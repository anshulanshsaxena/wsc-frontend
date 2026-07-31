import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

export interface ResortDetails {
  id: string;
  _recordName?: string;
  core_name?: string;
  core_location?: string;
  location?: string;
  core_rooms?: number | string;
  rooms?: number;
  core_star_rating?: string;
  star_rating?: string;
  core_expert_rating?: string;
  core_brand?: string;
  brand?: string;
  core_feature?: string;
  feature?: string;
  core_offer?: string;
  core_address?: string;
  core_geolocation?: string;
  core_calendar?: any[];
  tour_360_scenes?: any[];
  [key: string]: any;
}

// Server-side fetch helper for Next.js Metadata & Page SSR
export async function getResortDataServer(resortId: string): Promise<ResortDetails | null> {
  try {
    const docRef = doc(db, "resort_data", resortId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ResortDetails;
    }

    // Fallback search
    const q = query(collection(db, "resort_data"), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      return { id: d.id, ...d.data() } as ResortDetails;
    }

    return null;
  } catch (err) {
    console.error("Error fetching resort data server-side:", err);
    return null;
  }
}