'use client';

import React from 'react';

interface OfferCampaignHeaderProps {
  campaignTitle?: string;
  resortName: string;
  validFrom?: string;
  validTo?: string;
  guests: number;
  days: number;
  totalBudget: number;
  resortSplit: number;
  plannerSplit: number;
  plannerName?: string;
  onLockPricingClick?: () => void;
}

export const OfferCampaignHeader: React.FC<OfferCampaignHeaderProps> = ({
  campaignTitle = 'Promotional Offer Campaign',
  resortName,
  validFrom,
  validTo,
  guests,
  days,
  totalBudget,
  resortSplit,
  plannerSplit,
  plannerName = 'Wedding Planner',
  onLockPricingClick,
}) => {
  const total = resortSplit + plannerSplit || 1;
  const resortPercent = Math.round((resortSplit / total) * 100);
  const plannerPercent = 100 - resortPercent;

  return (
    <div className="space-y-6 mb-6">
      {/* Summary Badge Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-black text-[#780522] uppercase tracking-[0.2em] block mb-1">
              PROMOTIONAL OFFER CAMPAIGN
            </span>
            <h2 className="text-sm font-black text-slate-800 leading-tight">
              All-Inclusive Wedding Package Cost at {resortName} for {guests} Pax
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Offer validity dates: {validFrom || 'Now'} to {validTo || 'Limited Time'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-[9px] uppercase tracking-wider font-black text-slate-400">
                Guests
              </span>
              <span className="text-base font-black text-slate-900">{guests} Pax</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-[9px] uppercase tracking-wider font-black text-slate-400">
                Duration
              </span>
              <span className="text-base font-black text-slate-900">{days} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Pricing Matrix Card */}
      <div className="bg-gradient-to-br from-[#780522] to-stone-900 rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-[#780522]/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-red-400 block mb-1">
              PROMOTIONAL PACKAGE BUDGET
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              ₹{totalBudget.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">
              * Inclusive of Stay, Buffet Meals, & Setups
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={onLockPricingClick}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-stone-900 font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition shadow-md"
            >
              Lock in Pricing <i className="ph-bold ph-arrow-right ml-1"></i>
            </button>
          </div>
        </div>

        {/* Cost Split Visualizer Bar */}
        <div className="space-y-4">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Pricing Matrix Split
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-white/90">
              <span className="flex items-center gap-1.5">
                <i className="ph-fill ph-house text-red-400"></i> Resort Stay & Food (Excluding GST.)
              </span>
              <span>₹{resortSplit.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${resortPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-white/5">
            <div className="flex justify-between text-xs font-bold text-white/90">
              <span className="flex items-center gap-1.5">
                <i className="ph-fill ph-sparkle text-amber-400"></i> Decor, Sound, & Production Setups
              </span>
              <span>₹{plannerSplit.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${plannerPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Decor setups managed and curated by {plannerName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};