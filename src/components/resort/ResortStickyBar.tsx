"use client";

import React from "react";
import { useFavorites } from "@/context/FavoritesContext";

interface ResortStickyBarProps {
  resortId: string;
  resortName: string;
  onOpenBudgetWizard: () => void;
  onScrollToInquiry: () => void;
}

export default function ResortStickyBar({
  resortId,
  resortName,
  onOpenBudgetWizard,
  onScrollToInquiry,
}: ResortStickyBarProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(resortId);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${resortName} - Wedding Support Company`,
        text: `Check out ${resortName} for our wedding!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div
      id="pageStickyBottomBar"
      className="fixed bottom-0 left-0 w-full bg-[#FAF6F0] border-t border-gray-200/50 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-4 pb-3 pt-2 gap-1">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1 cursor-pointer"
        >
          <i className="ph-bold ph-share-network text-xl md:text-2xl"></i>
          <span className="text-[10px] md:text-xs font-bold mt-1">Share</span>
        </button>

        {/* Budget / Recalc Button */}
        <button
          id="fullBudgetBtn"
          onClick={onOpenBudgetWizard}
          className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1 cursor-pointer"
        >
          <i id="budgetIcon" className="ph-bold ph-calculator text-xl md:text-2xl"></i>
          <span id="budgetLabel" className="text-[10px] md:text-xs font-bold mt-1">Budget</span>
        </button>

        {/* Saved / Favorite Button */}
        <button
          onClick={() => toggleFavorite(resortId, resortName)}
          className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1 cursor-pointer"
        >
          <i
            id="heroHeartIcon"
            className={`text-xl md:text-2xl transition-colors ${
              isFav ? "ph-fill ph-heart text-red-500" : "ph-bold ph-heart text-[#4A3E3D]"
            }`}
          />
          <span className="text-[10px] md:text-xs font-bold mt-1">Saved</span>
        </button>

        {/* Inquiry Button */}
        <button
          id="floatingInqBtn"
          onClick={onScrollToInquiry}
          className="flex flex-col items-center justify-center flex-[1.4] bg-[#6B0D24] text-white hover:bg-[#520a1a] transition-all rounded-2xl py-2 px-3 shadow-md cursor-pointer"
        >
          <i className="ph-bold ph-envelope-simple text-lg md:text-xl"></i>
          <span className="text-[11px] md:text-xs font-bold mt-0.5">Inquiry</span>
        </button>
      </div>
    </div>
  );
}