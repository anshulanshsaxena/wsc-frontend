"use client";

import React from "react";
import Link from "next/link";
import { ResortDoc } from "@/hooks/useSearchEngine";
import { extractCoverImage, getLowestPrice } from "@/lib/utils";
import { useFavorites } from "@/context/FavoritesContext";

interface ResortCardProps {
  resort: ResortDoc;
  priceFieldIds: string[];
  onOpenPriceExplanation: (e: React.MouseEvent) => void;
}

export default function ResortCard({
  resort,
  priceFieldIds,
  onOpenPriceExplanation,
}: ResortCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const coverImage = extractCoverImage(resort);
  const isFav = isFavorite(resort.id);

  // 1. Clean Star Rating (Prevents "5 Star Star" duplicates)
  const rawStar = String(resort.core_star_rating || resort.star_rating || "4")
    .replace(/star/gi, "")
    .trim();
  const starRatingDisplay = `${rawStar} Star`;

  // 2. Capacity Range Calculation (rooms * 2 to rooms * 3)
  const roomCount = Number(resort.core_rooms || resort.rooms || 0) || 0;
  const minGuests = roomCount * 2;
  const maxGuests = roomCount * 3;
  const capacityRangeStr = roomCount > 0 ? `${minGuests}-${maxGuests} Guests` : "";

  // 3. Robust Discount Check (Handles string & date-windowed numeric values)
  const getActiveDiscountBadge = (): string | null => {
    const today = new Date().toISOString().split("T")[0];

    const val = resort.value || resort.discount_value || resort.discount || resort.core_discount_value;
    const endDate = resort.endDate || resort.core_offer_end || resort.offer_end;
    const startDate = resort.startDate || resort.core_offer_start || resort.offer_start;

    if (val) {
      if (endDate) {
        const isAfterStart = !startDate || today >= startDate;
        const isBeforeEnd = today <= endDate;
        if (isAfterStart && isBeforeEnd) {
          return `${val}% OFF`;
        }
      } else {
        return `${val}% OFF`;
      }
    }

    if (resort.core_offer) {
      return resort.core_offer;
    }

    return null;
  };

  const activeDiscountBadge = getActiveDiscountBadge();

  // 4. Brand Name
  const brandName = resort.core_brand || resort.brand || "";

  // 5. Feature Badge
  const featureName = resort.core_feature || resort.feature || "";

  // Lowest Cost Per Person Per Day
  const price = getLowestPrice(resort, priceFieldIds);

  const tagColors: Record<string, string> = {
    "Hot Selling": "bg-red-500",
    "Most Demanded": "bg-purple-600",
    "Value for Money": "bg-green-600",
    "Premium Luxury": "bg-black",
  };
  const badgeColor = resort.core_tags ? tagColors[resort.core_tags] || "bg-blue-600" : "";

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/resort/${resort.id}`;
    navigator.clipboard.writeText(url);
    alert("Resort link copied!");
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(resort.id, resort._recordName || resort.name || "Resort");
  };

  return (
    <Link href={`/resort/${resort.id}`}>
      <div className="resort-card bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative flex flex-col cursor-pointer group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
        {/* Marketing Tag Badge */}
        {resort.core_tags && (
          <span
            className={`absolute top-4 left-4 ${badgeColor} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg z-10`}
          >
            {resort.core_tags}
          </span>
        )}

        {/* Share & Heart Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-white shadow-sm transition"
            title="Share"
          >
            <i className="ph-bold ph-share-network"></i>
          </button>

          <button
            onClick={handleHeartClick}
            className="bg-white/90 backdrop-blur w-9 h-9 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition z-10 group/fav"
          >
            <i
              className={`text-lg transition-colors ${
                isFav
                  ? "ph-fill ph-heart text-red-500"
                  : "ph ph-heart text-gray-400 group-hover/fav:text-red-500"
              }`}
            />
          </button>
        </div>

        {/* Cover Image & Badges Overlay */}
        <div className="h-60 w-full overflow-hidden relative bg-gray-100">
          <img
            src={coverImage}
            alt={resort._recordName || resort.name || "Venue"}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

          {/* Image Overlay: Star Rating & Feature */}
          <div className="absolute bottom-4 left-5 text-white flex items-center gap-2 flex-wrap">
            <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
              <i className="ph-fill ph-star text-yellow-400"></i> {starRatingDisplay}
            </span>

            {featureName && (
              <span className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                {featureName}
              </span>
            )}
          </div>

          {/* Offer / Discount Badge */}
{activeDiscountBadge && (
  <div className="absolute top-12 left-4 bg-red-600 text-white text-[10px] uppercase tracking-widest text-center font-black px-2.5 py-1.5 rounded-md shadow-lg animate-pulse z-10">
    {activeDiscountBadge}
  </div>
)}
        </div>

        {/* Card Details Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight mb-1 truncate">
              {resort._recordName || resort.name || "Unnamed Venue"}
            </h2>

            <p className="text-xs text-stone-500 font-semibold flex items-center gap-1">
              <i className="ph-fill ph-map-pin text-stone-400"></i>{" "}
              {resort.core_location || resort.location || "Location Not Set"}
            </p>

            {/* Sleek Minimalist Capacity & Brand Row */}
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-stone-600">
              {capacityRangeStr && (
                <span className="flex items-center gap-1">
                  <i className="ph-fill ph-users text-stone-400 text-xs"></i>
                  {capacityRangeStr}
                </span>
              )}

              {capacityRangeStr && brandName && <span className="text-stone-300">•</span>}

              {brandName && (
                <span className="text-stone-900 font-extrabold uppercase tracking-wider text-[11px]">
                  {brandName}
                </span>
              )}
            </div>
          </div>

          {/* Pricing Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                  Cost Per Person Per Day
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenPriceExplanation(e);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none inline-flex items-center shrink-0"
                  title="What does this mean?"
                >
                  <i className="ph-bold ph-info text-xs"></i>
                </button>
              </div>
              <p className="text-lg md:text-xl font-black text-black truncate leading-none">
                {price ? (
                  <>
                    ₹{price.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-0.5 inline-block">
                      + GST
                    </span>
                  </>
                ) : (
                  "Get Quote"
                )}
              </p>
            </div>

            <div className="bg-gray-100 text-black font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shadow-sm shrink-0">
              <i className="ph-bold ph-arrow-right text-base"></i>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}