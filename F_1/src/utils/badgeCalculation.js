/**
 * Badge Calculation Logic for FaRm Marketplace
 * Determines which badges to show on product cards based on crop data
 */

export const BADGE_TYPES = {
  NEW: 'new',
  SEASONAL: 'seasonal',
  TRENDING: 'trending',
  POPULAR: 'popular',
  LIMITED: 'limited'
};

const BADGE_CONFIG = {
  [BADGE_TYPES.NEW]: {
    label: 'NEW',
    color: 'blue',
    icon: '✨',
    tooltip: 'Recently added to marketplace'
  },
  [BADGE_TYPES.SEASONAL]: {
    label: 'SEASONAL',
    color: 'green',
    icon: '🌾',
    tooltip: 'Currently in harvest season'
  },
  [BADGE_TYPES.TRENDING]: {
    label: 'TRENDING',
    color: 'orange',
    icon: '🔥',
    tooltip: 'Popular this week'
  },
  [BADGE_TYPES.POPULAR]: {
    label: 'POPULAR',
    color: 'purple',
    icon: '⭐',
    tooltip: 'Highly rated by customers'
  },
  [BADGE_TYPES.LIMITED]: {
    label: 'LIMITED',
    color: 'red',
    icon: '⚡',
    tooltip: 'Limited stock available'
  }
};

/**
 * Calculate badges for a crop based on its properties
 * Priority: Trending > Seasonal > Limited > New > Popular
 * Max 2 badges shown per card
 * 
 * @param {Object} crop - Crop data object
 * @param {number} crop.id - Crop ID
 * @param {string} crop.name - Crop name
 * @param {number} crop.quantity - Available quantity in kg
 * @param {number} crop.rating - Average rating (0-5)
 * @param {number} crop.totalReviews - Number of reviews
 * @param {string} crop.createdAt - ISO timestamp or recent indicator
 * @param {boolean} crop.isSeasonal - Manual seasonal flag
 * @param {number} crop.orders - Number of orders (for trending)
 * @returns {Array} Array of badge type strings
 */
export function calculateBadges(crop) {
  if (!crop) return [];

  const badges = [];

  // Check if NEW (created in last 14 days)
  if (isNew(crop)) {
    badges.push(BADGE_TYPES.NEW);
  }

  // Check if SEASONAL (manual flag or in-season indicator)
  if (isSeasonal(crop)) {
    badges.push(BADGE_TYPES.SEASONAL);
  }

  // Check if TRENDING (high orders or reviews recently)
  if (isTrending(crop)) {
    badges.push(BADGE_TYPES.TRENDING);
  }

  // Check if LIMITED STOCK (qty < 10)
  if (isLimited(crop)) {
    badges.push(BADGE_TYPES.LIMITED);
  }

  // Check if POPULAR (rating 4.5+ and 10+ reviews)
  if (isPopular(crop)) {
    badges.push(BADGE_TYPES.POPULAR);
  }

  // Apply priority and limit to max 2 badges
  const prioritized = prioritizeBadges(badges);
  return prioritized.slice(0, 2);
}

/**
 * Check if crop is newly added (within 14 days)
 */
function isNew(crop) {
  if (!crop.createdAt) return false;

  try {
    const createdDate = new Date(crop.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 14;
  } catch {
    return false;
  }
}

/**
 * Check if crop is in season
 */
function isSeasonal(crop) {
  // Check manual flag first
  if (crop.isSeasonal === true) {
    return true;
  }

  // Check if marked as seasonal in certifications/tags
  if (crop.certifications?.includes('Seasonal')) {
    return true;
  }

  // Check season data if available
  if (crop.season) {
    const currentMonth = new Date().getMonth() + 1;
    const seasons = {
      'spring': [3, 4, 5],
      'summer': [6, 7, 8],
      'autumn': [9, 10, 11],
      'winter': [12, 1, 2]
    };
    
    const seasonMonths = seasons[crop.season.toLowerCase()];
    return seasonMonths?.includes(currentMonth);
  }

  return false;
}

/**
 * Check if crop is trending (top 10% by orders/reviews)
 */
function isTrending(crop) {
  // Need at least 5 orders or 10 reviews to be considered trending
  const minOrders = 5;
  const minReviews = 10;

  const orderCount = crop.orders || 0;
  const reviewCount = crop.totalReviews || 0;

  // Trending if has significant orders or reviews
  return orderCount >= minOrders || reviewCount >= minReviews;
}

/**
 * Check if crop has limited stock
 */
function isLimited(crop) {
  const quantity = crop.quantity || 0;
  return quantity > 0 && quantity < 10;
}

/**
 * Check if crop is popular
 */
function isPopular(crop) {
  const rating = crop.rating || 0;
  const reviews = crop.totalReviews || 0;

  // Popular if: rating >= 4.5 AND at least 10 reviews
  return rating >= 4.5 && reviews >= 10;
}

/**
 * Sort badges by priority
 * Order: Trending > Seasonal > Limited > New > Popular
 */
function prioritizeBadges(badges) {
  const priority = {
    [BADGE_TYPES.TRENDING]: 1,
    [BADGE_TYPES.SEASONAL]: 2,
    [BADGE_TYPES.LIMITED]: 3,
    [BADGE_TYPES.NEW]: 4,
    [BADGE_TYPES.POPULAR]: 5
  };

  return badges.sort((a, b) => priority[a] - priority[b]);
}

/**
 * Get badge configuration
 */
export function getBadgeConfig(badgeType) {
  return BADGE_CONFIG[badgeType] || {};
}

/**
 * Get all badge configurations
 */
export function getAllBadgeConfigs() {
  return BADGE_CONFIG;
}

/**
 * Format badge data for display
 */
export function formatBadgeData(crop) {
  const badges = calculateBadges(crop);
  return badges.map(badgeType => ({
    type: badgeType,
    ...getBadgeConfig(badgeType)
  }));
}
