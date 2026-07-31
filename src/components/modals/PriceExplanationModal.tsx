"use client";

import React from "react";

interface PriceExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PriceExplanationModal({
  isOpen,
  onClose,
}: PriceExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <i className="ph-bold ph-x text-xl"></i>
        </button>
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-inner">
            <i className="ph-bold ph-info"></i>
          </div>
          <h3 className="text-xl font-black text-gray-900 leading-tight">
            Price Per Person Per Day Means:
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            This is the price that will cost for one guest to stay and have meals for one day in the
            resort. This covers only the stay and all meals at the hotel for one guest for one day on
            double or triple sharing.
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-2">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
              Calculation Example
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              For example, if the price per person per day to book a resort is{" "}
              <span className="font-bold text-gray-900">Rs 10,000</span> and you want to book that
              resort for <span className="font-bold text-gray-900">2 days</span> for{" "}
              <span className="font-bold text-gray-900">100 guests</span>:
            </p>
            <div className="mt-3 bg-white border border-gray-200/60 rounded-xl p-3 text-center">
              <code className="text-xs md:text-sm font-mono font-bold text-black">
                10,000 × 2 × 100 = Rs 20,00,000
              </code>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-md"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}