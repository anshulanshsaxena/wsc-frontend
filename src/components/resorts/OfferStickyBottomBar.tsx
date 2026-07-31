'use client';

import React from 'react';

interface OfferStickyBottomBarProps {
  resortName: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onInquiryClick?: () => void;
}

export const OfferStickyBottomBar: React.FC<OfferStickyBottomBarProps> = ({
  resortName,
  isFavorited = false,
  onToggleFavorite,
  onInquiryClick,
}) => {
  const handleShare = async () => {
    const shareData = {
      title: `${resortName} - Offer Package`,
      text: `Check out this promotional offer at ${resortName}!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      alert('Campaign link copied to clipboard!');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#FAF6F0] border-t border-gray-200/50 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 pb-3 pt-2 gap-2">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1"
        >
          <i className="ph-bold ph-share-network text-xl md:text-2xl"></i>
          <span className="text-[10px] md:text-xs font-bold mt-1">Share</span>
        </button>

        {/* Saved Button */}
        <button
          onClick={onToggleFavorite}
          className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1"
        >
          <i
            className={`${
              isFavorited ? 'ph-fill ph-heart text-red-500' : 'ph-bold ph-heart text-[#4A3E3D]'
            } text-xl md:text-2xl transition-all duration-300`}
          ></i>
          <span className="text-[10px] md:text-xs font-bold mt-1">Saved</span>
        </button>

        {/* Inquiry Button */}
        <button
          onClick={onInquiryClick}
          className="flex flex-col items-center justify-center flex-[1.6] bg-[#6B0D24] text-white hover:bg-[#520a1a] transition-all rounded-2xl py-2 px-3 shadow-md"
        >
          <i className="ph-bold ph-envelope-simple text-lg md:text-xl"></i>
          <span className="text-[11px] md:text-xs font-bold mt-0.5">Inquiry</span>
        </button>
      </div>
    </div>
  );
};