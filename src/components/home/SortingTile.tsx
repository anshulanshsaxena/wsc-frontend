"use client";

import React from "react";
import { SortingTileData } from "@/lib/sortingsEngine";

interface SortingTileProps {
  tile: SortingTileData;
  shapeType: "circular" | "square" | "horizontal" | "vertical";
  onSelect: () => void;
}

export default function SortingTile({ tile, shapeType, onSelect }: SortingTileProps) {
  const imageSrc =
    tile.image ||
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=300";
  const totalMatching = tile.assignedResortIds ? tile.assignedResortIds.length : 0;

  if (shapeType === "circular") {
    return (
      <div
        onClick={onSelect}
        className="w-[110px] md:w-[150px] shrink-0 snap-start px-2 text-center cursor-pointer select-none group"
      >
        <div className="aspect-square w-full rounded-full overflow-hidden border border-gray-100 shadow-sm relative mb-2">
          <img
            src={imageSrc}
            alt={tile.label}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
        <h4 className="text-xs font-black text-gray-900 truncate px-1 leading-none mb-1">
          {tile.label}
        </h4>
        <span className="block text-[9px] text-[#780522] font-bold leading-none">
          {totalMatching} Resorts
        </span>
      </div>
    );
  }

  if (shapeType === "square") {
    return (
      <div
        onClick={onSelect}
        className="w-[140px] md:w-[200px] shrink-0 snap-start px-2 cursor-pointer select-none group"
      >
        <div className="aspect-square w-full rounded-2xl overflow-hidden border border-gray-150 shadow-sm relative mb-2">
          <img
            src={imageSrc}
            alt={tile.label}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-3 text-white">
            <h4 className="text-xs font-black truncate leading-none mb-1">{tile.label}</h4>
            <span className="block text-[8px] text-white/85 font-bold leading-none">
              {totalMatching} Resorts
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (shapeType === "horizontal") {
    return (
      <div
        onClick={onSelect}
        className="w-[220px] md:w-[320px] shrink-0 snap-start px-2 cursor-pointer select-none group"
      >
        <div className="aspect-[14/9] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative mb-2">
          <img
            src={imageSrc}
            alt={tile.label}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h4 className="text-sm font-black truncate leading-none mb-1">{tile.label}</h4>
            <span className="block text-[9px] text-white/80 font-bold leading-none">
              {totalMatching} Resorts
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Vertical shape fallback
  return (
    <div
      onClick={onSelect}
      className="w-[130px] md:w-[180px] shrink-0 snap-start px-2 cursor-pointer select-none group"
    >
      <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative mb-2">
        <img
          src={imageSrc}
          alt={tile.label}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h4 className="text-sm font-black truncate leading-none mb-1">{tile.label}</h4>
          <span className="block text-[9px] text-white/80 font-bold leading-none">
            {totalMatching} Resorts
          </span>
        </div>
      </div>
    </div>
  );
}