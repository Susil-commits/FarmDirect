import { z } from 'zod';
import type { ToolDefinition } from './types.js';

const ROUTE_WHITELIST: Record<
  string,
  { label: string; icon: 'ShoppingBag' | 'PlusCircle' | 'Package' | 'ShieldCheck' | 'MessageSquare' | 'TrendingUp' }
> = {
  '/marketplace': { label: 'Explore Marketplace', icon: 'ShoppingBag' },
  '/create-crop': { label: 'List a New Crop', icon: 'PlusCircle' },
  '/orders': { label: 'Track Orders', icon: 'Package' },
  '/dashboard/farmer': { label: 'Farmer Dashboard', icon: 'TrendingUp' },
  '/dashboard/buyer': { label: 'Buyer Dashboard', icon: 'ShoppingBag' },
  '/wishlist': { label: 'Saved Wishlist', icon: 'ShoppingBag' },
  '/verification/progress': { label: 'KYC Verification', icon: 'ShieldCheck' },
  '/support': { label: 'Customer Support', icon: 'MessageSquare' },
  '/about': { label: 'About FaRm Marketplace', icon: 'ShoppingBag' },
};

export const navigateSchema = z.object({
  route: z.string().min(1, 'route is required'),
});

export type NavigateArgs = z.infer<typeof navigateSchema>;

export const navigateTool: ToolDefinition<NavigateArgs> = {
  name: 'navigate',
  description:
    'Provide navigational links and quick-action buttons for whitelisted platform pages such as marketplace, create-crop, orders, dashboard, verification, or support.',
  schema: navigateSchema,
  declaration: {
    name: 'navigate',
    description:
      'Provide navigational links and quick-action buttons for whitelisted platform pages such as marketplace, create-crop, orders, dashboard, verification, or support.',
    parameters: {
      type: 'OBJECT',
      properties: {
        route: {
          type: 'STRING',
          description:
            'The target platform path (allowed: /marketplace, /create-crop, /orders, /dashboard/farmer, /dashboard/buyer, /wishlist, /verification/progress, /support, /about)',
        },
      },
      required: ['route'],
    },
  },
  allowedRoles: ['guest', 'buyer', 'farmer', 'admin'],
  async run(args) {
    const route = args.route.trim().toLowerCase();
    const match = ROUTE_WHITELIST[route];

    if (!match) {
      return {
        success: false,
        error: `Route "${args.route}" is not recognized or permitted.`,
        allowedRoutes: Object.keys(ROUTE_WHITELIST),
      };
    }

    return {
      success: true,
      url: route,
      label: match.label,
      icon: match.icon,
    };
  },
};
