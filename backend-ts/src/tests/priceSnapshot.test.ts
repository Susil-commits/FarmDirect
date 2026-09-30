import mongoose from 'mongoose';
import PriceSnapshot from '../models/PriceSnapshot.js';
import CropListing from '../models/CropListing.js';
import User from '../models/User.js';
import { capturePriceSnapshot, getPriceStats } from '../services/priceSnapshotService.js';
import { CropCategory, CropType, CropUnit, UserRole, KycStatus } from '../types/enums.js';

describe('PriceSnapshot & Price History Service', () => {
  it('should capture a price snapshot and query price statistics', async () => {
    const cropId = new mongoose.Types.ObjectId();

    // Insert 5 simulated price points for Tomato in Bhubaneswar
    const prices = [25, 30, 28, 35, 40];
    const now = Date.now();

    for (let i = 0; i < prices.length; i++) {
      await capturePriceSnapshot({
        cropId,
        cropName: 'Tomato',
        category: 'vegetables',
        region: 'Bhubaneswar, Odisha',
        price: prices[i],
        unit: 'kg',
        isOrganic: true,
        source: 'listing_created',
        at: new Date(now - (5 - i) * 86400000), // sequential days
      });
    }

    const count = await PriceSnapshot.countDocuments({ cropName: 'tomato' });
    expect(count).toBe(5);

    const stats = await getPriceStats({
      cropName: 'Tomato',
      region: 'Bhubaneswar',
      days: 30,
    });

    expect(stats.sufficientData).toBe(true);
    expect(stats.minPrice).toBe(25);
    expect(stats.maxPrice).toBe(40);
    expect(stats.medianPrice).toBe(30);
    expect(stats.avgPrice).toBe(31.6);
    expect(stats.trendPercent).toBeGreaterThan(0); // Prices went up from 25 to 40
  });

  it('should return sufficientData: false when fewer than minRequiredSnapshots exist', async () => {
    const cropId = new mongoose.Types.ObjectId();

    await capturePriceSnapshot({
      cropId,
      cropName: 'Dragonfruit',
      category: 'fruits',
      region: 'Cuttack, Odisha',
      price: 150,
      unit: 'kg',
    });

    const stats = await getPriceStats({
      cropName: 'Dragonfruit',
      minRequiredSnapshots: 3,
    });

    expect(stats.sufficientData).toBe(false);
    expect(stats.count).toBe(1);
    expect(stats.medianPrice).toBe(150);
  });
});
