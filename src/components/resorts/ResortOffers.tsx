'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ResortOffersProps {
  resortId: string;
  coverImageUrl: string;
}

export const ResortOffers: React.FC<ResortOffersProps> = ({ resortId, coverImageUrl }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resortId) return;

    const fetchOffers = async () => {
      try {
        const offerQuery = query(
          collection(db, 'resort_offers'),
          where('__name__', '>=', `${resortId}_offer`),
          where('__name__', '<=', `${resortId}_offer\uf8ff`)
        );

        const snap = await getDocs(offerQuery);
        if (snap.empty) {
          setOffers([]);
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeOffers: any[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();

          const validFrom = data.validFrom ? new Date(data.validFrom) : null;
          const validTo = data.validTo ? new Date(data.validTo) : null;
          if (validTo) validTo.setHours(23, 59, 59, 999);

          const isCurrentlyValid =
            (!validFrom || today >= validFrom) && (!validTo || today <= validTo);
          if (!isCurrentlyValid) return;

          const guests = data.guests || data.pax || 150;
          const days = data.days || 2;
          const budget = data.calculatedBudget || data.budget || 0;
          const discountPercent = data.discountPercent || data.offerPercent || data.discount || 0;

          const fromStr = validFrom
            ? validFrom.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Now';
          const toStr = validTo
            ? validTo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Limited Time';

          activeOffers.push({
            id: docSnap.id,
            guests,
            days,
            budget,
            discountPercent,
            fromStr,
            toStr,
            redirectUrl: `/resort-offer?id=${resortId}&guests=${guests}&days=${days}`,
          });
        });

        setOffers(activeOffers);
      } catch (err) {
        console.error('Error fetching resort offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [resortId]);

  if (!loading && offers.length === 0) return null;

  return (
    <div className="mb-6 bg-transparent animate-fadeIn">
      <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
        <i className="ph-bold ph-tag text-[#6B0D24]"></i> Offers for this Resort
      </h3>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-xs py-2">Loading active offers...</div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 md:mx-0 px-4 md:px-0 hide-scrollbar snap-x snap-mandatory">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={offer.redirectUrl}
              className="snap-center shrink-0 w-[260px] md:w-[300px] bg-white border border-[#C5A059]/30 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col relative group"
            >
              <div className="h-36 w-full relative overflow-hidden bg-gray-100">
                <img
                  src={coverImageUrl}
                  alt="Resort Offer"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {offer.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-[#6B0D24] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg border border-white/20">
                    {offer.discountPercent}% OFF
                  </div>
                )}

                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end text-white">
                  <div>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                      Estimated Budget
                    </p>
                    <p className="text-xl font-black text-[#C5A059] leading-tight">
                      ₹{Number(offer.budget).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                    {offer.guests} Guests / {offer.days} Days
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <i className="ph-fill ph-calendar-blank text-[#6B0D24]"></i>
                    <span>
                      Valid: <strong className="text-gray-900">{offer.fromStr} - {offer.toStr}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <i className="ph-fill ph-users text-[#6B0D24]"></i>
                    <span>
                      Guest Capacity: <strong className="text-gray-900">{offer.guests} Pax ({offer.days} Days Package)</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[#6B0D24] font-black text-xs group-hover:translate-x-1 transition-transform">
                  <span>Claim This Offer</span>
                  <i className="ph-bold ph-arrow-right text-sm"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};