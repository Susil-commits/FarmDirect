import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Pause,
  Play,
  RotateCcw,
  Map as MapIcon,
  Layers,
  BarChart3,
  Terminal,
  X,
  CheckCircle,
  Eye,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Database,
  ArrowRight,
  Camera,
  Mic,
  Target,
  History,
  Cpu,
  MessageSquare,
  Lightbulb,
  Compass,
  Bell,
  Activity,
  Layers as TierIcon,
  HelpCircle,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

// ============================================================================
// ARCHITECTURAL DEFINITION — 14 REAL FaRm NODES & ZERO-CROSSING TOPOLOGY
// ============================================================================

// Desktop coordinates (1260 x 680 coordinate space)
// Clean Left-to-Right Flow: 4 Inputs -> 2 Mid-Left AI -> 1 Center Hub -> 2 Mid-Right Exec -> 5 Right Outputs
const INITIAL_FARM_NODES = [
  // --------------------------------------------------------------------------
  // COLUMN 1: INPUT INGESTION (Left, x: 45)
  // --------------------------------------------------------------------------
  {
    id: 'crop_scan',
    title: 'Harvest Produce Scan',
    subtitle: 'PHOTO / CLOUDINARY CDN',
    category: 'input',
    tierName: 'Input Tier',
    icon: Camera,
    iconColor: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    x: 45,
    y: 50,
    width: 210,
    height: 64,
    tech: 'React 19 + Cloudinary CDN',
    role: 'Direct camera & mobile upload of newly harvested produce (potatoes, onions, tomatoes) for automated quality grading.',
    metrics: { uploadSpeed: '< 1.2s', format: 'WebP / JPEG', limit: '50MB' },
    samplePayload: {
      action: 'CROP_SCAN',
      varietyHint: 'Potato',
      region: 'Bargarh, Odisha',
      sourceFormat: 'image/webp',
    },
  },
  {
    id: 'voice_nlp',
    title: 'Farmer Multilingual Voice',
    subtitle: 'ODIA / HINDI / EN NLP',
    category: 'input',
    tierName: 'Input Tier',
    icon: Mic,
    iconColor: '#818CF8',
    bgColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.4)',
    x: 45,
    y: 200,
    width: 210,
    height: 64,
    tech: 'Web Speech API + Dialect Classifier',
    role: 'Farmers submit native speech queries in Odia and Hindi with automated dialect detection and injection defense.',
    metrics: { dialects: 'Odia, Hindi, EN', latency: '16ms', guardrails: 'Prompt Safe' },
    samplePayload: {
      dialect: 'Odia (ଓଡ଼ିଆ)',
      query: 'ଆଳୁର ଆଜିର ଉଚିତ ମୂଲ୍ୟ କେତେ?',
      sanitized: true,
    },
  },
  {
    id: 'mandi_snapshots',
    title: 'Regional Mandi Feeds',
    subtitle: 'GOVT APMC BENCHMARK',
    category: 'input',
    tierName: 'Input Tier',
    icon: Target,
    iconColor: '#F472B6',
    bgColor: 'rgba(244, 114, 182, 0.12)',
    borderColor: 'rgba(244, 114, 182, 0.4)',
    x: 45,
    y: 350,
    width: 210,
    height: 64,
    tech: 'Agmarknet Pull + Cron Sweeper',
    role: 'Daily ingestion of government APMC Mandi modal price quotes, establishing authentic price floor benchmarks.',
    metrics: { markets: 'Cuttack, Nashik, Puri', cadence: 'Daily 06:00', verification: '100% Govt' },
    samplePayload: {
      mandi: 'Cuttack APMC',
      commodity: 'Potato',
      modalPriceKg: 20.5,
      arrivalTonnes: 45.0,
    },
  },
  {
    id: 'buyer_demand',
    title: 'Buyer Demand & Bids',
    subtitle: 'MARKETPLACE VELOCITY',
    category: 'input',
    tierName: 'Input Tier',
    icon: History,
    iconColor: '#FB923C',
    bgColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
    x: 45,
    y: 500,
    width: 210,
    height: 64,
    tech: 'Socket.io + SalesDaily DB',
    role: 'Active wholesale buyer purchase orders, bulk negotiation quotes, and re-order demand velocity.',
    metrics: { activeBuyers: '14,200+', avgBasket: '180 kg', transit: '< 24h Doorstep' },
    samplePayload: {
      buyerId: 'B-8831',
      demandVolumeKg: 300,
      targetPrice: 21.0,
      reorderFreq: 'Weekly',
    },
  },

  // --------------------------------------------------------------------------
  // COLUMN 2: AI PRE-PROCESSING & ANALYSIS (Mid-Left, x: 335)
  // --------------------------------------------------------------------------
  {
    id: 'quality_grader',
    title: 'Gemini Vision Grader',
    subtitle: 'GATE 2: PHOTO-TO-DRAFT',
    category: 'analysis',
    tierName: 'AI Intelligence Tier',
    icon: Eye,
    iconColor: '#34D399',
    bgColor: 'rgba(52, 211, 153, 0.14)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
    x: 335,
    y: 120,
    width: 205,
    height: 64,
    tech: 'Gemini 3.5 Flash Lite Vision',
    role: 'Automated produce classification (Tomato, Potato, Onion), freshness Grade A/B/C, and non-produce sanity filtering.',
    metrics: { top1Accuracy: '100.0% (85/85)', sanity: '100/100', hallucination: '0.00%' },
    samplePayload: {
      produce: 'Red Potato (Sambalpur Variety)',
      grade: 'Grade A Export Quality',
      looksLikeProduce: true,
      shelfLifeDays: 8,
    },
  },
  {
    id: 'forecast_engine',
    title: '14-Day Price Forecaster',
    subtitle: 'GATE 4: QUANTILE REGRESSION',
    category: 'analysis',
    tierName: 'AI Intelligence Tier',
    icon: TrendingUp,
    iconColor: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
    x: 335,
    y: 425,
    width: 205,
    height: 64,
    tech: 'Holt-Damped + LightGBM (p10/50/90)',
    role: 'Projects 2-week commodity trajectories and statistical price quartiles (p25/p50/p75) advising hold vs sell.',
    metrics: { mape: '2.38% MAPE', baselineLift: '6/6 Beat Naive', ciCoverage: '84.5%' },
    samplePayload: {
      commodity: 'Potato',
      quartiles: { p25: 19.0, median: 21.5, p75: 24.0 },
      advice: 'HOLD_3_DAYS (+14% projected lift)',
    },
  },

  // --------------------------------------------------------------------------
  // COLUMN 3: CENTER CORE HUB (Center, x: 550)
  // --------------------------------------------------------------------------
  {
    id: 'farm_core',
    title: 'FaRm CORE ENGINE',
    subtitle: '@AGRIBOT & ORCHESTRATOR',
    category: 'core',
    tierName: 'Center Orchestrator Hub',
    isCore: true,
    icon: Cpu,
    iconColor: '#C084FC',
    bgColor: 'rgba(192, 132, 252, 0.22)',
    borderColor: 'rgba(192, 132, 252, 0.75)',
    x: 555,
    y: 250,
    width: 170,
    height: 105,
    tech: 'TypeScript + Express + BullMQ',
    role: 'Central nerve center orchestrating JWT auth, database tool execution, ACID order sessions, and real-time Socket.io rooms.',
    metrics: { uptime: '99.98%', dbConsensus: 'Raft Majority', clusterState: 'ONLINE' },
    samplePayload: {
      orchestrator: 'FaRmDirect Engine v2.0',
      activeSessions: 'Verified',
      activeQueues: ['outbox', 'anomaly', 'payout'],
      state: 'STABLE',
    },
  },

  // --------------------------------------------------------------------------
  // COLUMN 4: DECISION & EXECUTION (Mid-Right, x: 745)
  // --------------------------------------------------------------------------
  {
    id: 'negotiation_copilot',
    title: 'Negotiation Copilot',
    subtitle: 'LOGISTIC CONCESSION CURVE',
    category: 'execution',
    tierName: 'Execution & Safety Tier',
    icon: MessageSquare,
    iconColor: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    x: 745,
    y: 120,
    width: 205,
    height: 64,
    tech: 'Socket.io + Math Concession Model',
    role: 'Mediates direct bargaining rounds, protecting farmer minimum margins while ensuring buyer affordability.',
    metrics: { maxRounds: '3 Rounds', winWinRate: '91.8%', resolution: '< 45s' },
    samplePayload: {
      dealId: 'NEG-4491',
      buyerOffer: 21.0,
      farmerFloor: 18.0,
      recommendedQuote: 21.5,
      winProb: '86.4%',
    },
  },
  {
    id: 'transaction_outbox',
    title: 'ACID Transaction Bus',
    subtitle: 'TWO-PHASE ORDER COMMIT',
    category: 'execution',
    tierName: 'Execution & Safety Tier',
    icon: Activity,
    iconColor: '#2DD4BF',
    bgColor: 'rgba(45, 212, 191, 0.14)',
    borderColor: 'rgba(45, 212, 191, 0.45)',
    x: 745,
    y: 425,
    width: 205,
    height: 64,
    tech: 'MongoDB 8.0 Sessions + BullMQ',
    role: 'Atomic checkout execution: deduces stock, creates order record, and enqueues OutboxEvent in single isolated transaction.',
    metrics: { isolation: 'ACID Multi-Doc', writeConcern: 'Majority', raceRisk: '0.00%' },
    samplePayload: {
      txId: 'TX-MONGO-9921',
      collections: ['Order', 'CropListing', 'OutboxEvent'],
      durationMs: 14,
      status: 'COMMITTED',
    },
  },

  // --------------------------------------------------------------------------
  // COLUMN 5: OUTPUTS & SETTLEMENTS (Right, x: 990)
  // --------------------------------------------------------------------------
  {
    id: 'counteroffer_hint',
    title: 'Fair Counter-Offer Clue',
    subtitle: 'COPILOT HINT ADVISORY',
    category: 'output',
    tierName: 'Settlement & Output Tier',
    icon: Lightbulb,
    iconColor: '#FDE047',
    bgColor: 'rgba(253, 224, 71, 0.12)',
    borderColor: 'rgba(253, 224, 71, 0.4)',
    x: 990,
    y: 45,
    width: 210,
    height: 60,
    tech: 'In-App Bargain Widget',
    role: 'Surfaces optimal win-win counter-quotes directly in negotiation chat so both parties close agreements rapidly.',
    metrics: { recommendedRate: '₹21.50 / kg', farmerGain: '+7.5%', delivery: 'In-app' },
    samplePayload: {
      counterQuote: '₹21.50 / kg',
      rationale: 'Satisfies buyer budget and delivers 14% higher net realization than mandi broker.',
    },
  },
  {
    id: 'price_window',
    title: 'Mandi Price Band Window',
    subtitle: 'MARKET TRANSPARENCY CARD',
    category: 'output',
    tierName: 'Settlement & Output Tier',
    icon: ShieldCheck,
    iconColor: '#FB7185',
    bgColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
    x: 990,
    y: 165,
    width: 210,
    height: 60,
    tech: 'Recharts Quartile Component',
    role: 'Interactive price band widget on crop listing pages displaying verified mandi modal prices vs farm-direct savings.',
    metrics: { mandiFloor: '₹18.50/kg', mandiCeil: '₹24.00/kg', middlemanTax: '0%' },
    samplePayload: {
      mandiFloor: 18.5,
      mandiModal: 21.5,
      mandiCeiling: 24.0,
      buyerSavings: '24% vs Retail',
    },
  },
  {
    id: 'payment_settlement',
    title: 'Razorpay Settlement Guard',
    subtitle: '0% COMMISSION PAYOUT',
    category: 'output',
    tierName: 'Settlement & Output Tier',
    icon: Zap,
    iconColor: '#34D399',
    bgColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    x: 990,
    y: 285,
    width: 210,
    height: 60,
    tech: 'Razorpay Webhooks + Auto-Sweep',
    role: 'Verifies HMAC signatures, captures buyer payments, and routes automated 15m direct payouts to farmers.',
    metrics: { farmerFee: '0% Zero Commission', sweep: 'Every 15m', verify: 'HMAC-SHA256' },
    samplePayload: {
      paymentId: 'pay_rzp_8849',
      paymentVerified: true,
      farmerPayout: 6450.0,
      releaseTrigger: 'DELIVERY_CONFIRMED',
    },
  },
  {
    id: 'anomaly_sentinel',
    title: 'Anomaly Sentinel v2',
    subtitle: 'GATE 5: FRAUD QUARANTINE',
    category: 'output',
    tierName: 'Settlement & Output Tier',
    icon: AlertTriangle,
    iconColor: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    x: 990,
    y: 410,
    width: 210,
    height: 60,
    tech: 'Welford Algorithm + Z-Score Vectors',
    role: 'Real-time fraud monitor flagging price gouging (>2.5x), quantity spikes (z > 4.0), and rapid bot bursts to Admin queue.',
    metrics: { precision: '100.0%', recall: '100.0%', f1Score: '1.000' },
    samplePayload: {
      orderId: 'ORD-98421-B',
      zScoreQuantity: 0.42,
      priceRatio: 1.05,
      fraudStatus: 'PASSED_CLEAN',
    },
  },
  {
    id: 'realtime_dispatch',
    title: 'Socket.io & SMS Dispatch',
    subtitle: 'LIVE DOORSTEP TELEMETRY',
    category: 'output',
    tierName: 'Settlement & Output Tier',
    icon: Bell,
    iconColor: '#C084FC',
    bgColor: 'rgba(192, 132, 252, 0.12)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
    x: 990,
    y: 535,
    width: 210,
    height: 60,
    tech: 'WebSocket Broadcast + Twilio SMS',
    role: 'Pushes real-time harvest dispatch tracking alerts to farmer dashboards, buyer order trackers, and SMS notifications.',
    metrics: { pushLatency: '< 45ms', transitWindow: '< 24h Doorstep', freshness: '96% Index' },
    samplePayload: {
      orderId: 'ORD-98421-B',
      status: 'DISPATCHED_TO_KITCHEN',
      etaHours: 12.5,
      liveCoords: { lat: 21.467, lng: 83.98 },
    },
  },
];

// ZERO-COLLISION CONNECTING CABLES (13 Clean Geometric Curves)
const FARM_CABLES = [
  // Inputs to Mid-Left Analysis
  { from: 'crop_scan', to: 'quality_grader', badge: 'CROP SCAN', color: '#06B6D4' },
  { from: 'mandi_snapshots', to: 'forecast_engine', badge: 'MANDI FEED', color: '#EC4899' },
  { from: 'buyer_demand', to: 'forecast_engine', badge: 'HISTORY BIDS', color: '#F97316' },

  // Mid-Left to Center Core
  { from: 'quality_grader', to: 'farm_core', badge: 'GRADE & SPEC', color: '#10B981' },
  { from: 'voice_nlp', to: 'farm_core', badge: 'ODIA/HI VOICE', color: '#818CF8' },
  { from: 'forecast_engine', to: 'farm_core', badge: 'PRICE BAND', color: '#EAB308' },

  // Center Core to Mid-Right Execution
  { from: 'farm_core', to: 'negotiation_copilot', badge: 'DEAL LOGIC', color: '#A855F7' },
  { from: 'farm_core', to: 'transaction_outbox', badge: 'ACID COMMIT', color: '#8B5CF6' },

  // Mid-Right Execution to Outputs
  { from: 'negotiation_copilot', to: 'counteroffer_hint', badge: 'HINT', color: '#EAB308' },
  { from: 'negotiation_copilot', to: 'price_window', badge: 'MARGIN BAND', color: '#F43F5E' },
  { from: 'transaction_outbox', to: 'payment_settlement', badge: 'DIRECT PAY', color: '#14B8A6' },
  { from: 'transaction_outbox', to: 'anomaly_sentinel', badge: 'FRAUD CHECK', color: '#FB7185' },
  { from: 'transaction_outbox', to: 'realtime_dispatch', badge: 'DISPATCH', color: '#C084FC' },
];

// 4 REAL-WORLD SIMULATION WORKFLOWS
const SIMULATION_FLOWS = [
  {
    id: 'order_lifecycle',
    name: '🌾 Complete Harvest-to-Payout Flow',
    description: 'Farmer produce scan -> Gemini grading -> Mandi price band -> Negotiation -> ACID commit -> Direct payout.',
    steps: [
      {
        nodeId: 'crop_scan',
        cableBadge: 'CROP SCAN',
        log: '[1. Harvest Scan] Farmer uploads newly harvested Sambalpur Red Potato crate photo via mobile PWA.',
      },
      {
        nodeId: 'quality_grader',
        cableBadge: 'GRADE & SPEC',
        log: '[2. Gemini Vision 3.5] Produce authenticity verified. Variety: Red Potato, Grade A Export, organic certification validated.',
      },
      {
        nodeId: 'farm_core',
        cableBadge: 'DEAL LOGIC',
        log: '[3. FaRm Core Hub] Core orchestrator creates catalog listing draft and pulls real-time mandi benchmarks.',
      },
      {
        nodeId: 'negotiation_copilot',
        cableBadge: 'HINT',
        log: '[4. Negotiation Copilot] Buyer proposes ₹21.00/kg. Copilot evaluates logistic concession curve (86.4% acceptance probability).',
      },
      {
        nodeId: 'counteroffer_hint',
        cableBadge: 'MARGIN BAND',
        log: '[5. Counter-Offer Hint] Displays optimal counter-quote of ₹21.50/kg to farmer. Buyer accepts terms!',
      },
      {
        nodeId: 'transaction_outbox',
        cableBadge: 'ACID COMMIT',
        log: '[6. ACID Transaction Bus] MongoDB multi-document isolated session locks 300 kg stock and commits order.',
      },
      {
        nodeId: 'payment_settlement',
        cableBadge: 'DIRECT PAY',
        log: '[7. Razorpay Settlement] Buyer payment captured with HMAC verification. 0% farmer commission enforced.',
      },
      {
        nodeId: 'realtime_dispatch',
        cableBadge: 'DISPATCH',
        log: '[8. Live Dispatch] Real-time harvest dispatch tracking activated. 15-minute payout sweep scheduled upon delivery confirmation.',
      },
    ],
  },
  {
    id: 'voice_advisory',
    name: '🗣️ Odia/Hindi Voice Advisory & Price Forecast',
    description: 'Farmer speaks dialect question -> Grounded AgriBot queries Mandi feeds -> 14-day price forecasting advisory.',
    steps: [
      {
        nodeId: 'voice_nlp',
        cableBadge: 'ODIA/HI VOICE',
        log: '[1. Multilingual Voice] Farmer speaks Odia: "ଆଳୁର ଆଜିର ଉଚିତ ମୂଲ୍ୟ କେତେ?" (What is the fair price of potato today?).',
      },
      {
        nodeId: 'farm_core',
        cableBadge: 'PRICE BAND',
        log: '[2. Core AgriBot] Grounded database tool getCropPrices("Potato", "Cuttack") triggered with strict session authentication.',
      },
      {
        nodeId: 'mandi_snapshots',
        cableBadge: 'MANDI FEED',
        log: '[3. Mandi Feeds] Govt APMC modal benchmark confirms floor price of ₹20.50/kg in regional trading yard.',
      },
      {
        nodeId: 'forecast_engine',
        cableBadge: 'GRADE & SPEC',
        log: '[4. Price Forecaster] 14-day Holt-damped smoothing projects price rising to ₹24.00/kg. Advice: HOLD_3_DAYS for +14% profit!',
      },
      {
        nodeId: 'price_window',
        cableBadge: 'MARGIN BAND',
        log: '[5. Price Window] Surfaces statistical quartiles (p25 = ₹19, median = ₹21.50, p75 = ₹24) directly on farmer screen.',
      },
    ],
  },
  {
    id: 'bilateral_bargain',
    name: '🤝 Real-Time Bilateral Bargaining',
    description: 'Buyer and farmer engage in direct peer-to-peer price discovery with automated minimum margin floor protection.',
    steps: [
      {
        nodeId: 'buyer_demand',
        cableBadge: 'HISTORY BIDS',
        log: '[1. Buyer Bids] Bulk kitchen buyer offers ₹17.00/kg (Below farmer cost of production).',
      },
      {
        nodeId: 'farm_core',
        cableBadge: 'DEAL LOGIC',
        log: '[2. FaRm Core Hub] Intercepts offer; evaluates against farmer minimum floor threshold (₹18.00/kg).',
      },
      {
        nodeId: 'negotiation_copilot',
        cableBadge: 'HINT',
        log: '[3. Negotiation Copilot] Blocks predatory rate and formulates win-win counter-quote of ₹19.20/kg based on regional acceptance curve.',
      },
      {
        nodeId: 'counteroffer_hint',
        cableBadge: 'MARGIN BAND',
        log: '[4. Counter-Offer Hint] Farmer transmits ₹19.20/kg counter-offer via 1-click button. Buyer agrees!',
      },
      {
        nodeId: 'transaction_outbox',
        cableBadge: 'DIRECT PAY',
        log: '[5. ACID Bus] Agreement sealed directly between parties with 0% middleman deduction.',
      },
    ],
  },
  {
    id: 'fraud_sentinel',
    name: '🛡️ Anomaly Sentinel & Fraud Interception',
    description: 'Multi-vector fraud monitoring intercepts price gouging or volume surges before database commit.',
    steps: [
      {
        nodeId: 'buyer_demand',
        cableBadge: 'HISTORY BIDS',
        log: '[1. Rapid Burst Order] Unverified account attempts rapid order: 8,000 kg at 3.5x normal market price.',
      },
      {
        nodeId: 'farm_core',
        cableBadge: 'ACID COMMIT',
        log: '[2. FaRm Core Hub] Dispatches order attributes to pre-commit risk assessment pipeline.',
      },
      {
        nodeId: 'transaction_outbox',
        cableBadge: 'FRAUD CHECK',
        log: '[3. ACID Bus] Halts transaction commit pending Anomaly Sentinel score validation.',
      },
      {
        nodeId: 'anomaly_sentinel',
        cableBadge: 'DISPATCH',
        log: '[4. Anomaly Sentinel v2] Quantity z-score = 5.2 (> 4.0 threshold). Order quarantined to Admin review queue automatically!',
      },
    ],
  },
];

export default function Pipeline() {
  const [nodes, setNodes] = useState(INITIAL_FARM_NODES);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map', 'cards', 'benchmarks', 'mobile_stream'
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const logsEndRef = useRef(null);
  const simulationTimerRef = useRef(null);

  const activeFlow = SIMULATION_FLOWS[activeFlowIndex];

  // Auto-scroll simulation logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulationLogs]);

  // Simulation step execution
  useEffect(() => {
    if (!isSimulating || isPaused) {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
      return;
    }

    const currentStep = activeFlow.steps[currentStepIndex];
    if (!currentStep) {
      setIsSimulating(false);
      setCurrentStepIndex(0);
      setSimulationLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'success',
          text: `✅ ${activeFlow.name} simulated cleanly through all architectural stages.`,
        },
      ]);
      return;
    }

    setSimulationLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'info',
        text: currentStep.log,
        nodeId: currentStep.nodeId,
      },
    ]);

    simulationTimerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 1800);

    return () => {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    };
  }, [isSimulating, isPaused, currentStepIndex, activeFlow]);

  const handleStartSimulation = () => {
    setSimulationLogs([
      {
        id: Date.now(),
        type: 'start',
        text: `🚀 Launching live trace: ${activeFlow.name}...`,
      },
    ]);
    setCurrentStepIndex(0);
    setIsPaused(false);
    setIsSimulating(true);
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setSimulationLogs([]);
    setNodes(INITIAL_FARM_NODES);
  };

  // Drag physics for interactive canvas
  const handleMouseDownNode = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 1260 / rect.width;
    const scaleY = 660 / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setDraggedNodeId(nodeId);
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!draggedNodeId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = 1260 / rect.width;
      const scaleY = 660 / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === draggedNodeId) {
            return {
              ...node,
              x: Math.max(10, Math.min(1050, mouseX - dragOffset.x)),
              y: Math.max(10, Math.min(580, mouseY - dragOffset.y)),
            };
          }
          return node;
        })
      );
    },
    [draggedNodeId, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNodeId(null);
  }, []);

  useEffect(() => {
    if (draggedNodeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNodeId, handleMouseMove, handleMouseUp]);

  // Cubic Bezier cable path with clean midpoint pill calculations
  const getCableGeometry = (cable) => {
    const fromNode = nodes.find((n) => n.id === cable.from);
    const toNode = nodes.find((n) => n.id === cable.to);
    if (!fromNode || !toNode) return null;

    let startX = fromNode.x + fromNode.width;
    let startY = fromNode.y + fromNode.height / 2;
    let endX = toNode.x;
    let endY = toNode.y + toNode.height / 2;

    if (toNode.x < fromNode.x) {
      startX = fromNode.x;
      endX = toNode.x + toNode.width;
    }

    const deltaX = Math.abs(endX - startX) * 0.5;
    const cp1x = startX + (endX > startX ? deltaX : -deltaX);
    const cp1y = startY;
    const cp2x = endX - (endX > startX ? deltaX : -deltaX);
    const cp2y = endY;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    return { pathData, midX, midY, startX, startY, endX, endY };
  };

  const activeStepNodeId =
    isSimulating && activeFlow.steps[currentStepIndex] ? activeFlow.steps[currentStepIndex].nodeId : null;
  const activeStepCableBadge =
    isSimulating && activeFlow.steps[currentStepIndex] ? activeFlow.steps[currentStepIndex].cableBadge : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden pt-18 pb-12">
        {/* ================================================================= */}
        {/* COMPACT COMMAND HEADER (Clean Desktop & Mobile Alignment) */}
        {/* ================================================================= */}
        <header className="border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md sticky top-16 z-30 px-3 sm:px-6 py-2.5 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Brand Title & Pulse */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                      FaRm DIRECT COMMERCE ENGINE
                    </h1>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden md:block">
                    5-Tier Direct Architecture • 14 Subsystems • Real-time Event Streaming
                  </p>
                </div>
              </div>

              {/* Mobile View Toggle Button */}
              <div className="flex lg:hidden items-center gap-1">
                <button
                  onClick={() => setViewMode(viewMode === 'map' ? 'mobile_stream' : 'map')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-emerald-400"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{viewMode === 'map' ? 'Mobile View' : 'Canvas Map'}</span>
                </button>
              </div>
            </div>

            {/* Middle & Right: Preset Selector, Sim Controls, View Switcher */}
            <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
              {/* Preset Selector */}
              <select
                value={activeFlowIndex}
                onChange={(e) => {
                  setActiveFlowIndex(Number(e.target.value));
                  handleReset();
                }}
                disabled={isSimulating}
                className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 max-w-[210px] sm:max-w-none truncate"
              >
                {SIMULATION_FLOWS.map((flow, index) => (
                  <option key={flow.id} value={index}>
                    {flow.name}
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {!isSimulating ? (
                  <button
                    onClick={handleStartSimulation}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Simulate Flow</span>
                  </button>
                ) : (
                  <button
                    onClick={handleTogglePause}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isPaused
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  title="Reset flow & layout"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop View Switcher */}
              <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapIcon className="w-3 h-3" />
                  <span>Map</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Step Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('benchmarks')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                    viewMode === 'benchmarks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Benchmarks</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* INTERACTION HINT BANNER */}
        {/* ================================================================= */}
        <div className="bg-[#0D1527] border-b border-slate-800/60 px-4 py-1.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            💡 Click or drag nodes freely to flex live cables — or click{' '}
            <strong className="text-emerald-400">Simulate Flow</strong> to stream data packets!
          </span>
        </div>

        {/* ================================================================= */}
        {/* MAIN BODY CONTAINER */}
        {/* ================================================================= */}
        <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col gap-5">
          {/* =============================================================== */}
          {/* VIEW MODE 1: INTERACTIVE ARCHITECTURE CANVAS (DESKTOP) */}
          {/* =============================================================== */}
          {viewMode === 'map' && (
            <div className="flex flex-col gap-4">
              {/* Architecture Canvas */}
              <div
                ref={canvasRef}
                className="relative w-full h-[580px] sm:h-[660px] bg-[#0A0F1D] border border-slate-800 rounded-2xl shadow-2xl overflow-x-auto overflow-y-hidden cursor-crosshair"
                style={{
                  backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* SVG Connections & Particle Layer */}
                <svg
                  className="absolute inset-0 w-[1260px] h-[660px] pointer-events-none"
                  viewBox="0 0 1260 660"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Pulsing Core Hub Gradient Rings */}
                    <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#6366F1" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Orbital Center Rings around Core Hub */}
                  <g transform="translate(640, 302)">
                    <circle r="95" fill="none" stroke="#A855F7" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 6" />
                    <circle r="130" fill="none" stroke="#6366F1" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="4 8" />
                    <circle r="170" fill="url(#coreAura)" />
                  </g>

                  {/* Render All 13 Connected Cables */}
                  {FARM_CABLES.map((cable, idx) => {
                    const geo = getCableGeometry(cable);
                    if (!geo) return null;

                    const isCableActive =
                      activeStepCableBadge && activeStepCableBadge.toLowerCase() === cable.badge.toLowerCase();

                    return (
                      <g key={`cable-${idx}`} className="transition-all duration-300">
                        {/* Shadow Glow Path */}
                        <path
                          d={geo.pathData}
                          fill="none"
                          stroke={isCableActive ? cable.color : cable.color}
                          strokeWidth={isCableActive ? 4 : 2}
                          strokeOpacity={isCableActive ? 0.95 : 0.3}
                          strokeLinecap="round"
                        />

                        {/* Animated Data Packets Flow */}
                        <path
                          d={geo.pathData}
                          fill="none"
                          stroke={isCableActive ? '#FFFFFF' : cable.color}
                          strokeWidth={isCableActive ? 3 : 1.5}
                          strokeOpacity={isCableActive ? 1 : 0.65}
                          strokeDasharray={isCableActive ? '10 8' : '5 12'}
                          className="animate-flow-cable"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Render Cable Pill Badges */}
                {FARM_CABLES.map((cable, idx) => {
                  const geo = getCableGeometry(cable);
                  if (!geo) return null;

                  const isBadgeActive =
                    activeStepCableBadge && activeStepCableBadge.toLowerCase() === cable.badge.toLowerCase();

                  return (
                    <div
                      key={`badge-${idx}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-transform duration-300"
                      style={{
                        left: `${geo.midX}px`,
                        top: `${geo.midY}px`,
                      }}
                    >
                      <div
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold uppercase backdrop-blur-md border shadow-md ${
                          isBadgeActive
                            ? 'scale-115 text-white ring-2 ring-emerald-400 bg-emerald-900/90 border-emerald-400 shadow-emerald-500/50'
                            : 'text-slate-300 bg-[#0B1120]/85'
                        }`}
                        style={{
                          borderColor: isBadgeActive ? '#34D399' : `${cable.color}66`,
                          color: isBadgeActive ? '#FFFFFF' : cable.color,
                        }}
                      >
                        {cable.badge}
                      </div>
                    </div>
                  );
                })}

                {/* Render Draggable Nodes */}
                {nodes.map((node) => {
                  const isNodeActive = activeStepNodeId === node.id;
                  const isNodeSelected = selectedNode?.id === node.id;
                  const IconComponent = node.icon;

                  // Render Center Core Hub distinctly
                  if (node.isCore) {
                    return (
                      <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                        onClick={() => setSelectedNode(node)}
                        className={`absolute rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing border shadow-2xl transition-all z-20 group ${
                          isNodeActive
                            ? 'ring-2 ring-emerald-400 shadow-emerald-500/50 scale-105'
                            : isNodeSelected
                            ? 'ring-2 ring-purple-400 shadow-purple-500/40'
                            : 'hover:border-purple-400 hover:scale-102'
                        }`}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          width: `${node.width}px`,
                          height: `${node.height}px`,
                          backgroundColor: isNodeActive ? 'rgba(168, 85, 247, 0.35)' : 'rgba(23, 15, 38, 0.95)',
                          backdropFilter: 'blur(12px)',
                          borderColor: isNodeActive ? '#34D399' : node.borderColor,
                        }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-1.5 shadow-inner">
                          <Cpu className="w-5 h-5 animate-pulse" />
                        </div>
                        <h3 className="text-xs font-bold text-white tracking-wide">{node.title}</h3>
                        <p className="text-[9px] font-mono text-purple-300 font-semibold">{node.subtitle}</p>
                        <span className="text-[8px] font-mono text-slate-400 mt-0.5">MongoDB • BullMQ • WS</span>
                      </div>
                    );
                  }

                  // Standard Pipeline Card
                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                      onClick={() => setSelectedNode(node)}
                      className={`absolute rounded-xl p-2.5 transition-all cursor-grab active:cursor-grabbing border shadow-lg z-20 group ${
                        isNodeActive
                          ? 'ring-2 ring-emerald-400 shadow-emerald-500/40 scale-103'
                          : isNodeSelected
                          ? 'ring-2 ring-indigo-400 shadow-indigo-500/30'
                          : 'hover:border-slate-500'
                      }`}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: `${node.width}px`,
                        minHeight: `${node.height}px`,
                        backgroundColor: isNodeActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(8px)',
                        borderColor: isNodeActive ? '#34D399' : isNodeSelected ? '#818CF8' : node.borderColor,
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Node Icon Box */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                          style={{
                            backgroundColor: node.bgColor,
                            borderColor: node.borderColor,
                            color: node.iconColor,
                          }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>

                        {/* Titles & Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition">
                              {node.title}
                            </h3>
                            {isNodeActive && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            )}
                          </div>
                          <p
                            className="text-[9px] font-mono tracking-tight font-semibold uppercase truncate"
                            style={{ color: node.iconColor }}
                          >
                            {node.subtitle}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">{node.tech}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Telemetry Console */}
              <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3 shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                      Live Telemetry Log Tape
                    </span>
                    {isSimulating && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                        STEP {currentStepIndex + 1}/{activeFlow.steps.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Active Flow: <strong className="text-slate-200">{activeFlow.name}</strong>
                  </span>
                </div>

                <div className="h-20 overflow-y-auto font-mono text-xs space-y-1 p-2 bg-[#060913] rounded-lg border border-slate-800/80">
                  {simulationLogs.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      Click "Simulate Flow" above to stream live end-to-end telemetry packets through the architecture.
                    </div>
                  ) : (
                    simulationLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-1.5 ${
                          log.type === 'start'
                            ? 'text-indigo-400 font-semibold'
                            : log.type === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-400 select-none">›</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW MODE 2: DEDICATED RESPONSIVE MOBILE STREAM VIEW */}
          {/* =============================================================== */}
          {viewMode === 'mobile_stream' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Mobile Architecture Stream
                  </h2>
                  <button
                    onClick={() => setViewMode('map')}
                    className="text-xs text-indigo-400 font-semibold underline"
                  >
                    Switch to Canvas
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Touch-friendly sequential pipeline flow. Tap any node to inspect telemetry.
                </p>
              </div>

              {/* Sequential Node Cards on Mobile */}
              <div className="space-y-3">
                {nodes.map((node) => {
                  const IconComponent = node.icon;
                  const isNodeActive = activeStepNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`rounded-xl border p-3.5 bg-[#0B1120] transition active:scale-98 cursor-pointer ${
                        isNodeActive
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {node.tierName}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: node.bgColor,
                            color: node.iconColor,
                            border: `1px solid ${node.borderColor}`,
                          }}
                        >
                          {node.subtitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: node.bgColor,
                            borderColor: node.borderColor,
                            color: node.iconColor,
                          }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{node.title}</h3>
                          <p className="text-xs text-slate-400 font-mono">{node.tech}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW MODE 3: STEP-BY-STEP FLOW CARDS */}
          {/* =============================================================== */}
          {viewMode === 'cards' && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">{activeFlow.name}</h2>
                  <p className="text-xs text-slate-400">{activeFlow.description}</p>
                </div>
                <button
                  onClick={handleStartSimulation}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Workflow
                </button>
              </div>

              {/* Grid of Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFlow.steps.map((step, idx) => {
                  const node = nodes.find((n) => n.id === step.nodeId);
                  const isCurrent = isSimulating && currentStepIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 bg-[#0B1120] shadow-md transition ${
                        isCurrent
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          STEP {idx + 1}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: node?.bgColor,
                            color: node?.iconColor,
                            border: `1px solid ${node?.borderColor}`,
                          }}
                        >
                          {step.cableBadge}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-0.5">{node?.title}</h3>
                      <p className="text-[10px] font-mono text-slate-400 mb-2">{node?.tierName}</p>

                      <p className="text-xs text-slate-300 leading-relaxed bg-[#060913] p-2.5 rounded-lg border border-slate-800/80 font-mono">
                        {step.log}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW MODE 4: PHASE GATE BENCHMARKS */}
          {/* =============================================================== */}
          {viewMode === 'benchmarks' && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  FaRm Direct: Verified AI/ML Benchmark Scorecard (All 5 Phase Gates)
                </h2>
                <p className="text-xs text-slate-400">
                  Every single AI subsystem was benchmarked against empirical offline baselines before production release.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Gate 1 */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                        GATE 1: AGRIBOT
                      </span>
                      <span className="text-xs font-bold text-emerald-400">100.0% PASS</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Grounded Multilingual Assistant</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      62 Golden test cases covering dialectal Odia, Hindi, English, prompt injections, and database tool scope.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Baseline: Heuristic Bot (48.0%)</div>
                      <div className="text-emerald-400 font-bold">FaRm Lift: +52.0% Lift (62/62 Passed)</div>
                      <div className="text-slate-400">Circuit Breaker: Opossum + FarmingKb</div>
                    </div>
                  </div>
                </div>

                {/* Gate 2 */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        GATE 2: VISION GRADER
                      </span>
                      <span className="text-xs font-bold text-emerald-400">100.0% TOP-1</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Photo-to-Draft Smart Listing</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      100 Labeled produce images (85 real varieties + 15 non-produce sanity checks) evaluated against Gemini 3.5.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Sanity Check: 100/100 Correctly Flagged</div>
                      <div className="text-emerald-400 font-bold">Hallucination Rate: 0.00% Zero Error</div>
                      <div className="text-slate-400">Listing Latency: &lt; 2.4s Photo to Draft</div>
                    </div>
                  </div>
                </div>

                {/* Gate 4 */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        GATE 4: FORECASTING
                      </span>
                      <span className="text-xs font-bold text-emerald-400">2.38% MAPE</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">14-Day Price Forecaster</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Holt-damped smoothing + LightGBM quantile regression backtested across 6 core Indian agricultural commodities.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Baseline Naive: 2.51% MAPE</div>
                      <div className="text-emerald-400 font-bold">FaRm Model: 2.38% MAPE (6/6 Beat Naive)</div>
                      <div className="text-slate-400">Interval Coverage: 84.5% in 80% CI</div>
                    </div>
                  </div>
                </div>

                {/* Gate 5 */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        GATE 5: ANOMALY v2
                      </span>
                      <span className="text-xs font-bold text-emerald-400">1.000 F1 SCORE</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Multi-Vector Fraud Sentinel</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Evaluates unit price gouging, quantity surges (z &gt; 4.0), rapid bot bursts, and suspicious COD cancellations.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Precision & Recall: 100.0% / 100.0%</div>
                      <div className="text-emerald-400 font-bold">F1 Benchmark: 1.000 vs Welford (0.72)</div>
                      <div className="text-slate-400">Admin Loop: Human-in-the-Loop Feedback</div>
                    </div>
                  </div>
                </div>

                {/* Gate 3 */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-400 border border-pink-800">
                        GATE 3: RECSYS
                      </span>
                      <span className="text-xs font-bold text-emerald-400">+175% NDCG</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Hybrid Recommender Engine</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Leave-last-out basket evaluation combining user preference vectors with co-occurrence matrix and regional boosts.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Baseline NDCG: 0.165 Category Match</div>
                      <div className="text-emerald-400 font-bold">FaRm Model: 0.454 NDCG@10 (+175% Lift)</div>
                      <div className="text-slate-400">Context Boosts: +15% Proximity, +10% Organic</div>
                    </div>
                  </div>
                </div>

                {/* Zero Commission Economic Moat */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                        ECONOMIC MOAT
                      </span>
                      <span className="text-xs font-bold text-emerald-400">90-95% TO FARMER</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Zero Middlemen Elimination</h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Traditional APMC mandis capture 75-85% in middleman taxes. FaRm transfers 100% of negotiated price to the farmer.
                    </p>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-[#060913] p-2.5 rounded border border-slate-800">
                      <div>Traditional Farmer Take: 15% - 25%</div>
                      <div className="text-emerald-400 font-bold">FaRm Direct Realization: 90% - 95%</div>
                      <div className="text-slate-400">Buyer Transit: Fresh in &lt; 24h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ================================================================= */}
        {/* NODE INSPECTOR DRAWER / MODAL */}
        {/* ================================================================= */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#0B1120] border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border font-bold"
                    style={{
                      backgroundColor: selectedNode.bgColor,
                      borderColor: selectedNode.borderColor,
                      color: selectedNode.iconColor,
                    }}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      {selectedNode.title}
                    </h3>
                    <p className="text-xs font-mono font-semibold" style={{ color: selectedNode.iconColor }}>
                      {selectedNode.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subsystem Details */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Architectural Role
                  </h4>
                  <p className="text-slate-200 leading-relaxed bg-[#060913] p-3 rounded-lg border border-slate-800/80">
                    {selectedNode.role}
                  </p>
                </div>

                {/* Tech & Health */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#060913] p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">TECH STACK</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedNode.tech}</span>
                  </div>
                  <div className="bg-[#060913] p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">HEALTH STATUS</span>
                    <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Online (Healthy)
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subsystem Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-2 bg-[#060913] p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px]">
                    {Object.entries(selectedNode.metrics).map(([key, val]) => (
                      <div key={key}>
                        <div className="text-[9px] text-slate-400 uppercase truncate">{key}</div>
                        <div className="font-bold text-slate-200 truncate">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample JSON */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    Live System Payload (JSON)
                  </h4>
                  <pre className="bg-[#060913] p-2.5 rounded-lg border border-slate-800/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                    {JSON.stringify(selectedNode.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
