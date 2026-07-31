"use client";

import React from "react";
import Link from "next/link";
import { ResortDetails } from "@/lib/resortService";

interface ResortHeaderCardProps {
  resort: ResortDetails;
  startingPrice: number;
  savedQuotes?: any[];
}

export default function ResortHeaderCard({
  resort,
  startingPrice,
  savedQuotes = [],
}: ResortHeaderCardProps) {
  const resortName = resort._recordName || resort.core_name || "Premium Resort";
  const location = resort.core_location || resort.location || "Location not set";
  const address = resort.core_address || "";

  // Star Rating Parsing (Extracts digit count safely)
  const starRatingVal = resort.core_star_rating || resort.star_rating || "";
  const starNumMatch = starRatingVal.match(/\d+/);
  const starCount = starNumMatch ? parseInt(starNumMatch[0], 10) : 0;

  // Rooms & Capacity Calculation (Rooms x2 to Rooms x3)
  const roomsNum = parseInt(String(resort.core_rooms || resort.rooms || 0), 10) || 0;
  const minPax = roomsNum * 2;
  const maxPax = roomsNum * 3;
  const capacityDisplay =
    roomsNum > 0
      ? `${roomsNum} Rooms (${minPax} - ${maxPax} Pax)`
      : `${resort.core_rooms || "--"} Rooms`;

  const offerText = resort.core_offer || "";
  const brandName = resort.core_brand || resort.brand || "";

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl border border-gray-100 mb-6">
      <div className="w-full">
        {/* Offer Tag */}
        {offerText && (
          <div
            id="offerTag"
            className="inline-flex items-center gap-1 bg-[#C5A059]/10 text-[#C5A059] px-2.5 py-1 rounded-lg text-xs font-bold mb-2"
          >
            <i className="ph-fill ph-tag"></i> <span id="offerText">{offerText}</span>
          </div>
        )}

        {/* Resort Name */}
        <h1
          id="resortName"
          className="text-2xl md:text-4xl font-black text-[#6B0D24] leading-tight w-full break-words"
        >
          {resortName}
        </h1>

        {/* Brand Name & Star Rating Pill Bar */}
        <div id="brandRatingBar" className="flex items-center gap-2 flex-wrap mt-2 mb-1.5">
          {brandName && (
            <span
              id="resortBrandTag"
              className="inline-flex items-center gap-1 bg-[#6B0D24]/10 text-[#6B0D24] text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
            >
              <i className="ph-bold ph-buildings text-xs"></i>{" "}
              <span id="resortBrandText">{brandName}</span>
            </span>
          )}

          {starRatingVal && (
            <span
              id="resortRatingBadge"
              className="inline-flex items-center gap-1.5 bg-[#6B0D24] text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full shadow-xs"
            >
              <span id="resortRatingStars" className="flex items-center gap-0.5 text-amber-300 text-xs">
                {starCount > 0 ? (
                  Array.from({ length: starCount }).map((_, i) => (
                    <i key={i} className="ph-fill ph-star"></i>
                  ))
                ) : (
                  <i className="ph-fill ph-crown text-amber-300"></i>
                )}
              </span>
              <span id="resortRatingText" className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                {starCount > 0 ? `${starCount} STAR` : starRatingVal.toUpperCase()}
              </span>
            </span>
          )}
        </div>

        {/* Location */}
        <p id="resortLocation" className="text-gray-500 text-xs md:text-sm flex items-center gap-1 mt-1 font-medium">
          <i className="ph-fill ph-map-pin text-[#6B0D24]/80"></i> {location}
        </p>

        {/* Address */}
        {address && (
          <p
            id="resortAddress"
            className="text-gray-500 text-xs flex items-start gap-1 mt-1 font-normal leading-relaxed"
          >
            <i className="ph-fill ph-navigation-arrow text-[#6B0D24]/70 shrink-0 mt-0.5"></i>
            <span id="resortAddressText">{address}</span>
          </p>
        )}
      </div>

      {/* Starting Price & Capacity Grid */}
      <div className="flex gap-3 md:gap-6 mt-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Starting Price
          </p>
          <p className="text-lg md:text-2xl font-black text-gray-900 leading-tight">
            ₹
            <span id="displayPrice">
              {startingPrice > 0 ? startingPrice.toLocaleString("en-IN") : "..."}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold"> /person</span>
          </p>
        </div>

        <div className="border-l border-gray-200 pl-3 md:pl-6">
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Rooms
          </p>
          <p id="resortCapacity" className="text-sm md:text-lg font-bold text-gray-900 leading-tight">
            {capacityDisplay}
          </p>
        </div>
      </div>

      {/* Expandable Saved Budget Dropdown */}
      {savedQuotes.length > 0 && (
        <div id="savedQuotePreviewContainer">
          <details className="group bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl overflow-hidden shadow-sm transition-all mt-6">
            <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C5A059]/20 text-[#C5A059] rounded-full flex items-center justify-center">
                  <i className="ph-fill ph-check-circle text-xl"></i>
                </div>
                <div>
                  <p className="text-xs text-[#C5A059] uppercase tracking-wider font-bold">
                    Budget Saved
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    You have {savedQuotes.length} saved quotes.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#C5A059] shadow-sm transition-transform group-open:rotate-180">
                <i className="ph-bold ph-caret-down"></i>
              </div>
            </summary>
            <div className="p-4 pt-0 bg-white border-t border-[#C5A059]/20">
              {savedQuotes.map((q, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={q.logoUrl}
                      alt={q.plannerName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-gray-700">{q.plannerName}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">
                    ₹{Number(q.grandTotal).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}

              <Link
                href="/user-profile"
                className="mt-4 w-full block text-center bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition"
              >
                View Full Dashboard <i className="ph-bold ph-arrow-right ml-1"></i>
              </Link>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}