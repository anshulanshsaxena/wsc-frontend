"use client";

import React from "react";
import Link from "next/link";

export default function CompareResortsCTA() {
  return (
    <div className="animate-fade-up-delayed w-full max-w-3xl mx-auto px-4 mt-12 mb-6 relative z-20">
      <div className="relative bg-white/90 backdrop-blur-md rounded-[2rem] border border-stone-200/80 p-6 md:p-8 shadow-[0_20px_50px_rgba(120,5,34,0.05)] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-[#780522]/30 transition-all duration-500">
        <div className="absolute -right-16 -bottom-16 w-40 h-48 bg-[#780522]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#780522]/8 transition-colors duration-500" />
        <div className="absolute -left-16 -top-16 w-32 h-32 bg-stone-100 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center sm:text-left relative z-10 max-w-lg">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#780522] block mb-1"></span>
          <h3 className="font-serif text-lg md:text-xl font-normal text-stone-900 leading-tight">
            Or let us find a resort that fits your{" "}
            <span className="italic text-[#780522] font-normal">requirements.</span>
          </h3>
        </div>

        <div className="shrink-0 w-full md:w-auto relative z-10">
          <Link
            href="/compare-resorts"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#780522] hover:bg-stone-950 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-md hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] transition-all duration-300"
          >
            Get Started <i className="ph-bold ph-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}