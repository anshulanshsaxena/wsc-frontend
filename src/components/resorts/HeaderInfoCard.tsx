import React from 'react';

interface HeaderInfoCardProps {
  resortName: string;
  location?: string;
  brand?: string;
  starRating?: string;
  address?: string;
  rooms?: number | string;
  startingPrice?: number;
  offer?: string;
}

export const HeaderInfoCard: React.FC<HeaderInfoCardProps> = ({
  resortName,
  location = 'Location not set',
  brand,
  starRating,
  address,
  rooms = 0,
  startingPrice = 0,
  offer,
}) => {
  // Calculate Pax Capacity (Rooms x2 to Rooms x3)
  const roomsNum = Number(rooms) || 0;
  const capacityText =
    roomsNum > 0
      ? `${roomsNum} Rooms (${roomsNum * 2} - ${roomsNum * 3} Pax)`
      : `${rooms || '--'} Rooms`;

  // Parse Star Rating
  let starCount: number | null = null;
  if (starRating) {
    const match = starRating.match(/\d+/);
    if (match) {
      starCount = parseInt(match[0], 10);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl border border-gray-100 mb-6">
      <div className="w-full">
        {/* Offer Tag */}
        {offer && offer.trim() !== '' && (
          <div className="inline-flex items-center gap-1 bg-[#C5A059]/10 text-[#C5A059] px-2.5 py-1 rounded-lg text-xs font-bold mb-2">
            <i className="ph-fill ph-tag"></i> <span>{offer}</span>
          </div>
        )}

        {/* Resort Name */}
        <h1 className="text-2xl md:text-4xl font-black text-[#6B0D24] leading-tight w-full break-words">
          {resortName || 'Loading Resort...'}
        </h1>

        {/* Brand Name & Star Rating Pill Bar */}
        <div className="flex items-center gap-2 flex-wrap mt-2 mb-1.5">
          {brand && brand.trim() !== '' && (
            <span className="inline-flex items-center gap-1 bg-[#6B0D24]/10 text-[#6B0D24] text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <i className="ph-bold ph-buildings text-xs"></i> <span>{brand}</span>
            </span>
          )}

          {starRating && starRating.trim() !== '' && (
            <span className="inline-flex items-center gap-1.5 bg-[#6B0D24] text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
              <span className="flex items-center gap-0.5 text-amber-300 text-xs">
                {starCount !== null ? (
                  Array.from({ length: starCount }).map((_, i) => (
                    <i key={i} className="ph-fill ph-star"></i>
                  ))
                ) : (
                  <i className="ph-fill ph-crown text-amber-300"></i>
                )}
              </span>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                {starCount !== null ? `${starCount} STAR` : starRating.toUpperCase()}
              </span>
            </span>
          )}
        </div>

        {/* Location */}
        <p className="text-gray-500 text-xs md:text-sm flex items-center gap-1 mt-1 font-medium">
          <i className="ph-fill ph-map-pin text-[#6B0D24]/80"></i> {location}
        </p>

        {/* Address */}
        {address && (
          <p className="text-gray-500 text-xs flex items-start gap-1 mt-1 font-normal leading-relaxed">
            <i className="ph-fill ph-navigation-arrow text-[#6B0D24]/70 shrink-0 mt-0.5"></i>
            <span>{address}</span>
          </p>
        )}
      </div>

      {/* Starting Price & Room Capacity Footer */}
      <div className="flex gap-3 md:gap-6 mt-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Starting Price
          </p>
          <p className="text-lg md:text-2xl font-black text-gray-900 leading-tight">
            ₹
            <span className="inline-block transition-all duration-300 transform scale-100">
              {startingPrice > 0 ? startingPrice.toLocaleString('en-IN') : '...'}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-semibold"> /person</span>
          </p>
        </div>
        <div className="border-l border-gray-200 pl-3 md:pl-6">
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Rooms
          </p>
          <p className="text-sm md:text-lg font-bold text-gray-900 leading-tight">
            {capacityText}
          </p>
        </div>
      </div>
    </div>
  );
};