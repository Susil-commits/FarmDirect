/**
 * Admin Seed Script
 * Creates an admin user for FarmDirect if one doesn't exist.
 * 
 * Usage: node backend/scripts/seedAdmin.js
 * 
 * Default admin credentials:
 *   Email: admin@farmdirect.com
 *   Password: Admin@123
 * 
 * You can customize via environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/farmdirect';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'FarmDirect';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'Admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Dynamically import User model
    const User = (await import('../models/User.js')).default;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log(`\n⚠️  Admin user already exists: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   KYC Status: ${existingAdmin.kycStatus}`);
      
      // Ensure the existing admin has correct role and status
      if (existingAdmin.role !== 'admin' || existingAdmin.kycStatus !== 'verified') {
        existingAdmin.role = 'admin';
        existingAdmin.kycStatus = 'verified';
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log('✅ Updated existing admin to correct role/status');
      }
      
      console.log('\n📋 Admin Login Credentials:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    const admin = await User.create({
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      kycStatus: 'verified',    // Admin doesn't need KYC
      status: 'active',
      verified: true,
      emailVerified: true,
      phone: '0000000000',
      bio: 'FarmDirect Platform Administrator',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   KYC Status: ${admin.kycStatus}`);
    
    console.log('\n📋 Admin Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    // List all users for verification
    const allUsers = await User.find({}).select('firstName lastName email role kycStatus');
    console.log('\n📊 All Users in Database:');
    allUsers.forEach(u => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.email}) | Role: ${u.role} | KYC: ${u.kycStatus}`);
    });

    // Count pending KYC
    const pendingBuyers = await User.countDocuments({ role: 'buyer', kycStatus: 'pending' });
    const pendingFarmers = await User.countDocuments({ role: 'farmer', kycStatus: 'pending' });
    console.log(`\n📋 Pending KYC: ${pendingBuyers} buyers, ${pendingFarmers} farmers`);

    await mongoose.disconnect();
    console.log('\n👋 Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedAdmin();