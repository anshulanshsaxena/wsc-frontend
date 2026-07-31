export interface PricingTier {
  min: number;
  max: number;
  price: number;
}

export interface CalendarRule {
  startDate?: string;
  endDate?: string;
  adjustmentType?: string;
  value?: number | string;
}

export interface SelectedItem {
  id: string;
  name: string;
  qty: number;
  rule: string;
  category: string;
}

export interface PlannerQuote {
  plannerId: string;
  plannerName: string;
  instaUrl: string;
  logoUrl: string;
  plannerImage: string;
  plannerTotal: number;
  resortTotal: number;
  grandTotal: number;
}

export interface QuoteCalculationResult {
  quotes: PlannerQuote[];
  totalResortCost: number;
  totalResortStayCost: number;
  resortFlatFee: number;
  daysDiff: number;
  guests: number;
  eventsCount: number;
}

/**
 * Gets per-guest base price according to guest count tiers
 */
export function getPriceForGuestCount(guests: number, pricingTiers: PricingTier[], defaultBasePrice: number = 0): number {
  if (guests === 0 || !pricingTiers || pricingTiers.length === 0) return defaultBasePrice;
  const matchingTier = pricingTiers.find(t => guests >= t.min && guests <= t.max);
  return matchingTier ? matchingTier.price : defaultBasePrice;
}

/**
 * Extracts resort pricing tiers from Firestore raw document and schema definition
 */
export function extractResortPricingTiers(dbData: Record<string, any>, schemaStructure: any[]): PricingTier[] {
  const tiers: PricingTier[] = [];
  if (!dbData || !schemaStructure) return tiers;

  function extractTiers(nodes: any[]) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach(node => {
      if (node.type === 'subcategory' && node.items) {
        let minId: string | undefined;
        let maxId: string | undefined;
        let priceId: string | undefined;

        node.items.forEach((sub: any) => {
          if (sub.calcTag === 'cond_min_guest' || sub.calcTag === 'condition:minimum guest') minId = sub.id;
          if (sub.calcTag === 'cond_max_guest' || sub.calcTag === 'condition:maximum guest') maxId = sub.id;
          if (sub.calcTag === 'calc_base_price' || sub.calcTag === 'condition:multiply by guest') priceId = sub.id;
        });

        if (minId && maxId && priceId) {
          Object.keys(dbData).forEach(key => {
            if (key.startsWith(priceId!)) {
              const suffix = key.replace(priceId!, '');
              tiers.push({
                min: Number(dbData[minId! + suffix] || 0),
                max: Number(dbData[maxId! + suffix] || 99999),
                price: Number(dbData[priceId! + suffix] || 0)
              });
            }
          });
        }
      }
      if (node.items) extractTiers(node.items);
    });
  }

  extractTiers(schemaStructure);
  return tiers;
}

/**
 * Calculates base price of a resort for comparison / similar resort widgets
 */
export function getResortBasePrice(resortData: Record<string, any>, schemaStructure: any[]): number {
  const tiers = extractResortPricingTiers(resortData, schemaStructure);
  return tiers.length > 0 ? Math.min(...tiers.map(t => t.price)) : 0;
}

/**
 * Extracts cover/thumbnail image URL from Firestore document data
 */
export function extractCoverImage(data: Record<string, any>): string {
  if (!data) return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800';
  for (const key in data) {
    if (typeof data[key] === 'string' && data[key].includes('firebasestorage.googleapis.com')) {
      return data[key].split(', ')[0];
    }
  }
  return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800';
}

/**
 * Calculates quotes across all planners for given stay dates, guest count, and decor items
 */
export function calculateQuoteResults(params: {
  checkInVal: string;
  checkOutVal: string;
  guests: number;
  eventsCount: number;
  pricingTiers: PricingTier[];
  calendarRules: CalendarRule[];
  dbDataGlobal: Record<string, any>;
  resortPlannersPricing: Record<string, any>[];
  plannerProfiles: Record<string, any>;
  selectedItems: SelectedItem[];
}): QuoteCalculationResult {
  const {
    checkInVal,
    checkOutVal,
    guests = 150,
    eventsCount = 1,
    pricingTiers = [],
    calendarRules = [],
    dbDataGlobal = {},
    resortPlannersPricing = [],
    plannerProfiles = {},
    selectedItems = []
  } = params;

  if (!checkInVal || !checkOutVal) {
    return {
      quotes: [],
      totalResortCost: 0,
      totalResortStayCost: 0,
      resortFlatFee: 0,
      daysDiff: 1,
      guests,
      eventsCount
    };
  }

  const checkIn = new Date(checkInVal);
  const checkOut = new Date(checkOutVal);
  const daysDiff = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  const activePerPersonCost = getPriceForGuestCount(guests, pricingTiers, 0);

  let totalResortStayCost = 0;
  for (let i = 0; i < daysDiff; i++) {
    const dateObj = new Date(checkIn);
    dateObj.setDate(checkIn.getDate() + i);
    let finalDaily = activePerPersonCost;

    calendarRules.forEach(rule => {
      if (rule.startDate && rule.endDate) {
        const sRaw = String(rule.startDate).split('T')[0].replace(/\//g, '-').trim();
        const eRaw = String(rule.endDate).split('T')[0].replace(/\//g, '-').trim();
        const sParts = sRaw.split('-');
        const eParts = eRaw.split('-');
        if (sParts.length === 3 && eParts.length === 3) {
          const sD = new Date(parseInt(sParts[0]), parseInt(sParts[1]) - 1, parseInt(sParts[2]), 0, 0, 0);
          const eD = new Date(parseInt(eParts[0]), parseInt(eParts[1]) - 1, parseInt(eParts[2]), 23, 59, 59);
          if (dateObj >= sD && dateObj <= eD && rule.adjustmentType === 'discount_percent') {
            finalDaily -= (finalDaily * (parseFloat(String(rule.value || 0)) / 100));
          }
        }
      }
    });
    totalResortStayCost += (finalDaily * guests);
  }

  const rawFlatFee = dbDataGlobal['id_8rypjw0pr'] || "0";
  const resortFlatFee = Number(rawFlatFee.toString().replace(/,/g, '').replace(/[^0-9.]/g, '')) || 0;
  const totalResortCost = totalResortStayCost + resortFlatFee;

  const generatedQuotes: PlannerQuote[] = [];

  resortPlannersPricing.forEach(pricingData => {
    let plannerCost = Number(pricingData.core_base_decor_3_events) || 0;
    if (eventsCount > 3) {
      plannerCost += (eventsCount - 3) * (Number(pricingData.core_addon_decor_per_event) || 0);
    }

    selectedItems.forEach(item => {
      const itemPrice = parseFloat(pricingData[item.id]) || 0;
      const ruleStr = (item.rule || '').toLowerCase();
      const qty = item.qty || 1;

      if (ruleStr.includes('flat') || ruleStr.includes('bundle')) plannerCost += itemPrice;
      else if (ruleStr === 'per_person') plannerCost += (itemPrice * guests);
      else if (ruleStr === 'per_person_event') plannerCost += (itemPrice * guests * eventsCount);
      else if (ruleStr === 'per_person_day') plannerCost += (itemPrice * guests * daysDiff);
      else if (ruleStr.includes('qty') && ruleStr.includes('event')) plannerCost += (itemPrice * qty * eventsCount);
      else if (ruleStr.includes('qty') && ruleStr.includes('day')) plannerCost += (itemPrice * qty * daysDiff);
      else if (ruleStr.includes('qty') || ruleStr.includes('quant') || ruleStr.includes('unit')) plannerCost += (itemPrice * qty);
      else if (ruleStr.includes('item') && !ruleStr.includes('person')) plannerCost += (itemPrice * qty);
    });

    const profile = plannerProfiles[pricingData.plannerId] || {};
    const plannerImage = profile.core_portfolio 
      ? (Array.isArray(profile.core_portfolio) ? profile.core_portfolio[0] : profile.core_portfolio) 
      : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80";

    generatedQuotes.push({
      plannerId: pricingData.plannerId || "UNKNOWN",
      plannerName: profile._recordName || pricingData.plannerName || "Wedding Planner",
      instaUrl: profile.core_insta || "#",
      logoUrl: profile.core_logo || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
      plannerImage,
      plannerTotal: plannerCost,
      resortTotal: totalResortCost,
      grandTotal: plannerCost + totalResortCost
    });
  });

  generatedQuotes.sort((a, b) => b.grandTotal - a.grandTotal);

  return {
    quotes: generatedQuotes,
    totalResortCost,
    totalResortStayCost,
    resortFlatFee,
    daysDiff,
    guests,
    eventsCount
  };
}