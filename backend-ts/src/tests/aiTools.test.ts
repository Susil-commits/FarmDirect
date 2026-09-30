import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import User from '../models/User.js';
import Negotiation from '../models/Negotiation.js';
import { CropCategory, CropStatus, ListingApprovalStatus, OrderStatus, CropType } from '../types/enums.js';
import {
  executeTool,
  getToolsForRole,
  getDeclarationsForRole,
} from '../ai/tools/index.js';

describe('T1.2 Tool Layer - Role Gating, Function Execution & Authorization', () => {
  let farmerUser: any;
  let buyerUser: any;
  let intruderUser: any;
  let testCrop: any;

  beforeEach(async () => {
    await CropListing.deleteMany({});
    await Order.deleteMany({});
    await PriceSnapshot.deleteMany({});
    await User.deleteMany({});
    await Negotiation.deleteMany({});

    farmerUser = await User.create({
      firstName: 'Ramesh',
      lastName: 'Pradhan',
      email: 'ramesh@farmer.com',
      password: 'Password123!',
      role: 'farmer',
      isEmailVerified: true,
      farmName: 'Pradhan Organic Farms',
    });

    buyerUser = await User.create({
      firstName: 'Sita',
      lastName: 'Mohanty',
      email: 'sita@buyer.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
    });

    intruderUser = await User.create({
      firstName: 'Intruder',
      lastName: 'Spy',
      email: 'intruder@random.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
    });

    testCrop = await CropListing.create({
      farmerId: farmerUser._id,
      cropName: 'Organic Tomato',
      category: CropCategory.Vegetables,
      cropType: CropType.Vegetables,
      price: 45,
      quantity: 8, // Low stock <= 15
      unit: 'kg',
      description: 'Fresh organic farm tomatoes harvested daily.',
      pickupLocation: 'Cuttack Mandi',
      contactNumber: '9876543210',
      status: CropStatus.Active,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      specifications: { organicCertified: true },
      rating: 4.8,
    });

    await Order.create({
      orderNumber: 'ORD-TEST-12345',
      buyerId: buyerUser._id,
      farmerId: farmerUser._id,
      cropId: testCrop._id,
      cropName: 'Organic Tomato',
      quantity: 10,
      unitPrice: 45,
      totalAmount: 450,
      orderStatus: OrderStatus.Confirmed,
      pickupLocation: 'Cuttack Mandi',
    });

    // Create snapshots for price stats
    await PriceSnapshot.create([
      {
        cropId: testCrop._id,
        cropName: 'organic tomato',
        category: 'vegetables',
        region: 'Cuttack',
        price: 40,
        unit: 'kg',
        at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        cropId: testCrop._id,
        cropName: 'organic tomato',
        category: 'vegetables',
        region: 'Cuttack',
        price: 50,
        unit: 'kg',
        at: new Date(),
      },
    ]);
  });

  describe('Role Gating and Tool Declarations', () => {
    it('restricts guests to only safe public query tools', () => {
      const guestTools = getToolsForRole('guest');
      const toolNames = guestTools.map((t) => t.name);

      expect(toolNames).toContain('search_crops');
      expect(toolNames).toContain('get_crop');
      expect(toolNames).toContain('get_price_stats');
      expect(toolNames).toContain('navigate');

      // Guests must NOT have access to personal or farmer tools
      expect(toolNames).not.toContain('my_orders');
      expect(toolNames).not.toContain('order_status');
      expect(toolNames).not.toContain('my_listings');
      expect(toolNames).not.toContain('low_stock');
    });

    it('denies buyers access to farmer-only tools', async () => {
      const exec = await executeTool(
        'my_listings',
        {},
        { user: { _id: buyerUser._id, role: 'buyer' } }
      );
      expect(exec.error).toBeDefined();
      expect(exec.error).toContain('Access denied');
    });

    it('provides valid Gemini function declarations for all roles', () => {
      const farmerDeclarations = getDeclarationsForRole('farmer');
      expect(farmerDeclarations.length).toBeGreaterThan(5);
      for (const decl of farmerDeclarations) {
        expect(decl.name).toBeDefined();
        expect(decl.description).toBeDefined();
        expect(decl.parameters.type).toBe('OBJECT');
      }
    });
  });

  describe('Tool Execution & Grounding', () => {
    it('executes search_crops with query and organic filter', async () => {
      const res = await executeTool(
        'search_crops',
        { query: 'tomato', organic: true },
        { user: null }
      );

      expect(res.error).toBeUndefined();
      const output = res.result as any;
      expect(output.foundCount).toBe(1);
      expect(output.listings[0].cropName).toBe('Organic Tomato');
      expect(output.listings[0].isOrganic).toBe(true);
    });

    it('executes get_crop and returns full details', async () => {
      const res = await executeTool(
        'get_crop',
        { cropId: testCrop._id.toString() },
        { user: null }
      );

      expect(res.error).toBeUndefined();
      const crop = res.result as any;
      expect(crop.cropName).toBe('Organic Tomato');
      expect(crop.farmer.farmName).toBe('Pradhan Organic Farms');
    });

    it('executes get_price_stats with accurate aggregates', async () => {
      const res = await executeTool(
        'get_price_stats',
        { cropName: 'organic tomato', region: 'Cuttack' },
        { user: null }
      );

      expect(res.error).toBeUndefined();
      const stats = res.result as any;
      expect(stats.sufficientData).toBe(true);
      expect(stats.minPrice).toBe('₹40');
      expect(stats.maxPrice).toBe('₹50');
      expect(stats.medianPrice).toBe('₹45');
    });

    it('executes my_orders scoped to the authenticated user', async () => {
      const buyerRes = await executeTool(
        'my_orders',
        {},
        { user: { _id: buyerUser._id, role: 'buyer' } }
      );

      expect(buyerRes.error).toBeUndefined();
      const buyerOutput = buyerRes.result as any;
      expect(buyerOutput.orderCount).toBe(1);
      expect(buyerOutput.orders[0].orderNumber).toBe('ORD-TEST-12345');

      const intruderRes = await executeTool(
        'my_orders',
        {},
        { user: { _id: intruderUser._id, role: 'buyer' } }
      );
      const intruderOutput = intruderRes.result as any;
      expect(intruderOutput.orderCount).toBe(0);
    });

    it('strictly denies unauthorized users from viewing an order status', async () => {
      // Intruder attempts to check buyer's order -> Denied!
      const deniedRes = await executeTool(
        'order_status',
        { orderNumber: 'ORD-TEST-12345' },
        { user: { _id: intruderUser._id, role: 'buyer' } }
      );

      const output = deniedRes.result as any;
      expect(output).toBeDefined();
      expect(output.error).toBeDefined();
      expect(output.error).toContain('not authorized');

      // Legitimate buyer checks their order -> Allowed!
      const allowedRes = await executeTool(
        'order_status',
        { orderNumber: 'ORD-TEST-12345' },
        { user: { _id: buyerUser._id, role: 'buyer' } }
      );

      expect(allowedRes.error).toBeUndefined();
      expect((allowedRes.result as any).orderNumber).toBe('ORD-TEST-12345');
    });

    it('executes low_stock and my_listings for authenticated farmer', async () => {
      const stockRes = await executeTool(
        'low_stock',
        { threshold: 10 },
        { user: { _id: farmerUser._id, role: 'farmer' } }
      );

      expect(stockRes.error).toBeUndefined();
      const stockOutput = stockRes.result as any;
      expect(stockOutput.lowStockCount).toBe(1);
      expect(stockOutput.items[0].cropName).toBe('Organic Tomato');

      const listingsRes = await executeTool(
        'my_listings',
        {},
        { user: { _id: farmerUser._id, role: 'farmer' } }
      );

      expect(listingsRes.error).toBeUndefined();
      const listingsOutput = listingsRes.result as any;
      expect(listingsOutput.totalListings).toBe(1);
      expect(listingsOutput.listings[0].cropName).toBe('Organic Tomato');
    });

    it('executes navigate and only allows whitelisted routes', async () => {
      const validNav = await executeTool('navigate', { route: '/marketplace' }, { user: null });
      expect(validNav.error).toBeUndefined();
      expect((validNav.result as any).success).toBe(true);
      expect((validNav.result as any).url).toBe('/marketplace');

      const invalidNav = await executeTool('navigate', { route: '/admin/secret-backdoor' }, { user: null });
      expect((invalidNav.result as any).success).toBe(false);
      expect((invalidNav.result as any).error).toContain('not recognized');
    });
  });
});
