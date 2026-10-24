export interface FarmingGuideItem {
  sourceId: string;
  title: string;
  category: 'soil_health' | 'pest_management' | 'water_irrigation' | 'post_harvest' | 'crop_calendar';
  tags: string[];
  content: string;
  attribution: string;
}

export const FARMING_GUIDES: FarmingGuideItem[] = [
  {
    sourceId: 'KB-SOIL-01',
    title: 'Organic Soil Health, Vermicompost & Green Manuring',
    category: 'soil_health',
    tags: ['soil', 'vermicompost', 'fym', 'organic matter', 'dhaincha', 'nitrogen'],
    content:
      'Healthy soil requires at least 0.5-0.75% organic carbon. Apply 2-3 tons of mature vermicompost or 5-8 tons of well-rotted Farmyard Manure (FYM) per acre prior to land preparation. Green manuring with Sunhemp or Dhaincha (Sesbania aculeata) grown for 45 days and ploughed down fixes 60-80 kg atmospheric nitrogen per hectare and dramatically boosts microbial biodiversity.',
    attribution: 'FarmDirect Soil Stewardship Guide',
  },
  {
    sourceId: 'KB-SOIL-02',
    title: 'Soil pH Management & Micronutrient Balancing',
    category: 'soil_health',
    tags: ['ph', 'acidity', 'liming', 'zinc', 'boron', 'soil test'],
    content:
      'Optimal soil pH for most vegetable and cereal crops ranges between 6.2 and 7.2. For acidic red and laterite soils (pH < 5.5), apply agricultural lime or dolomite at 200-400 kg/acre based on soil test recommendations every 3 years. Correct zinc deficiency in paddy and maize with basal application of zinc sulphate (25 kg/ha) or 0.5% foliar spray at tillering.',
    attribution: 'FarmDirect Soil Stewardship Guide',
  },
  {
    sourceId: 'KB-PEST-01',
    title: 'Neem-Based Bio-Pesticide Formulation for Sucking Pests',
    category: 'pest_management',
    tags: ['neem oil', 'aphids', 'whitefly', 'organic spray', 'pest control'],
    content:
      'For control of aphids, jassids, thrips, and whiteflies in vegetables and pulses: Mix 5 ml of cold-pressed Neem oil (minimum 1500 ppm Azadirachtin) with 2 ml of mild organic soap or Khadi soap per liter of water. Emulsify thoroughly until milky white. Spray during late afternoon or overcast conditions, coating both upper and lower leaf surfaces. Repeat every 7-10 days.',
    attribution: 'FarmDirect Natural Pest Protocol',
  },
  {
    sourceId: 'KB-PEST-02',
    title: 'Jeevamrut Preparation & Trap Cropping Techniques',
    category: 'pest_management',
    tags: ['jeevamrut', 'bio fertilizer', 'companion planting', 'marigold', 'nematodes'],
    content:
      'Jeevamrut preparation for 1 acre: Mix 10 kg fresh indigenous cow dung, 5-10 liters cow urine, 2 kg jaggery, 2 kg pulse flour (besan), and a handful of fertile farm soil in 200 liters of water. Ferment in shade for 48 hours with twice-daily stirring. Apply through irrigation water or as a 10% foliar spray. Intercrop border rows of African Marigold to trap tomato fruit borers and suppress root-knot nematodes.',
    attribution: 'FarmDirect Natural Pest Protocol',
  },
  {
    sourceId: 'KB-PEST-03',
    title: 'Safe Pesticide Handling & IPM Caution Protocol',
    category: 'pest_management',
    tags: ['pesticide', 'chemical', 'dosage', 'kvk', 'safety', 'ipm'],
    content:
      'Integrated Pest Management (IPM) prioritizes cultural, mechanical, and biological controls first. Chemical interventions should only be considered when pest populations breach the Economic Threshold Level (ETL). Always wear protective gloves, mask, and goggles. CAUTION: Any chemical pesticide selection, formulation, or dosage MUST be confirmed with your local KVK (Krishi Vigyan Kendra) or District Agriculture Officer to avoid crop burn, resistance, or toxicity.',
    attribution: 'Central Insecticides Board & KVK Extension Guidelines',
  },
  {
    sourceId: 'KB-WATER-01',
    title: 'Drip Irrigation Efficiency & Organic Mulching',
    category: 'water_irrigation',
    tags: ['drip', 'irrigation', 'water conservation', 'mulching', 'fertigation'],
    content:
      'Drip irrigation conserves 40-60% water while increasing crop yield by 20-30% compared to flood irrigation. Operate inline drippers (2-4 LPH) at 1.0-1.5 kg/cm² pressure. Combine with 25-micron reflective silver-black plastic mulch or 3-4 inch organic paddy straw mulch to retain root-zone soil moisture, suppress weeds, and buffer soil temperature fluctuations.',
    attribution: 'FarmDirect Water Conservation Manual',
  },
  {
    sourceId: 'KB-WATER-02',
    title: 'Raised Bed Cultivation & Monsoon Drainage',
    category: 'water_irrigation',
    tags: ['raised bed', 'drainage', 'monsoon', 'waterlogging', 'root rot'],
    content:
      'In heavy rainfall and flood-prone soils, construct broad bed and furrow (BBF) systems or raised beds (15-20 cm high, 100 cm wide) with 30 cm drainage furrows. This prevents waterlogging, protects roots from anaerobic stress and Pythium damping-off, and ensures rapid drainage while facilitating intercultural operations.',
    attribution: 'FarmDirect Water Conservation Manual',
  },
  {
    sourceId: 'KB-GRAIN-01',
    title: 'Post-Harvest Grain Drying & Safe Storage',
    category: 'post_harvest',
    tags: ['grain storage', 'moisture', 'paddy', 'wheat', 'weevils', 'pudina', 'neem'],
    content:
      'Grains (paddy, wheat, pulses) must be dried in sun until moisture content drops below 12% (10% for oilseeds) to prevent Aspergillus aflatoxin fungal growth. Store in hermetic bags (PICS bags) or clean metal bins. Line storage containers with dried neem leaves and dry red chillies at 2% weight to naturally repel granary weevils, pulse beetles, and grain moths without toxic chemicals.',
    attribution: 'FarmDirect Post-Harvest Management Guide',
  },
  {
    sourceId: 'KB-FRUIT-01',
    title: 'Fresh Produce Handling & Zero Energy Cool Chamber (ZECC)',
    category: 'post_harvest',
    tags: ['vegetables', 'fruits', 'storage', 'zecc', 'spoilage', 'tomato', 'transit'],
    content:
      'For tomatoes, leafy greens, mangoes, and brinjals: Harvest during early morning hours to preserve turgidity. Discard damaged or diseased produce immediately. On-farm storage can be extended by 5-10 days using an on-farm Zero Energy Cool Chamber (ZECC) constructed with double-walled wet brickwork and river sand, maintaining 10-15°C lower temperature and 90% relative humidity.',
    attribution: 'FarmDirect Post-Harvest Management Guide',
  },
  {
    sourceId: 'KB-SEASON-01',
    title: 'Kharif, Rabi & Zaid Seasonal Crop Planting Calendar',
    category: 'crop_calendar',
    tags: ['calendar', 'kharif', 'rabi', 'zaid', 'seasons', 'planting'],
    content:
      'Kharif (June-October): Paddy, maize, arhar (pigeon pea), groundnut, and brinjal sown with onset of monsoon. Rabi (October-March): Wheat, mustard, chickpea, potato, tomato, and onion sown under declining temperatures with assured irrigation. Zaid / Summer (March-June): Watermelon, cucumber, bitter gourd, and moong (green gram) providing quick cash returns before monsoon arrival.',
    attribution: 'ICAR Agrometeorological Advisory Advisory Guide',
  },
  {
    sourceId: 'KB-DISEASE-01',
    title: 'Tomato Early Blight, Late Blight & Leaf Curl Virus Management',
    category: 'pest_management',
    tags: ['tomato', 'tamatar', 'bilaati', 'blight', 'jhulsa', 'leaf curl', 'patta modak', 'patra modaka', 'whitefly', 'trichoderma'],
    content:
      'Tomato Leaf Curl virus is transmitted by whiteflies; control vectors with yellow sticky traps (15-20 traps/acre) and 5% neem seed kernel extract (NSKE) spray. For Early & Late Blight (Alternaria / Phytophthora fungal spots and brown leaf scorched margins): Spray biological bio-fungicide Trichoderma viride or Pseudomonas fluorescens (5g/liter) prophylactically. Remove and burn infected lower leaves. CAUTION: Any chemical fungicide (e.g. Copper Oxychloride or Mancozeb) MUST be confirmed with your local KVK or Agriculture Officer for dosage and harvest waiting periods.',
    attribution: 'ICAR-IIHR Tomato Disease Advisory & IPM Protocol',
  },
  {
    sourceId: 'KB-DISEASE-02',
    title: 'Paddy Yellow Stem Borer & Leaf Blast (Pyricularia) Management',
    category: 'pest_management',
    tags: ['paddy', 'rice', 'dhan', 'dhana', 'stem borer', 'majra poka', 'tana chhedak', 'blast', 'jhunsi', 'pheromone trap'],
    content:
      'For Paddy Yellow Stem Borer (dead heart at vegetative stage and white earhead at heading stage): Install pheromone traps with Scirpophaga incertulas lures at 8-10 traps/acre to monitor moth population. Release egg parasitoid Trichogramma japonicum @ 1,00,000/ha thrice at weekly intervals. For Blast (eye-shaped spots with grey center): Avoid excessive nitrogenous fertilizers. CAUTION: If Economic Threshold Level (ETL) is breached, confirm any chemical spray (such as Tricyclazole) with your local KVK or District Agriculture Extension Officer.',
    attribution: 'ICAR-NRRI Cuttack Rice Crop Protection Manual',
  },
  {
    sourceId: 'KB-DISEASE-03',
    title: 'Potato Late Blight (Phytophthora) & Tuber Rot Prevention',
    category: 'pest_management',
    tags: ['potato', 'aalu', 'aloo', 'late blight', 'jhulsa', 'phytophthora', 'tuber rot', 'ridging', 'mancozeb'],
    content:
      'Potato Late Blight (Phytophthora infestans) manifests as water-soaked lesions on leaves turning blackish-brown with white mildew ring underneath during humid cool weather. Practice high earthing-up (ridging) to create an 8-10 cm protective soil barrier preventing fungal spores from washing down to tubers. Treat seed tubers with Trichoderma viride before planting. CAUTION: For chemical blight management, always confirm recommended preventive contact or curative systemic fungicides and safe spray intervals with your local KVK or Agriculture Extension Officer.',
    attribution: 'Central Potato Research Institute (CPRI) Advisory',
  },
];

