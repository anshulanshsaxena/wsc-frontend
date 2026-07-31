'use client';

import React from 'react';

interface ResortGalleryProps {
  images: string[];
  onOpenLightbox?: (images: string[], initialIndex: number) => void;
}

export const ResortGallery: React.FC<ResortGalleryProps> = ({
  images = [],
  onOpenLightbox,
}) => {
  if (!images || images.length === 0) return null;

  const displayLimit = 4;
  const displayedImages = images.slice(0, displayLimit);
  const remainingCount = images.length - displayLimit + 1;

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight flex items-center gap-2">
            <i className="ph-fill ph-image text-[#6B0D24]"></i> Resort Gallery
          </h3>
        </div>
        <span className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 px-3 py-1 rounded-full text-xs font-bold">
          {images.length} Photos
        </span>
      </div>

      {/* Modern Interactive Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {displayedImages.map((url, idx) => {
          const isLast = idx === displayLimit - 1 && images.length > displayLimit;

          return (
            <div
              key={url + idx}
              onClick={() => onOpenLightbox && onOpenLightbox(images, idx)}
              className="relative h-28 sm:h-32 md:h-36 rounded-2xl overflow-hidden cursor-pointer group shadow-xs border border-gray-100"
            >
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {isLast ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-black/70 transition-colors">
                  <span className="text-lg md:text-xl font-black">+{remainingCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">More Photos</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};