import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import { hashPassword } from '../utils/password.js';
import connectDB from '../config/db.js';

dotenv.config();

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300?text=Farm+Product';

// Farmer names and details
const farmerData = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    farmName: 'Golden Harvest Farm',
    farmArea: '45 acres',
    bio: 'Organic farming expert with 20 years of experience',
    city: 'Punjab'
  },
  {
    firstName: 'Priya',
    lastName: 'Singh',
    farmName: 'Green Valley Produce',
    farmArea: '32 acres',
    bio: 'Specializes in vegetables and spices',
    city: 'Haryana'
  },
  {
    firstName: 'Amit',
    lastName: 'Patel',
    farmName: 'Patel Family Orchard',
    farmArea: '28 acres',
    bio: 'Fresh fruits direct from farm to table',
    city: 'Gujarat'
  },
  {
    firstName: 'Savitri',
    lastName: 'Sharma',
    farmName: 'Sharma Dairy Farm',
    farmArea: '50 acres',
    bio: 'Premium dairy and organic milk production',
    city: 'Madhya Pradesh'
  },
  {
    firstName: 'Vikram',
    lastName: 'Reddy',
    farmName: 'Reddy Spice Farms',
    farmArea: '18 acres',
    bio: 'Authentic spices sourced directly',
    city: 'Karnataka'
  },
  {
    firstName: 'Anita',
    lastName: 'Gupta',
    farmName: 'Gupta Rice Mills',
    farmArea: '65 acres',
    bio: 'High-quality grains and pulses',
    city: 'Uttar Pradesh'
  },
  {
    firstName: 'Deepak',
    lastName: 'Yadav',
    farmName: 'Yadav Herb Garden',
    farmArea: '15 acres',
    bio: 'Medicinal and culinary herbs',
    city: 'Rajasthan'
  },
  {
    firstName: 'Meera',
    lastName: 'Iyer',
    farmName: 'Iyer Coconut Estate',
    farmArea: '35 acres',
    bio: 'Coconut and tropical fruits',
    city: 'Tamil Nadu'
  },
  {
    firstName: 'Suresh',
    lastName: 'Nair',
    farmName: 'Nair Spice Estate',
    farmArea: '22 acres',
    bio: 'Black pepper, cardamom, and more',
    city: 'Kerala'
  },
  {
    firstName: 'Lisa',
    lastName: 'Menon',
    farmName: 'Menon Organic Foods',
    farmArea: '40 acres',
    bio: 'Certified organic vegetables',
    city: 'Maharashtra'
  }
];

// Buyer names
const buyerData = [
  { firstName: 'Arun', lastName: 'Verma' },
  { firstName: 'Neha', lastName: 'Malhotra' },
  { firstName: 'Rohit', lastName: 'Sinha' },
  { firstName: 'Shruti', lastName: 'Bhat' },
  { firstName: 'Arjun', lastName: 'Nath' },
  { firstName: 'Divya', lastName: 'Desai' },
  { firstName: 'Karthik', lastName: 'Rao' },
  { firstName: 'Pooja', lastName: 'Kapoor' },
  { firstName: 'Vikrant', lastName: 'Yadav' },
  { firstName: 'Zara', lastName: 'Khan' }
];

// Crop data
const cropTypes = [
  {
    cropName: 'Fresh Tomatoes',
    category: 'Vegetables',
    basePrice: 30,
    description: 'Fresh, juicy tomatoes picked daily from our farm. Perfect for salads and cooking.',
    quantity: 100,
    unit: 'kg',
    discount: 10
  },
  {
    cropName: 'Organic Spinach',
    category: 'Vegetables',
    basePrice: 45,
    description: 'Nutritious organic spinach leaves. Rich in iron and vitamins.',
    quantity: 50,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Bananas',
    category: 'Fruits',
    basePrice: 40,
    description: 'Golden, sweet bananas. Great source of natural energy.',
    quantity: 80,
    unit: 'kg',
    discount: 15
  },
  {
    cropName: 'Mangoes',
    category: 'Fruits',
    basePrice: 120,
    description: 'Premium Alphonso mangoes. King of fruits!',
    quantity: 60,
    unit: 'kg',
    discount: 8
  },
  {
    cropName: 'Turmeric Powder',
    category: 'Spices',
    basePrice: 250,
    description: 'Pure, unadulterated turmeric powder. No additives.',
    quantity: 30,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Black Pepper',
    category: 'Spices',
    basePrice: 400,
    description: 'Fresh ground black pepper. Premium quality.',
    quantity: 20,
    unit: 'kg',
    discount: 0
  },
  {
    cropName: 'Organic Rice',
    category: 'Grains',
    basePrice: 60,
    description: 'Basmati rice, pesticide-free and high quality.',
    quantity: 200,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Chickpeas (Chana)',
    category: 'Pulses',
    basePrice: 80,
    description: 'Protein-rich chickpeas. Perfect for dals and curries.',
    quantity: 100,
    unit: 'kg',
    discount: 10
  },
  {
    cropName: 'Fresh Milk',
    category: 'Dairy',
    basePrice: 50,
    description: 'Fresh, pure milk collected daily from our dairy farm.',
    quantity: 500,
    unit: 'liter',
    discount: 0
  },
  {
    cropName: 'Coriander Seeds',
    category: 'Spices',
    basePrice: 180,
    description: 'Fresh coriander seeds with strong aroma.',
    quantity: 25,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Onions',
    category: 'Vegetables',
    basePrice: 25,
    description: 'Fresh onions, perfect for cooking.',
    quantity: 150,
    unit: 'kg',
    discount: 12
  },
  {
    cropName: 'Cauliflower',
    category: 'Vegetables',
    basePrice: 35,
    description: 'Fresh cauliflower heads. Great for curries and stir-fries.',
    quantity: 60,
    unit: 'kg',
    discount: 8
  },
  {
    cropName: 'Cucumber',
    category: 'Vegetables',
    basePrice: 20,
    description: 'Crisp and refreshing cucumbers. Rich in water and minerals.',
    quantity: 80,
    unit: 'kg',
    discount: 10
  },
  {
    cropName: 'Carrots',
    category: 'Vegetables',
    basePrice: 28,
    description: 'Sweet and crunchy carrots. Good for health.',
    quantity: 100,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Apples',
    category: 'Fruits',
    basePrice: 150,
    description: 'Select red apples. Fresh and crispy.',
    quantity: 70,
    unit: 'kg',
    discount: 12
  },
  {
    cropName: 'Oranges',
    category: 'Fruits',
    basePrice: 60,
    description: 'Fresh oranges loaded with vitamin C.',
    quantity: 90,
    unit: 'kg',
    discount: 10
  },
  {
    cropName: 'Garlic',
    category: 'Vegetables',
    basePrice: 80,
    description: 'Fresh garlic bulbs. Pungent and aromatic.',
    quantity: 40,
    unit: 'kg',
    discount: 5
  },
  {
    cropName: 'Ginger',
    category: 'Spices',
    basePrice: 90,
    description: 'Fresh ginger roots. Great for immunity.',
    quantity: 35,
    unit: 'kg',
    discount: 8
  },
  {
    cropName: 'Wheat Flour',
    category: 'Grains',
    basePrice: 50,
    description: 'Pure, pesticide-free wheat flour.',
    quantity: 150,
    unit: 'kg',
    discount: 0
  },
  {
    cropName: 'Moong Dal',
    category: 'Pulses',
    basePrice: 120,
    description: 'Split and polished moong dal.',
    quantity: 80,
    unit: 'kg',
    discount: 5
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      CropListing.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Wishlist.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('Creating farmers...');
    const hashedPassword = await hashPassword('demo123');
    
    const farmers = await User.create(
      farmerData.map((farmer, index) => ({
        firstName: farmer.firstName,
        lastName: farmer.lastName,
        name: `${farmer.firstName} ${farmer.lastName}`,
        email: `farmer${index + 1}@farm.com`,
        password: hashedPassword,
        phone: `+91${9000000000 + index}`,
        role: 'farmer',
        profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        farmName: farmer.farmName,
        farmArea: farmer.farmArea,
        bio: farmer.bio,
        address: `Farm, ${farmer.city}`,
        city: farmer.city,
        state: farmer.city,
        pincode: `${110000 + index}`,
        kycStatus: index % 2 === 0 ? 'verified' : 'pending', // Mix of verified and pending
        isVerified: index % 2 === 0 ? true : false,
        rating: 3.5 + (Math.random() * 1.5),
        totalReviews: Math.floor(Math.random() * 100) + 10,
        cropsGrown: Math.floor(Math.random() * 50) + 10
      }))
    );

    console.log(`✓ Created ${farmers.length} farmers`);

    console.log('Creating buyers...');
    const buyers = await User.create(
      buyerData.map((buyer, index) => ({
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        name: `${buyer.firstName} ${buyer.lastName}`,
        email: `buyer${index + 1}@farm.com`,
        password: hashedPassword,
        phone: `+91${9100000000 + index}`,
        role: 'buyer',
        profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        address: `${index + 1} Main Street, City`,
        city: 'Delhi',
        state: 'Delhi',
        pincode: `110${100 + index}`,
        addresses: [
          {
            streetAddress: `${index + 1} Main Street`,
            area: 'Downtown',
            city: 'Delhi',
            state: 'Delhi',
            pincode: `110${100 + index}`,
            isDefault: true
          }
        ]
      }))
    );

    console.log(`✓ Created ${buyers.length} buyers`);

    console.log('Creating crop listings...');
    const crops = [];
    
    for (let i = 0; i < 25; i++) {
      const cropType = cropTypes[i % cropTypes.length];
      const farmer = farmers[Math.floor(Math.random() * farmers.length)];
      
      const crop = await CropListing.create({
        farmerId: farmer._id,
        cropName: `${cropType.cropName} - Batch ${Math.floor(i / cropTypes.length) + 1}`,
        category: cropType.category,
        price: cropType.basePrice + Math.random() * 50,
        originalPrice: cropType.basePrice + Math.random() * 100,
        quantity: cropType.quantity + Math.random() * 100,
        unit: cropType.unit,
        description: cropType.description,
        images: [PLACEHOLDER_IMAGE],
        discount: cropType.discount,
        specifications: {
          size: 'Medium',
          color: 'Natural',
          organicCertified: Math.random() > 0.5,
          shelfLife: '7-10 days',
          storageInstructions: 'Store in cool, dry place'
        },
        certifications: Math.random() > 0.5 ? ['Organic', 'Fair Trade'] : ['Organic'],
        harvestDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        rating: 3.5 + Math.random() * 1.5,
        totalReviews: Math.floor(Math.random() * 50) + 5,
        status: 'active',
        listingApprovalStatus: 'approved',
        views: Math.floor(Math.random() * 1000) + 100,
        sold: Math.floor(Math.random() * 200) + 10,
        likes: Math.floor(Math.random() * 50) + 5
      });

      crops.push(crop);
    }

    console.log(`✓ Created ${crops.length} crop listings`);

    console.log('Creating sample orders...');
    const orders = [];
    const orderStatuses = [
      'pending',
      'verification_pending',
      'verification_completed',
      'admin_approval_pending',
      'admin_approved',
      'ready_for_delivery',
      'delivered'
    ];

    for (let i = 0; i < 20; i++) {
      const buyer = buyers[i % buyers.length];
      const cropStart = (i * 2) % crops.length;
      const selectedCrops = [
        crops[cropStart],
        crops[(cropStart + 1) % crops.length]
      ];
      
      const items = selectedCrops.map(crop => ({
        cropId: crop._id,
        farmerId: crop.farmerId,
        cropName: crop.cropName,
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: crop.price,
        totalPrice: crop.price * (Math.floor(Math.random() * 10) + 1)
      }));

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * 0.05;
      const deliveryCharges = 50;
      const totalAmount = subtotal + taxAmount + deliveryCharges;

      const order = await Order.create({
        buyerId: buyer._id,
        items,
        deliveryAddress: {
          streetAddress: buyer.addresses?.[0]?.streetAddress || `${i} Main St`,
          area: buyer.addresses?.[0]?.area || 'Downtown',
          city: buyer.city,
          state: buyer.state,
          pincode: buyer.pincode
        },
        subtotal,
        taxAmount,
        discountAmount: 0,
        deliveryCharges,
        totalAmount,
        chargesAmount: 0,
        fineAmount: 0,
        totalWithCharges: totalAmount,
        orderStatus: i % 2 === 0 ? 'delivered' : orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        paymentMethod: 'cod',
        paymentStatus: Math.random() > 0.7 ? 'completed' : 'pending',
        verificationCall: {
          status: Math.random() > 0.6 ? 'completed' : 'pending',
          callInitiatedAt: new Date()
        }
      });

      orders.push(order);
    }

    console.log(`✓ Created ${orders.length} sample orders`);

    console.log('Creating reviews...');
    const reviews = [];

    for (let i = 0; i < 10; i++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const crop = crops[Math.floor(Math.random() * crops.length)];
      const order = orders[Math.floor(Math.random() * orders.length)];

      const review = await Review.create({
        cropId: crop._id,
        userId: buyer._id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: 'High quality product, fresh and delicious. Highly recommended! Great customer service.',
        images: [PLACEHOLDER_IMAGE]
      });

      reviews.push(review);
    }

    console.log(`✓ Created ${reviews.length} reviews`);

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Farmers: ${farmers.length}`);
    console.log(`  - Buyers: ${buyers.length}`);
    console.log(`  - Crops: ${crops.length}`);
    console.log(`  - Orders: ${orders.length}`);
    console.log(`  - Reviews: ${reviews.length}`);
    console.log('\n🔐 Demo Credentials:');
    console.log('  Email: farmer1@farm.com (or buyer1@farm.com, etc.)');
    console.log('  Password: demo123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
