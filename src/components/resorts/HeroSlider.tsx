'use client';

import React, { useState, useEffect } from 'react';

interface HeroSliderProps {
  images: string[];
  lowestPrice?: number | null;
  has360Tour?: boolean;
  onOpen360?: () => void;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop';

export const HeroSlider: React.FC<HeroSliderProps> = ({
  images = [],
  lowestPrice,
  has360Tour = false,
  onOpen360,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const displayImages = images.length > 0 ? images : [DEFAULT_IMAGE];

  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div className="relative w-full h-[40vh] md:h-[60vh] mt-16 bg-gray-900 overflow-hidden">
      {/* Images with Smooth Fade Transitions */}
      <div className="absolute inset-0 w-full h-full">
        {displayImages.map((url, idx) => (
          <img
            key={url + idx}
            src={url}
            alt="Resort View"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-90' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 pointer-events-none" />

      {/* Floating Lowest Price Banner */}
      {lowestPrice !== undefined && lowestPrice !== null && (
        <div className="absolute top-16 right-4 z-20 bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 text-right transition-all">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            Book This Resort At
          </p>
          <p className="text-2xl font-black text-white leading-none">
            ₹{lowestPrice.toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* 360 Tour Launch Button */}
      {has360Tour && (
        <button
          onClick={onOpen360}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform border border-white z-30"
        >
          <i className="ph-fill ph-play-circle text-[#6B0D24] text-2xl"></i> View in 360°
        </button>
      )}
    </div>
  );
};