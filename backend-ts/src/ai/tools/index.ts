import type { ToolContext, ToolDefinition } from './types.js';
import { searchCropsTool } from './searchCrops.js';
import { getCropTool } from './getCrop.js';
import { getPriceStatsTool } from './getPriceStats.js';
import { myOrdersTool } from './myOrders.js';
import { orderStatusTool } from './orderStatus.js';
import { myNegotiationsTool } from './myNegotiations.js';
import { myListingsTool } from './myListings.js';
import { lowStockTool } from './lowStock.js';
import { navigateTool } from './navigate.js';
import { farmingKbTool } from './farmingKb.js';
import logger from '../../utils/logger.js';

export * from './types.js';
export * from './searchCrops.js';
export * from './getCrop.js';
export * from './getPriceStats.js';
export * from './myOrders.js';
export * from './orderStatus.js';
export * from './myNegotiations.js';
export * from './myListings.js';
export * from './lowStock.js';
export * from './navigate.js';
export * from './farmingKb.js';

export const ALL_TOOLS: Record<string, ToolDefinition<any, any>> = {
  search_crops: searchCropsTool,
  get_crop: getCropTool,
  get_price_stats: getPriceStatsTool,
  my_orders: myOrdersTool,
  order_status: orderStatusTool,
  my_negotiations: myNegotiationsTool,
  my_listings: myListingsTool,
  low_stock: lowStockTool,
  navigate: navigateTool,
  farming_kb: farmingKbTool,
};

export function getToolsForRole(role: string = 'guest'): ToolDefinition<any, any>[] {
  const normalizedRole = (role || 'guest').toLowerCase() as 'guest' | 'buyer' | 'farmer' | 'admin';
  return Object.values(ALL_TOOLS).filter((t) => t.allowedRoles.includes(normalizedRole));
}

export function getDeclarationsForRole(role: string = 'guest') {
  const tools = getToolsForRole(role);
  return tools.map((t) => t.declaration);
}

export async function executeTool(
  toolName: string,
  rawArgs: unknown,
  ctx: ToolContext
): Promise<{ result?: unknown; error?: string }> {
  const tool = ALL_TOOLS[toolName];
  if (!tool) {
    return { error: `Tool "${toolName}" is not recognized.` };
  }

  const userRole = (ctx.user?.role || 'guest').toLowerCase() as 'guest' | 'buyer' | 'farmer' | 'admin';
  if (!tool.allowedRoles.includes(userRole)) {
    return {
      error: `Access denied. Tool "${toolName}" is not available for role "${userRole}".`,
    };
  }

  const parsed = tool.schema.safeParse(rawArgs || {});
  if (!parsed.success) {
    return {
      error: `Invalid parameters for tool "${toolName}": ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    };
  }

  try {
    const result = await tool.run(parsed.data, ctx);
    return { result };
  } catch (err: any) {
    logger.error({ toolName, err: err?.message || err }, 'Tool execution error');
    return { error: err?.message || 'An error occurred while executing the tool.' };
  }
}
