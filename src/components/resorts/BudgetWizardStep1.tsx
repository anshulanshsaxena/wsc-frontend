'use client';

import React, { useState } from 'react';

interface BudgetWizardStep1Props {
  rooms?: number;
  onStartWizard: (params: { checkIn: string; checkOut: string; guests: number }) => void;
}

export const BudgetWizardStep1: React.FC<BudgetWizardStep1Props> = ({
  rooms = 0,
  onStartWizard,
}) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(150);

  const [minCheckout, setMinCheckout] = useState('');
  const [maxCheckout, setMaxCheckout] = useState('');

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCheckIn(val);

    if (val) {
      const d = new Date(val);
      const minD = new Date(d);
      minD.setDate(minD.getDate() + 1);
      const maxD = new Date(d);
      maxD.setDate(maxD.getDate() + 4);

      const minStr = minD.toISOString().split('T')[0];
      const maxStr = maxD.toISOString().split('T')[0];

      setMinCheckout(minStr);
      setMaxCheckout(maxStr);

      if (checkOut && (checkOut < minStr || checkOut > maxStr)) {
        setCheckOut('');
      }
    } else {
      setMinCheckout('');
      setMaxCheckout('');
      setCheckOut('');
    }
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let entered = parseInt(e.target.value) || 0;
    if (rooms > 0) {
      const maxAllowed = rooms * 3 + 10;
      if (entered > maxAllowed) {
        alert(
          `Capacity Limit Reached!\n\nThis resort has ${rooms} rooms. Maximum allowed is ${maxAllowed} guests.`
        );
        entered = maxAllowed;
      }
    }
    setGuests(entered);
  };

  const handleStart = () => {
    if (!checkIn || !checkOut) {
      alert('Please select valid Check-In and Check-Out dates.');
      return;
    }
    onStartWizard({ checkIn, checkOut, guests });
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
          <p className="text-xs text-gray-400 font-medium">Select dates & guests to customize your budget</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-In</label>
            <input
              type="date"
              value={checkIn}
              onChange={handleCheckInChange}
              className="w-full p-2.5 md:p-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-xs md:text-sm font-bold bg-[#FAF6F0]/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Check-Out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={minCheckout}
              max={maxCheckout}
              disabled={!checkIn}
              className="w-full p-2.5 md:p-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-xs md:text-sm font-bold bg-[#FAF6F0]/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimated Guests</label>
          <div className="relative">
            <i className="ph-fill ph-users absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B0D24] text-lg"></i>
            <input
              type="number"
              value={guests}
              onChange={handleGuestChange}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl border border-gray-200 focus:border-[#6B0D24] outline-none text-base md:text-lg font-black text-gray-900 bg-[#FAF6F0]/50"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="w-full mt-2 bg-[#6B0D24] text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-[#520a1a] transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider"
        >
          <span>Select Events & Estimate Budget</span>
          <i className="ph-bold ph-arrow-right text-base"></i>
        </button>
      </div>
    </div>
  );
};