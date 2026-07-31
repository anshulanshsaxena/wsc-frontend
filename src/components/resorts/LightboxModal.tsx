'use client';

import React, { useState, useEffect } from 'react';

interface LightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  images = [],
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const changeImage = (newIndex: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setFading(false);
    }, 150);
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const nextIdx = (currentIndex + 1) % images.length;
    changeImage(nextIdx);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    changeImage(prevIdx);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black flex flex-col items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-red-500 p-2 z-50 transition-colors"
      >
        <i className="ph-bold ph-x text-3xl"></i>
      </button>

      {/* Prev Button */}
      <button
        onClick={handlePrev}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white hover:text-[#6B0D24] p-2 md:p-4 z-50 transition-colors"
      >
        <i className="ph-bold ph-caret-left text-4xl"></i>
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white hover:text-[#6B0D24] p-2 md:p-4 z-50 transition-colors"
      >
        <i className="ph-bold ph-caret-right text-4xl"></i>
      </button>

      {/* Image Display */}
      <img
        src={images[currentIndex]}
        alt={`Lightbox Image ${currentIndex + 1}`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Counter Badge */}
      <div className="absolute bottom-6 text-white font-bold tracking-widest text-sm bg-black/50 px-4 py-1.5 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};