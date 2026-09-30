import Embedding from '../models/Embedding.js';
import { farmingKbService } from '../services/farmingKbService.js';
import { executeTool, ALL_TOOLS } from '../ai/tools/index.js';

describe('T1.7 Farming Knowledge Base (RAG)', () => {
  beforeAll(async () => {
    await Embedding.deleteMany({});
    await farmingKbService.syncKnowledgeBase();
  });

  it('syncs all curated guides into the Embedding collection', async () => {
    const count = await Embedding.countDocuments();
    expect(count).toBeGreaterThanOrEqual(10);

    const soilDoc = await Embedding.findOne({ sourceId: 'KB-SOIL-01' });
    expect(soilDoc).not.toBeNull();
    expect(soilDoc?.title).toContain('Vermicompost');
    expect(soilDoc?.embedding.length).toBeGreaterThan(0);
  });

  it('retrieves relevant soil health guidance for soil questions', async () => {
    const results = await farmingKbService.searchFarmingKb('how to improve soil health and vermicompost', 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].sourceId).toBe('KB-SOIL-01');
    expect(results[0].content).toContain('vermicompost');
  });

  it('retrieves neem oil formulation for organic pest queries', async () => {
    const results = await farmingKbService.searchFarmingKb('neem oil spray formulation for aphids and whiteflies', 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].sourceId).toBe('KB-PEST-01');
    expect(results[0].content).toContain('5 ml');
  });

  it('includes mandatory KVK consultation warning for chemical pesticide queries', async () => {
    const results = await farmingKbService.searchFarmingKb('what is chemical pesticide dosage for bugs?', 3);
    const pestSafety = results.find((r) => r.sourceId === 'KB-PEST-03');
    expect(pestSafety).toBeDefined();
    expect(pestSafety?.content).toMatch(/confirm(ed)? with your local KVK.*Agriculture Officer/i);
  });

  it('executes farming_kb tool successfully for guest and authenticated roles', async () => {
    expect(ALL_TOOLS.farming_kb).toBeDefined();

    const toolResult = await executeTool(
      'farming_kb',
      { question: 'how to prevent grain spoilage in storage' },
      { user: null }
    );

    expect(toolResult.error).toBeUndefined();
    const data = toolResult.result as any;
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.citationInstruction).toContain('sourceId');
    expect(data.results.some((r: any) => r.sourceId === 'KB-GRAIN-01')).toBe(true);
  });
});
