export type Verdict = 'fair' | 'overpriced' | 'underpriced' | 'uncertain';

export interface AnalysisResult {
  verdict: Verdict;
  confidence: number;
  estimatedLow: number;
  estimatedHigh: number;
  explanation: string;
  tips: string[];
  category: string;
}

interface PriceRange {
  low: number;
  high: number;
  unit: string;
  perUnit?: 'sqft' | 'linearft';
  tips: string[];
}

const PRICE_RANGES: Record<string, PriceRange> = {
  plumbing: { low: 150, high: 450, unit: 'per job', tips: ['Get 3 quotes', 'Check license', 'Ask about parts warranty'] },
  faucet: { low: 150, high: 350, unit: 'installed', tips: ['Parts typically $50-150', 'Labor 1-2 hours', 'Ask if parts included'] },
  drain: { low: 100, high: 250, unit: 'per drain', tips: ['Simple clogs are cheaper', 'Camera inspection adds cost'] },
  toilet: { low: 150, high: 400, unit: 'installed', tips: ['Standard install 1-2 hours', 'Ask about wax ring replacement'] },
  electrical: { low: 200, high: 600, unit: 'per job', tips: ['Must be licensed', 'Permit may be required', 'Get itemized quote'] },
  outlet: { low: 100, high: 200, unit: 'per outlet', tips: ['GFCI outlets cost more', 'Panel work adds cost'] },
  panel: { low: 1500, high: 4000, unit: 'replacement', tips: ['Permit required', 'Inspect after completion', 'Check warranty'] },
  painting: { low: 200, high: 800, unit: 'per room', tips: ['Ask about prep work', 'Check paint quality included', 'Get color samples'] },
  exterior_painting: { low: 1500, high: 5000, unit: 'whole house', tips: ['Weather dependent', 'Surface prep is key', 'Ask about primer'] },
  hvac: { low: 300, high: 1200, unit: 'repair', tips: ['Get diagnostic fee upfront', 'Ask about parts warranty', 'Consider service contract'] },
  ac_install: { low: 3000, high: 7000, unit: 'central AC', tips: ['Size matters (tons)', 'SEER rating affects efficiency', 'Rebates available'] },
  roofing: { low: 5000, high: 15000, unit: 'full replacement', tips: ['Get 3 quotes minimum', 'Check shingle warranty', 'Verify insurance'] },
  roof_repair: { low: 300, high: 1500, unit: 'repair', tips: ['Document damage with photos', 'Check if insurance covers it'] },
  landscaping: { low: 100, high: 500, unit: 'per visit', tips: ['Seasonal pricing varies', 'Ask about equipment', 'Check references'] },
  lawn: { low: 30, high: 100, unit: 'per mow', tips: ['Size dependent', 'Edging may cost extra', 'Bundle for discount'] },
  cleaning: { low: 100, high: 300, unit: 'per clean', tips: ['Deep clean costs more', 'Supplies included?', 'Background checked?'] },
  moving: { low: 500, high: 2000, unit: 'local move', tips: ['Get binding estimate', 'Check insurance coverage', 'Avoid peak weekends'] },
  auto_repair: { low: 100, high: 500, unit: 'per job', tips: ['Get written estimate', 'Ask about OEM vs aftermarket parts', 'Check warranty'] },
  oil_change: { low: 40, high: 100, unit: 'synthetic', tips: ['Synthetic lasts longer', 'Check for coupons', 'Tire rotation often bundled'] },
  brakes: { low: 200, high: 600, unit: 'per axle', tips: ['Front brakes wear faster', 'Ask about rotor condition', 'Get parts warranty'] },
  carpet: { low: 1, high: 4, unit: 'per sq ft installed', perUnit: 'sqft', tips: ['Padding quality matters', 'Moving furniture may cost extra', 'Ask about seams'] },
  flooring: { low: 3, high: 12, unit: 'per sq ft installed', perUnit: 'sqft', tips: ['Material cost varies widely', 'Subfloor prep adds cost', 'Ask about transitions'] },
  window: { low: 300, high: 800, unit: 'per window installed', tips: ['Energy Star rating saves money', 'Frame material matters', 'Check warranty'] },
  pest: { low: 100, high: 300, unit: 'initial treatment', tips: ['Ask about guarantee', 'Recurring plans save money', 'Identify pest first'] },
  tree: { low: 300, high: 2000, unit: 'per tree removal', tips: ['Size and location matter', 'Stump removal extra', 'Check insurance'] },
  fence: { low: 15, high: 50, unit: 'per linear foot', perUnit: 'linearft', tips: ['Material affects price', 'Gates cost extra', 'Check property lines'] },
  deck: { low: 15, high: 35, unit: 'per sq ft', perUnit: 'sqft', tips: ['Composite costs more upfront', 'Permit may be required', 'Check local codes'] },
  drywall: { low: 1.5, high: 4, unit: 'per sq ft', perUnit: 'sqft', tips: ['Texture matching adds cost', 'Painting separate', 'Water damage needs inspection'] },
  tile: { low: 5, high: 20, unit: 'per sq ft installed', perUnit: 'sqft', tips: ['Grout color matters', 'Removal adds cost', 'Heated floor adds cost'] },
  // New categories
  appliance: { low: 100, high: 400, unit: 'repair', tips: ['Ask if repair vs replace makes sense', 'Parts warranty important', 'Brand affects parts cost'] },
  water_heater: { low: 800, high: 1800, unit: 'installed', tips: ['Tank vs tankless affects price', 'Energy factor matters', 'Permit may be required'] },
  insulation: { low: 1, high: 3, unit: 'per sq ft', perUnit: 'sqft', tips: ['R-value matters for climate', 'Attic insulation is most cost-effective', 'Check for rebates'] },
  concrete: { low: 4, high: 10, unit: 'per sq ft', perUnit: 'sqft', tips: ['Thickness affects price', 'Rebar adds cost', 'Curing time matters'] },
  gutter: { low: 4, high: 12, unit: 'per linear foot', perUnit: 'linearft', tips: ['Seamless gutters cost more', 'Guards add cost but save maintenance', 'Downspout extensions important'] },
  siding: { low: 3, high: 12, unit: 'per sq ft installed', perUnit: 'sqft', tips: ['Material choice is key', 'Removal of old siding adds cost', 'Insulated siding costs more'] },
  garage_door: { low: 700, high: 2000, unit: 'installed', tips: ['Insulated doors cost more', 'Smart openers add value', 'Spring replacement is common'] },
  solar: { low: 15000, high: 35000, unit: 'full system', tips: ['Federal tax credit available', 'Get multiple quotes', 'Check local incentives'] },
  bathroom_remodel: { low: 5000, high: 20000, unit: 'full remodel', tips: ['Fixtures are major cost driver', 'Plumbing moves add cost', 'Tile selection matters'] },
  kitchen_remodel: { low: 10000, high: 50000, unit: 'full remodel', tips: ['Cabinets are biggest cost', 'Countertop material varies widely', 'Appliances separate'] },
};

const KEYWORD_MAP: Record<string, string> = {
  faucet: 'faucet',
  tap: 'faucet',
  sink: 'faucet',
  drain: 'drain',
  clog: 'drain',
  toilet: 'toilet',
  commode: 'toilet',
  pipe: 'plumbing',
  plumb: 'plumbing',
  leak: 'plumbing',
  outlet: 'outlet',
  socket: 'outlet',
  'electrical panel': 'panel',
  'breaker box': 'panel',
  'circuit breaker': 'panel',
  electric: 'electrical',
  wiring: 'electrical',
  wire: 'electrical',
  light: 'electrical',
  switch: 'electrical',
  'exterior paint': 'exterior_painting',
  'outside paint': 'exterior_painting',
  'house paint': 'exterior_painting',
  paint: 'painting',
  'ac unit': 'ac_install',
  'air conditioner install': 'ac_install',
  'central air': 'ac_install',
  hvac: 'hvac',
  'air conditioner': 'hvac',
  furnace: 'hvac',
  heating: 'hvac',
  cooling: 'hvac',
  'roof replacement': 'roofing',
  'new roof': 'roofing',
  roofing: 'roofing',
  shingle: 'roofing',
  'roof repair': 'roof_repair',
  'roof leak': 'roof_repair',
  lawn: 'lawn',
  mow: 'lawn',
  grass: 'lawn',
  landscaping: 'landscaping',
  landscape: 'landscaping',
  garden: 'landscaping',
  mulch: 'landscaping',
  clean: 'cleaning',
  maid: 'cleaning',
  housekeeping: 'cleaning',
  moving: 'moving',
  movers: 'moving',
  'oil change': 'oil_change',
  brakes: 'brakes',
  brake: 'brakes',
  'auto repair': 'auto_repair',
  car: 'auto_repair',
  mechanic: 'auto_repair',
  carpet: 'carpet',
  flooring: 'flooring',
  hardwood: 'flooring',
  laminate: 'flooring',
  vinyl: 'flooring',
  window: 'window',
  windows: 'window',
  pest: 'pest',
  termite: 'pest',
  exterminator: 'pest',
  bug: 'pest',
  tree: 'tree',
  stump: 'tree',
  fence: 'fence',
  fencing: 'fence',
  deck: 'deck',
  patio: 'deck',
  drywall: 'drywall',
  sheetrock: 'drywall',
  tile: 'tile',
  tiling: 'tile',
  grout: 'tile',
  // New keywords
  appliance: 'appliance',
  refrigerator: 'appliance',
  washer: 'appliance',
  dryer: 'appliance',
  dishwasher: 'appliance',
  oven: 'appliance',
  microwave: 'appliance',
  'water heater': 'water_heater',
  'hot water': 'water_heater',
  'water tank': 'water_heater',
  insulation: 'insulation',
  'attic insulation': 'insulation',
  concrete: 'concrete',
  driveway: 'concrete',
  sidewalk: 'concrete',
  'patio concrete': 'concrete',
  gutter: 'gutter',
  gutters: 'gutter',
  downspout: 'gutter',
  siding: 'siding',
  'vinyl siding': 'siding',
  'garage door': 'garage_door',
  garage: 'garage_door',
  solar: 'solar',
  'solar panel': 'solar',
  'solar panels': 'solar',
  'bathroom remodel': 'bathroom_remodel',
  'bathroom renovation': 'bathroom_remodel',
  'bath remodel': 'bathroom_remodel',
  'kitchen remodel': 'kitchen_remodel',
  'kitchen renovation': 'kitchen_remodel',
};

const HIGH_COST_CITIES = ['new york', 'nyc', 'san francisco', 'sf', 'los angeles', 'la', 'seattle', 'boston', 'chicago', 'washington dc', 'dc', 'miami', 'denver', 'austin', 'portland'];
const LOW_COST_AREAS = ['rural', 'midwest', 'small town', 'countryside', 'suburb'];

function getLocationMultiplier(location: string): number {
  const loc = location.toLowerCase();
  for (const city of HIGH_COST_CITIES) {
    if (loc.includes(city)) return 1.25;
  }
  for (const area of LOW_COST_AREAS) {
    if (loc.includes(area)) return 0.85;
  }
  return 1.0;
}

function findCategory(description: string): string | null {
  const desc = description.toLowerCase();

  // Check multi-word keywords first (longer matches take priority)
  const sortedKeys = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (desc.includes(keyword)) {
      return KEYWORD_MAP[keyword];
    }
  }
  return null;
}

function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    faucet: 'Faucet Installation',
    drain: 'Drain Cleaning',
    toilet: 'Toilet Installation',
    plumbing: 'Plumbing',
    outlet: 'Electrical Outlet',
    panel: 'Electrical Panel',
    electrical: 'Electrical Work',
    painting: 'Interior Painting',
    exterior_painting: 'Exterior Painting',
    hvac: 'HVAC Repair',
    ac_install: 'AC Installation',
    roofing: 'Roof Replacement',
    roof_repair: 'Roof Repair',
    lawn: 'Lawn Mowing',
    landscaping: 'Landscaping',
    cleaning: 'House Cleaning',
    moving: 'Moving Service',
    oil_change: 'Oil Change',
    brakes: 'Brake Service',
    auto_repair: 'Auto Repair',
    carpet: 'Carpet Installation',
    flooring: 'Flooring Installation',
    window: 'Window Installation',
    pest: 'Pest Control',
    tree: 'Tree Removal',
    fence: 'Fence Installation',
    deck: 'Deck Construction',
    drywall: 'Drywall Repair',
    tile: 'Tile Installation',
    // New categories
    appliance: 'Appliance Repair',
    water_heater: 'Water Heater Installation',
    insulation: 'Insulation',
    concrete: 'Concrete Work',
    gutter: 'Gutter Installation',
    siding: 'Siding Installation',
    garage_door: 'Garage Door Installation',
    solar: 'Solar Panel Installation',
    bathroom_remodel: 'Bathroom Remodel',
    kitchen_remodel: 'Kitchen Remodel',
  };
  return names[category] ?? category;
}

/**
 * Parses a combined text string for a measurement in sq ft or linear ft.
 * Returns the numeric measurement, or null if none found.
 */
export function extractMeasurement(text: string, unit: 'sqft' | 'linearft'): number | null {
  console.log('[extractMeasurement] Parsing text for', unit, ':', text);

  const t = text.toLowerCase();

  if (unit === 'sqft') {
    // Pattern: NxM, N x M, Nft x Mft, N' x M', N'xM', etc.
    const dimPattern = /(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?/i;
    const dimMatch = t.match(dimPattern);
    if (dimMatch) {
      const sqft = parseFloat(dimMatch[1]) * parseFloat(dimMatch[2]);
      console.log('[extractMeasurement] Matched dimension pattern:', dimMatch[0], '→', sqft, 'sq ft');
      return sqft;
    }

    // Pattern: 100 sq ft, 100sqft, 100 square feet, 100 square foot
    const sqftPattern = /(\d+(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|square\s*f(?:eet|oot|t))/i;
    const sqftMatch = t.match(sqftPattern);
    if (sqftMatch) {
      const sqft = parseFloat(sqftMatch[1]);
      console.log('[extractMeasurement] Matched sq ft pattern:', sqftMatch[0], '→', sqft, 'sq ft');
      return sqft;
    }
  }

  if (unit === 'linearft') {
    // Pattern: 50 linear feet, 50 linear ft, 50 lf, 50 lin ft
    const linearPattern = /(\d+(?:\.\d+)?)\s*(?:linear\s*f(?:eet|oot|t)\.?|lin\.?\s*ft\.?|lf\b)/i;
    const linearMatch = t.match(linearPattern);
    if (linearMatch) {
      const lf = parseFloat(linearMatch[1]);
      console.log('[extractMeasurement] Matched linear ft pattern:', linearMatch[0], '→', lf, 'linear ft');
      return lf;
    }

    // Pattern: 50 ft (generic feet, only for linear categories)
    const ftPattern = /(\d+(?:\.\d+)?)\s*(?:ft\.?|feet|foot)\b/i;
    const ftMatch = t.match(ftPattern);
    if (ftMatch) {
      const lf = parseFloat(ftMatch[1]);
      console.log('[extractMeasurement] Matched generic ft pattern:', ftMatch[0], '→', lf, 'linear ft');
      return lf;
    }
  }

  console.log('[extractMeasurement] No measurement found');
  return null;
}

export function analyzeQuote(
  description: string,
  amount: number,
  location: string,
  details: string
): AnalysisResult {
  console.log('[analyzeQuote] Starting analysis', { description, amount, location, details });

  const category = findCategory(description + ' ' + details);
  console.log('[analyzeQuote] Detected category:', category);

  if (!category || !PRICE_RANGES[category]) {
    console.log('[analyzeQuote] No category match — returning uncertain');
    return {
      verdict: 'uncertain',
      confidence: 30,
      estimatedLow: 0,
      estimatedHigh: 0,
      explanation:
        "We couldn't identify a specific service category from your description. Our database covers common home services, auto repair, and more. Try adding more detail about the type of work.",
      tips: [
        'Always get at least 3 quotes for any service',
        'Ask for an itemized breakdown of labor vs. parts',
        'Check contractor reviews on Google or Yelp',
        'Verify licenses and insurance before hiring',
      ],
      category: 'Unknown',
    };
  }

  const range = PRICE_RANGES[category];
  const locationMultiplier = getLocationMultiplier(location);

  // Resolve per-unit ranges by extracting measurement from description + details
  let resolvedLow = range.low;
  let resolvedHigh = range.high;
  let measurementNote = '';

  if (range.perUnit) {
    const combinedText = description + ' ' + details;
    const measurement = extractMeasurement(combinedText, range.perUnit);
    console.log('[analyzeQuote] Per-unit category detected, measurement:', measurement, range.perUnit);

    if (measurement !== null) {
      resolvedLow = range.low * measurement;
      resolvedHigh = range.high * measurement;
      const unitLabel = range.perUnit === 'sqft' ? 'sq ft' : 'linear ft';
      measurementNote = ` for a ${measurement} ${unitLabel} ${formatCategoryName(category).toLowerCase()}`;
      console.log('[analyzeQuote] Scaled range by measurement:', { resolvedLow, resolvedHigh });
    } else {
      // No measurement found — keep per-unit rates but annotate explanation
      const unitLabel = range.perUnit === 'sqft' ? 'per sq ft' : 'per linear ft';
      measurementNote = ` (rate shown is ${unitLabel} — add dimensions for a total estimate)`;
    }
  }

  const adjustedLow = Math.round(resolvedLow * locationMultiplier);
  const adjustedHigh = Math.round(resolvedHigh * locationMultiplier);

  console.log('[analyzeQuote] Price range:', { adjustedLow, adjustedHigh, locationMultiplier });

  let verdict: Verdict;
  let confidence: number;
  let explanation: string;

  const midpoint = (adjustedLow + adjustedHigh) / 2;
  const rangeSpread = adjustedHigh - adjustedLow;
  const buffer = rangeSpread * 0.15;

  const rangeLabel = range.perUnit && !measurementNote.startsWith(' for')
    ? `$${adjustedLow.toLocaleString()}–$${adjustedHigh.toLocaleString()} ${range.perUnit === 'sqft' ? 'per sq ft' : 'per linear ft'}`
    : `$${adjustedLow.toLocaleString()}–$${adjustedHigh.toLocaleString()}`;

  if (amount < adjustedLow - buffer) {
    const howLow = ((adjustedLow - amount) / adjustedLow) * 100;
    if (howLow > 40) {
      verdict = 'uncertain';
      confidence = 55;
      explanation = `This quote is significantly below the typical range of ${rangeLabel} for ${formatCategoryName(category)}${measurementNote}. Prices this low may indicate cut corners, unlicensed work, or a misunderstanding of the scope. Verify what's included before proceeding.`;
    } else {
      verdict = 'underpriced';
      confidence = 70;
      explanation = `This quote is below the typical range of ${rangeLabel} for ${formatCategoryName(category)}${measurementNote}. This could be a great deal, but make sure the contractor is licensed and the quote covers all necessary work.`;
    }
  } else if (amount > adjustedHigh + buffer) {
    const howHigh = ((amount - adjustedHigh) / adjustedHigh) * 100;
    if (howHigh > 50) {
      verdict = 'overpriced';
      confidence = 85;
      explanation = `This quote is well above the typical range of ${rangeLabel} for ${formatCategoryName(category)}${measurementNote}. We strongly recommend getting additional quotes before proceeding.`;
    } else {
      verdict = 'overpriced';
      confidence = 72;
      explanation = `This quote is above the typical range of ${rangeLabel} for ${formatCategoryName(category)}${measurementNote}. Consider negotiating or getting a second opinion — there may be room to reduce the price.`;
    }
  } else {
    const distanceFromMid = Math.abs(amount - midpoint) / (rangeSpread / 2);
    confidence = Math.round(85 - distanceFromMid * 15);
    verdict = 'fair';
    explanation = `This quote falls within the typical range of ${rangeLabel} for ${formatCategoryName(category)}${measurementNote}${location ? ' in your area' : ''}. This appears to be a fair market price.`;
  }

  const tips = [...range.tips];
  if (locationMultiplier > 1.1) {
    tips.push('Prices in your area tend to run higher than national averages');
  } else if (locationMultiplier < 0.9) {
    tips.push('Prices in your area tend to be below national averages');
  }
  if (tips.length < 4) {
    tips.push('Always get a written contract before work begins');
  }

  console.log('[analyzeQuote] Result:', { verdict, confidence });

  return {
    verdict,
    confidence,
    estimatedLow: adjustedLow,
    estimatedHigh: adjustedHigh,
    explanation,
    tips: tips.slice(0, 5),
    category: formatCategoryName(category),
  };
}
