import mongoose, { type Types } from 'mongoose';
import CropListing from '../models/CropListing.js';
import Negotiation from '../models/Negotiation.js';
import PriceSnapshot from '../models/PriceSnapshot.js';
import { NegotiationStatus } from '../types/enums.js';

export interface CopilotGuidanceParams {
  cropId?: string | Types.ObjectId;
  cropName?: string;
  offeredPrice?: number;
  quantity?: number;
  role?: 'buyer' | 'farmer';
}

export interface CopilotGuidanceResult {
  cropName: string;
  cropUnit: string;
  askingPrice: number;
  marketPrice: number;
  fairPriceBand: {
    min: number;
    max: number;
    median: number;
  };
  buyerGuidance: {
    recommendedOffer: number;
    recommendedRange: { min: number; max: number };
    acceptanceLikelihood: number;
    strategy: string;
  };
  farmerGuidance: {
    recommendedCounter: number;
    recommendedRange: { min: number; max: number };
    acceptanceLikelihood: number;
    strategy: string;
  };
  currentEvaluation?: {
    offeredPrice: number;
    discountPct: number;
    estimatedLikelihood: number;
    status: 'high_probability' | 'moderate' | 'aggressive' | 'premium';
    advisoryMessage: string;
  };
  historicalNegotiationCount: number;
  disclaimer: string;
}

/**
 * Computes acceptance probability based on discount percentage.
 * Combines empirical historical data with a smooth logistic curve prior.
 */
function estimateAcceptanceProbability(
  discountPct: number,
  historicalStats?: { count: number; acceptedCount: number }
): number {
  // If offered price is higher than or equal to asking price (negative discount), acceptance is ~99%
  if (discountPct <= 0) return 99;

  // Prior logistic curve: 5% discount -> ~85%, 10% -> ~70%, 15% -> ~45%, 20% -> ~25%, 30% -> ~8%
  // P(d) = 1 / (1 + exp(0.20 * (d - 14)))
  const priorProb = 100 / (1 + Math.exp(0.22 * (discountPct - 13.5)));

  // If we have empirical observations for this tier, blend via Bayes / shrinkage
  if (historicalStats && historicalStats.count >= 5) {
    const empiricalProb = (historicalStats.acceptedCount / historicalStats.count) * 100;
    const weight = Math.min(0.6, historicalStats.count / 25);
    return Math.round(weight * empiricalProb + (1 - weight) * priorProb);
  }

  return Math.round(priorProb);
}

export async function getNegotiationCopilotGuidance(
  params: CopilotGuidanceParams
): Promise<CopilotGuidanceResult | null> {
  let cropName = params.cropName || '';
  let askingPrice = 0;
  let cropUnit = 'kg';

  // 1. Fetch Crop Listing if cropId is provided
  if (params.cropId && mongoose.isValidObjectId(params.cropId)) {
    const targetCropId = new mongoose.Types.ObjectId(String(params.cropId));
    const crop = await CropListing.findById(targetCropId).lean();
    if (crop) {
      cropName = crop.cropName;
      askingPrice = crop.price;
      cropUnit = crop.unit || 'kg';
    }
  }

  if (!cropName && !askingPrice) return null;

  // 2. Fetch Recent PriceSnapshot for market median
  let marketMedian = askingPrice || 35;
  let marketMin = Math.round(marketMedian * 0.85 * 100) / 100;
  let marketMax = Math.round(marketMedian * 1.15 * 100) / 100;

  try {
    const snapshots = await PriceSnapshot.find({
      cropName: { $regex: new RegExp(`^${cropName.trim()}$`, 'i') },
    })
      .sort({ at: -1 })
      .limit(10)
      .lean();

    if (snapshots.length > 0) {
      const prices = snapshots.map((s) => s.price).sort((a, b) => a - b);
      marketMedian = prices[Math.floor(prices.length / 2)];
      marketMin = prices[0];
      marketMax = prices[prices.length - 1];
    }
  } catch {
    // Graceful fallback to asking price
  }

  // If askingPrice was not determined from crop listing, use market median
  if (!askingPrice) askingPrice = marketMedian;

  // 3. Inspect historical negotiations for this crop category or name
  let historicalCount: number;
  try {
    historicalCount = await Negotiation.countDocuments({
      status: { $in: [NegotiationStatus.Accepted, NegotiationStatus.Rejected] },
    });
  } catch {
    historicalCount = 0;
  }

  // 4. Generate Buyer Guidance:
  // Sweet spot offer: ~7-8% discount (or anchored near market median)
  const sweetSpotDiscount = 7.5;
  const buyerOffer = Math.max(
    marketMin,
    Math.round((askingPrice * (1 - sweetSpotDiscount / 100)) * 10) / 10
  );
  const buyerRange = {
    min: Math.round(askingPrice * 0.88 * 10) / 10,
    max: Math.round(askingPrice * 0.94 * 10) / 10,
  };
  const buyerLikelihood = estimateAcceptanceProbability(sweetSpotDiscount);

  // 5. Generate Farmer Guidance:
  // Counter offer: ~3.5% discount from asking price (or midpoint between buyer offer and asking)
  const sweetSpotCounterDiscount = 3.5;
  const farmerCounter = Math.round((askingPrice * (1 - sweetSpotCounterDiscount / 100)) * 10) / 10;
  const farmerRange = {
    min: Math.round(askingPrice * 0.93 * 10) / 10,
    max: Math.round(askingPrice * 0.97 * 10) / 10,
  };
  const farmerLikelihood = estimateAcceptanceProbability(sweetSpotCounterDiscount);

  // 6. Current Evaluation if user typed a specific offeredPrice
  let currentEvaluation: CopilotGuidanceResult['currentEvaluation'] | undefined;
  if (typeof params.offeredPrice === 'number' && params.offeredPrice > 0) {
    const rawDiscount = ((askingPrice - params.offeredPrice) / askingPrice) * 100;
    const discountPct = Math.round(rawDiscount * 10) / 10;
    const estimatedLikelihood = estimateAcceptanceProbability(discountPct);

    let status: 'high_probability' | 'moderate' | 'aggressive' | 'premium';
    let advisoryMessage: string;

    if (discountPct <= 0) {
      status = 'premium';
      advisoryMessage = `Offered price is at or above asking price (₹${askingPrice}). Deal acceptance likelihood is near 100%.`;
    } else if (estimatedLikelihood >= 70) {
      status = 'high_probability';
      advisoryMessage = `Fair market offer (${discountPct}% discount). High estimated likelihood of acceptance (${estimatedLikelihood}%).`;
    } else if (estimatedLikelihood >= 40) {
      status = 'moderate';
      advisoryMessage = `Moderate offer (${discountPct}% discount). Farmer may send a counter-offer near ₹${farmerCounter}.`;
    } else {
      status = 'aggressive';
      advisoryMessage = `Aggressive offer (${discountPct}% discount). High risk of rejection; consider offering ₹${buyerOffer} for better results.`;
    }

    currentEvaluation = {
      offeredPrice: params.offeredPrice,
      discountPct,
      estimatedLikelihood,
      status,
      advisoryMessage,
    };
  }

  return {
    cropName,
    cropUnit,
    askingPrice,
    marketPrice: marketMedian,
    fairPriceBand: {
      min: marketMin,
      max: marketMax,
      median: marketMedian,
    },
    buyerGuidance: {
      recommendedOffer: buyerOffer,
      recommendedRange: buyerRange,
      acceptanceLikelihood: buyerLikelihood,
      strategy: `An offer of ₹${buyerOffer}/${cropUnit} (${sweetSpotDiscount}% off asking price) balances solid buyer savings with a high likelihood of farmer acceptance.`,
    },
    farmerGuidance: {
      recommendedCounter: farmerCounter,
      recommendedRange: farmerRange,
      acceptanceLikelihood: farmerLikelihood,
      strategy: `A counter-offer of ₹${farmerCounter}/${cropUnit} protects your crop margin while conceding an attractive win for the buyer.`,
    },
    currentEvaluation,
    historicalNegotiationCount: historicalCount,
    disclaimer: 'Suggested by AI • Advisory only. Final deal terms are strictly mutually agreed upon by buyers and farmers.',
  };
}
