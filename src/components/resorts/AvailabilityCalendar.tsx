'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PricingTier, CalendarRule, getPriceForGuestCount } from '@/lib/pricing';

interface AvailabilityCalendarProps {
  pricingTiers?: PricingTier[];
  calendarRules?: CalendarRule[];
  basePrice?: number;
  guestCount?: number;
  onDateSelect?: (date: Date, pricePerPerson: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to safely parse dates from string, ISO, or Firestore Timestamp
function parseRuleDate(raw: any, isEnd: boolean): Date | null {
  if (!raw) return null;
  if (typeof raw.toDate === 'function') {
    const d = raw.toDate();
    d.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    return d;
  }
  if (typeof raw === 'object' && raw.seconds !== undefined) {
    const d = new Date(raw.seconds * 1000);
    d.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    return d;
  }
  const str = String(raw).split('T')[0].split(' ')[0].replace(/\//g, '-').trim();
  const parts = str.split('-');
  if (parts.length === 3) {
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10) - 1;
    const dy = parseInt(parts[2], 10);
    if (!isNaN(yr) && !isNaN(mo) && !isNaN(dy)) {
      return new Date(yr, mo, dy, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    }
  }
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) {
    fallback.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    return fallback;
  }
  return null;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  pricingTiers = [],
  calendarRules = [],
  basePrice = 0,
  guestCount = 150,
  onDateSelect,
}) => {
  const today = useMemo(() => new Date(), []);
  const currentYearNow = today.getFullYear();
  const currentMonthNow = today.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYearNow);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNow);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const availableMonths = useMemo(() => {
    return MONTH_NAMES.map((name, index) => ({ name, index })).filter((m) => {
      if (selectedYear === currentYearNow) {
        return m.index >= currentMonthNow;
      }
      return true;
    });
  }, [selectedYear, currentYearNow, currentMonthNow]);

  useEffect(() => {
    if (selectedYear === currentYearNow && selectedMonth < currentMonthNow) {
      setSelectedMonth(currentMonthNow);
    }
  }, [selectedYear, selectedMonth, currentYearNow, currentMonthNow]);

  const activeBasePrice = useMemo(() => {
    return getPriceForGuestCount(guestCount, pricingTiers, basePrice);
  }, [guestCount, pricingTiers, basePrice]);

  const { calendarDays, firstDayIndex } = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const startWeekday = new Date(selectedYear, selectedMonth, 1).getDay();

    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);

    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(selectedYear, selectedMonth, day, 0, 0, 0, 0);
      let finalPrice = activeBasePrice;
      let isDiscounted = false;
      let discountLabel = '';

      if (Array.isArray(calendarRules) && calendarRules.length > 0) {
        calendarRules.forEach((rule: any) => {
          if (!rule) return;
          const startRaw = rule.startDate || rule.start_date || rule.sDate;
          const endRaw = rule.endDate || rule.end_date || rule.eDate;

          const startDateObj = parseRuleDate(startRaw, false);
          const endDateObj = parseRuleDate(endRaw, true);

          if (startDateObj && endDateObj) {
            if (cellDate >= startDateObj && cellDate <= endDateObj) {
              const discVal = parseFloat(
                String(
                  rule.value ??
                    rule.discount ??
                    rule.discountPercent ??
                    rule.adjustmentValue ??
                    rule.amount ??
                    0
                )
              );
              if (discVal > 0) {
                finalPrice = activeBasePrice - activeBasePrice * (discVal / 100);
                isDiscounted = true;
                discountLabel = `${discVal}% OFF`;
              }
            }
          }
        });
      }

      days.push({
        dayNum: day,
        monthStr: cellDate.toLocaleDateString('en-US', { month: 'short' }),
        isPast: cellDate.getTime() < todayZero.getTime(),
        price: Math.round(finalPrice),
        isDiscounted,
        discountLabel,
        dateObj: cellDate,
      });
    }

    return { calendarDays: days, firstDayIndex: startWeekday };
  }, [selectedYear, selectedMonth, activeBasePrice, calendarRules]);

  const handleSelectDay = (dayData: (typeof calendarDays)[0]) => {
    if (dayData.isPast) return;
    setSelectedDay(dayData.dayNum);
    if (onDateSelect) {
      onDateSelect(dayData.dateObj, dayData.price);
    }
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
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6B0D24] cursor-pointer"
          >
            <option value={currentYearNow}>{currentYearNow}</option>
            <option value={currentYearNow + 1}>{currentYearNow + 1}</option>
          </select>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2 relative z-10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d} className="text-[10px] font-black text-gray-400 uppercase">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 relative z-10">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty_${idx}`} className="h-10 md:h-12 bg-transparent" />
        ))}

        {calendarDays.map((day) => {
          const isSelected = day.dayNum === selectedDay;

          let cellClasses =
            'relative h-10 md:h-12 p-1 rounded-sm border transition-all flex flex-col items-center justify-between cursor-pointer select-none ';

          if (day.isPast) {
            cellClasses += 'bg-gray-50 border-gray-100 opacity-40 pointer-events-none';
          } else if (isSelected) {
            cellClasses += 'bg-[#FAF6F0] border-[#6B0D24] border-2 shadow-sm scale-105 z-10';
          } else {
            cellClasses += 'bg-white border-gray-100 hover:border-[#6B0D24]/30 hover:bg-gray-50';
          }

          const priceColor = day.isDiscounted
            ? isSelected
              ? 'text-[#C5A059] font-black'
              : 'text-[#C5A059] font-bold'
            : isSelected
            ? 'text-[#6B0D24] font-black'
            : 'text-gray-500 font-medium';

          return (
            <div
              key={day.dayNum}
              className={cellClasses}
              onClick={() => handleSelectDay(day)}
            >
              {day.isDiscounted && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#C5A059] text-white text-[7px] md:text-[8px] font-black px-1 rounded shadow-xs whitespace-nowrap z-20">
                  {day.discountLabel}
                </span>
              )}
              <span
                className={`text-xs md:text-sm font-black ${
                  isSelected
                    ? 'text-[#6B0D24]'
                    : day.isPast
                    ? 'text-gray-400'
                    : 'text-gray-800'
                }`}
              >
                {day.dayNum}
              </span>
              <span className={`text-[9px] md:text-[10px] ${priceColor} tracking-tighter`}>
                ₹{day.price.toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar Disclaimer Note */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-1.5 text-[11px] text-gray-400 font-medium leading-relaxed relative z-10">
        <i className="ph-fill ph-calendar text-[#6B0D24] text-sm shrink-0 mt-0.5"></i>
        <p>
          Choosing dates is only for checking the pricing on a particular date and not confirming the availability of the resort for that date.
        </p>
      </div>
    </div>
  );
};