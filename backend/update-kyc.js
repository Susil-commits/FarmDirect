import mongoose from 'mongoose';
import User from './models/User.js';

async function updateAsutoshKYC() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmdirect');
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'nayakasutosh123@gmail.com' });
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('👤 Found user:', user.firstName, user.lastName);
    console.log('   Current KYC Status:', user.kycStatus);

    // Update KYC status
    user.kycStatus = 'pending';
    user.kycSubmittedAt = new Date();
    await user.save();

    console.log('✅ Updated KYC Status to:', user.kycStatus);
    console.log('✅ Submitted At:', user.kycSubmittedAt);

    // Verify
    const updated = await User.findById(user._id);
    console.log('\n📊 Verification:');
    console.log('   Name:', updated.firstName, updated.lastName);
    console.log('   Email:', updated.email);
    console.log('   Role:', updated.role);
    console.log('   KYC Status:', updated.kycStatus);
    console.log('   KYC Submitted At:', updated.kycSubmittedAt);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAsutoshKYC();
