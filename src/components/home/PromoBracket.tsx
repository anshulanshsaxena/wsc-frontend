"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface ResortOffer {
  resortId: string;
  resortName: string;
  resortImage: string;
  resortLocation: string;
  guests: number;
  rooms: number;
  days: number;
  calculatedBudget: number;
  isActive?: boolean;
}

interface PromoBracketProps {
  guestCount: number;
  onViewAll?: (bracket: number) => void;
}

export default function PromoBracket({ guestCount, onViewAll }: PromoBracketProps) {
  const [offers, setOffers] = useState<ResortOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBracketOffers() {
      try {
        const snap = await getDocs(collection(db, "resort_offers"));
        const matched: ResortOffer[] = [];

        snap.forEach((d) => {
          const data = d.data() as ResortOffer;
          if (data.isActive !== false && Number(data.guests) === Number(guestCount)) {
            matched.push(data);
          }
        });

        setOffers(matched);
      } catch (err) {
        console.error("Error loading bracket offers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBracketOffers();
  }, [guestCount]);

  if (loading || offers.length === 0) return null;

  const visibleOffers = offers.slice(0, 10);
  const hasMoreThan5 = offers.length > 5;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#780522] font-extrabold block mb-1">
            PROMOTIONAL OFFER CAMPAIGN
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Special Curations for {guestCount} Guests
          </h3>
        </div>

        {hasMoreThan5 && (
          <button
            onClick={() => onViewAll?.(guestCount)}
            className="text-xs text-[#780522] font-black hover:underline bg-[#780522]/5 hover:bg-[#780522]/10 px-5 py-2.5 rounded-full transition-colors shrink-0"
          >
            View All
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x scroll-smooth">
        {visibleOffers.map((offer, idx) => (
          <Link
            key={idx}
            href={`/resort-offer?id=${offer.resortId}&guests=${offer.guests}&days=${offer.days}`}
          >
            <div className="flex-shrink-0 w-[290px] md:w-[340px] bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer snap-start group">
              <div className="h-44 w-full relative overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={offer.resortImage}
                  alt={offer.resortName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-[#780522] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md z-10 animate-pulse">
                  {offer.days} Days Offer
                </span>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1 z-10">
                  <i className="ph-fill ph-door text-red-500"></i> {offer.rooms} Rooms
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <h4 className="font-black text-gray-900 text-base leading-tight truncate">
                    {offer.resortName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-semibold">
                    <i className="ph-fill ph-map-pin text-red-500"></i> {offer.resortLocation}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-black">
                      Offer for {offer.guests} Guests
                    </span>
                    <span className="text-base font-black text-gray-900">
                      ₹{Number(offer.calculatedBudget).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-stone-600 transition-colors group-hover:bg-black group-hover:text-white">
                    <i className="ph ph-arrow-right text-xs"></i>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}