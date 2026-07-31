"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Top10Resort {
  resortId: string;
  resortName: string;
  resortImage: string;
  resortRooms: number;
  rank: number;
}

interface Top10Collection {
  id: string;
  heading: string;
  sequence: number;
  isActive?: boolean;
  resorts: Top10Resort[];
}

interface Top10CollectionsProps {
  sequenceFilter?: number;
}

export default function Top10Collections({ sequenceFilter }: Top10CollectionsProps) {
  const [collections, setCollections] = useState<Top10Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      try {
        const snap = await getDocs(collection(db, "homepage_top10"));
        const cols: Top10Collection[] = [];
        snap.forEach((d) => {
          const data = d.data() as Top10Collection;
          if (data.isActive !== false) {
            cols.push({ ...data, id: d.id });
          }
        });
        cols.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        setCollections(cols);
      } catch (err) {
        console.error("Error loading Top 10 collections:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCollections();
  }, []);

  if (loading) return null;

  const filtered = sequenceFilter
    ? collections.filter((c) => c.sequence === sequenceFilter)
    : collections;

  if (filtered.length === 0) return null;

  return (
    <div className="bg-zinc-950 text-white w-full">
      {filtered.map((col) => {
        const sortedResorts = [...(col.resorts || [])].sort((a, b) => a.rank - b.rank);

        return (
          <div key={col.id} className="py-10 border-b border-zinc-800/60 last:border-none">
            <div className="mb-6 px-4 md:px-8">
              <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-red-500 font-extrabold block mb-1">
                TOP RANKED
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {col.heading}
              </h2>
            </div>

            <div className="flex overflow-x-auto gap-1 pb-6 px-4 md:px-8 scroll-smooth snap-x snap-mandatory zinc-scroll">
              {sortedResorts.map((item, idx) => (
                <div
                  key={`${col.id}-${item.resortId || "item"}-${item.rank || idx}-${idx}`}
                  className="flex items-center relative shrink-0 select-none pl-4 pr-2 py-4 snap-start"
                >
                  <span
                    className="text-[130px] md:text-[210px] font-black leading-none text-transparent select-none font-sans -mr-8 md:-mr-14 z-10"
                    style={{ WebkitTextStroke: "3px #52525b" }}
                  >
                    {item.rank}
                  </span>

                  <Link href={`/resort/${item.resortId}`}>
                    <div className="w-[110px] md:w-[160px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative shrink-0 z-20 cursor-pointer group hover:scale-105 transition-all duration-300 bg-zinc-900 border border-zinc-850">
                      <img
                        src={
                          item.resortImage ||
                          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=300"
                        }
                        alt={item.resortName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-2.5 right-2.5 text-white">
                        <p className="text-[8px] md:text-[10px] text-red-500 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <i className="ph-fill ph-door"></i> {item.resortRooms || 0} Rooms
                        </p>
                        <h4 className="text-[11px] md:text-xs font-black line-clamp-2 leading-tight drop-shadow-md group-hover:text-red-400 transition-colors">
                          {item.resortName}
                        </h4>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}