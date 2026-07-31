"use client";

import React from "react";

interface SortDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSort: (sortType: string, label: string) => void;
}

const SORT_OPTIONS = [
  { id: "price_low_high", label: "Price: Low to High", shortLabel: "Price ↑", icon: "ph-arrow-up text-[#6B0D24]" },
  { id: "price_high_low", label: "Price: High to Low", shortLabel: "Price ↓", icon: "ph-arrow-down text-[#6B0D24]" },
  { id: "discount_high_low", label: "Discount: High to Low", shortLabel: "Discount ↓", icon: "ph-tag text-[#C5A059]" },
  { id: "discount_low_high", label: "Discount: Low to High", shortLabel: "Discount ↑", icon: "ph-tag text-[#C5A059]" },
  { id: "rooms_high_low", label: "Rooms: High to Low", shortLabel: "Rooms ↓", icon: "ph-door text-[#6B0D24]" },
  { id: "rooms_low_high", label: "Rooms: Low to High", shortLabel: "Rooms ↑", icon: "ph-door text-[#6B0D24]" },
];

export default function SortDrawer({ isOpen, onClose, onSelectSort }: SortDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-xs flex items-end md:items-stretch justify-center md:justify-start">
      <div className="bg-white w-full md:max-w-md h-auto md:h-full rounded-t-3xl md:rounded-r-3xl md:rounded-t-none p-5 md:p-6 shadow-2xl flex flex-col max-h-[80vh] md:max-h-full">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3 shrink-0">
          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
            <i className="ph-bold ph-arrows-down-up text-[#6B0D24]"></i> Sort Venues
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:text-black cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelectSort(opt.id, opt.shortLabel);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl border border-gray-100 hover:border-[#6B0D24] font-bold text-xs text-gray-800 flex justify-between items-center hover:bg-[#FAF6F0] transition cursor-pointer"
            >
              <span>{opt.label}</span>
              <i className={`ph-bold ${opt.icon}`}></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}