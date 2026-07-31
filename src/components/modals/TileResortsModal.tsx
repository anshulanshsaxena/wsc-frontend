"use client";

import React from "react";
import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";
import { extractCoverImage, getLowestPrice } from "@/lib/utils";

interface TileResortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  heading: string;
  resorts: any[];
  priceFieldIds?: string[];
  onOpenPriceModal?: () => void;
}

export default function TileResortsModal({
  isOpen,
  onClose,
  category,
  heading,
  resorts,
  priceFieldIds = [],
  onOpenPriceModal,
}: TileResortsModalProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-black text-[#780522] uppercase tracking-widest block mb-0.5">
            {category}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
            {heading}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition"
        >
          <i className="ph-bold ph-x text-lg"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {resorts.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100">
              <i className="ph-bold ph-magnifying-glass text-4xl text-gray-200 mb-2"></i>
              <h3 className="text-lg font-black text-gray-900">No Resorts Found</h3>
              <p className="text-xs text-gray-500">
                We couldn't locate any properties fitting these specific guidelines right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resorts.map((resort) => {
                const coverImage = extractCoverImage(resort);
                const isFav = isFavorite(resort.id);

                // Clean Star Rating
                const rawStar = String(resort.core_star_rating || resort.star_rating || "4")
                  .replace(/star/gi, "")
                  .trim();
                const starRatingDisplay = `${rawStar} Star`;

                // Capacity Range
                const roomCount = parseInt(resort.core_rooms || resort.rooms || 0) || 0;
                const minGuests = roomCount * 2;
                const maxGuests = roomCount * 3;
                const capacityRangeStr = roomCount > 0 ? `${minGuests}-${maxGuests} Guests` : "";

                // Discount Check
                const today = new Date().toISOString().split("T")[0];
                const val = resort.value || resort.discount_value || resort.discount || resort.core_discount_value;
                const endDate = resort.endDate || resort.core_offer_end || resort.offer_end;
                const startDate = resort.startDate || resort.core_offer_start || resort.offer_start;

                let activeDiscountBadge: string | null = null;
                if (val) {
                  if (endDate) {
                    const isAfterStart = !startDate || today >= startDate;
                    const isBeforeEnd = today <= endDate;
                    if (isAfterStart && isBeforeEnd) {
                      activeDiscountBadge = `${val}% OFF`;
                    }
                  } else {
                    activeDiscountBadge = `${val}% OFF`;
                  }
                } else if (resort.core_offer) {
                  activeDiscountBadge = resort.core_offer;
                }

                // Brand Name & Feature
                const brandName = resort.core_brand || resort.brand || "";
                const featureName = resort.core_feature || resort.feature || "";

                const price = getLowestPrice(resort, priceFieldIds);

                return (
                  <div
                    key={resort.id}
                    className="bg-white rounded-[24px] overflow-hidden border border-gray-150 shadow-sm relative flex flex-col cursor-pointer group hover:shadow-md transition"
                  >
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/resort/${resort.id}`;
                          navigator.clipboard.writeText(url);
                          alert("Resort link copied!");
                        }}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-700 hover:text-black shadow-sm transition"
                      >
                        <i className="ph-bold ph-share-network"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(resort.id);
                        }}
                        className="bg-white/90 backdrop-blur w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition z-10 group/fav"
                      >
                        <i
                          className={`text-base transition-colors ${
                            isFav ? "ph-fill ph-heart text-red-500" : "ph ph-heart text-gray-400 group-hover/fav:text-red-500"
                          }`}
                        />
                      </button>
                    </div>

                    <Link href={`/resort/${resort.id}`}>
                      <div className="h-52 w-full overflow-hidden relative bg-gray-100">
                        <img
                          src={coverImage}
                          alt={resort._recordName || "Venue"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        <div className="absolute bottom-4 left-4 text-white flex items-center gap-2 flex-wrap">
                          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm flex items-center gap-1">
                            <i className="ph-fill ph-star text-yellow-400"></i> {starRatingDisplay}
                          </span>

                          {featureName && (
                            <span className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                              {featureName}
                            </span>
                          )}
                        </div>

                        {activeDiscountBadge && (
                          <div className="absolute bottom-4 right-4 bg-red-600 text-white text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded animate-pulse">
                            {activeDiscountBadge}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h2 className="text-lg font-black text-gray-900 leading-tight mb-1 truncate">
                            {resort._recordName || resort.name || "Unnamed Venue"}
                          </h2>
                          <p className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                            <i className="ph-fill ph-map-pin text-stone-400"></i>{" "}
                            {resort.core_location || resort.location || "Location Not Set"}
                          </p>

                          {/* Sleek Capacity & Brand Row */}
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

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-0.5">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                Cost Per Person Per Day
                              </p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenPriceModal?.();
                                }}
                                className="text-[#780522] hover:text-red-800 focus:outline-none transition-colors inline-flex items-center"
                              >
                                <i className="ph-bold ph-info text-xs"></i>
                              </button>
                            </div>
                            <p className="text-base font-black text-black truncate leading-none">
                              {price ? (
                                <>
                                  ₹{price.toLocaleString("en-IN")}{" "}
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                    + GST
                                  </span>
                                </>
                              ) : (
                                "Get Quote"
                              )}
                            </p>
                          </div>
                          <button className="bg-gray-100 text-black font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                            <i className="ph-bold ph-arrow-right text-base"></i>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}