"use client";

import React from "react";

export interface ActiveFilterPill {
  id: string;
  type: "price" | "location" | "star" | "brand" | "features" | "rooms";
  label: string;
  value: string;
}

interface FilterSortBarProps {
  activeFilterCount: number;
  activeSortLabel: string;
  activePills?: ActiveFilterPill[];
  onOpenFilter: () => void;
  onOpenSort: () => void;
  onReset: () => void;
  onRemovePill?: (pill: ActiveFilterPill) => void;
}

export default function FilterSortBar({
  activeFilterCount,
  activeSortLabel,
  activePills = [], // Default fallback array prevents undefined error
  onOpenFilter,
  onOpenSort,
  onReset,
  onRemovePill = () => {},
}: FilterSortBarProps) {
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-3 border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-30">
      {/* Action Buttons & Pills Container */}
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={onOpenFilter}
          className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#6B0D24] hover:text-white transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <i className="ph-bold ph-sliders-horizontal text-sm"></i>
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#6B0D24] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ml-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Trigger Button */}
        <button
          type="button"
          onClick={onOpenSort}
          className="bg-[#FAF6F0] text-gray-800 border border-gray-200 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-gray-100 transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <i className="ph-bold ph-arrows-down-up text-sm text-[#6B0D24]"></i>
          <span>Sort</span>
          {activeSortLabel && (
            <span className="text-gray-400 font-normal">{activeSortLabel}</span>
          )}
        </button>

        {/* Active Filter Pills (Safely checked) */}
        {activePills && activePills.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full custom-scrollbar">
            {activePills.map((pill) => (
              <span
                key={`${pill.type}-${pill.id}`}
                className="bg-[#6B0D24]/10 text-[#6B0D24] border border-[#6B0D24]/20 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <span>{pill.label}</span>
                <button
                  type="button"
                  onClick={() => onRemovePill(pill)}
                  className="hover:text-red-700 font-black text-xs cursor-pointer"
                  title="Remove filter"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reset Button */}
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-[#6B0D24] font-bold hover:underline bg-[#FAF6F0] border border-[#6B0D24]/10 px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer self-end md:self-auto"
      >
        Reset
      </button>
    </div>
  );
}