"use client";

import React from "react";

interface Step1BudgetCalculatorProps {
  checkIn: string;
  checkOut: string;
  guests: number;
  maxRooms: number;
  onCheckInChange: (val: string) => void;
  onCheckOutChange: (val: string) => void;
  onGuestsChange: (val: number) => void;
  onStartWizard: () => void;
}

export default function Step1BudgetCalculator({
  checkIn,
  checkOut,
  guests,
  maxRooms,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onStartWizard,
}: Step1BudgetCalculatorProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate Check-Out Bounds (Min +1 day, Max +4 days)
  const getCheckOutBounds = () => {
    if (!checkIn) return { min: todayStr, max: "" };
    const d = new Date(checkIn);
    const min = new Date(d);
    min.setDate(min.getDate() + 1);
    const max = new Date(d);
    max.setDate(max.getDate() + 4);

    return {
      min: min.toISOString().split("T")[0],
      max: max.toISOString().split("T")[0],
    };
  };

  const bounds = getCheckOutBounds();
  const maxAllowedGuests = maxRooms > 0 ? maxRooms * 3 + 10 : 0;

  const handleGuestChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10) || 0;
    if (maxAllowedGuests > 0 && val > maxAllowedGuests) {
      alert(`Capacity Limit Reached!\n\nThis resort has ${maxRooms} rooms. Maximum allowed is ${maxAllowedGuests} guests.`);
      val = maxAllowedGuests;
    }
    onGuestsChange(val);
  };

  return (
    <div
      id="resortBudgetCalculatorContainer"
      className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden"
    >
      <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base md:text-lg font-black text-[#6B0D24] flex items-center gap-2 leading-tight">
            <i className="ph-bold ph-calculator text-[#C5A059] text-xl"></i> Estimate Wedding Budget
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            Select dates & guests to customize your budget
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Check-In
            </label>
            <input
              type="date"
              id="wizCheckIn"
              value={checkIn}
              min={todayStr}
              onChange={(e) => onCheckInChange(e.target.value)}
              className="w-full p-2.5 md:p-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-xs md:text-sm font-bold bg-[#FAF6F0]/50 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Check-Out
            </label>
            <input
              type="date"
              id="wizCheckOut"
              value={checkOut}
              min={bounds.min}
              max={bounds.max}
              disabled={!checkIn}
              onChange={(e) => onCheckOutChange(e.target.value)}
              className="w-full p-2.5 md:p-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-xs md:text-sm font-bold bg-[#FAF6F0]/50 text-gray-900 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Estimated Guests
          </label>
          <div className="relative">
            <i className="ph-fill ph-users absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B0D24] text-lg"></i>
            <input
              type="number"
              id="wizGuests"
              value={guests}
              onChange={handleGuestChangeInternal}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-base md:text-lg font-black text-gray-900 bg-[#FAF6F0]/50"
              min="1"
            />
          </div>
          {maxAllowedGuests > 0 && (
            <p
              id="wizGuestHintText"
              className="text-[10px] text-[#C5A059] mt-1.5 font-bold uppercase tracking-wider"
            >
              Max Capacity: {maxAllowedGuests} Guests
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onStartWizard}
          className="w-full mt-2 bg-[#6B0D24] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#520a1a] transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider cursor-pointer"
        >
          <span>Select Events & Estimate Budget</span>
          <i className="ph-bold ph-arrow-right text-base"></i>
        </button>
      </div>
    </div>
  );
}