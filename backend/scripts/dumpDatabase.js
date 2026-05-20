import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data_dump');

// All known collection names in your database
const COLLECTIONS = [
  'users',
  'croplistings',
  'orders',
  'reviews',
  'wishlists',
  'messages',
  'notifications',
  'contacts',
  'contactqueries',
  'auditlogs',
];

async function dumpCollection(name) {
  // Access the raw collection (bypasses Mongoose schema)
  const db = mongoose.connection.db;
  const docs = await db.collection(name).find({}).toArray();
  return docs;
}

async function main() {
  console.log(`\nConnecting to MongoDB...`);
  console.log(`URI: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}\n`);

  // Hide deprecation warning noise
  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
  } catch (err) {
    console.error(`\nFAILED TO CONNECT: ${err.message}`);
    console.error('\nPossible causes:');
    console.error('  - MongoDB Atlas server is down / unreachable');
    console.error('  - Network/firewall blocking the connection');
    console.error('  - IP whitelist on Atlas does not include your current IP');
    console.error('  - Credentials in .env are invalid or expired');
    process.exit(1);
  }

  console.log(`Connected! Database: ${mongoose.connection.db.databaseName}\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Dump each collection
  for (const collName of COLLECTIONS) {
    try {
      console.log(`Dumping "${collName}"...`);
      const docs = await dumpCollection(collName);
      console.log(`  -> ${docs.length} document(s)`);

      const filePath = path.join(OUTPUT_DIR, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`  -> Saved to ${filePath}`);
    } catch (err) {
      // Collection doesn't exist — skip gracefully
      if (err.code === 26 || err.message?.includes('does not exist')) {
        console.log(`  -> Collection "${collName}" does not exist (skipping)`);
      } else {
        console.error(`  -> Error dumping "${collName}": ${err.message}`);
      }
    }
  }

  // Also write a summary JSON with counts
  const summary = {};
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8');
    const arr = JSON.parse(raw);
    summary[f.replace('.json', '')] = arr.length;
  }
  const summaryPath = path.join(OUTPUT_DIR, '_SUMMARY.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`\n========================================`);
  console.log(`DUMP COMPLETE`);
  console.log(`========================================`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Summary:`);
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k}: ${v} document(s)`);
  }
  console.log(`\nSummary file: ${summaryPath}`);

  await mongoose.disconnect();
  process.exit(0);
}

main();