import { jest } from '@jest/globals';
import { aiService } from '../services/aiService.js';
import { llmClient } from '../ai/llmClient.js';
import { aiStructuredResponseSchema } from '../schemas/aiSchemas.js';

describe('T1.3 Structured Output - JSON Schema & Validation', () => {
  it('validates a well-formed structured output with zod schema', () => {
    const validJson = {
      reply: 'Here are the steps to list your crops on FaRm.',
      topic: 'platform',
      suggestions: ['How do I negotiate price?', 'What KYC documents do I need?'],
      actions: [{ label: 'List Crop', url: '/create-crop', icon: 'PlusCircle' }],
    };

    const parsed = aiStructuredResponseSchema.safeParse(validJson);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.topic).toBe('platform');
      expect(parsed.data.suggestions.length).toBe(2);
      expect(parsed.data.actions?.[0].url).toBe('/create-crop');
    }
  });

  it('rejects invalid topic or missing reply with zod schema error', () => {
    const invalidJson = {
      reply: '',
      topic: 'unknown_topic_invalid',
      suggestions: [],
    };

    const parsed = aiStructuredResponseSchema.safeParse(invalidJson);
    expect(parsed.success).toBe(false);
  });

  it('handles structured response from LLM and sets topic, actions, and suggestions', async () => {
    // Mock llmClient.isConfigured to true and generateText to return structured JSON
    const origConfigured = llmClient.isConfigured;
    const origGenerateText = llmClient.generateText;

    llmClient.isConfigured = () => true;
    (llmClient as any).generateText = (jest.fn() as any).mockResolvedValue({
      text: JSON.stringify({
        reply: '### Fresh Organic Tomato Guidelines\nTomatoes grow best in warm soil with regular watering.',
        topic: 'farming',
        suggestions: ['Best organic pest control for tomato blight', 'How to test soil pH'],
        actions: [{ label: 'Browse Produce', url: '/marketplace', icon: 'ShoppingBag' }],
      }),
      modelUsed: 'gemini-mocked',
      inputTokens: 50,
      outputTokens: 75,
      latencyMs: 120,
    });

    try {
      const response = await aiService.processMessage({
        message: 'Tips for growing organic tomatoes',
      });

      expect(response.success).toBe(true);
      expect(response.topic).toBe('farming');
      expect(response.reply).toContain('Fresh Organic Tomato Guidelines');
      expect(response.suggestions).toContain('Best organic pest control for tomato blight');
      expect(response.actionLinks?.[0].url).toBe('/marketplace');
    } finally {
      llmClient.isConfigured = origConfigured;
      llmClient.generateText = origGenerateText;
    }
  });

  it('falls back to plain text gracefully when model returns unparseable text', async () => {
    const origConfigured = llmClient.isConfigured;
    const origGenerateText = llmClient.generateText;

    llmClient.isConfigured = () => true;
    (llmClient as any).generateText = (jest.fn() as any).mockResolvedValue({
      text: 'This is plain text with no JSON formatting whatsoever.',
      modelUsed: 'gemini-mocked',
      inputTokens: 30,
      outputTokens: 20,
      latencyMs: 100,
    });

    try {
      const response = await aiService.processMessage({
        message: 'Explain crop rotation',
      });

      expect(response.success).toBe(true);
      expect(response.reply).toBe('This is plain text with no JSON formatting whatsoever.');
      expect(response.topic).toBe('platform');
      expect(response.suggestions.length).toBeGreaterThan(0);
    } finally {
      llmClient.isConfigured = origConfigured;
      llmClient.generateText = origGenerateText;
    }
  });
});
