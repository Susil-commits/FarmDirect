// Animation Delays (in seconds)
export const ANIMATION_DELAYS = {
  STAGGER_DELAY_1: '0.1s',
  STAGGER_DELAY_2: '0.2s',
};

// Hero Section Image
export const HERO_IMAGE = {
  src: 'https://img-cdn.publive.online/fit-in/1200x675/filters:format(webp)/english-betterindia/media/media_files/2026/01/29/high-value-winter-crops-2026-01-29-17-55-43.png',
  alt: 'Fresh vegetables marketplace',
  fallback: 'https://via.placeholder.com/1200x675?text=Fresh+Produce',
};

// Benefits Section
export const BENEFITS = [
  {
    id: 'fresh-produce',
    title: 'Fresh Produce',
    desc: 'Farm-fresh fruits & vegetables delivered to your doorstep',
    emoji: '🌱',
  },
  {
    id: 'better-prices',
    title: 'Better Prices',
    desc: 'Direct from farmers means no middlemen markup',
    emoji: '💳',
  },
  {
    id: 'fast-delivery',
    title: 'Fast Delivery',
    desc: '3-5 days guaranteed delivery to your location',
    emoji: '🚚',
  },
  {
    id: 'support-farmers',
    title: 'Support Farmers',
    desc: 'Your purchase directly benefits local farmers',
    emoji: '❤️',
  },
  {
    id: 'quality-assured',
    title: 'Quality Assured',
    desc: 'All products verified for freshness and quality',
    emoji: '🛡️',
  },
  {
    id: 'trusted-community',
    title: 'Trusted Community',
    desc: 'Real reviews from real customers like you',
    emoji: '⭐',
  },
];

// Getting Started Steps
export const STEPS = [
  {
    number: 1,
    title: 'Create Your Account',
    desc: 'Sign up as a buyer in just 1 minute',
    details: [
      'Enter your name and email',
      'Create a secure password',
      'Provide delivery address',
      '⏱️ Admin verification in 24-48 hours',
    ],
  },
  {
    number: 2,
    title: 'Wait for Verification',
    desc: 'Admin team reviews your account',
    details: [
      'Our team verifies your information',
      'Get email confirmation',
      'Full marketplace access granted',
    ],
  },
  {
    number: 3,
    title: 'Browse Fresh Produce',
    desc: 'Explore our wide selection of farm products',
    details: [
      'Filter by category or location',
      'Read farmer profiles',
      'Check product reviews',
    ],
  },
  {
    number: 4,
    title: 'Order & Receive',
    desc: 'Easy checkout and fast delivery',
    details: [
      'Add items to cart',
      'Choose payment method',
      'Track delivery in real-time',
      'Enjoy farm-fresh produce!',
    ],
  },
];

// Quick Facts
export const QUICK_FACTS = [
  {
    id: 'delivery-time',
    value: '3-5',
    label: 'Days Delivery',
  },
  {
    id: 'savings',
    value: '40%+',
    label: 'Savings vs Retail',
  },
  {
    id: 'quality',
    value: '100%',
    label: 'Farm-Fresh Quality',
  },
];

// FAQ Items
export const FAQ_ITEMS = [
  {
    id: 'account',
    q: 'Do I need a special account?',
    a: 'No, just sign up as a buyer with your basic information.',
  },
  {
    id: 'payment',
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit cards, debit cards, and digital wallets.',
  },
  {
    id: 'tracking',
    q: 'Can I track my order?',
    a: 'Yes! You get real-time tracking updates and can contact the farmer directly.',
  },
  {
    id: 'satisfaction',
    q: 'What if I\'m not satisfied with the product?',
    a: 'We offer a 100% satisfaction guarantee. Contact us and we\'ll resolve it.',
  },
  {
    id: 'delivery-charges',
    q: 'Are delivery charges included?',
    a: 'Delivery charges depend on location and are shown before checkout.',
  },
  {
    id: 'cancellation',
    q: 'Can I cancel my order?',
    a: 'Yes, you can cancel within 24 hours of placing your order.',
  },
];

// Verification Benefits
export const VERIFICATION_BENEFITS = [
  {
    id: 'security',
    icon: '🔐',
    title: 'Platform Security',
    desc: 'Verification ensures only genuine buyers access our platform, protecting both customers and farmers from fraud.',
  },
  {
    id: 'quality-assurance',
    icon: '✅',
    title: 'Quality Assurance',
    desc: 'We verify buyer information to ensure smooth deliveries and reduce issues. Farmers can trust verified buyers.',
  },
  {
    id: 'payment-safety',
    icon: '💳',
    title: 'Payment Safety',
    desc: 'Verification confirms payment methods and reduces transaction risks for everyone on FarmDirect.',
  },
  {
    id: 'community-trust',
    icon: '🤝',
    title: 'Community Trust',
    desc: 'Verified buyers build a trusted community. This makes farmers confident to sell quality produce directly.',
  },
];

// Verification Timeline
export const VERIFICATION_TIMELINE = [
  {
    time: '⏱️ 1 Min',
    milestone: 'Sign Up',
    desc: 'Create your account',
  },
  {
    time: '⏰ 24-48 Hrs',
    milestone: 'Admin Review',
    desc: 'Profile verification',
  },
  {
    time: '✅ Instant',
    milestone: 'Full Access',
    desc: 'Start shopping immediately',
  },
];

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  UNVERIFIED: 'unverified',
};

// Error Messages
export const ERROR_MESSAGES = {
  NAVIGATION_FAILED: 'Failed to navigate. Please try again.',
  VERIFICATION_REQUIRED: 'Please verify your account to access the marketplace.',
  UNAUTHORIZED_ACCESS: 'You need to be logged in to access this page.',
};
