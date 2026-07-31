"use client";

import React from "react";
import Link from "next/link";

interface HeroLandingProps {
  onQuickSearch: (destination: string) => void;
}

export default function HeroLanding({ onQuickSearch }: HeroLandingProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-12 relative overflow-hidden bg-white fade-in">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-50 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4">
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-5 tracking-tighter leading-tight">
          Explore curated venues.
        </h2>
        <p className="text-gray-500 text-base md:text-lg mb-8 max-w-2xl font-medium">
          Search across our catalog of luxury resorts, heritage palaces, and coastal getaways.
        </p>

        {/* Compare Resorts CTA Card */}
        <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-[0_20px_50px_rgba(120,5,34,0.05)] overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-[#780522]/30 transition-all duration-500 text-left">
            <div className="absolute -right-16 -bottom-16 w-40 h-48 bg-[#780522]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#780522]/8 transition-colors duration-500" />
            <div className="absolute -left-16 -top-16 w-32 h-32 bg-stone-100 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center sm:text-left relative z-10 flex-1">
              <h3 className="font-serif text-base md:text-lg font-normal text-stone-900 leading-tight">
                Not sure which to choose?{" "}
                <span className="italic text-[#780522] font-normal">
                  Compare budgets of all resorts at once.
                </span>
              </h3>
            </div>

            <div className="shrink-0 w-full sm:w-auto relative z-10">
              <Link
                href="/compare-resorts"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#780522] hover:bg-stone-950 text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-md hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-300"
              >
                Get Started <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Search Destination Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs md:text-sm text-gray-400 font-bold mr-2">
            Popular Destinations:
          </span>
          {["Goa", "Udaipur", "Jaipur", "Kerala"].map((dest) => (
            <button
              key={dest}
              onClick={() => onQuickSearch(dest)}
              className="px-5 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:text-black transition shadow-sm cursor-pointer"
            >
              {dest}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}