"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface PromotionalSectionProps {
  sectionId: string;
}

export default function PromotionalSection({ sectionId }: PromotionalSectionProps) {
  const [data, setData] = useState<any>(null);
  const [blendedResorts, setBlendedResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotion() {
      try {
        const secSnap = await getDoc(doc(db, "promotional_sections", sectionId));
        if (!secSnap.exists()) {
          setLoading(false);
          return;
        }

        const secData = secSnap.data();
        setData(secData);

        const blended: any[] = [];
        for (const promoResort of secData.resorts || []) {
          try {
            const rDoc = await getDoc(doc(db, "resort_data", promoResort.resortId));
            blended.push({
              ...promoResort,
              liveData: rDoc.exists() ? rDoc.data() : null,
            });
          } catch (e) {
            blended.push({ ...promoResort, liveData: null });
          }
        }
        setBlendedResorts(blended);
      } catch (err) {
        console.error("Error loading promo section:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPromotion();
  }, [sectionId]);

  if (loading || !data || blendedResorts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{data.heading}</h2>
        <p className="text-sm text-stone-500 font-medium mt-1">
          {data.subheading || `Handpicked destination configurations calculated for ${data.guestCount} guests.`}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory">
        {blendedResorts.map((resort) => {
          const live = resort.liveData || {};
          const expertRating = live.core_expert_rating || "4.5";
          const rooms = live.core_rooms || "--";
          const offerTag = live.core_offer || resort.tag || "";

          return (
            <Link key={resort.resortId} href={`/resort/${resort.resortId}`}>
              <div className="group w-[290px] md:w-[340px] shrink-0 snap-start bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer">
                <div className="h-52 overflow-hidden relative bg-gray-50">
                  <img
                    src={resort.image}
                    alt={resort.resortName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur text-gray-900 text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center shadow border border-gray-100 z-10">
                    <i className="ph-fill ph-check-circle text-green-500 mr-1"></i> Expert: {expertRating}
                    {live.core_star_rating && (
                      <>
                        <span className="ml-1 text-gray-300">|</span>
                        <span className="ml-1 text-yellow-500 flex items-center gap-0.5">
                          <i className="ph-fill ph-star text-[10px]"></i> {live.core_star_rating} Star
                        </span>
                      </>
                    )}
                  </div>

                  {offerTag && (
                    <span className="absolute bottom-3 left-3 bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded shadow-md z-10 animate-pulse">
                      {offerTag}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-gray-900 mb-1 group-hover:text-[#780522] transition-colors leading-tight truncate">
                      {resort.resortName}
                    </h3>
                    <p className="text-xs text-stone-500 font-semibold flex items-center gap-1 mt-2">
                      <i className="ph-fill ph-map-pin text-red-500"></i> {resort.location}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                        Calculated for {data.guestCount} Guests
                      </span>
                      <span className="text-base font-black text-gray-950">
                        ₹{Number(resort.calculatedBudget).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <i className="ph-fill ph-door"></i> {rooms} Rms
                      </span>
                      <span className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-stone-600 transition-colors group-hover:bg-black group-hover:text-white">
                        <i className="ph ph-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}