"use client";

import React, { useEffect, useState } from "react";
import { fetchHomepageSortings, SortingSectionData } from "@/lib/sortingsEngine";
import SortingTile from "./SortingTile";

interface DynamicSortingsProps {
  sequenceFilter?: number;
  onTileClick?: (sectionId: string, tileId: string) => void;
}

export default function DynamicSortings({
  sequenceFilter,
  onTileClick,
}: DynamicSortingsProps) {
  const [sections, setSections] = useState<SortingSectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSortings() {
      const data = await fetchHomepageSortings();
      setSections(data);
      setLoading(false);
    }
    initSortings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-8 animate-pulse">
        <div className="h-6 w-52 bg-gray-200 rounded-md mb-2" />
        <div className="h-4 w-80 bg-gray-200 rounded-md mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="w-28 h-28 rounded-full bg-gray-200 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const filteredSections = sequenceFilter
    ? sections.filter((s) => s.sequence === sequenceFilter)
    : sections.filter((s) => !sequenceFilter);

  if (filteredSections.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto pt-4 pb-4 space-y-4">
      {filteredSections.map((section) => (
        <section key={section.id} className="py-2 border-b border-gray-100 last:border-none">
          <div className="mb-2 px-4 md:px-8">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              {section.heading}
            </h2>
            {section.description && (
              <p className="text-xs text-stone-500 mt-1 font-medium">{section.description}</p>
            )}
          </div>

          {/* Explicit horizontal flex container */}
          <div className="flex overflow-x-auto space-x-2 px-4 md:px-8 py-2 custom-scrollbar snap-x snap-mandatory">
            {(section.tiles || []).map((tile) => (
              <SortingTile
                key={tile.id}
                tile={tile}
                shapeType={section.shapeType || "circular"}
                onSelect={() => onTileClick?.(section.id, tile.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}