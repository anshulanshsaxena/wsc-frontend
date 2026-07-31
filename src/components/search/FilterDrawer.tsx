"use client";

import React, { useState } from "react";
import { ResortDoc, PRICE_RANGES, ROOM_RANGES } from "@/hooks/useSearchEngine";
import { getLowestPrice } from "@/lib/utils";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allResorts?: ResortDoc[];
  baseSearchResults?: ResortDoc[];
  priceFieldIds?: string[];

  selectedPriceRanges: Set<string>;
  setSelectedPriceRanges: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedLocations: Set<string>;
  setSelectedLocations: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedStars: Set<string>;
  setSelectedStars: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedBrands: Set<string>;
  setSelectedBrands: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFeatures: Set<string>;
  setSelectedFeatures: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedRooms: Set<string>;
  setSelectedRooms: React.Dispatch<React.SetStateAction<Set<string>>>;

  onResetAll: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  allResorts = [],
  baseSearchResults = [],
  priceFieldIds = [],
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
  onResetAll,
}: FilterDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "price" | "location" | "star" | "brand" | "features" | "rooms"
  >("price");

  if (!isOpen) return null;

  // Use baseSearchResults if non-empty, otherwise fall back to allResorts
  const pool =
    baseSearchResults && baseSearchResults.length > 0 ? baseSearchResults : allResorts;

  const toggleSet = (set: Set<string>, setFn: (s: Set<string>) => void, val: string) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setFn(next);
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-xs flex items-end md:items-stretch justify-start">
      <div className="bg-white w-full md:w-[480px] rounded-t-3xl md:rounded-r-3xl md:rounded-t-none p-4 md:p-6 shadow-2xl flex flex-col h-[85vh] md:h-full max-h-[85vh] md:max-h-full">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0 mb-3">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            <i className="ph-bold ph-sliders-horizontal text-[#6B0D24]"></i> Filter Venues
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={onResetAll} className="text-xs text-[#6B0D24] font-bold hover:underline cursor-pointer">
              Reset All
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:text-black cursor-pointer">
              &times;
            </button>
          </div>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 flex overflow-hidden border border-gray-100 rounded-2xl">
          {/* Left Category Column */}
          <div className="w-1/3 bg-[#FAF6F0]/60 border-r border-gray-100 overflow-y-auto p-2 space-y-1 shrink-0">
            {[
              { id: "price", label: "Price Range" },
              { id: "location", label: "Location" },
              { id: "star", label: "Star Category" },
              { id: "brand", label: "Brand" },
              { id: "features", label: "Features" },
              { id: "rooms", label: "Rooms" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === cat.id
                    ? "bg-[#6B0D24] text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Options Column */}
          <div className="w-2/3 bg-white p-3.5 overflow-y-auto custom-scrollbar">
            {activeTab === "price" &&
              PRICE_RANGES.map((range) => {
                const count = pool.filter((r) => {
                  const p = getLowestPrice(r, priceFieldIds);
                  return typeof p === "number" && p >= range.min && p <= range.max;
                }).length;

                const key = `${range.min}_${range.max}`;
                const isChecked = selectedPriceRanges.has(key);
                if (count === 0 && !isChecked) return null;

                return (
                  <label key={key} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSet(selectedPriceRanges, setSelectedPriceRanges, key)}
                        className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800">{range.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                  </label>
                );
              })}

            {activeTab === "location" &&
              Array.from(new Set(pool.map((r) => String(r.core_location || "").trim()).filter(Boolean)))
                .sort()
                .map((loc) => {
                  const lower = loc.toLowerCase();
                  const count = pool.filter((r) => String(r.core_location || "").trim().toLowerCase() === lower).length;
                  const isChecked = selectedLocations.has(lower);
                  if (count === 0 && !isChecked) return null;

                  return (
                    <label key={loc} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSet(selectedLocations, setSelectedLocations, lower)}
                          className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800 capitalize">{loc}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  );
                })}

            {activeTab === "star" &&
              Array.from(new Set(pool.map((r) => String(r.core_star_rating || "").trim()).filter(Boolean)))
                .sort()
                .map((star) => {
                  const lower = star.toLowerCase();
                  const count = pool.filter((r) => String(r.core_star_rating || "").trim().toLowerCase() === lower).length;
                  const isChecked = selectedStars.has(lower);
                  if (count === 0 && !isChecked) return null;

                  return (
                    <label key={star} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSet(selectedStars, setSelectedStars, lower)}
                          className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800">{star}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  );
                })}

            {activeTab === "brand" &&
              Array.from(new Set(pool.map((r) => String(r.core_brand || "").trim()).filter(Boolean)))
                .sort()
                .map((brand) => {
                  const lower = brand.toLowerCase();
                  const count = pool.filter((r) => String(r.core_brand || "").trim().toLowerCase() === lower).length;
                  const isChecked = selectedBrands.has(lower);
                  if (count === 0 && !isChecked) return null;

                  return (
                    <label key={brand} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSet(selectedBrands, setSelectedBrands, lower)}
                          className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800">{brand}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  );
                })}

            {activeTab === "features" &&
              Array.from(new Set(pool.map((r) => String(r.core_feature || "").trim()).filter(Boolean)))
                .sort()
                .map((feat) => {
                  const lower = feat.toLowerCase();
                  const count = pool.filter((r) => String(r.core_feature || "").trim().toLowerCase() === lower).length;
                  const isChecked = selectedFeatures.has(lower);
                  if (count === 0 && !isChecked) return null;

                  return (
                    <label key={feat} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSet(selectedFeatures, setSelectedFeatures, lower)}
                          className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800">{feat}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  );
                })}

            {activeTab === "rooms" &&
              ROOM_RANGES.map((range) => {
                const count = pool.filter((r) => {
                  const rm = typeof r.core_rooms === "number" ? r.core_rooms : 0;
                  return rm >= range.min && rm <= range.max;
                }).length;

                const key = `${range.min}_${range.max}`;
                const isChecked = selectedRooms.has(key);
                if (count === 0 && !isChecked) return null;

                return (
                  <label key={key} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-[#FAF6F0] cursor-pointer mb-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSet(selectedRooms, setSelectedRooms, key)}
                        className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800">{range.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                  </label>
                );
              })}
          </div>
        </div>

        {/* Footer Apply Button */}
        <div className="pt-3 border-t border-gray-100 mt-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#6B0D24] text-white font-bold py-3 rounded-xl hover:bg-[#520a1a] transition shadow-md text-xs uppercase tracking-wider cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}