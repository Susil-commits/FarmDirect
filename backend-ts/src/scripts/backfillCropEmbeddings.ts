import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { backfillCropEmbeddings } from '../services/listingEmbeddingService.js';

dotenv.config();

async function runBackfill() {
  console.log('\n========================================================');
  console.log('       FaRm CROP LISTING EMBEDDINGS BACKFILL RUNNER     ');
  console.log('========================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmdirect';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    console.log('Starting backfill for crop listings without embeddings...');
    const result = await backfillCropEmbeddings();

    console.log('\n========================================================');
    console.log('                  BACKFILL COMPLETE                     ');
    console.log('========================================================');
    console.log(`Listings Processed:   ${result.processed}`);
    console.log(`Embeddings Updated:   ${result.updated}`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Failed to run embedding backfill:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runBackfill();
