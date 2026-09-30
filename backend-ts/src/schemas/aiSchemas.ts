import { z } from 'zod';

export const aiActionLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  icon: z
    .enum(['ShoppingBag', 'PlusCircle', 'Package', 'ShieldCheck', 'MessageSquare', 'TrendingUp'])
    .optional(),
});

export const aiStructuredResponseSchema = z.object({
  reply: z.string().min(1, 'Reply must not be empty'),
  topic: z.enum(['farming', 'platform', 'pricing', 'guardrail_blocked']).default('platform'),
  suggestions: z.array(z.string()).default([]),
  actions: z.array(aiActionLinkSchema).optional(),
});

export type AiStructuredResponse = z.infer<typeof aiStructuredResponseSchema>;

export const GEMINI_STRUCTURED_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'The natural language, friendly, markdown-formatted response for the user.',
    },
    topic: {
      type: 'STRING',
      enum: ['farming', 'platform', 'pricing', 'guardrail_blocked'],
      description: 'The primary classification of the user inquiry and response.',
    },
    suggestions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '2 to 3 contextually relevant follow-up questions the user might ask next.',
    },
    actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING', description: 'Label for the quick-action button' },
          url: { type: 'STRING', description: 'Target platform path (e.g. /marketplace, /create-crop, /orders)' },
          icon: {
            type: 'STRING',
            enum: ['ShoppingBag', 'PlusCircle', 'Package', 'ShieldCheck', 'MessageSquare', 'TrendingUp'],
            description: 'Icon identifier',
          },
        },
        required: ['label', 'url'],
      },
      description: 'Optional quick action navigational buttons relevant to the reply.',
    },
  },
  required: ['reply', 'topic', 'suggestions'],
};

export const listingDraftRequestSchema = z
  .object({
    imageUrl: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
    imageBase64: z.string().optional(),
    mimeType: z.string().optional(),
    cropNameHint: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.imageUrl || (data.imageUrls && data.imageUrls.length > 0) || data.imageBase64),
    {
      message: 'At least one of imageUrl, imageUrls, or imageBase64 must be provided.',
    }
  );

export type ListingDraftRequest = z.infer<typeof listingDraftRequestSchema>;

export const listingDraftResponseSchema = z.object({
  cropName: z.string().min(1, 'Crop name cannot be empty'),
  category: z.enum([
    'vegetables',
    'fruits',
    'grains',
    'pulses',
    'spices',
    'dairy',
    'meat',
    'seeds',
    'herbs',
    'other',
  ]),
  cropType: z.enum(['vegetables', 'crops']),
  ripeness: z.string().optional(),
  colour: z.string().optional(),
  size: z.string().optional(),
  qualityGrade: z.enum(['A', 'B', 'C']),
  confidence: z.number().min(0).max(1),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  looksLikeProduce: z.boolean(),
  issues: z.array(z.string()).default([]),
  suggestedPrice: z.number().optional(),
});

export type ListingDraftResponse = z.infer<typeof listingDraftResponseSchema>;

export const GEMINI_LISTING_DRAFT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    cropName: {
      type: 'STRING',
      description: 'The standard English or common commercial name of the agricultural produce (e.g. Tomato, Potato, Onion, Basmati Rice, Brinjal, Alphonso Mango, Green Chilli).',
    },
    category: {
      type: 'STRING',
      enum: ['vegetables', 'fruits', 'grains', 'pulses', 'spices', 'dairy', 'meat', 'seeds', 'herbs', 'other'],
      description: 'The primary marketplace category.',
    },
    cropType: {
      type: 'STRING',
      enum: ['vegetables', 'crops'],
      description: 'Platform crop type classification.',
    },
    ripeness: {
      type: 'STRING',
      description: 'Ripeness stage (e.g., Unripe, Semi-ripe, Ripe, Freshly Harvested).',
    },
    colour: {
      type: 'STRING',
      description: 'Primary visible colour and appearance of the produce (e.g., Bright Red, Deep Green, Golden Yellow).',
    },
    size: {
      type: 'STRING',
      description: 'Physical grading size (e.g., Small, Medium, Large, Uniform).',
    },
    qualityGrade: {
      type: 'STRING',
      enum: ['A', 'B', 'C'],
      description: 'Commercial agricultural quality grade: A for premium/export quality, B for standard good market quality, C for processing/economy grade.',
    },
    confidence: {
      type: 'NUMBER',
      description: 'Model confidence score between 0.0 and 1.0 for the produce identification.',
    },
    description: {
      type: 'STRING',
      description: 'A realistic, attractive 2-3 sentence marketplace description highlighting freshness, harvest state, and culinary or commercial value. At least 10 characters.',
    },
    looksLikeProduce: {
      type: 'BOOLEAN',
      description: 'True if the image clearly depicts agricultural farm produce (vegetable, fruit, grain, spice, pulse, crop). False if it is a screenshot, receipt, vehicle, portrait of a person without crops, irrelevant object, blank image, or non-produce.',
    },
    issues: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'List of detected quality issues, if any (e.g., blurry, stock_photo_watermark, not_produce, poor_lighting, low_resolution, partially_spoiled). Empty if clean.',
    },
  },
  required: [
    'cropName',
    'category',
    'cropType',
    'qualityGrade',
    'confidence',
    'description',
    'looksLikeProduce',
    'issues',
  ],
};

export const priceGuidanceQuerySchema = z.object({
  cropName: z.string().min(1, 'cropName is required'),
  region: z.string().optional(),
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30)),
  isOrganic: z
    .string()
    .optional()
    .transform((val) => (val === 'true' || val === '1' ? true : false)),
});

export type PriceGuidanceQuery = z.infer<typeof priceGuidanceQuerySchema>;

export const priceForecastQuerySchema = z.object({
  cropName: z.string().min(1, 'cropName is required'),
  category: z.string().optional(),
  region: z.string().optional(),
  daysAhead: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 14)),
  language: z.enum(['en', 'hi', 'od']).optional().default('en'),
});

export type PriceForecastQueryInput = z.infer<typeof priceForecastQuerySchema>;

