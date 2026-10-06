import { GoogleGenAI } from '@google/genai';
import mongoose, { type Types } from 'mongoose';
import { env } from '../config/env.js';
import AiUsage from '../models/AiUsage.js';
import { createCircuitBreaker } from '../utils/circuitBreaker.js';
import logger from '../utils/logger.js';

export interface ChatContentItem {
  role: string;
  parts: Array<{ text?: string; [key: string]: unknown }>;
}

export interface GenerateTextOptions {
  prompt?: string;
  contents?: string | ChatContentItem[];
  systemInstruction?: string;
  feature?: string;
  userId?: Types.ObjectId | string | null;
  temperature?: number;
  maxOutputTokens?: number;
  responseSchema?: Record<string, unknown>;
  responseMimeType?: string;
  tools?: any[];
}

export interface GenerateTextResult {
  text: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  functionCalls?: Array<{ name: string; args: Record<string, any> }>;
}

class LlmClient {
  private client: GoogleGenAI | null = null;
  private breaker: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err: any) {
        logger.warn({ err: err?.message || err }, 'Failed to initialize GoogleGenAI client');
        this.client = null;
      }
    }

    // Circuit breaker around external API invocations
    this.breaker = createCircuitBreaker(
      async (params: { model: string; contents: string | any[]; config: any }) => {
        if (!this.client) throw new Error('Gemini API client not configured');
        return await this.client.models.generateContent({
          model: params.model,
          contents: params.contents as any,
          config: params.config,
        });
      },
      { timeout: 15000, errorThresholdPercentage: 50, resetTimeout: 30000 }
    );
  }

  public isConfigured(): boolean {
    const apiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
    return Boolean(this.client && apiKey && apiKey !== 'your_gemini_api_key_here' && env.aiChatEnabled);
  }

  public async checkUserDailyTokenCap(userId?: Types.ObjectId | string | null): Promise<boolean> {
    if (!userId) return true;
    const cap = env.aiDailyTokenCap;
    if (!cap || cap <= 0) return true;

    try {
      const parsedUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const aggregateResult = await AiUsage.aggregate([
        { $match: { userId: parsedUserId, at: { $gte: since } } },
        { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } },
      ]);

      const usedTokens = aggregateResult[0]?.totalTokens || 0;
      return usedTokens < cap;
    } catch {
      return true; // Graceful degradation on aggregation error
    }
  }

  public async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    if (!this.isConfigured()) {
      throw new Error('AI service is not configured or disabled');
    }

    const {
      prompt,
      systemInstruction,
      feature = 'chat',
      userId = null,
      temperature = 0.35,
      maxOutputTokens = 800,
      responseSchema,
      responseMimeType,
    } = options;

    const hasQuota = await this.checkUserDailyTokenCap(userId);
    if (!hasQuota) {
      throw new Error('Daily AI token quota exceeded for this account');
    }

    const candidateModels = [
      env.geminiModel || 'gemini-3.5-flash-lite',
      env.geminiFallbackModel || 'gemini-2.5-flash-lite',
    ];

    const config: any = {
      systemInstruction,
      temperature,
      maxOutputTokens,
    };

    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }
    if (responseSchema) {
      config.responseSchema = responseSchema;
    }
    if (options.tools && options.tools.length > 0) {
      config.tools = [{ functionDeclarations: options.tools }];
    }

    const startTime = Date.now();
    let lastError: any = null;
    let selectedModel = candidateModels[0];
    let responseText = '';
    let promptTokens = 0;
    let candidatesTokens = 0;
    let functionCalls: Array<{ name: string; args: Record<string, any> }> | undefined = undefined;

    const contentsToSend = options.contents || prompt || '';

    for (const model of candidateModels) {
      selectedModel = model;
      try {
        const response = await this.breaker.fire({ model, contents: contentsToSend, config });
        if (response) {
          responseText = response.text || '';
          promptTokens = response.usageMetadata?.promptTokenCount || 0;
          candidatesTokens = response.usageMetadata?.candidatesTokenCount || 0;

          if (Array.isArray(response.functionCalls) && response.functionCalls.length > 0) {
            functionCalls = response.functionCalls.map((fc: any) => ({
              name: fc.name,
              args: fc.args || {},
            }));
          }

          if (responseText || (functionCalls && functionCalls.length > 0)) {
            lastError = null;
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        logger.warn({ model, err: err?.message || err }, 'Gemini model invocation failed, trying fallback model');
      }
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = promptTokens + candidatesTokens;
    const success = Boolean(responseText && !lastError);

    // Usage governance logging
    AiUsage.create({
      userId: userId ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId) : null,
      feature,
      model: selectedModel,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
      totalTokens,
      latencyMs,
      success,
      errorMessage: lastError ? String(lastError?.message || lastError) : null,
      at: new Date(),
    }).catch((err) => {
      logger.error({ err: err?.message || err }, 'Failed to record AiUsage');
    });

    if (!responseText && (!functionCalls || functionCalls.length === 0)) {
      throw lastError || new Error('No output generated by Gemini models');
    }

    return {
      text: responseText,
      modelUsed: selectedModel,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
      latencyMs,
      functionCalls,
    };
  }

  public async generateTextStream(
    options: GenerateTextOptions,
    onChunk: (text: string) => void
  ): Promise<GenerateTextResult> {
    if (!this.isConfigured() || !this.client) {
      throw new Error('AI service is not configured or disabled');
    }

    if (this.breaker && this.breaker.opened) {
      throw new Error('Circuit breaker is OPEN for Gemini service');
    }

    const {
      prompt,
      systemInstruction,
      feature = 'chat',
      userId = null,
      temperature = 0.35,
      maxOutputTokens = 800,
      tools,
    } = options;

    const hasQuota = await this.checkUserDailyTokenCap(userId);
    if (!hasQuota) {
      throw new Error('Daily AI token quota exceeded for this account');
    }

    const candidateModels = [
      env.geminiModel || 'gemini-3.5-flash-lite',
      env.geminiFallbackModel || 'gemini-2.5-flash-lite',
    ];

    const config: any = {
      systemInstruction,
      temperature,
      maxOutputTokens,
    };

    if (tools && tools.length > 0) {
      config.tools = tools;
    }

    const startTime = Date.now();
    let lastError: any = null;
    let selectedModel = candidateModels[0];
    let responseText = '';
    let promptTokens = 0;
    let candidatesTokens = 0;
    let functionCalls: Array<{ name: string; args: Record<string, any> }> | undefined = undefined;

    const contentsToSend = options.contents || prompt || '';

    for (const model of candidateModels) {
      selectedModel = model;
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: contentsToSend as any,
          config,
        });

        for await (const chunk of stream) {
          if (Array.isArray(chunk.functionCalls) && chunk.functionCalls.length > 0) {
            functionCalls = chunk.functionCalls.map((fc: any) => ({
              name: fc.name,
              args: fc.args || {},
            }));
          }
          if (chunk.text) {
            responseText += chunk.text;
            onChunk(chunk.text);
          }
          if (chunk.usageMetadata) {
            promptTokens = chunk.usageMetadata.promptTokenCount || promptTokens;
            candidatesTokens = chunk.usageMetadata.candidatesTokenCount || candidatesTokens;
          }
        }

        if (responseText || (functionCalls && functionCalls.length > 0)) {
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(
          { model, err: err?.message || err },
          'Gemini model stream invocation failed, trying fallback model'
        );
      }
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = promptTokens + candidatesTokens;
    const success = Boolean((responseText || functionCalls) && !lastError);

    AiUsage.create({
      userId: userId ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId) : null,
      feature,
      model: selectedModel,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
      totalTokens,
      latencyMs,
      success,
      errorMessage: lastError ? String(lastError?.message || lastError) : null,
      at: new Date(),
    }).catch((err) => {
      logger.error({ err: err?.message || err }, 'Failed to record AiUsage');
    });

    if (!responseText && (!functionCalls || functionCalls.length === 0)) {
      throw lastError || new Error('No output generated by streaming Gemini models');
    }

    return {
      text: responseText,
      modelUsed: selectedModel,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
      latencyMs,
      functionCalls,
    };
  }

  public isVisionConfigured(): boolean {
    const apiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
    return Boolean(this.client && apiKey && apiKey !== 'your_gemini_api_key_here' && env.aiVisionEnabled);
  }

  public async generateVisionJson<T = any>(options: {
    imageBase64?: string;
    imageBuffer?: Buffer;
    mimeType?: string;
    prompt: string;
    systemInstruction?: string;
    responseSchema?: Record<string, unknown>;
    userId?: Types.ObjectId | string | null;
    feature?: string;
  }): Promise<T> {
    if (!this.isVisionConfigured()) {
      throw new Error('AI Vision service is not configured or disabled');
    }

    if (this.breaker && this.breaker.opened) {
      throw new Error('Circuit breaker is OPEN for Gemini service');
    }

    const {
      imageBase64,
      imageBuffer,
      mimeType = 'image/jpeg',
      prompt,
      systemInstruction,
      responseSchema,
      userId = null,
      feature = 'listing_vision',
    } = options;

    let base64Data = '';
    if (imageBase64) {
      const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      base64Data = match ? match[2] : imageBase64;
    } else if (imageBuffer) {
      base64Data = imageBuffer.toString('base64');
    }

    if (!base64Data) {
      throw new Error('No valid image data provided for vision analysis');
    }

    const hasQuota = await this.checkUserDailyTokenCap(userId);
    if (!hasQuota) {
      throw new Error('Daily AI token quota exceeded for this account');
    }

    const candidateModels = [
      env.geminiModel || 'gemini-3.5-flash-lite',
      env.geminiFallbackModel || 'gemini-2.5-flash-lite',
    ];

    const config: any = {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: 'application/json',
    };

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const startTime = Date.now();
    let lastError: any = null;
    let selectedModel = candidateModels[0];
    let responseText = '';
    let promptTokens = 0;
    let candidatesTokens = 0;

    for (const model of candidateModels) {
      selectedModel = model;
      try {
        const response = await this.breaker.fire({ model, contents, config });
        if (response && response.text) {
          responseText = response.text;
          promptTokens = response.usageMetadata?.promptTokenCount || 0;
          candidatesTokens = response.usageMetadata?.candidatesTokenCount || 0;
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn({ model, err: err?.message || err }, 'Gemini vision invocation failed, trying fallback');
      }
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = promptTokens + candidatesTokens;
    const success = Boolean(responseText && !lastError);

    AiUsage.create({
      userId: userId ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId) : null,
      feature,
      model: selectedModel,
      inputTokens: promptTokens,
      outputTokens: candidatesTokens,
      totalTokens,
      latencyMs,
      success,
      errorMessage: lastError ? String(lastError?.message || lastError) : null,
      at: new Date(),
    }).catch((err) => {
      logger.error({ err: err?.message || err }, 'Failed to record AiUsage');
    });

    if (!responseText) {
      throw lastError || new Error('No vision response generated');
    }

    try {
      const parsed = JSON.parse(responseText);
      return parsed as T;
    } catch (parseErr: any) {
      logger.error({ parseErr: parseErr.message, responseText }, 'Failed to parse Gemini vision JSON output');
      throw parseErr;
    }
  }

  private embeddingDisabled = false;

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured() || !this.client || this.embeddingDisabled) {
      throw new Error('AI service embedding is not configured or disabled');
    }

    if (this.breaker && this.breaker.opened) {
      throw new Error('Circuit breaker is OPEN for Gemini service');
    }

    const candidateModels = ['text-embedding-004', 'embedding-001'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await this.client.models.embedContent({
          model,
          contents: text,
        });
        const anyResp = response as any;
        if (anyResp?.embedding?.values && Array.isArray(anyResp.embedding.values)) {
          return anyResp.embedding.values;
        }
        if (anyResp?.embeddings?.[0]?.values && Array.isArray(anyResp.embeddings[0].values)) {
          return anyResp.embeddings[0].values;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    this.embeddingDisabled = true;
    throw lastError || new Error('Failed to generate embedding');
  }
}

export const llmClient = new LlmClient();

