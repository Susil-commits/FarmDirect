import readline from 'readline';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { UserRole, KycStatus, UserStatus } from '../types/enums.js';

function prompt(questionText: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = 'true';
      }
    }
  }

  return parsed;
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

export async function run() {
  console.log('\n===========================================');
  console.log('   🛡️  FaRm — Secure Admin Bootstrap Tool  ');
  console.log('===========================================\n');

  const args = parseArgs();

  let email = args.email || process.env.ADMIN_BOOTSTRAP_EMAIL;
  let password = args.password || process.env.ADMIN_BOOTSTRAP_PASSWORD;
  let firstName = args.firstName || 'System';
  let lastName = args.lastName || 'Admin';

  if (!email) {
    email = await prompt('Enter Admin Email: ');
  }

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid email address is required.');
    process.exit(1);
  }

  email = email.toLowerCase().trim();

  await connectDB();

  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser) {
    console.log(`\nℹ️  User with email "${email}" already exists with role: "${existingUser.role}".`);
    
    let shouldPromote = args.promote === 'true';
    if (!args.promote) {
      const confirm = await prompt('Do you want to promote this user to Admin? (y/N): ');
      shouldPromote = confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes';
    }

    if (!shouldPromote) {
      console.log('Operation aborted. No changes made.');
      await mongoose.disconnect();
      process.exit(0);
    }

    existingUser.role = UserRole.Admin;
    existingUser.kycStatus = KycStatus.Verified;
    existingUser.status = UserStatus.Active;

    if (!password && !args.keepPassword) {
      const updatePass = await prompt('Do you want to reset their password as well? (y/N): ');
      if (updatePass.toLowerCase() === 'y' || updatePass.toLowerCase() === 'yes') {
        password = await prompt('Enter new Admin Password: ');
      }
    }

    if (password) {
      const check = validatePassword(password);
      if (!check.valid) {
        console.error(`❌ Weak password: ${check.message}`);
        await mongoose.disconnect();
        process.exit(1);
      }
      existingUser.password = await hashPassword(password);
    }

    await existingUser.save();

    console.log('\n✅ Successfully promoted user to Admin!');
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${existingUser.role}`);
    console.log(`   KYC:  ${existingUser.kycStatus}\n`);
  } else {
    if (!password) {
      password = await prompt('Enter Admin Password (min 8 chars, uppercase, lowercase, number): ');
    }

    const check = validatePassword(password);
    if (!check.valid) {
      console.error(`❌ Weak password: ${check.message}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await User.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: hashedPassword,
      role: UserRole.Admin,
      kycStatus: KycStatus.Verified,
      status: UserStatus.Active,
    });

    console.log('\n✅ Admin account created successfully!');
    console.log(`   ID:    ${newAdmin._id}`);
    console.log(`   Name:  ${newAdmin.name}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role:  ${newAdmin.role}`);
    console.log(`   KYC:   ${newAdmin.kycStatus}\n`);
  }

  await mongoose.disconnect();
  console.log('Database connection closed. You can now log in at /auth/login with these credentials.\n');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌ Failed to create/promote admin:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
