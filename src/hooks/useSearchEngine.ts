import { useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLowestPrice } from "@/lib/utils";
import { getPriceFieldIds } from "@/lib/sortingsEngine";

export interface ResortDoc {
  id: string;
  core_hidden?: boolean;
  core_location?: string;
  location?: string;
  core_rooms?: number;
  rooms?: number;
  core_star_rating?: string;
  core_brand?: string;
  core_feature?: string;
  core_tags?: string;
  core_offer?: string;
  core_expert_rating?: string;
  [key: string]: any;
}

export const PRICE_RANGES = [
  { min: 4000, max: 6000, label: "₹4,000 - ₹6,000" },
  { min: 6000, max: 8000, label: "₹6,000 - ₹8,000" },
  { min: 8000, max: 10000, label: "₹8,000 - ₹10,000" },
  { min: 10000, max: 12000, label: "₹10,000 - ₹12,000" },
  { min: 12000, max: 15000, label: "₹12,000 - ₹15,000" },
  { min: 15000, max: 999999, label: "₹15,000+" },
];

export const ROOM_RANGES = [
  { min: 0, max: 25, label: "0 - 25 Rooms" },
  { min: 25, max: 50, label: "25 - 50 Rooms" },
  { min: 50, max: 75, label: "50 - 75 Rooms" },
  { min: 75, max: 100, label: "75 - 100 Rooms" },
  { min: 100, max: 150, label: "100 - 150 Rooms" },
  { min: 150, max: 999999, label: "150+ Rooms" },
];

function safeNum(val: any, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseInt(val.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function extractDiscountVal(offerStr: string): number {
  if (!offerStr) return 0;
  const match = String(offerStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function useSearchEngine() {
  const [allResorts, setAllResorts] = useState<ResortDoc[]>([]);
  const [priceFieldIds, setPriceFieldIds] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search Results Pool
  const [baseSearchResults, setBaseSearchResults] = useState<ResortDoc[]>([]);

  // Filter States
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedStars, setSelectedStars] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [marketingTag, setMarketingTag] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("");

  // Load Firestore resorts database
  const loadDatabase = async () => {
    if (isDataLoaded) return;
    setIsSearching(true);
    try {
      const priceIds = await getPriceFieldIds();
      setPriceFieldIds(priceIds);

      const snap = await getDocs(collection(db, "resort_data"));
      const list: ResortDoc[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (!data.core_hidden) {
          list.push({ id: d.id, ...data });
        }
      });
      setAllResorts(list);
      setIsDataLoaded(true);
    } catch (err) {
      console.error("Error loading search database:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Core 3-Rule Search Matching Engine
  const runSearch = async (
    queryTerm: string,
    guestsCount: number,
    roomsCount: number,
    searchType: "resort" | "location" | "general" | null,
    selectedItem?: any
  ) => {
    setIsSearching(true);
    let pool = allResorts;

    if (!isDataLoaded) {
      const priceIds = await getPriceFieldIds();
      setPriceFieldIds(priceIds);

      const snap = await getDocs(collection(db, "resort_data"));
      const list: ResortDoc[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (!data.core_hidden) {
          list.push({ id: d.id, ...data });
        }
      });
      pool = list;
      setAllResorts(list);
      setIsDataLoaded(true);
    }

    const rawTerm = queryTerm.toLowerCase().trim();
    let matches: ResortDoc[] = [];

    // Rule 1: Specific Resort Search + Companion Resorts
    if (searchType === "resort" && selectedItem) {
      const targetId = selectedItem.id;
      const targetResort = pool.find((r) => r.id === targetId);

      if (targetResort) {
        const targetRooms = safeNum(targetResort.core_rooms || targetResort.rooms, 0);
        const targetLoc = (targetResort.core_location || targetResort.location || "").toLowerCase().trim();

        const companions = pool.filter((r) => {
          if (r.id === targetId) return false;
          const cLoc = (r.core_location || r.location || "").toLowerCase().trim();
          const cRooms = safeNum(r.core_rooms || r.rooms, 0);
          return cLoc === targetLoc && cRooms >= targetRooms - 20 && cRooms <= targetRooms + 20;
        });

        matches = [targetResort, ...companions];
      }
    }
    // Rule 2 & Rule 3: Location Search with Guests or Rooms
    else {
      // Rule 2: Location + Guest Count
      if (guestsCount > 0) {
        const reqRooms = Math.ceil(guestsCount / 3);
        const minRooms = reqRooms - 5;

        matches = pool.filter((r) => {
          const rLoc = (r.core_location || r.location || "").toLowerCase().trim();
          const rRooms = safeNum(r.core_rooms || r.rooms, 0);
          return (rLoc.includes(rawTerm) || rawTerm.includes(rLoc)) && rRooms >= minRooms;
        });
      }
      // Rule 3: Location + Room Count
      else if (roomsCount > 0) {
        matches = pool.filter((r) => {
          const rLoc = (r.core_location || r.location || "").toLowerCase().trim();
          const rRooms = safeNum(r.core_rooms || r.rooms, 0);
          return (
            (rLoc.includes(rawTerm) || rawTerm.includes(rLoc)) &&
            rRooms >= roomsCount - 10 &&
            rRooms <= roomsCount + 10
          );
        });
      }
      // Fallback: General location match
      else {
        matches = pool.filter((r) => {
          const rLoc = (r.core_location || r.location || "").toLowerCase().trim();
          const rName = (r._recordName || r.name || "").toLowerCase().trim();
          return rLoc.includes(rawTerm) || rName.includes(rawTerm);
        });
      }
    }

    setBaseSearchResults(matches);
    setIsSearching(false);
  };

  // Filter & Sort Application
  const filteredAndSortedResorts = useMemo(() => {
    let result = baseSearchResults.filter((resort) => {
      const resortPrice = getLowestPrice(resort, priceFieldIds);
      const resortRooms = safeNum(resort.core_rooms, 0);
      const resortLoc = String(resort.core_location || "").trim().toLowerCase();
      const resortStar = String(resort.core_star_rating || "").trim().toLowerCase();
      const resortBrand = String(resort.core_brand || "").trim().toLowerCase();
      const resortFeature = String(resort.core_feature || "").trim().toLowerCase();
      const resortTag = String(resort.core_tags || "").trim().toLowerCase();

      // 1. Price Ranges Filter
      if (selectedPriceRanges.size > 0) {
        let matchesPrice = false;
        selectedPriceRanges.forEach((key) => {
          const [min, max] = key.split("_").map(Number);
          const numPrice = typeof resortPrice === "number" ? resortPrice : 0;
          if (numPrice >= min && numPrice <= max) matchesPrice = true;
        });
        if (!matchesPrice) return false;
      }

      // 2. Location Filter
      if (selectedLocations.size > 0 && !selectedLocations.has(resortLoc)) return false;

      // 3. Star Rating Filter
      if (selectedStars.size > 0 && !selectedStars.has(resortStar)) return false;

      // 4. Brand Filter
      if (selectedBrands.size > 0 && !selectedBrands.has(resortBrand)) return false;

      // 5. Feature Filter
      if (selectedFeatures.size > 0 && !selectedFeatures.has(resortFeature)) return false;

      // 6. Rooms Filter
      if (selectedRooms.size > 0) {
        let matchesRoom = false;
        selectedRooms.forEach((key) => {
          const [min, max] = key.split("_").map(Number);
          if (resortRooms >= min && resortRooms <= max) matchesRoom = true;
        });
        if (!matchesRoom) return false;
      }

      // 7. Marketing Tag Pill
      if (marketingTag && resortTag !== marketingTag.toLowerCase()) return false;

      return true;
    });

    // Safe Sorting
    if (sortOption === "price_low_high") {
      result.sort((a, b) => safeNum(getLowestPrice(a, priceFieldIds), 999999) - safeNum(getLowestPrice(b, priceFieldIds), 999999));
    } else if (sortOption === "price_high_low") {
      result.sort((a, b) => safeNum(getLowestPrice(b, priceFieldIds), 0) - safeNum(getLowestPrice(a, priceFieldIds), 0));
    } else if (sortOption === "discount_high_low") {
      result.sort((a, b) => extractDiscountVal(b.core_offer) - extractDiscountVal(a.core_offer));
    } else if (sortOption === "discount_low_high") {
      result.sort((a, b) => extractDiscountVal(a.core_offer) - extractDiscountVal(b.core_offer));
    } else if (sortOption === "rooms_high_low") {
      result.sort((a, b) => safeNum(b.core_rooms, 0) - safeNum(a.core_rooms, 0));
    } else if (sortOption === "rooms_low_high") {
      result.sort((a, b) => safeNum(a.core_rooms, 0) - safeNum(b.core_rooms, 0));
    }

    return result;
  }, [
    baseSearchResults,
    priceFieldIds,
    selectedPriceRanges,
    selectedLocations,
    selectedStars,
    selectedBrands,
    selectedFeatures,
    selectedRooms,
    marketingTag,
    sortOption,
  ]);

  const clearAllFilters = () => {
    setSelectedPriceRanges(new Set());
    setSelectedLocations(new Set());
    setSelectedStars(new Set());
    setSelectedBrands(new Set());
    setSelectedFeatures(new Set());
    setSelectedRooms(new Set());
    setMarketingTag("");
    setSortOption("");
  };

  const totalActiveFilterCount =
    selectedPriceRanges.size +
    selectedLocations.size +
    selectedStars.size +
    selectedBrands.size +
    selectedFeatures.size +
    selectedRooms.size;

  return {
    allResorts,
    baseSearchResults,
    filteredResorts: filteredAndSortedResorts,
    isSearching,
    loadDatabase,
    runSearch,
    priceFieldIds,

    // Filter state getters and setters
    selectedPriceRanges,
    setSelectedPriceRanges,
    selectedLocations,
    setSelectedLocations,
    selectedStars,
    setSelectedStars,
    selectedBrands,
    setSelectedBrands,
    selectedFeatures,
    setSelectedFeatures,
    selectedRooms,
    setSelectedRooms,
    marketingTag,
    setMarketingTag,
    sortOption,
    setSortOption,
    clearAllFilters,
    totalActiveFilterCount,
  };
}