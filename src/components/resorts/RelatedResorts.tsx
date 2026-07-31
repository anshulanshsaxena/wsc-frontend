'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractCoverImage } from '@/lib/pricing';

interface RelatedResortsProps {
  currentResortId: string;
  currentRooms: number;
  currentLocation: string;
  savedBudgetsMap?: Map<string, number>;
}

export const RelatedResorts: React.FC<RelatedResortsProps> = ({
  currentResortId,
  currentRooms,
  currentLocation,
  savedBudgetsMap,
}) => {
  const [resorts, setResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentLocation) return;

    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, 'resort_data'),
          where('core_location', '==', currentLocation)
        );
        const snap = await getDocs(q);

        const list: any[] = [];
        snap.forEach((docSnap) => {
          const id = docSnap.id;
          if (id === currentResortId) return;

          const data = docSnap.data();
          if (data.core_hidden) return;

          const rooms = Number(data.core_rooms || data.rooms || 0);
          if (rooms >= currentRooms - 10 && rooms <= currentRooms + 10) {
            list.push({
              id,
              name: data._recordName || data.core_name || 'Luxury Resort',
              location: data.core_location || data.core_city || 'India',
              rooms,
              coverImage: extractCoverImage(data),
              savedBudget: savedBudgetsMap?.get(id) || null,
            });
          }
        });

        setResorts(list);
      } catch (e) {
        console.error('Error loading related resorts:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentResortId, currentRooms, currentLocation, savedBudgetsMap]);

  if (!loading && resorts.length === 0) return null;

  return (
    <div className="mb-6 bg-transparent animate-fadeIn">
      <h3 className="text-base md:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
        <i className="ph-bold ph-buildings text-[#6B0D24]"></i> Related Resorts
      </h3>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-xs py-4">Searching matching properties...</div>
      ) : (
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 md:mx-0 px-4 md:px-0 hide-scrollbar snap-x snap-mandatory">
          {resorts.map((resort) => (
            <Link
              key={resort.id}
              href={`/resort/${resort.id}`}
              className="snap-center shrink-0 w-[140px] md:w-[160px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative"
            >
              <div className="h-28 w-full relative overflow-hidden bg-gray-100">
                <img
                  src={resort.coverImage}
                  alt={resort.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {resort.savedBudget && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md text-white py-1 px-2 rounded-lg text-[9px] font-black text-center border border-white/10 truncate">
                    Budget: ₹{resort.savedBudget.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <h4 className="font-black text-gray-900 text-xs truncate leading-tight">
                  {resort.name}
                </h4>
                <div className="mt-1.5 flex flex-col gap-0.5 text-[9px] font-bold text-gray-400">
                  <span className="truncate">
                    <i className="ph-fill ph-map-pin"></i> {resort.location}
                  </span>
                  <span>
                    <i className="ph-fill ph-door"></i> {resort.rooms} Rooms
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};