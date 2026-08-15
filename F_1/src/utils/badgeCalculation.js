
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

export function calculateBadges(crop) {
  if (!crop) return [];

  const badges = [];

  if (isNew(crop)) {
    badges.push(BADGE_TYPES.NEW);
  }

  if (isSeasonal(crop)) {
    badges.push(BADGE_TYPES.SEASONAL);
  }

  if (isTrending(crop)) {
    badges.push(BADGE_TYPES.TRENDING);
  }

  if (isLimited(crop)) {
    badges.push(BADGE_TYPES.LIMITED);
  }

  if (isPopular(crop)) {
    badges.push(BADGE_TYPES.POPULAR);
  }

  const prioritized = prioritizeBadges(badges);
  return prioritized.slice(0, 2);
}

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

function isSeasonal(crop) {
  
  if (crop.isSeasonal === true) {
    return true;
  }

  if (crop.certifications?.includes('Seasonal')) {
    return true;
  }

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

function isTrending(crop) {
  
  const minOrders = 5;
  const minReviews = 10;

  const orderCount = crop.orders || 0;
  const reviewCount = crop.totalReviews || 0;

  return orderCount >= minOrders || reviewCount >= minReviews;
}

function isLimited(crop) {
  const quantity = crop.quantity || 0;
  return quantity > 0 && quantity < 10;
}

function isPopular(crop) {
  const rating = crop.rating || 0;
  const reviews = crop.totalReviews || 0;

  return rating >= 4.5 && reviews >= 10;
}

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

export function getBadgeConfig(badgeType) {
  return BADGE_CONFIG[badgeType] || {};
}

export function getAllBadgeConfigs() {
  return BADGE_CONFIG;
}

export function formatBadgeData(crop) {
  const badges = calculateBadges(crop);
  return badges.map(badgeType => ({
    type: badgeType,
    ...getBadgeConfig(badgeType)
  }));
}
