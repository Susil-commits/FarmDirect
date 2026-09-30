import mongoose, { type Types } from 'mongoose';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import EventLog from '../models/EventLog.js';
import User from '../models/User.js';
import { CropStatus, CropAvailability, ListingApprovalStatus } from '../types/enums.js';
import { cosineSimilarity, generateDeterministicVector } from './farmingKbService.js';
import { buildCropSearchText } from './listingEmbeddingService.js';
import logger from '../utils/logger.js';

export interface CoOccurrenceMap {
  [cropIdA: string]: {
    [cropIdB: string]: number;
  };
}

// In-memory cached co-occurrence matrix with timestamp
let cachedCoOccurrence: CoOccurrenceMap | null = null;
let lastCoOccurrenceBuild = 0;
const CO_OCCURRENCE_TTL = 3600 * 1000; // 1 hour

/**
 * Identify Indian agricultural season for a given date
 * - Kharif (Monsoon: July - October): Rice, Maize, Bajra, Jowar, Turmeric, Moong, Groundnut
 * - Rabi (Winter: November - March): Wheat, Mustard, Chana, Peas, Potato, Onion
 * - Zaid (Summer: April - June): Watermelon, Cucumber, Gourds, Pumpkin, Sunflower
 */
export function getCurrentSeason(date = new Date()): 'kharif' | 'rabi' | 'zaid' {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 7 && month <= 10) return 'kharif';
  if (month >= 11 || month <= 3) return 'rabi';
  return 'zaid';
}

const SEASONAL_CROPS: Record<'kharif' | 'rabi' | 'zaid', string[]> = {
  kharif: ['rice', 'paddy', 'maize', 'corn', 'bajra', 'jowar', 'turmeric', 'moong', 'cotton', 'soybean', 'groundnut', 'chilli'],
  rabi: ['wheat', 'mustard', 'chana', 'chickpea', 'pea', 'potato', 'onion', 'garlic', 'coriander', 'cumin', 'carrot', 'cabbage', 'cauliflower', 'spinach'],
  zaid: ['watermelon', 'cucumber', 'gourd', 'pumpkin', 'muskmelon', 'sunflower', 'sesame'],
};

export function isCropInSeason(cropName: string, date = new Date()): boolean {
  const season = getCurrentSeason(date);
  const seasonalNames = SEASONAL_CROPS[season] || [];
  const lower = cropName.toLowerCase();
  return seasonalNames.some((sn) => lower.includes(sn));
}

/**
 * Build item-item co-occurrence matrix from past orders and wishlists
 */
export async function buildCoOccurrenceMatrix(): Promise<CoOccurrenceMap> {
  const matrix: CoOccurrenceMap = {};

  try {
    // 1. Co-occurrence from Orders grouped by buyer
    const orders = await Order.find({}).lean().select('buyerId cropId items');
    const userItemMap = new Map<string, Set<string>>();

    for (const ord of orders) {
      const buyerId = String(ord.buyerId);
      if (!userItemMap.has(buyerId)) {
        userItemMap.set(buyerId, new Set());
      }
      const itemSet = userItemMap.get(buyerId)!;
      if (ord.cropId) itemSet.add(String(ord.cropId));
      if ('items' in ord && Array.isArray((ord as any).items)) {
        for (const it of (ord as any).items) {
          if (it.cropId) itemSet.add(String(it.cropId));
        }
      }
    }

    // 2. Add Wishlist items
    const wishlists = await Wishlist.find({}).lean().select('userId cropId');
    for (const w of wishlists) {
      const userId = String(w.userId);
      if (!userItemMap.has(userId)) {
        userItemMap.set(userId, new Set());
      }
      if (w.cropId) userItemMap.get(userId)!.add(String(w.cropId));
    }

    // 3. Populate symmetric pair frequencies
    for (const [, items] of userItemMap.entries()) {
      const arr = Array.from(items);
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];

          if (!matrix[a]) matrix[a] = {};
          if (!matrix[b]) matrix[b] = {};

          matrix[a][b] = (matrix[a][b] || 0) + 1;
          matrix[b][a] = (matrix[b][a] || 0) + 1;
        }
      }
    }
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, 'Failed to compute co-occurrence matrix');
  }

  cachedCoOccurrence = matrix;
  lastCoOccurrenceBuild = Date.now();
  return matrix;
}

export async function getCoOccurrenceMatrix(): Promise<CoOccurrenceMap> {
  if (cachedCoOccurrence && Date.now() - lastCoOccurrenceBuild < CO_OCCURRENCE_TTL) {
    return cachedCoOccurrence;
  }
  return buildCoOccurrenceMatrix();
}

/**
 * Content-based profile vector aggregation:
 * User vector = weighted average of vectors of interacted items
 */
export function buildUserProfileVector(
  itemsWithWeights: Array<{ vector: number[]; weight: number }>,
  dimensions = 64
): number[] | null {
  if (!itemsWithWeights || itemsWithWeights.length === 0) return null;

  const sumVec = new Array(dimensions).fill(0);
  let totalWeight = 0;

  for (const { vector, weight } of itemsWithWeights) {
    if (!vector || vector.length === 0) continue;
    const effectiveVec = vector.length === dimensions ? vector : generateDeterministicVector(JSON.stringify(vector), dimensions);
    for (let d = 0; d < dimensions; d++) {
      sumVec[d] += (effectiveVec[d] || 0) * weight;
    }
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  const norm = Math.sqrt(sumVec.reduce((acc, v) => acc + v * v, 0));
  return norm === 0 ? null : sumVec.map((v) => v / norm);
}

export interface RecommendationOptions {
  userId: string | Types.ObjectId;
  limit?: number;
  userRegion?: string;
  excludeCropIds?: string[];
}

/**
 * T3.3 Hybrid Recommender System
 * Integrates Content Embedding Similarity + Co-occurrence + Contextual Boosts (Region, In-Season) + Popularity
 */
export async function getHybridRecommendations(options: RecommendationOptions): Promise<any[]> {
  const { userId, limit = 8, excludeCropIds = [] } = options;
  const rawUserId = String(userId);

  try {
    // 1. Fetch User details for regional context
    const userDoc = await User.findById(rawUserId).lean().select('city state location');
    const userRegion = options.userRegion || userDoc?.city || userDoc?.state || '';

    // 2. Fetch User Interaction History (Orders, Wishlist, Views)
    const [pastOrders, wishlistItems, viewEvents] = await Promise.all([
      Order.find({ buyerId: rawUserId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('cropId', 'cropName category description specifications embedding')
        .lean(),
      Wishlist.find({ userId: rawUserId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('cropId', 'cropName category description specifications embedding')
        .lean(),
      EventLog.find({ userId: rawUserId, eventType: 'view_item' })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    // 3. Compile interacted crop IDs, category distribution, and weights for content vector
    const interactionWeights: Array<{ vector: number[]; weight: number }> = [];
    const interactedIds = new Set<string>(excludeCropIds.map(String));
    const userCategoryCounts: Record<string, number> = {};
    let organicPreferenceCount = 0;
    let totalInteractions = 0;

    for (const ord of pastOrders) {
      const crop = ord.cropId as any;
      if (crop && crop._id) {
        const idStr = String(crop._id);
        interactedIds.add(idStr);
        totalInteractions++;
        if (crop.category) {
          userCategoryCounts[crop.category] = (userCategoryCounts[crop.category] || 0) + 3;
        }
        if (crop.specifications?.organicCertified) organicPreferenceCount++;

        const vec = Array.isArray(crop.embedding) && crop.embedding.length > 0
          ? crop.embedding
          : generateDeterministicVector(buildCropSearchText(crop), 64);
        interactionWeights.push({ vector: vec, weight: 3.0 }); // Orders weight 3.0
      }
    }

    for (const w of wishlistItems) {
      const crop = w.cropId as any;
      if (crop && crop._id) {
        const idStr = String(crop._id);
        interactedIds.add(idStr);
        totalInteractions++;
        if (crop.category) {
          userCategoryCounts[crop.category] = (userCategoryCounts[crop.category] || 0) + 2;
        }
        if (crop.specifications?.organicCertified) organicPreferenceCount++;

        const vec = Array.isArray(crop.embedding) && crop.embedding.length > 0
          ? crop.embedding
          : generateDeterministicVector(buildCropSearchText(crop), 64);
        interactionWeights.push({ vector: vec, weight: 2.0 }); // Wishlist weight 2.0
      }
    }

    // View events
    for (const v of viewEvents) {
      const meta = v.meta as Record<string, unknown> | undefined;
      const cropIdStr = v.cropId ? String(v.cropId) : (meta?.cropId ? String(meta.cropId) : null);
      if (cropIdStr) {
        interactedIds.add(cropIdStr);
        totalInteractions++;
      }
    }

    const userProfileVector = buildUserProfileVector(interactionWeights, 64);
    const coocMatrix = await getCoOccurrenceMatrix();
    const isOrganicUser = totalInteractions > 0 && organicPreferenceCount / totalInteractions >= 0.4;

    // 4. Load Active Candidate Listings
    const candidateFilter: Record<string, unknown> = {
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
    };

    if (interactedIds.size > 0 && interactedIds.size < 50) {
      candidateFilter._id = { $nin: Array.from(interactedIds).map((id) => new mongoose.Types.ObjectId(id)) };
    }

    let candidates = await CropListing.find(candidateFilter)
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .lean()
      .limit(100);

    // If candidate set is too small, loosen the exclusion filter
    if (candidates.length < limit) {
      delete candidateFilter._id;
      candidates = await CropListing.find(candidateFilter)
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .lean()
        .limit(100);
    }

    if (candidates.length === 0) {
      return [];
    }

    // 5. Score candidates across hybrid components
    // Max sold count for normalization
    const maxSold = Math.max(...candidates.map((c) => Number(c.sold || 0)), 1);

    const scored = candidates.map((crop) => {
      const cropId = String(crop._id);
      const cropVec = Array.isArray(crop.embedding) && crop.embedding.length > 0
        ? crop.embedding
        : generateDeterministicVector(buildCropSearchText(crop), 64);

      // (a) Content similarity score [0, 1]
      const contentSim = userProfileVector ? Math.max(0, cosineSimilarity(userProfileVector, cropVec)) : 0;

      // (b) Item-Item Co-occurrence score
      let coocScore = 0;
      if (coocMatrix[cropId]) {
        for (const histId of interactedIds) {
          if (coocMatrix[cropId][histId]) {
            coocScore += coocMatrix[cropId][histId];
          }
        }
      }
      const normCoocScore = Math.min(1.0, coocScore / 5.0);

      // (c) Popularity prior [0, 1]
      const soldNorm = Number(crop.sold || 0) / maxSold;
      const farmerRating = (crop.farmerId as any)?.rating;
      const ratingNorm = Number(crop.rating || farmerRating || 4.0) / 5.0;
      const popularityScore = 0.6 * ratingNorm + 0.4 * soldNorm;

      // (d) Contextual Multipliers
      let multiplier = 1.0;

      // Same region boost (+15%)
      if (userRegion) {
        const farmerState = (crop.farmerId as any)?.state || '';
        const farmerCity = (crop.farmerId as any)?.city || '';
        const cropLoc = `${crop.pickupLocation || ''} ${farmerCity} ${farmerState}`.toLowerCase();
        if (cropLoc.includes(userRegion.toLowerCase())) {
          multiplier *= 1.15;
        }
      }

      // In-season boost (+10%)
      if (isCropInSeason(crop.cropName)) {
        multiplier *= 1.1;
      }

      // Organic preference boost (+10%)
      if (isOrganicUser && crop.specifications?.organicCertified) {
        multiplier *= 1.1;
      }

      // Category affinity [0, 1]
      const totalUserCatWeight = Object.values(userCategoryCounts).reduce((a, b) => a + b, 0);
      const catCount = userCategoryCounts[crop.category] || 0;
      const categoryAffinity = totalUserCatWeight > 0 ? catCount / totalUserCatWeight : 0;

      // Combined base score
      let baseScore: number;
      if (userProfileVector) {
        baseScore = (0.35 * categoryAffinity) + (0.30 * normCoocScore) + (0.25 * contentSim) + (0.10 * popularityScore);
      } else {
        // Cold start: rely primarily on popularity and regional/seasonal relevance
        baseScore = popularityScore;
      }

      const finalScore = baseScore * multiplier;

      return {
        crop,
        finalScore,
        contentSim,
        coocScore: normCoocScore,
        popularityScore,
      };
    });

    // Sort by finalScore descending
    scored.sort((a, b) => b.finalScore - a.finalScore);

    return scored.slice(0, limit).map((s) => s.crop);
  } catch (err: any) {
    logger.warn({ err: err?.message || err, userId: rawUserId }, 'Hybrid recommendations failed, falling back to legacy category query');
    return getLegacyRecommendationsFallback(rawUserId, limit);
  }
}

/**
 * Fallback baseline recommender matching category of user's past orders
 */
export async function getLegacyRecommendationsFallback(userId: string, limit = 8): Promise<any[]> {
  const [pastOrders, wishlistItems] = await Promise.all([
    Order.find({ buyerId: userId }).lean().populate('cropId', 'category').select('cropId').limit(30),
    Wishlist.find({ userId }).lean().populate('cropId', 'category').select('cropId').limit(30),
  ]);

  const preferredCategories = [
    ...pastOrders.map((o) => (o.cropId as { category?: string })?.category),
    ...wishlistItems.map((w) => (w.cropId as { category?: string })?.category),
  ].filter(Boolean);
  const uniqueCategories = [...new Set(preferredCategories.map(String))];

  if (uniqueCategories.length > 0) {
    const crops = await CropListing.find({
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      category: { $in: uniqueCategories },
    })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(limit)
      .sort({ rating: -1, sold: -1 });

    if (crops.length >= limit) return crops;

    const existingIds = new Set(crops.map((c) => String(c._id)));
    const needed = limit - crops.length;
    const additional = await CropListing.find({
      status: CropStatus.Active,
      availability: CropAvailability.Available,
      listingApprovalStatus: ListingApprovalStatus.Approved,
      _id: { $nin: Array.from(existingIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .lean()
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .limit(needed)
      .sort({ sold: -1, views: -1 });

    return [...crops, ...additional];
  }

  // Pure popularity
  return CropListing.find({
    status: CropStatus.Active,
    availability: CropAvailability.Available,
    listingApprovalStatus: ListingApprovalStatus.Approved,
  })
    .lean()
    .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
    .limit(limit)
    .sort({ sold: -1, views: -1, rating: -1 });
}

/**
 * T3.5 Similar Crops: Ranking by Embedding Similarity with Rating Tiebreak
 */
export async function getSimilarCropsVector(cropId: string, limit = 6): Promise<any[]> {
  const crop = await CropListing.findById(cropId).lean();
  if (!crop) return [];

  const targetVector = Array.isArray(crop.embedding) && crop.embedding.length > 0
    ? crop.embedding
    : generateDeterministicVector(buildCropSearchText(crop), 64);

  const candidates = await CropListing.find({
    _id: { $ne: new mongoose.Types.ObjectId(cropId) },
    status: CropStatus.Active,
    availability: CropAvailability.Available,
    listingApprovalStatus: ListingApprovalStatus.Approved,
  })
    .lean()
    .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
    .limit(60);

  if (candidates.length === 0) return [];

  const scored = candidates.map((cand) => {
    const candVector = Array.isArray(cand.embedding) && cand.embedding.length > 0
      ? cand.embedding
      : generateDeterministicVector(buildCropSearchText(cand), 64);
    const sim = cosineSimilarity(targetVector, candVector);
    const candFarmerRating = (cand.farmerId as any)?.rating;
    const ratingNorm = Number(cand.rating || candFarmerRating || 4.0) / 5.0;

    // Same category bonus
    const categoryBonus = cand.category === crop.category ? 0.15 : 0.0;

    const rankScore = (0.7 * sim) + (0.2 * categoryBonus) + (0.1 * ratingNorm);
    return { cand, rankScore, sim };
  });

  scored.sort((a, b) => b.rankScore - a.rankScore);
  return scored.slice(0, limit).map((s) => s.cand);
}
