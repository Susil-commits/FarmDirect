import mongoose, { type Types } from 'mongoose';
import CropListing from '../models/CropListing.js';
import Review from '../models/Review.js';
import { llmClient } from '../ai/llmClient.js';
import type { ICropReviewSummary } from '../types/index.js';
import logger from '../utils/logger.js';

const TOXIC_PATTERNS = [
  /\b(asshole|bitch|bastard|fuck|shit|cunt|dick|idiot|scumbag|motherfucker|madarchod|behenchod|chutiya|harami)\b/i,
  /\b(kill yourself|die in hell|hate you all)\b/i,
];

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /www\.[a-z0-9.-]+\.[a-z]{2,}/i,
  /\b[a-zA-Z0-9.-]+\.(com|xyz|top|ru|biz|club|site|online)\b/i,
  /\b(telegram|t\.me|whatsapp|wa\.me|crypto|forex|invest|earning app|free cash|win cash|lottery)\b/i,
  /\b(\+?91[\s-]?)?[6789]\d{9}\b/, // Phone number sequence
  /(.)\1{6,}/, // Excessive repeated character spam like "aaaaaaa"
];

const POSITIVE_WORDS = [
  'fresh', 'crisp', 'sweet', 'great', 'excellent', 'healthy', 'clean', 'fragrant',
  'delicious', 'organic', 'fast delivery', 'top quality', 'recommended', 'satisfied',
  'farm fresh', 'ripe', 'juicy', 'best', 'wonderful', 'prompt', 'good', 'super', 'loved',
];

const NEGATIVE_WORDS = [
  'rotten', 'spoiled', 'stale', 'mold', 'fungus', 'insect', 'insects', 'bugs', 'worms',
  'bad', 'damaged', 'bruised', 'terrible', 'worst', 'delay', 'delayed', 'late', 'sour',
  'overripe', 'unripe', 'dry', 'smelly', 'waste', 'poor', 'scam', 'fake', 'fraud', 'horrible',
];

export interface ReviewAnalysisResult {
  sentimentScore: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  isFlagged: boolean;
  flagReason: string | null;
}

/**
 * Analyzes review content for toxicity, spam, and sentiment.
 */
export function analyzeReviewContent(comment: string, rating: number): ReviewAnalysisResult {
  const text = (comment || '').trim();
  const lower = text.toLowerCase();

  // 1. Toxicity check
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        sentimentScore: -0.9,
        sentimentLabel: 'negative',
        isFlagged: true,
        flagReason: 'Offensive or abusive language detected',
      };
    }
  }

  // 2. Spam check
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        sentimentScore: 0.0,
        sentimentLabel: 'neutral',
        isFlagged: true,
        flagReason: 'Promotional, contact solicitation, or spam pattern detected',
      };
    }
  }

  // 3. Sentiment scoring
  // Base from rating: 5->0.8, 4->0.4, 3->0.0, 2->-0.4, 1->-0.8
  let score = (rating - 3) * 0.4;

  let posCount = 0;
  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) posCount++;
  }

  let negCount = 0;
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negCount++;
  }

  score += posCount * 0.1 - negCount * 0.15;
  score = Math.max(-1.0, Math.min(1.0, Math.round(score * 100) / 100));

  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 0.15) label = 'positive';
  else if (score < -0.15) label = 'negative';

  return {
    sentimentScore: score,
    sentimentLabel: label,
    isFlagged: false,
    flagReason: null,
  };
}

/**
 * Generates an aggregated review summary for a crop listing.
 * Cached directly on CropListing.reviewSummary.
 */
export async function generateCropReviewSummary(
  cropId: Types.ObjectId | string,
  force: boolean = false
): Promise<ICropReviewSummary | null> {
  const targetCropId = typeof cropId === 'string' ? new mongoose.Types.ObjectId(cropId) : cropId;

  const crop = await CropListing.findById(targetCropId);
  if (!crop) return null;

  const reviews = await Review.find({
    cropId: targetCropId,
    isFlagged: false,
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      summary: 'No reviews yet for this crop listing.',
      pros: [],
      cons: [],
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      lastGeneratedAt: new Date(),
      reviewCountAtGeneration: 0,
    };
  }

  // Sentiment counts
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const rev of reviews) {
    if (rev.sentimentLabel === 'positive' || (rev.rating && rev.rating >= 4)) {
      sentimentBreakdown.positive++;
    } else if (rev.sentimentLabel === 'negative' || (rev.rating && rev.rating <= 2)) {
      sentimentBreakdown.negative++;
    } else {
      sentimentBreakdown.neutral++;
    }
  }

  // Check regeneration cadence:
  // If not forced and already generated and reviews difference < 5, return existing cached summary with updated breakdown
  const existingSummary = crop.reviewSummary;
  const countDiff = totalReviews - (existingSummary?.reviewCountAtGeneration || 0);
  if (!force && existingSummary?.summary && countDiff < 5 && existingSummary.lastGeneratedAt) {
    return {
      ...existingSummary,
      sentimentBreakdown,
    };
  }

  // If reviews < 3, build a concise preliminary summary without LLM
  if (totalReviews < 3) {
    const summaryData: ICropReviewSummary = {
      summary: `Initial reviews are favorable with ${sentimentBreakdown.positive} positive feedback (${crop.rating || 5} average rating).`,
      pros: ['Farm-fresh quality', 'Direct harvest supply'],
      cons: ['Limited reviews recorded so far'],
      sentimentBreakdown,
      lastGeneratedAt: new Date(),
      reviewCountAtGeneration: totalReviews,
    };
    await CropListing.findByIdAndUpdate(targetCropId, { reviewSummary: summaryData });
    return summaryData;
  }

  // Build extractive or LLM-based summary
  let summaryText = '';
  let pros: string[] = [];
  let cons: string[] = [];

  // Anonymized sample of reviews (no user names or IDs)
  const reviewSnippets = reviews.slice(0, 15).map((r) => `Rating: ${r.rating}/5. Feedback: ${r.comment}`);

  try {
    const prompt = `You are an AI assistant analyzing customer produce reviews for ${crop.cropName} on the FaRm marketplace.
Analyze the following customer reviews and produce a JSON response with:
1. "summary": A balanced 2-sentence overview of overall produce quality and buyer satisfaction.
2. "pros": Array of 2 to 4 bullet points highlighting specific praised attributes (e.g. freshness, packaging, taste).
3. "cons": Array of 1 to 2 bullet points noting constructive feedback or areas of caution (or "No major complaints reported").

Reviews:
${reviewSnippets.join('\n')}

Format your response strictly as valid JSON with keys "summary", "pros", "cons".`;

    const llmRes = await llmClient.generateText({
      prompt,
      feature: 'review_summary',
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(llmRes.text);
    if (parsed.summary && Array.isArray(parsed.pros)) {
      summaryText = parsed.summary;
      pros = parsed.pros.slice(0, 4);
      cons = Array.isArray(parsed.cons) ? parsed.cons.slice(0, 3) : [];
    }
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, 'LLM review summary failed; using deterministic fallback');
  }

  // Fallback if LLM was skipped or failed
  if (!summaryText) {
    const posPct = Math.round((sentimentBreakdown.positive / totalReviews) * 100);
    summaryText = `Rated ${crop.rating || 4.5}/5 across ${totalReviews} verified orders. Approximately ${posPct}% of buyers reported positive satisfaction with produce quality and delivery.`;

    pros = [
      'High satisfaction with farm freshness and produce quality',
      'Reliable direct fulfillment from verified growers',
    ];
    if (sentimentBreakdown.negative > 0) {
      cons = ['A few buyers suggested faster dispatch or careful transit cushioning'];
    } else {
      cons = ['No recurring issues or complaints reported'];
    }
  }

  const finalSummary: ICropReviewSummary = {
    summary: summaryText,
    pros,
    cons,
    sentimentBreakdown,
    lastGeneratedAt: new Date(),
    reviewCountAtGeneration: totalReviews,
  };

  await CropListing.findByIdAndUpdate(targetCropId, { reviewSummary: finalSummary });
  return finalSummary;
}
