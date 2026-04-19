import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Wishlist from '../models/Wishlist.js';
import connectDB from '../config/db.js';

dotenv.config();

async function deleteAllUserData() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Delete all users
    const userResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    // Delete all crops
    const cropResult = await CropListing.deleteMany({});
    console.log(`✅ Deleted ${cropResult.deletedCount} crops`);

    // Delete all orders
    const orderResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${orderResult.deletedCount} orders`);

    // Delete all reviews
    const reviewResult = await Review.deleteMany({});
    console.log(`✅ Deleted ${reviewResult.deletedCount} reviews`);

    // Delete all notifications
    const notifResult = await Notification.deleteMany({});
    console.log(`✅ Deleted ${notifResult.deletedCount} notifications`);

    // Delete all wishlist
    const wishlistResult = await Wishlist.deleteMany({});
    console.log(`✅ Deleted ${wishlistResult.deletedCount} wishlist items`);

    console.log('\n🎉 Database completely cleared!');
    console.log('📝 Ready for fresh data entry');
    console.log('👤 Admin account (admin@123/password) is ready to login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting data:', error.message);
    process.exit(1);
  }
}

deleteAllUserData();
