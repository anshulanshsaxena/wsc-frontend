'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getResortBasePrice, extractCoverImage } from '@/lib/pricing';

interface SimilarBudgetResortsProps {
  currentResortId: string;
  currentBasePrice: number;
  schemaStructure: any[];
  savedBudgetsMap?: Map<string, number>;
}

export const SimilarBudgetResorts: React.FC<SimilarBudgetResortsProps> = ({
  currentResortId,
  currentBasePrice,
  schemaStructure,
  savedBudgetsMap,
}) => {
  const [resorts, setResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBasePrice || currentBasePrice <= 0) return;

    const fetchBudgetResorts = async () => {
      try {
        const q = query(collection(db, 'resort_data'));
        const snap = await getDocs(q);

        const minPrice = currentBasePrice * 0.9;
        const maxPrice = currentBasePrice * 1.1;

        const list: any[] = [];
        snap.forEach((docSnap) => {
          const id = docSnap.id;
          if (id === currentResortId) return;

          const data = docSnap.data();
          if (data.core_hidden) return;

          const otherPrice = getResortBasePrice(data, schemaStructure);
          if (otherPrice >= minPrice && otherPrice <= maxPrice) {
            list.push({
              id,
              name: data._recordName || data.core_name || 'Luxury Resort',
              location: data.core_location || data.core_city || 'India',
              rooms: data.core_rooms || data.rooms || 0,
              price: otherPrice,
              coverImage: extractCoverImage(data),
              savedBudget: savedBudgetsMap?.get(id) || null,
            });
          }
        });

        setResorts(list);
      } catch (e) {
        console.error('Error fetching similar budget resorts:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetResorts();
  }, [currentResortId, currentBasePrice, schemaStructure, savedBudgetsMap]);

  if (!loading && resorts.length === 0) return null;

  return (
    <div className="mb-6 bg-transparent animate-fadeIn">
      <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
        <i className="ph-bold ph-currency-inr text-[#C5A059]"></i> Similar Budget Resorts
      </h3>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-xs py-4">Searching matching properties...</div>
      ) : (
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 md:mx-0 px-4 md:px-0 hide-scrollbar snap-x snap-mandatory">
          {resorts.map((resort) => (
            <Link
              key={resort.id}
              href={`/resort/${resort.id}`}
              className="snap-center shrink-0 w-[200px] md:w-[220px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative animate-fadeIn"
            >
              <div className="h-24 w-full overflow-hidden bg-gray-100">
                <img
                  src={resort.coverImage}
                  alt={resort.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-xs line-clamp-1 leading-tight mb-1">
                    {resort.name}
                  </h4>
                  <div className="flex flex-col gap-0.5 text-[9px] font-bold text-gray-400">
                    <span className="truncate flex items-center gap-1">
                      <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> {resort.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ph-fill ph-door"></i> {resort.rooms} Rooms
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ph-fill ph-currency-inr text-[#C5A059]"></i> ₹
                      {resort.price.toLocaleString('en-IN')}/person
                    </span>
                  </div>
                </div>
                {resort.savedBudget && (
                  <div className="bg-[#C5A059]/10 text-[#C5A059] py-1 px-2.5 rounded-lg text-[10px] font-black text-center border border-[#C5A059]/20 mt-2 truncate w-full">
                    Budget: ₹{resort.savedBudget.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};