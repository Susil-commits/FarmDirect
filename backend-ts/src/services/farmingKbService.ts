import Embedding, { type IEmbedding } from '../models/Embedding.js';
import { FARMING_GUIDES } from '../data/farmingGuides.js';
import { llmClient } from '../ai/llmClient.js';
import logger from '../utils/logger.js';

export interface KbSearchResult {
  sourceId: string;
  title: string;
  category: string;
  content: string;
  attribution: string;
  relevanceScore: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function generateDeterministicVector(text: string, dimensions = 64): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

class FarmingKbService {
  private isSynced = false;

  public async syncKnowledgeBase(): Promise<number> {
    let syncedCount = 0;
    for (const guide of FARMING_GUIDES) {
      // Check if already embedded in database to avoid burning LLM quotas on every server restart
      const existing = await Embedding.findOne({ sourceId: guide.sourceId }).lean();
      if (existing && Array.isArray(existing.embedding) && existing.embedding.length > 0) {
        syncedCount++;
        continue;
      }

      let embeddingVector: number[];
      if (llmClient.isConfigured()) {
        try {
          embeddingVector = await llmClient.generateEmbedding(`${guide.title}: ${guide.content}`);
        } catch {
          embeddingVector = generateDeterministicVector(`${guide.title} ${guide.content}`);
        }
      } else {
        embeddingVector = generateDeterministicVector(`${guide.title} ${guide.content}`);
      }

      await Embedding.findOneAndUpdate(
        { sourceId: guide.sourceId },
        {
          sourceId: guide.sourceId,
          title: guide.title,
          category: guide.category,
          tags: guide.tags,
          content: guide.content,
          attribution: guide.attribution,
          embedding: embeddingVector,
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    this.isSynced = true;
    logger.info({ count: syncedCount }, 'Farming Knowledge Base synced successfully');
    return syncedCount;
  }

  public async searchFarmingKb(question: string, limit = 3): Promise<KbSearchResult[]> {
    if (!this.isSynced) {
      const count = await Embedding.countDocuments();
      if (count === 0) {
        await this.syncKnowledgeBase();
      } else {
        this.isSynced = true;
      }
    }

    const cleanQuery = question.trim().toLowerCase();
    const isPesticideQuery = /\b(pesticide|chemical pesticide|chemical spray|insecticide|fungicide|herbicide|weedicide|chemical dosage)\b/i.test(
      cleanQuery
    );

    let queryVector: number[] = [];
    if (llmClient.isConfigured()) {
      try {
        queryVector = await llmClient.generateEmbedding(question);
      } catch {
        queryVector = generateDeterministicVector(question);
      }
    } else {
      queryVector = generateDeterministicVector(question);
    }

    const allDocs = await Embedding.find().lean();
    if (allDocs.length === 0) {
      await this.syncKnowledgeBase();
      return this.searchFarmingKb(question, limit);
    }

    const queryWords = cleanQuery.split(/\W+/).filter((w) => w.length > 2);

    const scored = allDocs.map((doc: any) => {
      let vectorScore = 0;
      if (doc.embedding && doc.embedding.length > 0 && queryVector.length > 0) {
        vectorScore = cosineSimilarity(queryVector, doc.embedding);
      }

      // Keyword boost
      let keywordHits = 0;
      const combined = `${doc.title} ${doc.content} ${doc.tags?.join(' ') || ''}`.toLowerCase();
      for (const word of queryWords) {
        if (combined.includes(word)) keywordHits++;
      }

      const keywordScore = queryWords.length > 0 ? keywordHits / queryWords.length : 0;
      // Combined hybrid score
      const finalScore = vectorScore * 0.7 + keywordScore * 0.3;

      return {
        sourceId: doc.sourceId,
        title: doc.title,
        category: doc.category,
        content: doc.content,
        attribution: doc.attribution,
        relevanceScore: Math.round(finalScore * 1000) / 1000,
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    let results = scored.slice(0, limit);

    // If query asks about pesticides/chemicals, ensure KB-PEST-03 is included for regulatory safety
    if (isPesticideQuery && !results.some((r) => r.sourceId === 'KB-PEST-03')) {
      const safetyDoc = allDocs.find((d: any) => d.sourceId === 'KB-PEST-03');
      if (safetyDoc) {
        results = [
          {
            sourceId: safetyDoc.sourceId,
            title: safetyDoc.title,
            category: safetyDoc.category,
            content: safetyDoc.content,
            attribution: safetyDoc.attribution,
            relevanceScore: 1.0,
          },
          ...results.slice(0, limit - 1),
        ];
      }
    }

    return results;
  }
}

export const farmingKbService = new FarmingKbService();
