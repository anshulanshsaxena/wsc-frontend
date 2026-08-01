'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface FavoriteItem {
  id: string;
  name: string;
  location: string;
  rooms: number;
  image: string;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
}

export default function FavoritesModal({
  isOpen,
  onClose,
  favorites,
}: FavoritesModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200000] bg-gray-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center">
              <i className="ph-fill ph-heart text-lg"></i>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight">
                Your Favorite Resorts
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {favorites.length} Saved {favorites.length === 1 ? 'Resort' : 'Resorts'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((fav) => {
              const displayImage =
                fav.image ||
                'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80';

              return (
                <div
                  key={fav.id}
                  onClick={() => {
                    onClose();
                    router.push(`/resort/${fav.id}`);
                  }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#6B0D24] transition-all cursor-pointer group flex flex-col"
                >
                  <div className="h-32 w-full relative bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={displayImage}
                      alt={fav.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>

                    {/* Rooms Badge */}
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <i className="ph-fill ph-door"></i> {fav.rooms} Rooms
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-gray-900 text-xs md:text-sm leading-tight mb-1 truncate group-hover:text-[#6B0D24] transition-colors">
                        {fav.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                        <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> {fav.location}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#6B0D24]">
                      <span>View Resort Details</span>
                      <i className="ph-bold ph-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}