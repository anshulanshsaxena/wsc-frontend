'use client';

import React from 'react';
import Link from 'next/link';

export interface SavedBudgetQuote {
  plannerName: string;
  logoUrl: string;
  grandTotal: number;
}

export interface SavedBudgetData {
  guests: number;
  days: number;
  quotes: SavedBudgetQuote[];
}

interface StickyBottomBarProps {
  resortName: string;
  isFavorited?: boolean;
  savedBudgetData?: SavedBudgetData | null;
  onToggleFavorite?: () => void;
  onOpenBudgetWizard?: () => void;
  onInquiryClick?: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  resortName,
  isFavorited = false,
  savedBudgetData = null,
  onToggleFavorite,
  onOpenBudgetWizard,
  onInquiryClick,
}) => {
  const handleShare = async () => {
    const shareData = {
      title: `${resortName} - WedSaaS`,
      text: `Check out ${resortName} for our wedding!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Silent catch
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const hasSavedBudget =
    savedBudgetData && savedBudgetData.quotes && savedBudgetData.quotes.length > 0;

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 pb-safe pointer-events-none">
      {/* EXPANDABLE SAVED BUDGET PREVIEW CONTAINER (Transparent Screen Wings) */}
      {hasSavedBudget && (
        <div className="max-w-md mx-auto w-full px-4 pointer-events-auto">
          <details className="group bg-white border border-[#C5A059]/30 rounded-2xl overflow-hidden shadow-2xl transition-all mb-2">
            <summary className="flex justify-between items-center p-3.5 cursor-pointer list-none select-none bg-[#C5A059]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C5A059]/20 text-[#C5A059] rounded-full flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-check-circle text-xl"></i>
                </div>
                <div>
                  <p className="text-xs text-[#C5A059] uppercase tracking-wider font-bold">
                    Budget Saved
                  </p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">
                    You have {savedBudgetData.quotes.length} saved quote
                    {savedBudgetData.quotes.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#C5A059] shadow-sm transition-transform group-open:rotate-180 shrink-0">
                <i className="ph-bold ph-caret-down"></i>
              </div>
            </summary>

            <div className="p-4 pt-3 bg-white border-t border-[#C5A059]/20">
              <div className="flex justify-between text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg font-medium">
                <span>{savedBudgetData.guests} Guests</span>
                <span>{savedBudgetData.days} Days</span>
              </div>

              <div className="space-y-1.5">
                {savedBudgetData.quotes.map((q, idx) => (
                  <div
                    key={q.plannerName + idx}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          q.logoUrl ||
                          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80'
                        }
                        alt={q.plannerName}
                        className="w-6 h-6 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700">{q.plannerName}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">
                      ₹{q.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/user-profile"
                className="mt-4 w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition shadow-md"
              >
                <span>View Full Dashboard</span>
                <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          </details>
        </div>
      )}

      {/* BOTTOM ACTION BAR (Confined Cream Background) */}
      <div className="w-full bg-[#FAF6F0] border-t border-gray-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pointer-events-auto">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 pb-3 pt-2 gap-1">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1"
          >
            <i className="ph-bold ph-share-network text-xl md:text-2xl"></i>
            <span className="text-[10px] md:text-xs font-bold mt-1">Share</span>
          </button>

          {/* Budget / Recalc Button */}
          <button
            onClick={onOpenBudgetWizard}
            className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1"
          >
            <i
              className={`ph-bold ${
                hasSavedBudget
                  ? 'ph-arrows-clockwise text-xl md:text-2xl text-[#6B0D24]'
                  : 'ph-calculator text-xl md:text-2xl'
              }`}
            ></i>
            <span className="text-[10px] md:text-xs font-bold mt-1">
              {hasSavedBudget ? 'Recalc' : 'Budget'}
            </span>
          </button>

          {/* Saved / Favorite Button */}
          <button
            onClick={onToggleFavorite}
            className="flex flex-col items-center justify-center flex-1 text-[#4A3E3D] hover:text-[#6B0D24] transition-colors py-1"
          >
            <i
              className={`${
                isFavorited
                  ? 'ph-fill ph-heart text-red-500'
                  : 'ph-bold ph-heart text-[#4A3E3D]'
              } text-xl md:text-2xl transition-colors`}
            ></i>
            <span className="text-[10px] md:text-xs font-bold mt-1">Saved</span>
          </button>

          {/* Inquiry Button */}
          <button
            onClick={onInquiryClick}
            className="flex flex-col items-center justify-center flex-[1.4] bg-[#6B0D24] text-white hover:bg-[#520a1a] transition-all rounded-2xl py-2 px-3 shadow-md"
          >
            <i className="ph-bold ph-envelope-simple text-lg md:text-xl"></i>
            <span className="text-[11px] md:text-xs font-bold mt-0.5">Inquiry</span>
          </button>
        </div>
      </div>
    </div>
  );
};