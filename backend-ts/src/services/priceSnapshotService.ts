import type { Types } from 'mongoose';
import PriceSnapshot, { type IPriceSnapshot } from '../models/PriceSnapshot.js';
import logger from '../utils/logger.js';

export interface CaptureSnapshotParams {
  cropId: Types.ObjectId | string;
  cropName: string;
  category: string;
  region: string;
  price: number;
  unit?: string;
  isOrganic?: boolean;
  source?: 'listing_created' | 'price_updated' | 'order_completed' | 'seed';
  at?: Date;
}

export interface PriceStats {
  cropName: string;
  region?: string;
  count: number;
  minPrice: number;
  medianPrice: number;
  maxPrice: number;
  avgPrice: number;
  p25: number;
  p75: number;
  trendPercent?: number;
  sufficientData: boolean;
}

export async function capturePriceSnapshot(params: CaptureSnapshotParams): Promise<IPriceSnapshot | null> {
  try {
    const snapshot = await PriceSnapshot.create({
      cropId: params.cropId,
      cropName: params.cropName.trim().toLowerCase(),
      category: params.category.trim().toLowerCase(),
      region: params.region.trim(),
      price: Number(params.price),
      unit: params.unit || 'kg',
      isOrganic: Boolean(params.isOrganic),
      source: params.source || 'listing_created',
      at: params.at || new Date(),
    });
    return snapshot;
  } catch (error: any) {
    logger.error({ err: error?.message || error, cropName: params.cropName }, 'Failed to record PriceSnapshot');
    return null;
  }
}

export async function getPriceStats(params: {
  cropName: string;
  region?: string;
  days?: number;
  minRequiredSnapshots?: number;
}): Promise<PriceStats> {
  const { cropName, region, days = 90, minRequiredSnapshots = 3 } = params;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {
    cropName: cropName.trim().toLowerCase(),
    at: { $gte: cutoff },
  };

  if (region && region.trim() && region !== 'all') {
    filter.region = { $regex: region.trim(), $options: 'i' };
  }

  const snapshots = await PriceSnapshot.find(filter).sort({ at: 1 }).lean();

  if (snapshots.length < minRequiredSnapshots) {
    return {
      cropName,
      region,
      count: snapshots.length,
      minPrice: snapshots.length > 0 ? snapshots[0].price : 0,
      medianPrice: snapshots.length > 0 ? snapshots[0].price : 0,
      maxPrice: snapshots.length > 0 ? snapshots[0].price : 0,
      avgPrice: snapshots.length > 0 ? snapshots[0].price : 0,
      p25: 0,
      p75: 0,
      sufficientData: false,
    };
  }

  const prices = snapshots.map((s) => s.price).sort((a, b) => a - b);
  const count = prices.length;
  const minPrice = prices[0];
  const maxPrice = prices[count - 1];
  const avgPrice = Math.round((prices.reduce((sum, p) => sum + p, 0) / count) * 100) / 100;

  const medianPrice =
    count % 2 === 0
      ? (prices[count / 2 - 1] + prices[count / 2]) / 2
      : prices[Math.floor(count / 2)];

  const p25Index = Math.floor(count * 0.25);
  const p75Index = Math.floor(count * 0.75);
  const p25 = prices[p25Index];
  const p75 = prices[p75Index];

  // Calculate trend: first half vs second half average
  const half = Math.floor(snapshots.length / 2);
  const firstHalfAvg = snapshots.slice(0, half).reduce((s, r) => s + r.price, 0) / (half || 1);
  const secondHalfAvg = snapshots.slice(half).reduce((s, r) => s + r.price, 0) / (snapshots.length - half || 1);
  const trendPercent = firstHalfAvg > 0
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 1000) / 10
    : 0;

  return {
    cropName,
    region,
    count,
    minPrice,
    medianPrice,
    maxPrice,
    avgPrice,
    p25,
    p75,
    trendPercent,
    sufficientData: true,
  };
}

export interface PriceGuidanceResult {
  cropName: string;
  region?: string;
  days: number;
  isOrganic: boolean;
  sufficientData: boolean;
  status: 'available' | 'insufficient_data';
  count: number;
  p25?: number;
  median?: number;
  p75?: number;
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  suggestedPrice?: number;
  unit: string;
  trendPercent?: number;
  message?: string;
}

export async function getPriceGuidance(params: {
  cropName: string;
  region?: string;
  days?: number;
  isOrganic?: boolean;
  minRequiredSnapshots?: number;
}): Promise<PriceGuidanceResult> {
  const { cropName, region, days = 30, isOrganic = false, minRequiredSnapshots = 2 } = params;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {
    cropName: cropName.trim().toLowerCase(),
    at: { $gte: cutoff },
  };

  if (region && region.trim() && region !== 'all') {
    filter.region = { $regex: region.trim(), $options: 'i' };
  }

  const allSnapshots = await PriceSnapshot.find(filter).sort({ at: 1 }).lean();

  if (allSnapshots.length < minRequiredSnapshots) {
    return {
      cropName,
      region,
      days,
      isOrganic,
      count: allSnapshots.length,
      sufficientData: false,
      status: 'insufficient_data',
      unit: allSnapshots[0]?.unit || 'kg',
      message: `Insufficient historical price snapshots for "${cropName}". At least ${minRequiredSnapshots} transactions are required to calculate market price guidance.`,
    };
  }

  // Filter organic if requested and enough data exists; otherwise apply a 20% organic quality multiplier
  const organicSnapshots = isOrganic ? allSnapshots.filter((s) => s.isOrganic) : [];
  const useDirectOrganic = isOrganic && organicSnapshots.length >= minRequiredSnapshots;
  const selectedSnapshots = useDirectOrganic ? organicSnapshots : allSnapshots;
  const organicMultiplier = isOrganic && !useDirectOrganic ? 1.2 : 1.0;

  const rawPrices = selectedSnapshots.map((s) => s.price * organicMultiplier).sort((a, b) => a - b);
  const count = rawPrices.length;
  const minPrice = Math.round(rawPrices[0] * 100) / 100;
  const maxPrice = Math.round(rawPrices[count - 1] * 100) / 100;
  const avgPrice = Math.round((rawPrices.reduce((sum, p) => sum + p, 0) / count) * 100) / 100;

  const medianPrice =
    count % 2 === 0
      ? Math.round(((rawPrices[count / 2 - 1] + rawPrices[count / 2]) / 2) * 100) / 100
      : Math.round(rawPrices[Math.floor(count / 2)] * 100) / 100;

  const p25Index = Math.floor(count * 0.25);
  const p75Index = Math.floor(count * 0.75);
  const p25 = Math.round(rawPrices[p25Index] * 100) / 100;
  const p75 = Math.round(rawPrices[p75Index] * 100) / 100;

  const half = Math.floor(selectedSnapshots.length / 2);
  const firstHalfAvg = selectedSnapshots.slice(0, half).reduce((s, r) => s + r.price, 0) / (half || 1);
  const secondHalfAvg = selectedSnapshots.slice(half).reduce((s, r) => s + r.price, 0) / (selectedSnapshots.length - half || 1);
  const trendPercent = firstHalfAvg > 0
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 1000) / 10
    : 0;

  return {
    cropName,
    region,
    days,
    isOrganic,
    count,
    minPrice,
    median: medianPrice,
    maxPrice,
    avgPrice,
    p25,
    p75,
    suggestedPrice: medianPrice,
    unit: selectedSnapshots[0]?.unit || 'kg',
    trendPercent,
    sufficientData: true,
    status: 'available',
  };
}

