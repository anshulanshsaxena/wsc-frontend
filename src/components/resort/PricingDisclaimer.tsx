"use client";

import React from "react";

export default function PricingDisclaimer() {
  return (
    <div className="bg-amber-50 border border-[#C5A059]/20 rounded-2xl p-4 mb-6 leading-relaxed">
      <span className="text-[9px] font-black text-[#6B0D24] uppercase tracking-widest block mb-1 flex items-center gap-1">
        <i className="ph-bold ph-info"></i> Estimated Pricing Disclaimer
      </span>
      <p className="text-xs text-stone-600 font-medium">
        The price per person is calculated dynamically and can be lower or higher depending on dates, and number of guests. The price shown here is an estimated price per person and the resort has discrete power to reject this pricing in exceptional cases. These are estimated prices directly proposed by the resort representative and the final booking prices may be lower or higher depending on negotiations.
      </p>
    </div>
  );
}