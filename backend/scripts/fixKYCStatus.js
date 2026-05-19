/**
 * Migration Script: Fix KYC Status for Existing Users
 * 
 * Problem: The User model previously defaulted kycStatus to 'pending' for ALL new users,
 * making it impossible to distinguish between "just registered" and "actually submitted KYC."
 * 
 * This script:
 * 1. Sets kycStatus='not_submitted' for users who never submitted KYC (no kycSubmittedAt)
 * 2. Keeps kycStatus='pending' for users who actually submitted (have kycSubmittedAt)
 * 3. Keeps kycStatus='verified' and 'rejected' as-is
 * 4. Shows a summary of changes
 * 
 * Usage: node backend/scripts/fixKYCStatus.js
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend root
dotenv.config({ path: join(__dirname, '..', '.env') });

// Dynamic import for User model
async function runMigration() {
  const User = (await import('../models/User.js')).default;
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB:', mongoURI);

    // --- Step 1: Show current state ---
    const totalUsers = await User.countDocuments({});
    const pendingBefore = await User.countDocuments({ kycStatus: 'pending' });
    const verifiedBefore = await User.countDocuments({ kycStatus: 'verified' });
    const rejectedBefore = await User.countDocuments({ kycStatus: 'rejected' });
    const notSubmittedBefore = await User.countDocuments({ kycStatus: 'not_submitted' });

    console.log('\n📊 BEFORE MIGRATION:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   not_submitted: ${notSubmittedBefore}`);
    console.log(`   pending: ${pendingBefore}`);
    console.log(`   verified: ${verifiedBefore}`);
    console.log(`   rejected: ${rejectedBefore}`);

    // --- Step 2: Find users with 'pending' status but no kycSubmittedAt ---
    // These are users who registered but never actually submitted KYC
    const falselyPending = await User.find({
      kycStatus: 'pending',
      $or: [
        { kycSubmittedAt: { $exists: false } },
        { kycSubmittedAt: null }
      ]
    });

    console.log(`\n🔍 Found ${falselyPending.length} users with kycStatus='pending' but no kycSubmittedAt:`);
    falselyPending.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName}, role: ${u.role}, created: ${u.createdAt?.toISOString() || 'unknown'})`);
    });

    // --- Step 3: Fix them ---
    if (falselyPending.length > 0) {
      const result = await User.updateMany(
        {
          kycStatus: 'pending',
          $or: [
            { kycSubmittedAt: { $exists: false } },
            { kycSubmittedAt: null }
          ]
        },
        {
          $set: { kycStatus: 'not_submitted' }
        }
      );
      console.log(`\n✅ Fixed ${result.modifiedCount} users: kycStatus changed from 'pending' to 'not_submitted'`);
    }

    // --- Step 4: Also check for users with 'not_submitted' but who have kycSubmittedAt ---
    // (edge case: if someone manually set status back)
    const wronglyNotSubmitted = await User.find({
      kycStatus: 'not_submitted',
      kycSubmittedAt: { $exists: true, $ne: null }
    });

    if (wronglyNotSubmitted.length > 0) {
      console.log(`\n🔍 Found ${wronglyNotSubmitted.length} users with kycStatus='not_submitted' but have kycSubmittedAt:`);
      wronglyNotSubmitted.forEach(u => {
        console.log(`   - ${u.email} (submitted: ${u.kycSubmittedAt?.toISOString()})`);
      });

      const fixResult = await User.updateMany(
        {
          kycStatus: 'not_submitted',
          kycSubmittedAt: { $exists: true, $ne: null }
        },
        {
          $set: { kycStatus: 'pending' }
        }
      );
      console.log(`✅ Fixed ${fixResult.modifiedCount} users: kycStatus changed back to 'pending'`);
    }

    // --- Step 5: Show final state ---
    const pendingAfter = await User.countDocuments({ kycStatus: 'pending' });
    const verifiedAfter = await User.countDocuments({ kycStatus: 'verified' });
    const rejectedAfter = await User.countDocuments({ kycStatus: 'rejected' });
    const notSubmittedAfter = await User.countDocuments({ kycStatus: 'not_submitted' });

    console.log('\n📊 AFTER MIGRATION:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   not_submitted: ${notSubmittedAfter} (was ${notSubmittedBefore})`);
    console.log(`   pending: ${pendingAfter} (was ${pendingBefore})`);
    console.log(`   verified: ${verifiedAfter} (was ${verifiedBefore})`);
    console.log(`   rejected: ${rejectedAfter} (was ${rejectedBefore})`);

    // --- Step 6: Check specific user (asish) ---
    const asishUser = await User.findOne({ email: 'nayakasish123@gmail.com' });
    if (asishUser) {
      console.log('\n🔍 Specific check for nayakasish123@gmail.com:');
      console.log(`   Name: ${asishUser.firstName} ${asishUser.lastName}`);
      console.log(`   Role: ${asishUser.role}`);
      console.log(`   kycStatus: ${asishUser.kycStatus}`);
      console.log(`   kycSubmittedAt: ${asishUser.kycSubmittedAt || 'NOT SET'}`);
      console.log(`   kycDocuments: ${JSON.stringify(asishUser.kycDocuments || {})}`);
    } else {
      console.log('\n⚠️ User nayakasish123@gmail.com NOT FOUND in database');
    }

    console.log('\n🎉 Migration complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    try { await mongoose.connection.close(); } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

runMigration();