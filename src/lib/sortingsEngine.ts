import { db } from "./firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export interface SortingTileData {
  id: string;
  label: string;
  image?: string;
  assignedResortIds?: string[];
}

export interface SortingSectionData {
  id: string;
  heading: string;
  description?: string;
  sequence: number;
  shapeType: "circular" | "square" | "horizontal" | "vertical";
  tiles: SortingTileData[];
}

export interface ResortData {
  id: string;
  core_hidden?: boolean;
  [key: string]: any;
}

// Pre-compile cost calculation field IDs
export async function getPriceFieldIds(): Promise<string[]> {
  try {
    const schemaSnap = await getDoc(doc(db, "schemas", "resort_schema"));
    const priceIds: string[] = [];
    if (schemaSnap.exists()) {
      const structure = schemaSnap.data().structure || [];
      const digForPrices = (arr: any[]) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((item) => {
          if (item.type === "field" && item.calcTag === "calc_base_price") {
            if (!priceIds.includes(item.id)) priceIds.push(item.id);
          }
          if (item.items) digForPrices(item.items);
        });
      };
      digForPrices(structure);
    }
    return priceIds;
  } catch (err) {
    console.error("Error fetching price field IDs:", err);
    return [];
  }
}

// Fetch sorted homepage sections
export async function fetchHomepageSortings(): Promise<SortingSectionData[]> {
  try {
    const snap = await getDocs(collection(db, "homepage_sortings"));
    const sections: SortingSectionData[] = [];
    snap.forEach((docSnap) => {
      sections.push({ id: docSnap.id, ...docSnap.data() } as SortingSectionData);
    });
    return sections.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  } catch (err) {
    console.error("Error fetching homepage sortings:", err);
    return [];
  }
}