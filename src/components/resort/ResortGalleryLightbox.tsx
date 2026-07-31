"use client";

import React, { useState, useEffect } from "react";
import { ResortDetails } from "@/lib/resortService";

interface ResortGalleryLightboxProps {
  resort: ResortDetails;
}

export default function ResortGalleryLightbox({ resort }: ResortGalleryLightboxProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Extract all Firebase Storage photo URLs
  const extractAllPhotos = (): string[] => {
    const photos: string[] = [];
    Object.keys(resort || {}).forEach((key) => {
      if (
        typeof resort[key] === "string" &&
        resort[key].includes("firebasestorage.googleapis.com")
      ) {
        const urls = resort[key].split(",").map((u: string) => u.trim());
        urls.forEach((u: string) => {
          if (u && !photos.includes(u)) photos.push(u);
        });
      }
    });
    return photos;
  };

  const photos = extractAllPhotos();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseLightbox();
      else if (e.key === "ArrowRight") handleNextPhoto();
      else if (e.key === "ArrowLeft") handlePrevPhoto();
    };

    if (lightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  if (photos.length === 0) return null;

  const displayLimit = 4;
  const remainingCount = photos.length - displayLimit + 1;

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIdx(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <>
      {/* STANDALONE RESORT GALLERY SECTION */}
      <div id="standaloneGallerySection" className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight flex items-center gap-2">
              <i className="ph-fill ph-image text-[#6B0D24]"></i> Resort Gallery
            </h3>
          </div>
          <span id="galleryCountBadge" className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 px-3 py-1 rounded-full text-xs font-bold">
            {photos.length} Photos
          </span>
        </div>

        {/* Modern Interactive Image Grid */}
        <div id="standaloneGalleryGrid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.slice(0, displayLimit).map((url, idx) => {
            const isLastThumbnail = idx === displayLimit - 1 && photos.length > displayLimit;

            return (
              <div
                key={idx}
                onClick={() => handleOpenLightbox(idx)}
                className="relative h-28 sm:h-32 md:h-36 rounded-2xl overflow-hidden cursor-pointer group shadow-xs border border-gray-100"
              >
                <img
                  src={url}
                  alt={`Gallery Photo ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isLastThumbnail ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-black/70 transition-colors">
                    <span className="text-lg md:text-xl font-black">+{remainingCount}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      More Photos
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX GALLERY MODAL */}
      {lightboxOpen && (
        <div id="lightboxModal" className="fixed inset-0 z-[200000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-scale-in">
          <button
            onClick={handleCloseLightbox}
            className="fixed top-4 right-4 md:top-6 md:right-6 z-[200005] w-12 h-12 rounded-full bg-white text-black hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center shadow-2xl cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <i className="ph-bold ph-x text-2xl"></i>
          </button>

          <button
            onClick={handlePrevPhoto}
            className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 text-white hover:text-[#6B0D24] p-2 md:p-4 z-[200001] transition-colors cursor-pointer"
          >
            <i className="ph-bold ph-caret-left text-4xl"></i>
          </button>

          <button
            onClick={handleNextPhoto}
            className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 text-white hover:text-[#6B0D24] p-2 md:p-4 z-[200001] transition-colors cursor-pointer"
          >
            <i className="ph-bold ph-caret-right text-4xl"></i>
          </button>

          <img
            id="lightboxImage"
            src={photos[activePhotoIdx]}
            alt="Expanded View"
            className="max-w-[90vw] max-h-[85vh] object-contain transition-opacity duration-300 rounded-xl"
          />

          <div id="lightboxCounter" className="fixed bottom-6 text-white font-bold tracking-widest text-sm bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 z-[200001]">
            {activePhotoIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}