"use client";

import React, { useState } from "react";
import Link from "next/link";

interface AllOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  bracket: number | null;
  offers: any[];
}

export default function AllOffersModal({
  isOpen,
  onClose,
  bracket,
  offers,
}: AllOffersModalProps) {
  const [limit, setLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  if (!isOpen || !bracket) return null;

  const filteredOffers = offers.filter((o) => Number(o.guests) === Number(bracket));
  const visibleOffers = filteredOffers.slice(0, limit);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setLimit((prev) => prev + 10);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-zinc-950/95 backdrop-blur-md flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-black text-[#780522] uppercase tracking-widest block mb-0.5">
            Campaign Special
          </span>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
            All Active Promotional Offers ({bracket} Guests)
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition"
        >
          <i className="ph-bold ph-x text-lg"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {visibleOffers.map((offer, idx) => (
              <Link
                key={idx}
                href={`/resort-offer?id=${offer.resortId}&guests=${offer.guests}&days=${offer.days}`}
              >
                <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-sm flex flex-col cursor-pointer group hover:shadow-xl hover:border-red-500 transition-all duration-300">
                  <div className="h-48 w-full overflow-hidden relative bg-zinc-950">
                    <img
                      src={offer.resortImage}
                      alt={offer.resortName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-[#780522] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow">
                      {offer.days} Days Offer
                    </span>
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 z-10 border border-zinc-800">
                      <i className="ph-fill ph-door text-red-500"></i> {offer.rooms} Rooms
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between bg-zinc-900">
                    <div>
                      <h3 className="text-base font-black text-white mb-1 leading-tight truncate group-hover:text-red-400 transition-colors">
                        {offer.resortName}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium flex items-center gap-1 mt-3">
                        <i className="ph-fill ph-map-pin text-red-500"></i> {offer.resortLocation}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                          Offer for {offer.guests} Guests
                        </span>
                        <span className="text-base font-black text-white">
                          ₹{Number(offer.calculatedBudget).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors">
                        <i className="ph ph-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredOffers.length > limit && (
            <div className="text-center pb-8">
              <button
                onClick={handleLoadMore}
                className="bg-zinc-800 border border-zinc-700 text-white px-8 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition shadow-sm inline-flex items-center justify-center gap-2"
              >
                {loadingMore && <i className="ph-bold ph-spinner animate-spin text-lg"></i>} Load More
                Offers
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}