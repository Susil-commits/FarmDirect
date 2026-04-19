import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import connectDB from '../config/db.js';

dotenv.config();

async function cleanupDummyData() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Get the real users to keep (admin + actual users with verified status)
    const realUsers = await User.find({
      $or: [
        { email: 'admin@123' },  // Admin user
        { kycStatus: 'verified' } // Only verified real users
      ]
    });

    const realUserIds = realUsers.map(u => u._id);
    console.log(`✅ Found ${realUsers.length} real users to keep`);
    realUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));

    // Delete all dummy users (not in realUserIds)
    const deletedUsers = await User.deleteMany({
      _id: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} dummy users`);

    // Delete all crops (user will add real ones)
    const deletedCrops = await CropListing.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCrops.deletedCount} crops`);

    // Delete all dummy orders
    const deletedOrders = await Order.deleteMany({
      userId: { $nin: realUserIds },
      farmerId: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${deletedOrders.deletedCount} dummy orders`);

    // Delete all dummy reviews
    const deletedReviews = await Review.deleteMany({
      userId: { $nin: realUserIds },
      farmerId: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${deletedReviews.deletedCount} dummy reviews`);

    // Delete all dummy wishlists
    const deletedWishlists = await Wishlist.deleteMany({
      userId: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${deletedWishlists.deletedCount} dummy wishlists`);

    // Keep notifications for real users only
    const deletedNotifications = await Notification.deleteMany({
      recipientId: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${deletedNotifications.deletedCount} dummy notifications`);

    console.log('\n✅ Database cleanup complete!');
    console.log('📊 Database is now clean with only real user data');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanupDummyData();
