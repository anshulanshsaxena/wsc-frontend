"use client";

import React from "react";

interface MarketingTabsProps {
  selectedTag: string;
  onSelectTag: (tag: string) => void;
}

const TABS = [
  { id: "", label: "✨ All Resorts" },
  { id: "Hot Selling", label: "🔥 Hot Selling" },
  { id: "Most Demanded", label: "⭐ Most Demanded" },
  { id: "Value for Money", label: "💰 Value for Money" },
  { id: "Premium Luxury", label: "💎 Premium Luxury" },
];

export default function MarketingTabs({ selectedTag, onSelectTag }: MarketingTabsProps) {
  return (
    <div
      className="flex overflow-x-auto gap-2 pb-1 hide-scroll snap-x -mx-4 px-4 md:mx-0 md:px-0"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map((tab) => {
        const isActive = selectedTag === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTag(tab.id)}
            className={`marketing-tag-tab snap-center shrink-0 px-4 py-2 rounded-full text-xs transition-all cursor-pointer ${
              isActive
                ? "bg-[#6B0D24] text-white shadow-xs font-black"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 font-bold"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}