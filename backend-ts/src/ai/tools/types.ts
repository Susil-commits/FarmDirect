import type { Types } from 'mongoose';
import type { z } from 'zod';

export interface ToolUserContext {
  _id: Types.ObjectId | string;
  role: 'farmer' | 'buyer' | 'admin' | 'guest' | string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface ToolContext {
  user?: ToolUserContext | null;
}

export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  schema: z.ZodType<TArgs>;
  declaration: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
  allowedRoles: Array<'guest' | 'buyer' | 'farmer' | 'admin'>;
  run(args: TArgs, ctx: ToolContext): Promise<TResult>;
}
