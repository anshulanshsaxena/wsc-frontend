'use client';

import React from 'react';

interface InclusionItem {
  id?: string;
  name: string;
  qty: number;
  rule: string;
  category?: string;
}

interface OfferInclusionsProps {
  eventsList: string[];
  groupedInclusions: Record<string, InclusionItem[]>;
}

export const OfferInclusions: React.FC<OfferInclusionsProps> = ({
  eventsList = [],
  groupedInclusions = {},
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 space-y-6">
      <div>
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1">
          <i className="ph-fill ph-check-square text-[#780522]"></i> Package Inclusions Checklist
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          All setups, sound infrastructures, and logistics fully accounted for.
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Planned Functions */}
      <div className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#780522] block">
          1. Planned Functions Included
        </span>
        <div className="flex flex-wrap gap-2">
          {eventsList.map((evt, idx) => (
            <span
              key={evt + idx}
              className="bg-[#780522]/5 text-[#780522] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#780522]/15 flex items-center gap-1.5"
            >
              <i className="ph-fill ph-calendar text-xs"></i> {evt}
            </span>
          ))}
        </div>

        <p className="text-xs text-gray-500 italic mt-3 bg-[#FAF6F0] p-4 rounded-xl border border-dashed border-[#6B0D24]/10 leading-relaxed font-medium">
          <span className="font-bold text-[#780522] not-italic block mb-0.5">
            <i className="ph-bold ph-sparkle"></i> Note on Decor Setup:
          </span>
          Decor for all these functions is included; any changes to the themes offered may fluctuate the costing. Decor includes Tentage, Furniture, Lights & Genset-Diesel, and Floral work with partial natural flowers.
        </p>
      </div>

      {/* Setup & Production Items */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#780522] block mb-3">
          2. Inclusive Setup & Production Items
        </span>

        <div className="space-y-6 w-full">
          {Object.keys(groupedInclusions).length === 0 ? (
            <p className="text-xs text-slate-400">No custom setup items listed.</p>
          ) : (
            Object.entries(groupedInclusions).map(([groupName, items]) => (
              <div key={groupName} className="mb-6 w-full">
                <h4 className="text-xs font-black text-[#780522] uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                  <i className="ph-bold ph-gear"></i> {groupName}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, idx) => {
                    const ruleLabel = (item.rule || 'flat').replace(/_/g, ' ');
                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <i className="ph-bold ph-check text-xs"></i>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-800 truncate">
                            {item.name}
                          </span>
                          <span className="block text-[9px] text-[#780522] font-black uppercase tracking-wider">
                            {ruleLabel} {item.qty > 1 ? `x${item.qty}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};