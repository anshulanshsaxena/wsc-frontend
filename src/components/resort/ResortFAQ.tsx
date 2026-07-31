"use client";

import React from "react";

interface ResortFAQProps {
  resortName: string;
  location: string;
  rooms: number | string;
  feature?: string;
}

export default function ResortFAQ({
  resortName,
  location,
  rooms,
  feature,
}: ResortFAQProps) {
  return (
    <section className="border-t border-gray-100 pt-6 mt-6 w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
      <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <i className="ph-bold ph-question text-[#6B0D24] text-sm"></i> Frequently Asked Questions about {resortName}
      </h3>

      <div className="space-y-4 text-xs md:text-sm text-gray-700 font-medium w-full">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="font-bold text-gray-900 mb-1">
            How many rooms are available at {resortName}?
          </p>
          <p className="text-gray-600">
            {resortName} offers a total of {rooms || "--"} guest rooms for accommodation.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="font-bold text-gray-900 mb-1">Where is {resortName} located?</p>
          <p className="text-gray-600">
            {resortName} is located in {location}, India.
          </p>
        </div>

        {feature && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">
              Is {resortName} a {feature} property?
            </p>
            <p className="text-gray-600">
              Yes, {resortName} is categorized and highly rated for its unique {feature} atmosphere and surroundings.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}