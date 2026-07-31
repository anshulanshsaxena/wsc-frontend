"use client";

import React, { useState } from "react";
import { ResortDoc } from "@/hooks/useSearchEngine";
import ResortCard from "./ResortCard";

interface ResortsGridProps {
  resorts: ResortDoc[];
  priceFieldIds: string[];
  onResetFilters: () => void;
  onOpenPriceExplanation: (e: React.MouseEvent) => void;
}

export default function ResortsGrid({
  resorts,
  priceFieldIds,
  onResetFilters,
  onOpenPriceExplanation,
}: ResortsGridProps) {
  const [itemsToShow, setItemsToShow] = useState(9);

  if (resorts.length === 0) {
    return (
      <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <i className="ph-bold ph-magnifying-glass text-5xl text-gray-200 mb-4"></i>
        <h3 className="text-2xl font-black text-gray-900">No venues found</h3>
        <p className="text-base text-gray-500 mt-2 mb-6">
          Try adjusting your active search inputs or sidebar filters.
        </p>
        <button
          onClick={onResetFilters}
          className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition shadow-md cursor-pointer"
        >
          Clear Active Filters
        </button>
      </div>
    );
  }

  const visibleResorts = resorts.slice(0, itemsToShow);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">Explore Venues</h1>
          <p className="text-xs md:text-sm text-gray-500 font-bold mt-0.5">
            {resorts.length} venues found
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {visibleResorts.map((resort) => (
          <ResortCard
            key={resort.id}
            resort={resort}
            priceFieldIds={priceFieldIds}
            onOpenPriceExplanation={onOpenPriceExplanation}
          />
        ))}
      </div>

      {resorts.length > itemsToShow && (
        <div className="col-span-full flex justify-center mt-8 mb-10">
          <button
            onClick={() => setItemsToShow((prev) => prev + 9)}
            className="px-8 py-3.5 bg-white border border-gray-200 text-black font-black rounded-full hover:border-black hover:bg-gray-50 transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            Load More Venues <i className="ph-bold ph-arrow-down"></i>
          </button>
        </div>
      )}
    </div>
  );
}