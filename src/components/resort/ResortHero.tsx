"use client";

import React, { useState, useEffect } from "react";
import { ResortDetails } from "@/lib/resortService";

interface ResortHeroProps {
  resort: ResortDetails;
  lowestPrice?: number | null;
  onOpen360Tour: () => void;
}

export default function ResortHero({
  resort,
  lowestPrice,
  onOpen360Tour,
}: ResortHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Extract all hero image URLs from resort object
  const extractImages = (): string[] => {
    const urls: string[] = [];
    Object.keys(resort || {}).forEach((key) => {
      if (
        typeof resort[key] === "string" &&
        resort[key].includes("firebasestorage.googleapis.com")
      ) {
        const split = resort[key].split(",").map((u: string) => u.trim());
        split.forEach((u: string) => {
          if (u && !urls.includes(u)) urls.push(u);
        });
      }
    });

    if (urls.length === 0) {
      urls.push(
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
      );
    }
    return urls;
  };

  const images = extractImages();
  const has360Scenes = Array.isArray(resort?.tour_360_scenes) && resort.tour_360_scenes.length > 0;

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-[40vh] md:h-[60vh] mt-16 bg-gray-900 overflow-hidden">
      {/* Hero Image Slider Container */}
      <div id="heroSliderContainer" className="absolute inset-0 w-full h-full">
        {images.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={resort._recordName || "Hero Slide"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentSlide ? "opacity-90" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 pointer-events-none"></div>

      {/* Hero Budget Banner */}
      {lowestPrice && (
        <div
          id="heroBudgetBanner"
          className="absolute top-16 right-4 z-20 bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 text-right transition-all"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            Book This Resort At
          </p>
          <p className="text-2xl font-black text-white leading-none">
            ₹<span id="heroLowestPrice">{lowestPrice.toLocaleString("en-IN")}</span>
          </p>
        </div>
      )}

      {/* 360° Tour Launch Button */}
      {has360Scenes && (
        <button
          id="launch360Btn"
          onClick={onOpen360Tour}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform border border-white z-30 cursor-pointer"
        >
          <i className="ph-fill ph-play-circle text-[#6B0D24] text-2xl"></i> View in 360°
        </button>
      )}
    </div>
  );
}