import mongoose from 'mongoose';
import AiUsage from '../models/AiUsage.js';
import { llmClient } from '../ai/llmClient.js';

describe('LLM Client & AI Usage Governance', () => {
  it('should record AI usage rows with token counts and latency', async () => {
    const userId = new mongoose.Types.ObjectId();

    await AiUsage.create({
      userId,
      feature: 'chat',
      model: 'gemini-3.5-flash-lite',
      inputTokens: 120,
      outputTokens: 80,
      totalTokens: 200,
      latencyMs: 450,
      success: true,
      at: new Date(),
    });

    const recorded = await AiUsage.findOne({ userId });
    expect(recorded).not.toBeNull();
    expect(recorded?.feature).toBe('chat');
    expect(recorded?.totalTokens).toBe(200);
    expect(recorded?.latencyMs).toBe(450);
  });

  it('should enforce daily per-user token cap', async () => {
    const cappedUser = new mongoose.Types.ObjectId();

    // Insert usage that reaches the cap
    await AiUsage.create({
      userId: cappedUser,
      feature: 'chat',
      model: 'gemini-3.5-flash-lite',
      inputTokens: 30000,
      outputTokens: 25000,
      totalTokens: 55000,
      latencyMs: 1200,
      success: true,
      at: new Date(),
    });

    const underCapUser = new mongoose.Types.ObjectId();
    await AiUsage.create({
      userId: underCapUser,
      feature: 'chat',
      model: 'gemini-3.5-flash-lite',
      inputTokens: 500,
      outputTokens: 500,
      totalTokens: 1000,
      latencyMs: 300,
      success: true,
      at: new Date(),
    });

    const isCappedAllowed = await llmClient.checkUserDailyTokenCap(cappedUser);
    expect(isCappedAllowed).toBe(false);

    const isUnderCapAllowed = await llmClient.checkUserDailyTokenCap(underCapUser);
    expect(isUnderCapAllowed).toBe(true);
  });
});
