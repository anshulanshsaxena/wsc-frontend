import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeHTML(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Exact cover image extraction algorithm from original index.html
export function extractCoverImage(data: any): string {
  if (!data) return "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800";

  for (let key in data) {
    if (typeof data[key] === "string" && data[key].includes("firebasestorage.googleapis.com")) {
      return data[key].split(", ")[0];
    }
  }
  return "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800";
}

// Exact price calculation algorithm from original index.html
export function getLowestPrice(resortData: any, priceFieldIds: string[] = []): number | null {
  if (!resortData) return null;
  let prices: number[] = [];

  for (let key in resortData) {
    if (priceFieldIds.length > 0) {
      if (priceFieldIds.some((id) => key.includes(id))) {
        let num = parseFloat(resortData[key]);
        if (!isNaN(num) && num > 0) prices.push(num);
      }
    } else {
      if (key.includes("calc_base_price") || key.includes("price") || key.includes("cost")) {
        let num = parseFloat(resortData[key]);
        if (!isNaN(num) && num > 0) prices.push(num);
      }
    }
  }

  if (prices.length > 0) return Math.min(...prices);
  return null;
}