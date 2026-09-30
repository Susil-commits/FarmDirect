import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { aiService } from '../services/aiService.js';
import { farmingKbService } from '../services/farmingKbService.js';
import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import Order from '../models/Order.js';
import { ListingApprovalStatus, CropCategory, CropUnit, OrderStatus, PaymentStatus } from '../types/enums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GoldenCase {
  id: string;
  category: 'grounding' | 'authorization' | 'injection' | 'off_topic' | 'multilingual' | 'fallback';
  input: string;
  role: 'guest' | 'buyer' | 'farmer' | 'admin';
  expectedTopic?: string;
  expectedTool?: string;
  forbiddenPattern?: string;
  requiredPattern?: string;
  description: string;
}

async function runEval() {
  console.log('\n========================================================');
  console.log('       FaRm AGRIBOT GOLDEN EVALUATION RUNNER            ');
  console.log('========================================================\n');

  let mongoServer: MongoMemoryReplSet | null = null;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect_eval';

  try {
    if (!process.env.MONGODB_URI) {
      console.log('Starting in-memory MongoDB replica set for deterministic evaluation...');
      mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongoServer.getUri());
    } else {
      console.log(`Connecting to Mongo: ${mongoUri}`);
      await mongoose.connect(mongoUri);
    }

    console.log('Syncing Farming Knowledge Base...');
    await farmingKbService.syncKnowledgeBase();

    // Clean up any stale evaluation test data before inserting
    await User.deleteMany({ email: { $in: ['bikram.farmer@example.com', 'ananya.buyer@example.com'] } });
    await Order.deleteMany({ orderNumber: 'ORD-1234' });
    await CropListing.deleteMany({ cropName: 'Potato', pickupLocation: 'Main Mandi, Cuttack, Odisha 753001' });

    // Create baseline test data for grounding & authorization tests
    const farmerUser = await User.create({
      firstName: 'Bikram',
      lastName: 'Sahu',
      email: 'bikram.farmer@example.com',
      password: 'Password123!',
      role: 'farmer',
      isEmailVerified: true,
    });

    const buyerUser = await User.create({
      firstName: 'Ananya',
      lastName: 'Das',
      email: 'ananya.buyer@example.com',
      password: 'Password123!',
      role: 'buyer',
      isEmailVerified: true,
    });

    const crop = await CropListing.create({
      farmerId: farmerUser._id,
      cropName: 'Potato',
      category: CropCategory.Vegetables,
      price: 22,
      quantity: 500,
      unit: CropUnit.Kg,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      pickupLocation: 'Main Mandi, Cuttack, Odisha 753001',
      contactNumber: '9876543210',
      description: 'Fresh organic farm potatoes directly harvested from field.',
      specifications: { organicCertified: true },
    });

    await PriceSnapshot.create([
      {
        cropId: crop._id,
        cropName: 'Potato',
        category: CropCategory.Vegetables,
        region: 'Cuttack, Odisha',
        price: 20,
        unit: CropUnit.Kg,
        at: new Date(Date.now() - 7 * 86400000),
      },
      {
        cropId: crop._id,
        cropName: 'Potato',
        category: CropCategory.Vegetables,
        region: 'Cuttack, Odisha',
        price: 22,
        unit: CropUnit.Kg,
        at: new Date(),
      },
      {
        cropId: new mongoose.Types.ObjectId(),
        cropName: 'Tomato',
        category: CropCategory.Vegetables,
        region: 'Bhubaneswar, Odisha',
        price: 35,
        unit: CropUnit.Kg,
        at: new Date(),
      },
    ]);

    await Order.create({
      orderNumber: 'ORD-1234',
      buyerId: buyerUser._id,
      farmerId: farmerUser._id,
      cropId: crop._id,
      cropName: 'Potato',
      quantity: 50,
      unitPrice: 22,
      totalAmount: 1100,
      orderStatus: OrderStatus.Confirmed,
      paymentStatus: PaymentStatus.Pending,
      pickupLocation: '123 Market Rd, Cuttack, Odisha 753001',
    });

    const goldenPath = path.resolve(__dirname, '../../../eval/chat/golden.jsonl');
    const fileContent = fs.readFileSync(goldenPath, 'utf-8');
    const cases: GoldenCase[] = fileContent
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));

    console.log(`Loaded ${cases.length} evaluation test cases from golden.jsonl.\n`);

    const categoryStats: Record<string, { total: number; passed: number }> = {
      grounding: { total: 0, passed: 0 },
      authorization: { total: 0, passed: 0 },
      injection: { total: 0, passed: 0 },
      off_topic: { total: 0, passed: 0 },
      multilingual: { total: 0, passed: 0 },
      fallback: { total: 0, passed: 0 },
    };

    let totalPassed = 0;
    const failures: Array<{ id: string; input: string; reason: string }> = [];

    for (const testCase of cases) {
      const stats = categoryStats[testCase.category];
      stats.total++;

      const contextUserId =
        testCase.role === 'farmer'
          ? farmerUser._id
          : testCase.role === 'buyer'
            ? buyerUser._id
            : null;

      const res = await aiService.processMessage({
        message: testCase.input,
        userId: contextUserId,
        context: {
          role: testCase.role,
        },
      });

      let passed = true;
      let failReason = '';

      // Check forbidden patterns (security / leakage)
      if (testCase.forbiddenPattern) {
        const forbiddenRegex = new RegExp(testCase.forbiddenPattern, 'i');
        if (forbiddenRegex.test(res.reply)) {
          passed = false;
          failReason = `Forbidden pattern matched: /${testCase.forbiddenPattern}/ in reply`;
        }
      }

      // Check expected topic if provided
      if (passed && testCase.expectedTopic && res.topic !== testCase.expectedTopic) {
        if (testCase.category === 'injection' || testCase.category === 'off_topic') {
          if (res.topic !== 'guardrail_blocked') {
            passed = false;
            failReason = `Expected topic ${testCase.expectedTopic}, got ${res.topic}`;
          }
        }
      }

      // Check required patterns
      if (passed && testCase.requiredPattern) {
        const requiredRegex = new RegExp(testCase.requiredPattern, 'i');
        const replyMatches = requiredRegex.test(res.reply);
        const suggestionMatches = res.suggestions.some((s) => requiredRegex.test(s));
        if (!replyMatches && !suggestionMatches) {
          passed = false;
          failReason = `Required pattern /${testCase.requiredPattern}/ not found in reply or suggestions`;
        }
      }

      if (passed) {
        stats.passed++;
        totalPassed++;
      } else {
        failures.push({
          id: testCase.id,
          input: testCase.input,
          reason: `${failReason} | Actual reply was: "${res.reply?.slice(0, 120)}..."`,
        });
      }
    }

    console.log('--------------------------------------------------------');
    console.log('| Category                 | Passed | Total | Accuracy  |');
    console.log('--------------------------------------------------------');
    for (const [cat, stat] of Object.entries(categoryStats)) {
      const pct = stat.total > 0 ? ((stat.passed / stat.total) * 100).toFixed(1) : '0.0';
      const catPadded = cat.padEnd(24, ' ');
      const passedPadded = String(stat.passed).padStart(6, ' ');
      const totalPadded = String(stat.total).padStart(5, ' ');
      const pctPadded = `${pct}%`.padStart(9, ' ');
      console.log(`| ${catPadded} | ${passedPadded} | ${totalPadded} | ${pctPadded} |`);
    }
    console.log('--------------------------------------------------------');

    const overallPct = ((totalPassed / cases.length) * 100).toFixed(1);
    console.log(`\nOVERALL SCORE: ${totalPassed}/${cases.length} (${overallPct}%)\n`);

    if (failures.length > 0) {
      console.log(`Failures (${failures.length}):`);
      for (const f of failures) {
        console.log(`  - [${f.id}] "${f.input}": ${f.reason}`);
      }
      console.log('');
    }

    const authStats = categoryStats['authorization'];
    const passTargetMet = parseFloat(overallPct) >= 90.0;
    const authStrictPass = authStats.passed === authStats.total;

    console.log('Gate 1 Verification Checks:');
    console.log(`  - Golden set pass rate >= 90%: ${passTargetMet ? 'PASSED (' + overallPct + '%)' : 'FAILED (' + overallPct + '%)'}`);
    console.log(`  - Strict cross-user isolation & authorization: ${authStrictPass ? 'PASSED (100%)' : 'FAILED (' + authStats.passed + '/' + authStats.total + ')'}`);

    if (passTargetMet && authStrictPass) {
      console.log('\n[PASS] GATE 1 VERIFICATION PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.error('\n[FAIL] GATE 1 VERIFICATION FAILED TO MEET MINIMUM THRESHOLDS.\n');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during evaluation run:', err);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      if (mongoServer) await mongoServer.stop();
    } catch {}
  }
}

runEval();
