import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where, setDoc } from "firebase/firestore";

export interface WizardItem {
  id: string;
  name: string;
  pricingRule: string;
  thumbnail?: string;
  items?: WizardItem[];
}

export interface CatalogGroup {
  name: string;
  items: WizardItem[];
}

export interface SelectedItemState {
  checked: boolean;
  qty: number;
}

export interface SelectedBudgetItem {
  id: string;
  name: string;
  qty: number;
  rule: string;
  category: string;
}

export interface GeneratedQuote {
  plannerId: string;
  plannerName: string;
  instaUrl: string;
  logoUrl: string;
  plannerImage: string;
  plannerTotal: number;
  resortTotal: number;
  grandTotal: number;
}

// Fetch Master Catalog Schema
export async function fetchMasterCatalog(): Promise<CatalogGroup[]> {
  try {
    const snap = await getDoc(doc(db, "schemas", "master_catalog_schema"));
    if (snap.exists()) {
      return snap.data().structure || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching master catalog schema:", err);
    return [];
  }
}

// Fetch Planner Pricing for Resort
export async function fetchPlannerPricing(resortId: string) {
  try {
    const q = query(collection(db, "resort_planner_pricing"), where("resortId", "==", resortId));
    const snap = await getDocs(q);
    const pricingList: any[] = [];
    const plannerProfiles: Record<string, any> = {};

    for (const d of snap.docs) {
      const data = d.data();
      pricingList.push(data);

      if (data.plannerId && !plannerProfiles[data.plannerId]) {
        const pSnap = await getDoc(doc(db, "planner_data", data.plannerId));
        if (pSnap.exists()) {
          plannerProfiles[data.plannerId] = pSnap.data();
        }
      }
    }

    return { pricingList, plannerProfiles };
  } catch (err) {
    console.error("Error fetching planner pricing:", err);
    return { pricingList: [], plannerProfiles: {} };
  }
}

// Calculation Engine
export function calculateWeddingQuotes(
  resortData: any,
  checkInStr: string,
  checkOutStr: string,
  guests: number,
  selectedEventsCount: number,
  itemSelectionsState: Record<string, SelectedItemState>,
  catalogItems: WizardItem[],
  pricingList: any[],
  plannerProfiles: Record<string, any>
): { quotes: GeneratedQuote[]; selectedItems: SelectedBudgetItem[] } {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const daysDiff = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

  const basePerPerson = 12900;
  let totalStayCost = 0;

  const calendarRules = resortData.core_calendar || [];

  for (let i = 0; i < daysDiff; i++) {
    const dateObj = new Date(checkIn);
    dateObj.setDate(checkIn.getDate() + i);
    let dailyPrice = basePerPerson;

    calendarRules.forEach((rule: any) => {
      if (rule.startDate && rule.endDate) {
        const sD = new Date(rule.startDate);
        const eD = new Date(rule.endDate);
        if (dateObj >= sD && dateObj <= eD && rule.value) {
          dailyPrice -= dailyPrice * (parseFloat(rule.value) / 100);
        }
      }
    });

    totalStayCost += dailyPrice * guests;
  }

  const flatFee = parseFloat(resortData.id_8rypjw0pr || "0") || 0;
  const totalResortCost = totalStayCost + flatFee;

  const quotes: GeneratedQuote[] = [];

  pricingList.forEach((pricing) => {
    let plannerCost = Number(pricing.core_base_decor_3_events) || 0;
    if (selectedEventsCount > 3) {
      plannerCost += (selectedEventsCount - 3) * (Number(pricing.core_addon_decor_per_event) || 0);
    }

    Object.keys(itemSelectionsState).forEach((itemId) => {
      const state = itemSelectionsState[itemId];
      if (state && (state.checked || state.qty > 0)) {
        const itemPrice = parseFloat(pricing[itemId]) || 0;
        const itemObj = catalogItems.find((ci) => ci.id === itemId);
        const ruleStr = (itemObj?.pricingRule || "").toLowerCase();
        const qty = state.qty || 1;

        if (ruleStr.includes("flat") || ruleStr.includes("bundle")) plannerCost += itemPrice;
        else if (ruleStr === "per_person") plannerCost += itemPrice * guests;
        else if (ruleStr === "per_person_event") plannerCost += itemPrice * guests * selectedEventsCount;
        else if (ruleStr === "per_person_day") plannerCost += itemPrice * guests * daysDiff;
        else if (ruleStr.includes("qty") && ruleStr.includes("event")) plannerCost += itemPrice * qty * selectedEventsCount;
        else if (ruleStr.includes("qty") && ruleStr.includes("day")) plannerCost += itemPrice * qty * daysDiff;
        else if (ruleStr.includes("qty") || ruleStr.includes("unit")) plannerCost += itemPrice * qty;
        else plannerCost += itemPrice * qty;
      }
    });

    const profile = plannerProfiles[pricing.plannerId] || {};
    const plannerImage = profile.core_portfolio
      ? Array.isArray(profile.core_portfolio)
        ? profile.core_portfolio[0]
        : profile.core_portfolio
      : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80";

    quotes.push({
      plannerId: String(pricing.plannerId || "UNKNOWN"),
      plannerName: String(profile._recordName || pricing.plannerName || "Wedding Planner"),
      instaUrl: String(profile.core_insta || "#"),
      logoUrl: String(profile.core_logo || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80"),
      plannerImage: String(plannerImage),
      plannerTotal: Number(plannerCost) || 0,
      resortTotal: Number(totalResortCost) || 0,
      grandTotal: Number(plannerCost + totalResortCost) || 0,
    });
  });

  if (quotes.length === 0) {
    quotes.push({
      plannerId: "DEFAULT",
      plannerName: "Standard Resort Package",
      instaUrl: "#",
      logoUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80",
      plannerImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80",
      plannerTotal: 0,
      resortTotal: Number(totalResortCost) || 0,
      grandTotal: Number(totalResortCost) || 0,
    });
  }

  // Extract selected items array for Firestore persistence
  const selectedItems: SelectedBudgetItem[] = [];
  Object.keys(itemSelectionsState).forEach((itemId) => {
    const state = itemSelectionsState[itemId];
    if (state && (state.checked || state.qty > 0)) {
      const itemObj = catalogItems.find((ci) => ci.id === itemId);
      selectedItems.push({
        id: itemId,
        name: itemObj?.name || "Selected Item",
        qty: state.qty || 1,
        rule: itemObj?.pricingRule || "flat",
        category: "GENERAL REQUIREMENTS",
      });
    }
  });

  return {
    quotes: quotes.sort((a, b) => a.grandTotal - b.grandTotal),
    selectedItems,
  };
}

// Save Budget to Firestore (Includes selectedItems array)
export async function saveBudgetToFirestore(
  user: any,
  resortId: string,
  resortName: string,
  resortLocation: string,
  guests: number,
  days: number,
  checkIn: string,
  checkOut: string,
  rooms: number,
  eventsCount: number,
  quotes: GeneratedQuote[],
  selectedItems: SelectedBudgetItem[] = []
) {
  if (!user || !user.uid) return false;

  try {
    const sanitizedQuotes = (quotes || []).map((q) => ({
      plannerName: String(q.plannerName || "Wedding Planner"),
      instaUrl: String(q.instaUrl || "#"),
      logoUrl: String(q.logoUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80"),
      plannerImage: String(q.plannerImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80"),
      plannerTotal: Number(q.plannerTotal) || 0,
      resortTotal: Number(q.resortTotal) || 0,
      grandTotal: Number(q.grandTotal) || 0,
    }));

    const budgetData = {
      userId: String(user.uid),
      resortId: String(resortId || "UNKNOWN"),
      resortName: String(resortName || "Luxury Resort"),
      resortLocation: String(resortLocation || "India"),
      guests: Number(guests) || 150,
      days: Number(days) || 2,
      checkInDate: String(checkIn || ""),
      checkOutDate: String(checkOut || ""),
      rooms: Number(rooms) || 0,
      functions: Number(eventsCount) || 1,
      selectedItems: selectedItems || [], // Persisted selected items array!
      quotes: sanitizedQuotes,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "saved_budgets", `${user.uid}_${resortId}`), budgetData);
    console.log("Budget and selected items saved successfully to Firestore!");
    return true;
  } catch (err) {
    console.error("Error saving budget to Firestore:", err);
    return false;
  }
}