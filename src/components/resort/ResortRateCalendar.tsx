"use client";

import React, { useState } from "react";

interface CalendarRule {
  startDate?: string;
  endDate?: string;
  adjustmentType?: string;
  value?: string | number;
}

interface ResortRateCalendarProps {
  basePrice: number;
  calendarRules?: CalendarRule[];
  onDateSelect?: (selectedDate: Date, price: number) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ResortRateCalendar({
  basePrice = 12900,
  calendarRules = [],
  onDateSelect,
}: ResortRateCalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(today.getDate());

  const availableYears = [currentYear, currentYear + 1];

  // Filters out past months for the current year
  const availableMonths = MONTH_NAMES.map((name, index) => {
    const isPast = selectedYear === currentYear && index < currentMonth;
    return { name, index, isPast };
  }).filter((m) => !m.isPast);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

  // Generate 30-day calendar cells
  const calendarCells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(selectedYear, selectedMonth, day, 0, 0, 0, 0);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    const isPast = cellDate.getTime() < todayMidnight.getTime();
    let finalPrice = basePrice;
    let isDiscounted = false;
    let discountLabel = "";

    if (Array.isArray(calendarRules) && calendarRules.length > 0) {
      calendarRules.forEach((rule) => {
        if (!rule || !rule.startDate || !rule.endDate) return;

        const sRaw = String(rule.startDate).split("T")[0].replace(/\//g, "-").trim();
        const eRaw = String(rule.endDate).split("T")[0].replace(/\//g, "-").trim();

        const sParts = sRaw.split("-");
        const eParts = eRaw.split("-");

        if (sParts.length === 3 && eParts.length === 3) {
          const startDateObj = new Date(
            parseInt(sParts[0], 10),
            parseInt(sParts[1], 10) - 1,
            parseInt(sParts[2], 10),
            0,
            0,
            0
          );
          const endDateObj = new Date(
            parseInt(eParts[0], 10),
            parseInt(eParts[1], 10) - 1,
            parseInt(eParts[2], 10),
            23,
            59,
            59
          );

          if (cellDate >= startDateObj && cellDate <= endDateObj) {
            const discVal = parseFloat(String(rule.value || 0));
            if (discVal > 0) {
              finalPrice = basePrice - basePrice * (discVal / 100);
              isDiscounted = true;
              discountLabel = `${discVal}% OFF`;
            }
          }
        }
      });
    }

    calendarCells.push({
      dayNum: day,
      isPast,
      price: Math.round(finalPrice),
      isDiscounted,
      discountLabel,
      dateObj: cellDate,
    });
  }

  const handleCellClick = (cell: (typeof calendarCells)[0]) => {
    if (cell.isPast) return;
    setSelectedDayNum(cell.dayNum);
    onDateSelect?.(cell.dateObj, cell.price);
  };

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between">
      {/* Calendar Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-gray-100 relative z-20">
        <div>
          <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight">Select Date</h3>
          <p className="text-xs text-gray-400 font-medium">Click a date to check rate & dynamic discounts</p>
        </div>

        <div className="flex items-center gap-2 relative z-30">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6B0D24] cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.index} value={m.index}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              const yr = parseInt(e.target.value, 10);
              setSelectedYear(yr);
              if (yr === currentYear && selectedMonth < currentMonth) {
                setSelectedMonth(currentMonth);
              }
            }}
            className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6B0D24] cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2 relative z-10">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day} className="text-[10px] font-black text-gray-400 uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* 30-Day Grid */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 relative z-10">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={idx} className="h-10 md:h-12 bg-transparent" />
        ))}

        {calendarCells.map((cell) => {
          const isSelected = cell.dayNum === selectedDayNum;

          let cellClasses =
            "relative h-10 md:h-12 p-1 rounded-sm border transition-all flex flex-col items-center justify-between cursor-pointer select-none ";

          if (cell.isPast) {
            cellClasses += "bg-gray-50 border-gray-100 opacity-40 pointer-events-none";
          } else if (isSelected) {
            cellClasses += "bg-[#FAF6F0] border-[#6B0D24] border-2 shadow-sm scale-105 z-10";
          } else {
            cellClasses += "bg-white border-gray-100 hover:border-[#6B0D24]/30 hover:bg-gray-50";
          }

          const priceColor = cell.isDiscounted
            ? "text-[#C5A059] font-black"
            : isSelected
            ? "text-[#6B0D24] font-black"
            : "text-gray-500 font-medium";

          return (
            <div key={cell.dayNum} onClick={() => handleCellClick(cell)} className={cellClasses}>
              {cell.isDiscounted && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#C5A059] text-white text-[7px] md:text-[8px] font-black px-1 rounded shadow-xs whitespace-nowrap">
                  {cell.discountLabel}
                </span>
              )}
              <span
                className={`text-xs md:text-sm font-black ${
                  isSelected ? "text-[#6B0D24]" : cell.isPast ? "text-gray-400" : "text-gray-800"
                }`}
              >
                {cell.dayNum}
              </span>
              <span className={`text-[9px] md:text-[10px] ${priceColor} tracking-tighter`}>
                ₹{cell.price.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-1.5 text-[11px] text-gray-400 font-medium leading-relaxed relative z-10">
        <i className="ph-fill ph-calendar text-[#6B0D24] text-sm shrink-0 mt-0.5"></i>
        <p>
          Choosing dates is only for checking the pricing on a particular date and not confirming the
          availability of the resort for that date.
        </p>
      </div>
    </div>
  );
}