"use client";

import React from "react";

interface ResortMapCardProps {
  resortName: string;
  location: string;
  address?: string;
  geolocationUrl?: string;
}

export default function ResortMapCard({
  resortName,
  location,
  address,
  geolocationUrl,
}: ResortMapCardProps) {
  const addressText = address || location || resortName;

  const targetMapUrl =
    geolocationUrl && geolocationUrl.startsWith("http") && !geolocationUrl.includes("embed")
      ? geolocationUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${resortName} ${addressText}`
        )}`;

  const getEmbedIframeSrc = (): string => {
    if (geolocationUrl && geolocationUrl.includes("google.com/maps/embed")) {
      const srcMatch = geolocationUrl.match(/src=["']([^"']+)["']/);
      return srcMatch ? srcMatch[1] : geolocationUrl;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      `${resortName} ${addressText}`
    )}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  const iframeSrc = getEmbedIframeSrc();

  return (
    <div id="resortMapCard" className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
          <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight flex items-center gap-2">
            <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> Distance From Your Location
          </h3>

          <a
            id="openMapsBtn"
            href={targetMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FAF6F0] text-[#6B0D24] hover:bg-[#6B0D24] hover:text-white transition-colors px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#6B0D24]/20 shrink-0"
          >
            <span>Open Map</span> <i className="ph-bold ph-arrow-square-out text-sm"></i>
          </a>
        </div>

        {/* Map Display Box */}
        <a
          id="mapClickWrapper"
          href={targetMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden relative group border border-gray-200 bg-gray-100 shadow-inner"
        >
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
            title="Resort Location Map"
          />

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-end justify-center p-4">
            <div className="bg-white/95 backdrop-blur-md text-gray-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 group-hover:scale-105 transition-transform">
              <i className="ph-fill ph-navigation-arrow text-[#6B0D24]"></i> Get Directions on Google Maps
            </div>
          </div>
        </a>
      </div>

      <p id="mapAddressFooter" className="text-xs text-gray-500 font-medium mt-3 flex items-start gap-1.5">
        <i className="ph-fill ph-map-pin text-[#6B0D24] shrink-0 mt-0.5"></i>
        <span id="mapAddressFooterText">{addressText}</span>
      </p>
    </div>
  );
}