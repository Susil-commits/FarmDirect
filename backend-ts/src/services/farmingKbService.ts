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
  const safeText = typeof text === 'string' ? text.slice(0, 2048) : '';
  const vec = new Array(dimensions).fill(0);
  const words = safeText.toLowerCase().split(/\W+/).filter(Boolean).slice(0, 500);
  for (const word of words) {
    let hash = 0;
    const maxLen = Math.min(word.length, 128);
    for (let i = 0; i < maxLen; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

export const AGRONOMY_SYNONYMS: Record<string, string[]> = {
  // Pests & Insects (Odia, Hindi, English)
  poka: ['pest', 'insect', 'caterpillar', 'borer', 'aphid'],
  keeda: ['pest', 'insect', 'caterpillar', 'borer', 'aphid'],
  kida: ['pest', 'insect'],
  patanga: ['pest', 'moth', 'insect'],
  majra: ['stem borer', 'paddy', 'borer', 'pest'],
  'tana chhedak': ['stem borer', 'pest'],
  borer: ['majra', 'stem borer', 'tana chhedak'],
  aphid: ['sucking pest', 'mahua', 'whitefly', 'neem oil'],
  aphids: ['sucking pest', 'mahua', 'whitefly', 'neem oil'],
  mahua: ['aphid', 'sucking pest'],
  whitefly: ['sucking pest', 'leaf curl vector', 'neem oil'],
  thrips: ['sucking pest', 'leaf curl', 'neem oil'],

  // Diseases & Symptoms (Odia, Hindi, English)
  jhulsa: ['blight', 'late blight', 'early blight', 'fungal', 'phytophthora'],
  jhulasa: ['blight', 'fungal'],
  jhunsi: ['blast', 'blight', 'fungus'],
  blight: ['jhulsa', 'alternaria', 'phytophthora', 'leaf spot'],
  blast: ['paddy blast', 'leaf blast', 'pyricularia', 'jhunsi'],
  'leaf curl': ['patta modak', 'patra modaka', 'geminivirus', 'whitefly'],
  'patta modak': ['leaf curl', 'disease', 'whitefly'],
  'patra modaka': ['leaf curl', 'disease', 'whitefly'],
  rot: ['damping off', 'root rot', 'tuber rot', 'sadha'],
  sadha: ['rot', 'damping off', 'fungus'],
  galan: ['rot', 'damping off', 'fungus'],
  wilt: ['bacterial wilt', 'fusarium', 'drooping'],
  mildew: ['powdery mildew', 'downy mildew', 'fungus'],

  // Crops (Vernacular & English)
  dhan: ['paddy', 'rice'],
  dhana: ['paddy', 'rice'],
  paddy: ['dhan', 'dhana', 'rice'],
  rice: ['paddy', 'dhan', 'dhana'],
  aalu: ['potato'],
  aloo: ['potato'],
  potato: ['aalu', 'aloo'],
  tamatar: ['tomato', 'bilaati'],
  bilaati: ['tomato', 'tamatar'],
  tomato: ['tamatar', 'bilaati'],
  pyaz: ['onion', 'piaja'],
  piaja: ['onion', 'pyaz'],
  onion: ['pyaz', 'piaja'],
  baingan: ['brinjal', 'eggplant', 'baigana'],
  baigana: ['brinjal', 'eggplant', 'baingan'],
  brinjal: ['baingan', 'baigana', 'eggplant'],
  sarson: ['mustard', 'sorisa'],
  sorisa: ['mustard', 'sarson'],
  arhar: ['toor dal', 'pigeon pea', 'harada'],
  harada: ['toor dal', 'pigeon pea', 'arhar'],
  chana: ['gram', 'chickpea', 'buta'],
  buta: ['gram', 'chickpea', 'chana'],

  // Soil, Fertilizers & Manure
  khata: ['organic manure', 'vermicompost', 'fym', 'compost'],
  khat: ['organic manure', 'vermicompost', 'fym'],
  khad: ['fertilizer', 'manure', 'compost'],
  sar: ['fertilizer', 'chemical fertilizer', 'urea'],
  sara: ['fertilizer', 'chemical fertilizer', 'urea'],
  gobar: ['cow dung', 'fym', 'jeevamrut'],
  jeevamrut: ['bio fertilizer', 'liquid manure', 'cow urine formulation'],
  vermicompost: ['earthworm compost', 'organic matter', 'fym', 'soil health'],
  dhaincha: ['green manure', 'sesbania', 'nitrogen fixation'],

  // Operations
  chhidkaw: ['spray', 'foliar spray', 'application'],
  chanka: ['spray', 'foliar spray', 'application'],
  sinchai: ['irrigation', 'watering', 'drip'],
  pani: ['water', 'irrigation', 'drainage'],
  chasa: ['farming', 'cultivation', 'agriculture'],
  kheti: ['farming', 'cultivation', 'agriculture'],
};

export function expandAgronomyQuery(query: string): string[] {
  const clean = query.toLowerCase();
  const tokens = clean.split(/\W+/).filter((w) => w.length > 2);
  const expanded = new Set<string>(tokens);

  // Match single tokens in synonym dictionary
  for (const token of tokens) {
    if (AGRONOMY_SYNONYMS[token]) {
      for (const syn of AGRONOMY_SYNONYMS[token]) {
        for (const word of syn.split(/\W+/).filter((w) => w.length > 2)) {
          expanded.add(word);
        }
      }
    }
  }

  // Match 2-word phrases (e.g., 'leaf curl', 'stem borer', 'patta modak')
  for (const key of Object.keys(AGRONOMY_SYNONYMS)) {
    if (key.includes(' ') && clean.includes(key)) {
      for (const syn of AGRONOMY_SYNONYMS[key]) {
        for (const word of syn.split(/\W+/).filter((w) => w.length > 2)) {
          expanded.add(word);
        }
      }
    }
  }

  return Array.from(expanded);
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
    const isPesticideQuery = /\b(pesticide|chemical pesticide|chemical spray|insecticide|fungicide|herbicide|weedicide|chemical dosage|mancozeb|chlorpyrifos|copper oxychloride|tricyclazole)\b/i.test(
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

    // Expand query tokens with multi-lingual agronomy synonyms
    const expandedWords = expandAgronomyQuery(question);

    const scored = allDocs.map((doc: any) => {
      let vectorScore = 0;
      if (doc.embedding && doc.embedding.length > 0 && queryVector.length > 0) {
        vectorScore = cosineSimilarity(queryVector, doc.embedding);
      }

      // BM25-style weighted lexical scoring with field boosts
      const titleLower = (doc.title || '').toLowerCase();
      const tagsLower = (doc.tags || []).join(' ').toLowerCase();
      const contentLower = (doc.content || '').toLowerCase();

      let lexicalMatches = 0;
      for (const word of expandedWords) {
        if (titleLower.includes(word)) lexicalMatches += 2.5;
        if (tagsLower.includes(word)) lexicalMatches += 2.0;
        if (contentLower.includes(word)) lexicalMatches += 1.0;
      }

      const totalTokens = Math.max(expandedWords.length, 1);
      const rawLexical = lexicalMatches / (totalTokens * 3.5);
      const lexicalScore = Math.min(1.0, rawLexical);

      // Blended hybrid score: 65% dense vector + 35% expanded lexical
      const finalScore = vectorScore > 0 ? vectorScore * 0.65 + lexicalScore * 0.35 : lexicalScore;

      let content = doc.content;
      // If chemical/pesticide query, append standardized KVK safety notice if not present
      if (isPesticideQuery && !content.includes('KVK (Krishi Vigyan Kendra)')) {
        content = `${content} CAUTION: Any chemical pesticide selection, formulation, or dosage MUST be confirmed with your local KVK (Krishi Vigyan Kendra) or District Agriculture Officer.`;
      }

      return {
        sourceId: doc.sourceId,
        title: doc.title,
        category: doc.category,
        content,
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

