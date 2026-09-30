import { z } from 'zod';
import { farmingKbService } from '../../services/farmingKbService.js';
import type { ToolDefinition } from './types.js';

export const farmingKbSchema = z.object({
  question: z
    .string()
    .min(1, 'question is required')
    .describe('The agricultural, pest control, soil health, or cultivation question'),
});

export type FarmingKbArgs = z.infer<typeof farmingKbSchema>;

export const farmingKbTool: ToolDefinition<FarmingKbArgs> = {
  name: 'farming_kb',
  description:
    'Search the curated agricultural knowledge base for organic farming, soil health, pest control, irrigation, and post-harvest advice with source citations.',
  schema: farmingKbSchema,
  declaration: {
    name: 'farming_kb',
    description:
      'Search the curated agricultural knowledge base for organic farming, soil health, pest control, irrigation, and post-harvest advice with source citations.',
    parameters: {
      type: 'OBJECT',
      properties: {
        question: {
          type: 'STRING',
          description:
            'The agricultural, pest control, soil health, or cultivation question to search for.',
        },
      },
      required: ['question'],
    },
  },
  allowedRoles: ['guest', 'buyer', 'farmer', 'admin'],
  async run(args) {
    const results = await farmingKbService.searchFarmingKb(args.question, 3);
    return {
      results: results.map((r) => ({
        sourceId: r.sourceId,
        title: r.title,
        category: r.category,
        content: r.content,
        attribution: r.attribution,
      })),
      citationInstruction:
        'Cite the sourceId (e.g., [KB-PEST-01]) for any factual recommendation. If providing pesticide or chemical guidance, you MUST state: "Confirm with your local KVK / Agriculture Officer before application."',
    };
  },
};
