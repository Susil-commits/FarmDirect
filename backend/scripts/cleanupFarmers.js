import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import connectDB from '../config/db.js';

dotenv.config();

const cleanup = async () => {
  try {
    await connectDB();
    console.log('Connected to database...');

    // Delete all farmers
    const farmerDeleteResult = await User.deleteMany({ role: 'farmer' });
    console.log(`✓ Deleted ${farmerDeleteResult.deletedCount} farmers`);

    // Delete all crops associated with farmers
    const cropDeleteResult = await CropListing.deleteMany({});
    console.log(`✓ Deleted ${cropDeleteResult.deletedCount} crop listings`);

    console.log('\n✓ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
    process.exit(1);
  }
};

cleanup();
