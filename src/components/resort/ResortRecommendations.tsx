"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { extractCoverImage, getLowestPrice } from "@/lib/utils";

interface ResortRecommendationsProps {
  currentResortId: string;
  currentRooms: number;
  currentLocation: string;
  coverImageUrl?: string;
  currentBasePrice?: number;
  priceFieldIds?: string[];
}

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800";

export default function ResortRecommendations({
  currentResortId,
  currentRooms,
  currentLocation,
  coverImageUrl,
  currentBasePrice = 12900,
  priceFieldIds = [],
}: ResortRecommendationsProps) {
  const [resortOffers, setResortOffers] = useState<any[]>([]);
  const [relatedResorts, setRelatedResorts] = useState<any[]>([]);
  const [similarOtherResorts, setSimilarOtherResorts] = useState<any[]>([]);
  const [similarBudgetResorts, setSimilarBudgetResorts] = useState<any[]>([]);

  const validCoverImage =
    coverImageUrl && coverImageUrl.trim() !== "" ? coverImageUrl : DEFAULT_FALLBACK_IMAGE;

  useEffect(() => {
    async function loadRecommendations() {
      if (!currentResortId) return;

      // 1. Fetch Offers for this Resort
      try {
        const snapAllOffers = await getDocs(collection(db, "resort_offers"));
        const offersList: any[] = [];
        snapAllOffers.forEach((d) => {
          const data = d.data();
          if (data.isActive !== false && d.id.startsWith(`${currentResortId}_offer`)) {
            offersList.push({ id: d.id, ...data });
          }
        });
        setResortOffers(offersList);
      } catch (err) {
        console.error("Error loading resort offers:", err);
      }

      // 2. Fetch Related, Similar Location & Similar Budget Resorts
      try {
        const snapAll = await getDocs(collection(db, "resort_data"));
        const related: any[] = [];
        const similarOther: any[] = [];
        const similarBudget: any[] = [];

        // Strict ±10% Price Window (matching resort.php line 900)
        const minPrice = currentBasePrice * 0.90;
        const maxPrice = currentBasePrice * 1.10;

        snapAll.forEach((d) => {
          const id = d.id;
          if (id === currentResortId) return;
          const data = d.data();
          if (data.core_hidden) return;

          const rooms = parseInt(data.core_rooms || data.rooms || "0", 10) || 0;
          const loc = (data.core_location || data.location || "").toLowerCase().trim();
          const targetLoc = currentLocation.toLowerCase().trim();

          const isRoomMatch = rooms >= currentRooms - 10 && rooms <= currentRooms + 10;
          const price = getLowestPrice(data, priceFieldIds) || 0;

          if (loc === targetLoc && isRoomMatch) {
            related.push({ id, ...data });
          } else if (loc !== targetLoc && isRoomMatch) {
            similarOther.push({ id, ...data });
          }

          if (price >= minPrice && price <= maxPrice) {
            similarBudget.push({ id, price, ...data });
          }
        });

        setRelatedResorts(related);
        setSimilarOtherResorts(similarOther);
        setSimilarBudgetResorts(similarBudget);
      } catch (err) {
        console.error("Error loading recommendations:", err);
      }
    }

    loadRecommendations();
  }, [currentResortId, currentRooms, currentLocation, currentBasePrice, priceFieldIds]);

  return (
    <div className="space-y-6 mb-6">
      {/* 1. OFFERS FOR THIS RESORT */}
      {resortOffers.length > 0 && (
        <div id="currentResortOffersSection" className="bg-transparent">
          <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <i className="ph-bold ph-tag text-[#6B0D24]"></i> Offers for this Resort
          </h3>
          <div
            id="currentResortOffersContainer"
            className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar snap-x snap-mandatory"
          >
            {resortOffers.map((offer, idx) => {
              const guests = offer.guests || offer.pax || 150;
              const days = offer.days || 2;
              const budget = offer.calculatedBudget || offer.budget || 0;
              const discountPercent = offer.discountPercent || offer.discount || 0;

              const validFromStr = offer.validFrom
                ? new Date(offer.validFrom).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Now";
              const validToStr = offer.validTo
                ? new Date(offer.validTo).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Limited Time";

              return (
                <Link
                  key={idx}
                  href={`/resort-offer?id=${currentResortId}&guests=${guests}&days=${days}`}
                  className="snap-center shrink-0 w-[260px] md:w-[300px] bg-white border border-[#C5A059]/30 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col relative group"
                >
                  <div className="h-36 w-full relative overflow-hidden bg-gray-100">
                    <img
                      src={validCoverImage}
                      alt={offer.resortName || "Offer"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {discountPercent > 0 && (
                      <div className="absolute top-3 left-3 bg-[#6B0D24] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg border border-white/20">
                        {discountPercent}% OFF
                      </div>
                    )}

                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end text-white">
                      <div>
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                          Estimated Budget
                        </p>
                        <p className="text-xl font-black text-[#C5A059] leading-tight">
                          ₹{Number(budget).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                        {guests} Guests / {days} Days
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                    <div className="space-y-2">
                      {/* Validity Date Row */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <i className="ph-fill ph-calendar-blank text-[#6B0D24]"></i>
                        <span>
                          Valid: <strong className="text-gray-900">{validFromStr} - {validToStr}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <i className="ph-fill ph-users text-[#6B0D24]"></i>
                        <span>
                          Guest Capacity: <strong className="text-gray-900">{guests} Pax ({days} Days Package)</strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[#6B0D24] font-black text-xs group-hover:translate-x-1 transition-transform">
                      <span>Claim This Offer</span>
                      <i className="ph-bold ph-arrow-right text-sm"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. RELATED RESORTS IN SAME LOCATION */}
      {relatedResorts.length > 0 && (
        <div id="relatedResortsSection" className="bg-transparent">
          <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <i className="ph-bold ph-buildings text-[#6B0D24]"></i> Related Resorts
          </h3>
          <div
            id="relatedResortsContainer"
            className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x snap-mandatory"
          >
            {relatedResorts.map((resort) => {
              const img = extractCoverImage(resort) || DEFAULT_FALLBACK_IMAGE;
              const name = resort._recordName || resort.core_name || "Luxury Resort";
              const loc = resort.core_location || "India";
              const rms = resort.core_rooms || resort.rooms || 0;

              return (
                <Link
                  key={resort.id}
                  href={`/resort/${resort.id}`}
                  className="snap-center shrink-0 w-[140px] md:w-[160px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative"
                >
                  <div className="h-28 w-full relative overflow-hidden bg-gray-100">
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h4 className="font-black text-gray-900 text-xs truncate leading-tight">
                      {name}
                    </h4>
                    <div className="mt-1.5 flex flex-col gap-0.5 text-[9px] font-bold text-gray-400">
                      <span className="truncate">
                        <i className="ph-fill ph-map-pin"></i> {loc}
                      </span>
                      <span>
                        <i className="ph-fill ph-door"></i> {rms} Rooms
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SIMILAR RESORTS IN OTHER LOCATIONS */}
      {similarOtherResorts.length > 0 && (
        <div id="similarOtherResortsSection" className="bg-transparent">
          <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <i className="ph-bold ph-map-pin text-[#6B0D24]"></i> Similar Resorts in Other Locations
          </h3>
          <div
            id="similarOtherResortsContainer"
            className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x snap-mandatory"
          >
            {similarOtherResorts.map((resort) => {
              const img = extractCoverImage(resort) || DEFAULT_FALLBACK_IMAGE;
              const name = resort._recordName || resort.core_name || "Luxury Resort";
              const loc = resort.core_location || "India";
              const rms = resort.core_rooms || resort.rooms || 0;

              return (
                <Link
                  key={resort.id}
                  href={`/resort/${resort.id}`}
                  className="snap-center shrink-0 w-[200px] md:w-[220px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative"
                >
                  <div className="h-24 w-full overflow-hidden bg-gray-100">
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-gray-900 text-xs line-clamp-1 leading-tight mb-1">
                        {name}
                      </h4>
                      <div className="flex flex-col gap-0.5 text-[9px] font-bold text-gray-400">
                        <span className="truncate flex items-center gap-1">
                          <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> {loc}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ph-fill ph-door"></i> {rms} Rooms
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SIMILAR BUDGET RESORTS */}
      {similarBudgetResorts.length > 0 && (
        <div id="similarBudgetResortsSection" className="bg-transparent">
          <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <i className="ph-bold ph-currency-inr text-[#C5A059]"></i> Similar Budget Resorts
          </h3>
          <div
            id="similarBudgetResortsContainer"
            className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x snap-mandatory"
          >
            {similarBudgetResorts.map((resort) => {
              const img = extractCoverImage(resort) || DEFAULT_FALLBACK_IMAGE;
              const name = resort._recordName || resort.core_name || "Luxury Resort";
              const loc = resort.core_location || "India";
              const rms = resort.core_rooms || resort.rooms || 0;

              return (
                <Link
                  key={resort.id}
                  href={`/resort/${resort.id}`}
                  className="snap-center shrink-0 w-[200px] md:w-[220px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative"
                >
                  <div className="h-24 w-full overflow-hidden bg-gray-100">
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-gray-900 text-xs line-clamp-1 leading-tight mb-1">
                        {name}
                      </h4>
                      <div className="flex flex-col gap-0.5 text-[9px] font-bold text-gray-400">
                        <span className="truncate flex items-center gap-1">
                          <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> {loc}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ph-fill ph-door"></i> {rms} Rooms
                        </span>
                        {resort.price > 0 && (
                          <span className="flex items-center gap-1 text-[#C5A059] font-bold">
                            <i className="ph-fill ph-currency-inr"></i> ₹{resort.price.toLocaleString("en-IN")}/person
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}