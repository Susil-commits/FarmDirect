import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Negotiation from '../models/Negotiation.js';
import Review from '../models/Review.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import EventLog from '../models/EventLog.js';
import {
  UserRole,
  UserStatus,
  KycStatus,
  CropStatus,
  CropAvailability,
  ListingApprovalStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  NegotiationStatus,
} from '../types/enums.js';

dotenv.config();

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createRng(seed = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(12345);

function randomFloat(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const ODISHA_LOCATIONS = [
  { city: 'Bhubaneswar', state: 'Odisha', pincode: '751001' },
  { city: 'Cuttack', state: 'Odisha', pincode: '753001' },
  { city: 'Puri', state: 'Odisha', pincode: '752001' },
  { city: 'Sambalpur', state: 'Odisha', pincode: '768001' },
  { city: 'Berhampur', state: 'Odisha', pincode: '760001' },
  { city: 'Balasore', state: 'Odisha', pincode: '756001' },
  { city: 'Bargarh', state: 'Odisha', pincode: '768028' },
  { city: 'Koraput', state: 'Odisha', pincode: '764020' },
  { city: 'Angul', state: 'Odisha', pincode: '759122' },
  { city: 'Kendrapara', state: 'Odisha', pincode: '754211' },
  { city: 'Jagatsinghpur', state: 'Odisha', pincode: '754103' },
  { city: 'Jajpur', state: 'Odisha', pincode: '755001' },
  { city: 'Bhadrak', state: 'Odisha', pincode: '756100' },
  { city: 'Dhenkanal', state: 'Odisha', pincode: '759001' },
  { city: 'Nayagarh', state: 'Odisha', pincode: '752069' },
];

const FIRST_NAMES = [
  'Ramesh', 'Suresh', 'Bikash', 'Manoranjan', 'Subhash', 'Pradeep', 'Santosh', 'Bijay',
  'Priyabrata', 'Deepak', 'Alok', 'Soumya', 'Laxmidhar', 'Rabindra', 'Niranjan', 'Ashok',
  'Kalpataru', 'Debasish', 'Manoj', 'Tapas', 'Pravat', 'Sarat', 'Ganeswar', 'Kishore',
  'Sunita', 'Pravati', 'Mamata', 'Geetanjali', 'Swarnalata', 'Jayanti', 'Anuradha', 'Minati'
];

const LAST_NAMES = [
  'Pradhan', 'Nayak', 'Sahoo', 'Rout', 'Mohanty', 'Das', 'Behera', 'Patra',
  'Panda', 'Mishra', 'Samal', 'Swain', 'Jena', 'Barik', 'Muduli', 'Bhoi',
  'Majhi', 'Sethy', 'Lenka', 'Biswal', 'Mallick', 'Khatua', 'Parida', 'Mahapatra'
];

interface CropDefinition {
  name: string;
  category: string;
  basePrice: number;
  peakSupplyMonth: number; // 0-11: price dips when supply peaks
  seasonalityAmp: number;
  unit: string;
  description: string;
}

const CROP_DEFINITIONS: CropDefinition[] = [
  // Grains
  { name: 'Swarna Rice', category: 'grains', basePrice: 32, peakSupplyMonth: 11, seasonalityAmp: 0.15, unit: 'kg', description: 'Freshly harvested authentic Swarna paddy rice from Bargarh plains.' },
  { name: 'Basmati Rice', category: 'grains', basePrice: 85, peakSupplyMonth: 10, seasonalityAmp: 0.12, unit: 'kg', description: 'Aromatic long-grain traditional Basmati rice grown naturally.' },
  { name: 'Brown Rice', category: 'grains', basePrice: 65, peakSupplyMonth: 11, seasonalityAmp: 0.10, unit: 'kg', description: 'Unpolished mineral-rich brown rice with natural bran intact.' },
  { name: 'Finger Millet (Mandia / Ragi)', category: 'grains', basePrice: 42, peakSupplyMonth: 0, seasonalityAmp: 0.18, unit: 'kg', description: 'Nutrient-dense indigenous Koraput organic finger millet.' },
  { name: 'Little Millet (Suan)', category: 'grains', basePrice: 55, peakSupplyMonth: 1, seasonalityAmp: 0.15, unit: 'kg', description: 'Ancient heritage millet high in dietary fiber and micronutrients.' },
  { name: 'Sweet Corn', category: 'grains', basePrice: 28, peakSupplyMonth: 7, seasonalityAmp: 0.20, unit: 'kg', description: 'Juicy golden sweet corn cobs harvested early morning.' },

  // Vegetables
  { name: 'Desi Country Tomato', category: 'vegetables', basePrice: 28, peakSupplyMonth: 1, seasonalityAmp: 0.40, unit: 'kg', description: 'Naturally tangy sun-ripened local desi tomatoes with thin skin.' },
  { name: 'Hybrid Red Tomato', category: 'vegetables', basePrice: 32, peakSupplyMonth: 0, seasonalityAmp: 0.35, unit: 'kg', description: 'Firm, uniform commercial grade salad tomatoes.' },
  { name: 'Kantabada Brinjal', category: 'vegetables', basePrice: 36, peakSupplyMonth: 11, seasonalityAmp: 0.25, unit: 'kg', description: 'Famous GI candidate Kantabada thorn brinjal, renowned for tender pulp.' },
  { name: 'Green Round Brinjal', category: 'vegetables', basePrice: 30, peakSupplyMonth: 10, seasonalityAmp: 0.20, unit: 'kg', description: 'Tender small round brinjals perfect for Odia Bharata.' },
  { name: 'Potato (Jyoti)', category: 'vegetables', basePrice: 24, peakSupplyMonth: 2, seasonalityAmp: 0.30, unit: 'kg', description: 'Farm-fresh starchy potatoes ideal for daily home cooking.' },
  { name: 'Red Onion', category: 'vegetables', basePrice: 38, peakSupplyMonth: 3, seasonalityAmp: 0.45, unit: 'kg', description: 'Pungent medium-sized red onions with excellent shelf life.' },
  { name: 'Lady Finger (Bhendi / Okra)', category: 'vegetables', basePrice: 34, peakSupplyMonth: 6, seasonalityAmp: 0.25, unit: 'kg', description: 'Crisp, bright green tender okra picked at prime maturity.' },
  { name: 'Pointed Gourd (Potala)', category: 'vegetables', basePrice: 48, peakSupplyMonth: 5, seasonalityAmp: 0.30, unit: 'kg', description: 'Fresh riverbank pointed gourd from Mahanadi basin.' },
  { name: 'Cauliflower', category: 'vegetables', basePrice: 30, peakSupplyMonth: 0, seasonalityAmp: 0.50, unit: 'kg', description: 'Compact snow-white winter cauliflower curd with fresh foliage.' },
  { name: 'Cabbage', category: 'vegetables', basePrice: 20, peakSupplyMonth: 1, seasonalityAmp: 0.45, unit: 'kg', description: 'Crisp green solid heads harvested from organic vegetable patches.' },
  { name: 'Bottle Gourd (Lau)', category: 'vegetables', basePrice: 22, peakSupplyMonth: 6, seasonalityAmp: 0.20, unit: 'kg', description: 'Tender cylindrical bottle gourd rich in cooling hydration.' },
  { name: 'Ridge Gourd (Jahnhi)', category: 'vegetables', basePrice: 35, peakSupplyMonth: 7, seasonalityAmp: 0.22, unit: 'kg', description: 'Naturally trellis-grown ridge gourd rich in minerals.' },
  { name: 'Bitter Gourd (Kalara)', category: 'vegetables', basePrice: 42, peakSupplyMonth: 4, seasonalityAmp: 0.25, unit: 'kg', description: 'Deep green firm bitter gourd known for herbal wellness.' },
  { name: 'Drumstick (Sajana Chhui)', category: 'vegetables', basePrice: 65, peakSupplyMonth: 2, seasonalityAmp: 0.40, unit: 'kg', description: 'Tender organic moringa pods freshly harvested from trees.' },
  { name: 'Green Peas', category: 'vegetables', basePrice: 70, peakSupplyMonth: 0, seasonalityAmp: 0.60, unit: 'kg', description: 'Sweet plump winter garden peas podded fresh.' },
  { name: 'Fresh Spinach (Palanga Saaga)', category: 'vegetables', basePrice: 25, peakSupplyMonth: 11, seasonalityAmp: 0.30, unit: 'kg', description: 'Clean iron-rich leafy spinach bunches harvested at dawn.' },
  { name: 'Red Amaranth (Koshala Saaga)', category: 'vegetables', basePrice: 20, peakSupplyMonth: 8, seasonalityAmp: 0.20, unit: 'kg', description: 'Traditional Odia favorite tender red leafy greens.' },
  { name: 'Pumpkin (Boi Kakharu)', category: 'vegetables', basePrice: 18, peakSupplyMonth: 9, seasonalityAmp: 0.20, unit: 'kg', description: 'Sweet golden-fleshed whole pumpkin with excellent storage life.' },

  // Fruits
  { name: 'Banganapalli Mango', category: 'fruits', basePrice: 85, peakSupplyMonth: 4, seasonalityAmp: 0.55, unit: 'kg', description: 'Sweet fiberless king mangoes ripened naturally without calcium carbide.' },
  { name: 'Amrapali Mango', category: 'fruits', basePrice: 95, peakSupplyMonth: 5, seasonalityAmp: 0.60, unit: 'kg', description: 'Intense rich saffron-orange pulp dessert mangoes from Rayagada orchards.' },
  { name: 'Dussehri Mango', category: 'fruits', basePrice: 80, peakSupplyMonth: 5, seasonalityAmp: 0.50, unit: 'kg', description: 'Fragrant sweet northern heritage mango cultivar grown in Odisha soil.' },
  { name: 'Champa Banana', category: 'fruits', basePrice: 45, peakSupplyMonth: 7, seasonalityAmp: 0.15, unit: 'kg', description: 'Sweet small fragrant heritage bananas harvested on the bunch.' },
  { name: 'Robusta Banana', category: 'fruits', basePrice: 35, peakSupplyMonth: 8, seasonalityAmp: 0.12, unit: 'kg', description: 'Large creamy table bananas grown with bio-fertilizers.' },
  { name: 'Puri Coconut', category: 'fruits', basePrice: 32, peakSupplyMonth: 5, seasonalityAmp: 0.10, unit: 'piece', description: 'Mature rich coconut with thick kernel and sweet water from coastal groves.' },
  { name: 'Green Tender Coconut (Daba)', category: 'fruits', basePrice: 40, peakSupplyMonth: 4, seasonalityAmp: 0.25, unit: 'piece', description: 'Refreshing sweet electrolyte-rich tender coconut.' },
  { name: 'Red Lady Papaya', category: 'fruits', basePrice: 30, peakSupplyMonth: 3, seasonalityAmp: 0.18, unit: 'kg', description: 'Sweet thick red-fleshed papaya harvested ripe from the tree.' },
  { name: 'Allahabad Safeda Guava', category: 'fruits', basePrice: 45, peakSupplyMonth: 10, seasonalityAmp: 0.30, unit: 'kg', description: 'Crunchy white pulp guava rich in natural Vitamin C.' },
  { name: 'Sugar Baby Watermelon', category: 'fruits', basePrice: 22, peakSupplyMonth: 3, seasonalityAmp: 0.50, unit: 'kg', description: 'Crisp deep red sweet melon grown along the riverbanks.' },
  { name: 'Jackfruit (Panasa)', category: 'fruits', basePrice: 28, peakSupplyMonth: 4, seasonalityAmp: 0.40, unit: 'kg', description: 'Versatile raw jackfruit ideal for savoury curries.' },

  // Spices & Cash Crops
  { name: 'Kandhamal Haldi (Turmeric GI)', category: 'spices', basePrice: 140, peakSupplyMonth: 2, seasonalityAmp: 0.15, unit: 'kg', description: 'World-renowned GI certified high-curcumin organic turmeric powder.' },
  { name: 'Fresh Ginger (Ada)', category: 'spices', basePrice: 75, peakSupplyMonth: 1, seasonalityAmp: 0.30, unit: 'kg', description: 'Fiery aromatic mountain ginger with thin peel and low fiber.' },
  { name: 'Green Chilli (Suryamukhi)', category: 'spices', basePrice: 50, peakSupplyMonth: 6, seasonalityAmp: 0.35, unit: 'kg', description: 'Intensely spicy upward-growing country green chillies.' },
  { name: 'Dry Red Chilli', category: 'spices', basePrice: 180, peakSupplyMonth: 3, seasonalityAmp: 0.20, unit: 'kg', description: 'Sun-dried crisp red chillies with bold pungent aroma and colour.' },
  { name: 'Coriander Seeds (Dhania)', category: 'spices', basePrice: 110, peakSupplyMonth: 2, seasonalityAmp: 0.15, unit: 'kg', description: 'Fragrant golden coriander seeds whole and sun-cured.' },
  { name: 'Mustard Seeds (Sorisa)', category: 'spices', basePrice: 90, peakSupplyMonth: 2, seasonalityAmp: 0.12, unit: 'kg', description: 'High oil-content small black mustard seeds essential for Odia tadka.' },
  { name: 'Garlic (Rasuna)', category: 'spices', basePrice: 160, peakSupplyMonth: 2, seasonalityAmp: 0.40, unit: 'kg', description: 'Strong pungent compact white garlic cloves from local farmers.' },
];

function calculateSeasonalPrice(basePrice: number, peakMonth: number, amplitude: number, date: Date): number {
  const month = date.getMonth();
  // When supply peaks, price hits minimum; opposite month price hits maximum
  const seasonalMultiplier = 1.0 - amplitude * Math.cos((2 * Math.PI * (month - peakMonth)) / 12);
  const noise = randomFloat(-0.08, 0.08);
  const calculated = Math.round(basePrice * seasonalMultiplier * (1 + noise) * 10) / 10;
  return Math.max(5, calculated);
}

export async function seedMarketplace(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect';
  console.log(`Connecting to MongoDB for seeding: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
  await mongoose.connect(mongoUri);

  console.log('--- Cleaning previous synthetic seed data ---');
  await Promise.all([
    User.deleteMany({ isSynthetic: true }),
    CropListing.deleteMany({ isSynthetic: true }),
    Order.deleteMany({ isSynthetic: true }),
    Negotiation.deleteMany({ isSynthetic: true }),
    Review.deleteMany({ isSynthetic: true }),
    PriceSnapshot.deleteMany({ source: 'seed' }),
    EventLog.deleteMany({ query: { $regex: 'synthetic', $options: 'i' } }),
  ]);

  console.log('Hashing default credentials...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Farmers (~200)
  console.log('Generating 200 Farmers...');
  const farmerDocs: any[] = [];
  for (let i = 1; i <= 200; i++) {
    const fn = randomChoice(FIRST_NAMES);
    const ln = randomChoice(LAST_NAMES);
    const loc = randomChoice(ODISHA_LOCATIONS);
    farmerDocs.push({
      firstName: fn,
      lastName: ln,
      name: `${fn} ${ln}`,
      email: `farmer${i}@farmdirect.local`,
      password: passwordHash,
      phone: `9861${String(100000 + i).padStart(6, '0')}`,
      role: UserRole.Farmer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      farmName: `${ln} Krushi Farm`,
      farmArea: `${randomInt(2, 25)} Acres`,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      address: `${loc.city} Rural Block, Dist: ${loc.city}`,
      experience: randomInt(3, 35),
      rating: Math.round(randomFloat(4.0, 5.0) * 10) / 10,
      totalReviews: randomInt(5, 50),
      isSynthetic: true,
      verified: true,
      emailVerified: true,
    });
  }
  const farmers = await User.insertMany(farmerDocs);
  console.log(`✓ Inserted ${farmers.length} Farmers.`);

  // 2. Seed Buyers (~1000)
  console.log('Generating 1000 Buyers...');
  const buyerDocs: any[] = [];
  for (let i = 1; i <= 1000; i++) {
    const fn = randomChoice(FIRST_NAMES);
    const ln = randomChoice(LAST_NAMES);
    const loc = randomChoice(ODISHA_LOCATIONS);
    buyerDocs.push({
      firstName: fn,
      lastName: ln,
      name: `${fn} ${ln}`,
      email: `buyer${i}@farmdirect.local`,
      password: passwordHash,
      phone: `9437${String(100000 + i).padStart(6, '0')}`,
      role: UserRole.Buyer,
      status: UserStatus.Active,
      kycStatus: KycStatus.Verified,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      address: `Plot No. ${randomInt(10, 999)}, ${loc.city}`,
      isSynthetic: true,
      verified: true,
      emailVerified: true,
    });
  }
  const buyers = await User.insertMany(buyerDocs);
  console.log(`✓ Inserted ${buyers.length} Buyers.`);

  // 3. Seed Crop Listings (~400-500 listings)
  console.log('Generating Crop Listings for 40+ Odisha Crops...');
  const cropDocs: any[] = [];
  const now = new Date();

  for (const farmer of farmers) {
    // Each farmer produces 2 to 4 crops
    const numCrops = randomInt(2, 4);
    for (let c = 0; c < numCrops; c++) {
      const def = randomChoice(CROP_DEFINITIONS);
      const isOrganic = rng() < 0.35;
      const price = calculateSeasonalPrice(def.basePrice, def.peakSupplyMonth, def.seasonalityAmp, now);
      const originalPrice = isOrganic ? Math.round(price * 1.15) : price;

      cropDocs.push({
        farmerId: farmer._id,
        cropName: def.name,
        category: def.category,
        cropType: def.category === 'grains' ? 'grains' : def.category === 'fruits' ? 'fruits' : 'vegetables',
        price,
        originalPrice,
        quantity: randomInt(100, 3000),
        unit: def.unit,
        description: def.description,
        pickupLocation: `${farmer.city}, ${farmer.state}`,
        contactNumber: farmer.phone,
        images: [
          'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80',
        ],
        specifications: {
          organicCertified: isOrganic,
          shelfLife: `${randomInt(3, 20)} Days`,
          color: 'Natural Fresh',
          ripeness: 'Prime Mature',
        },
        status: CropStatus.Active,
        availability: CropAvailability.Available,
        listingApprovalStatus: ListingApprovalStatus.Approved,
        rating: Math.round(randomFloat(4.1, 4.9) * 10) / 10,
        totalReviews: randomInt(3, 30),
        views: randomInt(50, 800),
        sold: randomInt(20, 400),
        isSynthetic: true,
        createdAt: new Date(now.getTime() - randomInt(1, 400) * 86400000),
      });
    }
  }
  const crops = await CropListing.insertMany(cropDocs);
  console.log(`✓ Inserted ${crops.length} Crop Listings.`);

  // 4. Seed Historical Price Snapshots (across 15 months / 450 days)
  console.log('Generating 15 months of Price Snapshots with seasonal curves...');
  const priceSnapshots: any[] = [];
  const DAYS_BACK = 450;

  for (const def of CROP_DEFINITIONS) {
    // Generate snapshot every 5-7 days for representative Odisha regions
    const sampleRegions = ['Bhubaneswar, Odisha', 'Cuttack, Odisha', 'Sambalpur, Odisha', 'Bargarh, Odisha'];
    for (const region of sampleRegions) {
      for (let day = DAYS_BACK; day >= 0; day -= randomInt(5, 7)) {
        const at = new Date(now.getTime() - day * 86400000);
        const seasonalPrice = calculateSeasonalPrice(def.basePrice, def.peakSupplyMonth, def.seasonalityAmp, at);

        priceSnapshots.push({
          cropId: randomChoice(crops)._id,
          cropName: def.name.toLowerCase(),
          category: def.category.toLowerCase(),
          region,
          price: seasonalPrice,
          unit: def.unit,
          isOrganic: false,
          source: 'seed',
          at,
          createdAt: at,
        });
      }
    }
  }
  await PriceSnapshot.insertMany(priceSnapshots);
  console.log(`✓ Inserted ${priceSnapshots.length} historical PriceSnapshots.`);

  // 5. Seed Historical Orders (~3000) & Reviews & Anomalies
  console.log('Generating 3,000 historical orders with injected anomalies...');
  const orderDocs: any[] = [];
  const reviewDocs: any[] = [];
  const negotiationDocs: any[] = [];
  const eventDocs: any[] = [];

  for (let i = 1; i <= 3000; i++) {
    const buyer = randomChoice(buyers);
    const crop = randomChoice(crops);
    const orderDaysAgo = randomInt(1, DAYS_BACK);
    const orderDate = new Date(now.getTime() - orderDaysAgo * 86400000);

    const isAnomaly = rng() < 0.02; // 2% injected anomalies
    let qty = randomInt(5, 60);
    let unitPrice = calculateSeasonalPrice(crop.price, 0, 0.1, orderDate);

    let anomalyReason = '';
    let anomalyScore = null;

    if (isAnomaly) {
      if (rng() < 0.5) {
        // High price outlier
        unitPrice = Math.round(unitPrice * randomFloat(3.5, 6.0));
        anomalyReason = 'Unit price far exceeds market median (+400%)';
      } else {
        // High volume outlier
        qty = randomInt(2000, 5000);
        anomalyReason = 'Order quantity drastically exceeds normal consumer distribution';
      }
      anomalyScore = Math.round(randomFloat(3.2, 5.0) * 10) / 10;
    }

    const totalAmount = Math.round(qty * unitPrice);
    const orderNumber = `ORD-SYN-${String(i).padStart(6, '0')}`;
    const orderId = new mongoose.Types.ObjectId();

    orderDocs.push({
      _id: orderId,
      orderNumber,
      buyerId: buyer._id,
      farmerId: crop.farmerId,
      cropId: crop._id,
      cropName: crop.cropName,
      quantity: qty,
      unitPrice,
      totalAmount,
      orderStatus: OrderStatus.Completed,
      paymentMethod: randomChoice([PaymentMethod.Razorpay, PaymentMethod.Cod]),
      paymentStatus: PaymentStatus.Completed,
      pickupLocation: crop.pickupLocation,
      timeline: [
        { event: 'CONFIRMED', description: 'Order placed by buyer', timestamp: orderDate },
        { event: 'COMPLETED', description: 'Order delivered and verified', timestamp: new Date(orderDate.getTime() + 86400000) },
      ],
      flaggedAsAnomaly: isAnomaly,
      anomalyScore,
      notes: isAnomaly ? `Synthetic Anomaly: ${anomalyReason}` : undefined,
      completedAt: new Date(orderDate.getTime() + 86400000),
      isSynthetic: true,
      createdAt: orderDate,
      updatedAt: new Date(orderDate.getTime() + 86400000),
    });

    // Reviews for ~40% of completed orders
    if (rng() < 0.40) {
      const rating = isAnomaly ? randomChoice([1, 2]) : randomChoice([4, 5, 5, 4, 3]);
      const comment = rating >= 4
        ? randomChoice([
            'Extremely fresh produce straight from the farm!',
            'Best quality harvest, tasted authentic and sweet.',
            'Direct delivery with zero hassle. Will definitely reorder.',
            'Very polite farmer and excellent packaging.',
          ])
        : randomChoice([
            'Delivery was delayed by a day.',
            'Produce was okay, slightly smaller size than expected.',
          ]);

      reviewDocs.push({
        cropId: crop._id,
        userId: buyer._id,
        rating,
        comment,
        isApproved: true,
        isFlagged: false,
        isSynthetic: true,
        createdAt: new Date(orderDate.getTime() + 2 * 86400000),
      });
    }

    // Negotiations for ~20% of orders
    if (rng() < 0.20) {
      const offeredPrice = Math.round(unitPrice * randomFloat(0.85, 0.95));
      negotiationDocs.push({
        cropId: crop._id,
        buyerId: buyer._id,
        farmerId: crop.farmerId,
        originalPrice: unitPrice,
        offeredPrice,
        quantity: qty,
        status: NegotiationStatus.Accepted,
        timeline: [
          { status: NegotiationStatus.Pending, offeredPrice, message: 'Kindly offer bulk deal discount', timestamp: orderDate },
          { status: NegotiationStatus.Accepted, offeredPrice, message: 'Accepted for direct purchase', timestamp: new Date(orderDate.getTime() + 3600000) },
        ],
        orderId,
        isSynthetic: true,
        createdAt: orderDate,
      });
    }

    // Browsing Event Logs
    if (rng() < 0.35) {
      eventDocs.push({
        userId: buyer._id,
        sessionId: `sess_synthetic_${buyer._id}`,
        type: 'view',
        cropId: crop._id,
        query: 'synthetic seed browsing',
        meta: { cropName: crop.cropName, category: crop.category },
        at: orderDate,
      });
    }
  }

  // Insert in chunked batches
  const BATCH_SIZE = 500;
  for (let i = 0; i < orderDocs.length; i += BATCH_SIZE) {
    await Order.insertMany(orderDocs.slice(i, i + BATCH_SIZE));
  }
  console.log(`✓ Inserted ${orderDocs.length} Orders with seasonal trends and injected anomalies.`);

  for (let i = 0; i < reviewDocs.length; i += BATCH_SIZE) {
    await Review.insertMany(reviewDocs.slice(i, i + BATCH_SIZE));
  }
  console.log(`✓ Inserted ${reviewDocs.length} Reviews.`);

  for (let i = 0; i < negotiationDocs.length; i += BATCH_SIZE) {
    await Negotiation.insertMany(negotiationDocs.slice(i, i + BATCH_SIZE));
  }
  console.log(`✓ Inserted ${negotiationDocs.length} Negotiations.`);

  for (let i = 0; i < eventDocs.length; i += BATCH_SIZE) {
    await EventLog.insertMany(eventDocs.slice(i, i + BATCH_SIZE));
  }
  console.log(`✓ Inserted ${eventDocs.length} EventLog actions.`);

  console.log('====================================================');
  console.log('🎉 Marketplace Seed Completed Successfully!');
  console.log(`• Farmers: ${farmers.length}`);
  console.log(`• Buyers: ${buyers.length}`);
  console.log(`• Crop Listings: ${crops.length}`);
  console.log(`• Price Snapshots: ${priceSnapshots.length}`);
  console.log(`• Orders (15 Months): ${orderDocs.length}`);
  console.log(`• Negotiations: ${negotiationDocs.length}`);
  console.log(`• Reviews: ${reviewDocs.length}`);
  console.log(`• Event Logs: ${eventDocs.length}`);
  console.log('====================================================');

  await mongoose.disconnect();
}

seedMarketplace().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
