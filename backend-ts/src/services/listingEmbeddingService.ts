import mongoose from 'mongoose';
import CropListing from '../models/CropListing.js';
import Embedding from '../models/Embedding.js';
import { llmClient } from '../ai/llmClient.js';
import { generateDeterministicVector, cosineSimilarity } from './farmingKbService.js';
import logger from '../utils/logger.js';
import { CropStatus, CropAvailability, ListingApprovalStatus } from '../types/enums.js';

// Multilingual produce dictionary mapping English, Hindi (Latin + Devanagari), and Odia (Latin + Odia)
export const MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
  potato: ['potato', 'aloo', 'aalu', 'आलू', 'ଆଳୁ', 'batata'],
  tomato: ['tomato', 'tamatar', 'टमाटर', 'ଟମାଟୋ', 'tamata'],
  onion: ['onion', 'pyaz', 'pyaaz', 'kanda', 'प्याज', 'ପିଆଜ', 'dungri'],
  mango: ['mango', 'aam', 'आम', 'ଆମ୍ବ', 'alphonso', 'kesar'],
  rice: ['rice', 'chawal', 'dhan', 'paddy', 'चावल', 'धान', 'ଧାନ', 'ଚାଉଳ', 'basmati'],
  wheat: ['wheat', 'gehun', 'atta', 'kanak', 'गेहूं', 'ଗହମ', 'sharbati'],
  brinjal: ['brinjal', 'eggplant', 'baingan', 'baigana', 'बैंगन', 'ବାଇଗଣ', 'vangi'],
  chilli: ['chilli', 'chili', 'mirch', 'mirchi', 'lanka', 'मिर्च', 'ଲଙ୍କା'],
  turmeric: ['turmeric', 'haldi', 'halada', 'हल्दी', 'ହଳଦୀ'],
  ginger: ['ginger', 'adrak', 'ada', 'अदरक', 'ଅଦା'],
  banana: ['banana', 'kela', 'kadali', 'केला', 'କଦଳୀ'],
  apple: ['apple', 'seb', 'seo', 'सेब', 'ସେଓ'],
  spinach: ['spinach', 'palak', 'palanga', 'पालक', 'ପାଳଙ୍ଗ', 'saag'],
  carrot: ['carrot', 'gajar', 'gajara', 'गाजर', 'ଗାଜର'],
  cauliflower: ['cauliflower', 'gobhi', 'gobi', 'phulagobi', 'गोभी', 'ଫୁଲକୋବି'],
  cabbage: ['cabbage', 'patagobhi', 'bandhagobi', 'ପତ୍ରକୋବି', 'ପତ୍ତାଗୋଭୀ'],
  okra: ['okra', 'bhindi', 'bhendi', 'ladyfinger', 'भिंडी', 'ଭେଣ୍ଡି'],
  pea: ['pea', 'peas', 'matar', 'matara', 'मटर', 'ମଟର'],
  gourd: ['gourd', 'karela', 'lauki', 'turai', 'kalara', 'lau', 'करेला', 'लौकी', 'ତୋରି', 'କଲରା', 'ଲାଉ'],
  mustard: ['mustard', 'sarson', 'rai', 'saraso', 'सरसों', 'ସୋରିଷ'],
  cumin: ['cumin', 'jeera', 'jira', 'जीरा', 'ଜିରା'],
  coriander: ['coriander', 'dhania', 'dhaniya', 'धनिया', 'ଧନିଆ'],
  garlic: ['garlic', 'lahsun', 'rasuna', 'लहसुन', 'ରସୁଣ'],
  pumpkin: ['pumpkin', 'kaddu', 'boiti', 'कद्दू', 'ବୋଇତି କଖାରୁ'],
  watermelon: ['watermelon', 'tarbooz', 'tarbhuja', 'तरबूज', 'ତରଭୁଜ'],
  coconut: ['coconut', 'nariyal', 'nadia', 'नारियल', 'ନଡ଼ିଆ'],
  chana: ['chana', 'chickpea', 'gram', 'चना', 'ଚଣା'],
  moong: ['moong', 'mung', 'मूंग', 'ମୁଗ'],
  toor: ['toor', 'arhar', 'harada', 'अरहर', 'ହରଡ଼'],
  urad: ['urad', 'biri', 'उड़द', 'ବିରି'],
  cardamom: ['cardamom', 'elaichi', 'gujarati', 'इलायची', 'ଗୁଜୁରାତି'],
  pepper: ['pepper', 'peppercorn', 'golmarich', 'काली मिर्च', 'ଗୋଲମରିଚ'],
};

/**
 * Expand a user query string with multilingual synonyms across EN, HI, OD
 */
export function expandMultilingualQuery(rawQuery: string): { canonicalTerms: string[]; expandedKeywords: string[] } {
  const normalized = (rawQuery || '').trim().toLowerCase();
  if (!normalized) return { canonicalTerms: [], expandedKeywords: [] };

  const tokens = normalized.split(/\s+/);
  const matchedCanonicals = new Set<string>();
  const allKeywords = new Set<string>(tokens);

  for (const token of tokens) {
    for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
      if (synonyms.some((s) => s.toLowerCase() === token || token.includes(s.toLowerCase()) || s.toLowerCase().includes(token))) {
        matchedCanonicals.add(canonical);
        for (const syn of synonyms) {
          allKeywords.add(syn.toLowerCase());
        }
      }
    }
  }

  return {
    canonicalTerms: Array.from(matchedCanonicals),
    expandedKeywords: Array.from(allKeywords),
  };
}

export function buildCropSearchText(crop: {
  cropName: string;
  category: string;
  cropType?: string;
  description?: string;
  specifications?: any;
  pickupLocation?: string;
}): string {
  const specs = crop.specifications || {};
  const isOrg = specs.organicCertified ? 'organic' : '';
  const grade = specs.grade ? `grade ${specs.grade}` : '';
  const variety = specs.variety ? `variety ${specs.variety}` : '';
  const loc = crop.pickupLocation || '';
  const desc = crop.description || '';

  return `${crop.cropName} ${crop.cropName} ${crop.cropName} ${crop.category} ${crop.category} ${crop.cropType || ''} ${variety} ${isOrg} ${grade} ${loc} ${desc}`.trim();
}

export async function generateEmbeddingVector(text: string): Promise<number[]> {
  if (llmClient.isConfigured()) {
    try {
      const vector = await llmClient.generateEmbedding(text);
      if (vector && vector.length > 0) return vector;
    } catch (err: any) {
      logger.warn({ err: err?.message || err }, 'LLM embedding failed, falling back to deterministic vector');
    }
  }
  return generateDeterministicVector(text, 64);
}

/**
 * Generate and store embedding vector on a CropListing and the Embedding collection
 */
export async function syncCropEmbedding(cropId: string | mongoose.Types.ObjectId): Promise<number[]> {
  const crop = await CropListing.findById(cropId);
  if (!crop) {
    throw new Error(`CropListing ${cropId} not found`);
  }

  const textToEmbed = buildCropSearchText(crop);
  const vector = await generateEmbeddingVector(textToEmbed);

  crop.embedding = vector;
  await crop.save();

  // Also sync into unified Embedding collection
  await Embedding.findOneAndUpdate(
    { sourceId: `crop_${crop._id.toString()}` },
    {
      sourceId: `crop_${crop._id.toString()}`,
      title: crop.cropName,
      category: crop.category || 'vegetables',
      entityType: 'crop_listing',
      cropId: crop._id,
      content: textToEmbed,
      embedding: vector,
      tags: [crop.category, crop.cropType, crop.cropName.toLowerCase()].filter(Boolean),
      attribution: `FaRm Direct Farmer Listing: ${crop.cropName}`,
      metadata: {
        price: crop.price,
        unit: crop.unit,
        isOrganic: Boolean(crop.specifications?.organicCertified),
        pickupLocation: crop.pickupLocation,
        status: crop.status,
      },
    },
    { upsert: true, new: true }
  );

  return vector;
}

/**
 * Backfill embeddings for all crop listings missing vectors
 */
export async function backfillCropEmbeddings(): Promise<{ processed: number; updated: number }> {
  const crops = await CropListing.find({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  });

  let updated = 0;
  for (const crop of crops) {
    try {
      await syncCropEmbedding(crop._id);
      updated++;
    } catch (err: any) {
      logger.warn({ err: err?.message || err, cropId: crop._id }, 'Failed to backfill crop embedding');
    }
  }

  return { processed: crops.length, updated };
}

export interface HybridSearchResult {
  crop: any;
  score: number;
  textRank?: number;
  vectorRank?: number;
  rrfScore: number;
}

export interface SemanticSearchParams {
  query?: string;
  category?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  page?: number;
  limit?: number;
}

/**
 * T3.2 Semantic + Multilingual Hybrid Search with Reciprocal Rank Fusion (RRF)
 */
export async function searchCropsHybrid(params: SemanticSearchParams): Promise<{
  crops: any[];
  total: number;
  page: number;
  pages: number;
  appliedExpansion?: string[];
}> {
  const {
    query = '',
    category,
    region,
    minPrice,
    maxPrice,
    isOrganic,
    page = 1,
    limit = 12,
  } = params;

  const baseFilter: Record<string, unknown> = {
    status: CropStatus.Active,
    availability: CropAvailability.Available,
    listingApprovalStatus: ListingApprovalStatus.Approved,
  };

  if (category && category !== 'all') {
    baseFilter.category = category.toLowerCase();
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
    if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
    baseFilter.price = priceFilter;
  }

  if (isOrganic !== undefined) {
    baseFilter['specifications.organicCertified'] = Boolean(isOrganic);
  }

  if (region && region !== 'all') {
    baseFilter.$or = [
      { pickupLocation: { $regex: region, $options: 'i' } },
      { 'location.state': { $regex: region, $options: 'i' } },
      { 'location.district': { $regex: region, $options: 'i' } },
    ];
  }

  // If no query string provided, return standard paginated listings
  if (!query.trim()) {
    const skip = (page - 1) * limit;
    const [crops, total] = await Promise.all([
      CropListing.find(baseFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
        .lean(),
      CropListing.countDocuments(baseFilter),
    ]);

    return {
      crops,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  // 1. Multilingual query expansion (Hindi, Odia, English)
  const { canonicalTerms, expandedKeywords } = expandMultilingualQuery(query);
  const regexOrClauses = [
    { cropName: { $regex: query, $options: 'i' } },
    { description: { $regex: query, $options: 'i' } },
    ...expandedKeywords.map((kw) => ({ cropName: { $regex: kw, $options: 'i' } })),
    ...canonicalTerms.map((canon) => ({ cropName: { $regex: canon, $options: 'i' } })),
    ...canonicalTerms.map((canon) => ({ category: { $regex: canon, $options: 'i' } })),
  ];

  // 2. Fetch Candidate Set matching baseFilter and keyword expansion
  const candidateFilter = {
    ...baseFilter,
    $or: regexOrClauses,
  };

  const candidates = await CropListing.find(candidateFilter)
    .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
    .lean()
    .limit(100);

  // If candidate count is 0, broaden to baseFilter to allow pure semantic vector matching
  const pool = [...candidates];
  if (pool.length < 5) {
    const fallbackCandidates = await CropListing.find(baseFilter)
      .populate('farmerId', 'firstName lastName name avatar rating farmName location city state')
      .lean()
      .limit(60);
    const existingIds = new Set(pool.map((c) => String(c._id)));
    for (const fb of fallbackCandidates) {
      if (!existingIds.has(String(fb._id))) {
        pool.push(fb);
      }
    }
  }

  if (pool.length === 0) {
    return { crops: [], total: 0, page, pages: 1, appliedExpansion: expandedKeywords };
  }

  // 3. Compute Query Embedding
  const queryVector = await generateEmbeddingVector(query);

  // 4. Text rank: score based on keyword match in cropName and description
  const scoredByText = pool.map((crop) => {
    let textScore = 0;
    const lowerName = (crop.cropName || '').toLowerCase();
    const lowerDesc = (crop.description || '').toLowerCase();

    if (lowerName === query.toLowerCase()) textScore += 50;
    else if (lowerName.includes(query.toLowerCase())) textScore += 25;

    for (const kw of expandedKeywords) {
      if (lowerName.includes(kw)) textScore += 15;
      if (lowerDesc.includes(kw)) textScore += 5;
    }
    for (const canon of canonicalTerms) {
      if (lowerName.includes(canon)) textScore += 20;
    }
    return { crop, textScore };
  });

  scoredByText.sort((a, b) => b.textScore - a.textScore);
  const textRankMap = new Map<string, number>();
  scoredByText.forEach((item, idx) => {
    textRankMap.set(String(item.crop._id), idx + 1);
  });

  // 5. Vector rank: cosine similarity to query embedding
  const scoredByVector = pool.map((crop) => {
    const cropVec = Array.isArray(crop.embedding) && crop.embedding.length > 0
      ? crop.embedding
      : generateDeterministicVector(buildCropSearchText(crop), 64);
    const sim = cosineSimilarity(queryVector, cropVec);
    return { crop, vectorScore: sim };
  });

  scoredByVector.sort((a, b) => b.vectorScore - a.vectorScore);
  const vectorRankMap = new Map<string, number>();
  scoredByVector.forEach((item, idx) => {
    vectorRankMap.set(String(item.crop._id), idx + 1);
  });

  // 6. Reciprocal Rank Fusion (RRF) with k = 60
  const K = 60;
  const fusedResults: HybridSearchResult[] = pool.map((crop) => {
    const id = String(crop._id);
    const rText = textRankMap.get(id) || pool.length;
    const rVec = vectorRankMap.get(id) || pool.length;

    const rrfScore = (1 / (K + rText)) + (1 / (K + rVec));
    return {
      crop,
      score: rrfScore,
      textRank: rText,
      vectorRank: rVec,
      rrfScore,
    };
  });

  // Sort by fused RRF score descending, tie-breaking by seller rating
  fusedResults.sort((a, b) => {
    if (Math.abs(b.rrfScore - a.rrfScore) > 0.0001) {
      return b.rrfScore - a.rrfScore;
    }
    const ratingA = Number(a.crop.farmerId?.rating || a.crop.rating || 0);
    const ratingB = Number(b.crop.farmerId?.rating || b.crop.rating || 0);
    return ratingB - ratingA;
  });

  const total = fusedResults.length;
  const skip = (page - 1) * limit;
  const pagedCrops = fusedResults.slice(skip, skip + limit).map((r) => r.crop);

  return {
    crops: pagedCrops,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    appliedExpansion: expandedKeywords,
  };
}
