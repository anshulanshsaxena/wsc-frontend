'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface ItineraryEvent {
  id: string;
  title: string;
  startTime: string; // "10:00"
  endTime: string;   // "13:00"
  description?: string;
  isCustom?: boolean;
}

interface WeddingItineraryCreatorProps {
  budgets: any[];
  userName?: string;
}

export default function WeddingItineraryCreator({
  budgets = [],
  userName = 'Wedding Couple',
}: WeddingItineraryCreatorProps) {
  // 1. Resort Selection State
  const [selectedResortId, setSelectedResortId] = useState<string>('');
  const [coupleName, setCoupleName] = useState<string>('Anshul & Ananya');
  const [hasDayZero, setHasDayZero] = useState<boolean>(false);

  // Itinerary Store: Record<dayKey, ItineraryEvent[]>
  const [itinerary, setItinerary] = useState<Record<string, ItineraryEvent[]>>({
    day_1: [
      {
        id: 'evt_1',
        title: 'Guest Check-In & Welcome Lunch',
        startTime: '12:00',
        endTime: '15:00',
        description: 'Pastel traditional attire. Welcome drinks at Lawn.',
        isCustom: true,
      },
    ],
  });

  // New Event Form State
  const [addingDayKey, setAddingDayKey] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCustomTitle, setEventCustomTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [eventDesc, setEventDesc] = useState('');
  const [showDescInput, setShowDescInput] = useState(false);
  const [isMinorCustom, setIsMinorCustom] = useState(false);

  // Auto-select initial resort budget
  useEffect(() => {
    if (budgets.length > 0 && !selectedResortId) {
      setSelectedResortId(budgets[0].resortId || budgets[0].docId);
    }
  }, [budgets, selectedResortId]);

  // Selected Budget Object
  const activeBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;
    return (
      budgets.find((b) => (b.resortId || b.docId) === selectedResortId) || budgets[0]
    );
  }, [budgets, selectedResortId]);

  // Helper: Format Date into "Wed 22 Nov 2026"
  const formatDateWithWeekday = (dateObj: Date): string => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  };

  // Helper: Convert "14:30" to minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Helper: Format "14:00" to "02:00 PM"
  const formatTime12Hr = (timeStr: string): string => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${String(displayH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  // Date Math & Day Schedule Structure
  const daySchedule = useMemo(() => {
    if (!activeBudget) return [];

    let checkInDateObj = new Date();
    if (activeBudget.checkInDate && activeBudget.checkInDate !== 'Not Selected') {
      checkInDateObj = new Date(activeBudget.checkInDate + 'T00:00:00');
      if (isNaN(checkInDateObj.getTime())) checkInDateObj = new Date();
    }

    const totalDays = Number(activeBudget.days) || 2;
    const schedule = [];

    // Optional Day 0 (Day before check-in)
    if (hasDayZero) {
      const day0Obj = new Date(checkInDateObj);
      day0Obj.setDate(day0Obj.getDate() - 1);
      schedule.push({
        key: 'day_0',
        label: 'Day 0',
        sublabel: 'Pre-Wedding Arrival',
        formattedDate: formatDateWithWeekday(day0Obj),
        isCheckOut: false,
      });
    }

    // Day 1 to Day N
    for (let i = 1; i <= totalDays; i++) {
      const dayObj = new Date(checkInDateObj);
      dayObj.setDate(dayObj.getDate() + (i - 1));
      schedule.push({
        key: `day_${i}`,
        label: `Day ${i}`,
        sublabel: i === 1 ? 'Check-in & Function Day' : `Celebration Day ${i}`,
        formattedDate: formatDateWithWeekday(dayObj),
        isCheckOut: false,
      });
    }

    // Checkout Day (Day N + 1)
    const checkOutObj = new Date(checkInDateObj);
    checkOutObj.setDate(checkOutObj.getDate() + totalDays);
    schedule.push({
      key: `checkout_day`,
      label: 'Check Out',
      sublabel: 'Guest Departure',
      formattedDate: formatDateWithWeekday(checkOutObj),
      isCheckOut: true,
    });

    return schedule;
  }, [activeBudget, hasDayZero]);

  // Overall Date Range String e.g. "Wed 22 Nov 2026 - Fri 24 Nov 2026"
  const overallDateRangeStr = useMemo(() => {
    if (daySchedule.length === 0) return '';
    const firstDay = daySchedule[0];
    const lastDay = daySchedule[daySchedule.length - 1];
    return `${firstDay.formattedDate} - ${lastDay.formattedDate}`;
  }, [daySchedule]);

  // 1. EXTRACT UNIQUE EVENT CATEGORIES FROM SAVED BUDGET (EXCLUDING GENERAL REQUIREMENTS)
  const eventCategories = useMemo(() => {
    if (!activeBudget || !activeBudget.selectedItems) return [];
    const categoriesSet = new Set<string>();

    activeBudget.selectedItems.forEach((it: any) => {
      const cat = (it.category || '').trim();
      if (cat && !cat.toLowerCase().includes('general')) {
        categoriesSet.add(cat);
      }
    });

    return Array.from(categoriesSet);
  }, [activeBudget]);

  // 2. COLLECT ALL EVENT TITLES ALREADY SCHEDULED IN ITINERARY
  const usedEventTitles = useMemo(() => {
    const titles = new Set<string>();
    Object.values(itinerary).forEach((dayEvts) => {
      (dayEvts || []).forEach((evt) => {
        if (evt.title) titles.add(evt.title);
      });
    });
    return titles;
  }, [itinerary]);

  // 3. FILTER CATEGORIES THAT CAN BE SELECTED (ONE-TIME SELECTION RULE)
  const availableCategoryOptions = useMemo(() => {
    return eventCategories.filter((cat) => !usedEventTitles.has(cat));
  }, [eventCategories, usedEventTitles]);

  // Time Clash Validation
  const validateTimeClash = (dayKey: string, newStart: string, newEnd: string, currentEvtId?: string): boolean => {
    const newStartMins = timeToMinutes(newStart);
    const newEndMins = timeToMinutes(newEnd);

    if (newStartMins >= newEndMins) {
      alert('⚠️ End time must be after start time.');
      return false;
    }

    const dayEvents = itinerary[dayKey] || [];
    for (const evt of dayEvents) {
      if (currentEvtId && evt.id === currentEvtId) continue;
      const existStart = timeToMinutes(evt.startTime);
      const existEnd = timeToMinutes(evt.endTime);

      if (newStartMins < existEnd && newEndMins > existStart) {
        alert(
          `⚠️ Time Clash Detected!\n\nThis event (${formatTime12Hr(newStart)} - ${formatTime12Hr(newEnd)}) overlaps with "${evt.title}" (${formatTime12Hr(evt.startTime)} - ${formatTime12Hr(evt.endTime)}).`
        );
        return false;
      }
    }

    return true;
  };

  // Add Event Handler
  const handleAddEventSubmit = (dayKey: string) => {
    const finalTitle = isMinorCustom ? eventCustomTitle.trim() : eventTitle.trim();

    if (!finalTitle) {
      alert('Please select or enter an event name.');
      return;
    }

    if (!validateTimeClash(dayKey, startTime, endTime)) {
      return;
    }

    const newEvt: ItineraryEvent = {
      id: `evt_${Date.now()}`,
      title: finalTitle,
      startTime,
      endTime,
      description: showDescInput ? eventDesc.trim() : undefined,
      isCustom: isMinorCustom,
    };

    setItinerary((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), newEvt].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      ),
    }));

    // Reset Form
    setAddingDayKey(null);
    setEventTitle('');
    setEventCustomTitle('');
    setEventDesc('');
    setShowDescInput(false);
    setIsMinorCustom(false);
  };

  // Remove Event
  const handleRemoveEvent = (dayKey: string, eventId: string) => {
    setItinerary((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((e) => e.id !== eventId),
    }));
  };

  // PDF Print & Download Handler
  const handleDownloadPDF = () => {
    window.print();
  };

  if (!activeBudget) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-12">
      {/* PRINT-ONLY DEDICATED LUXURY STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printableItinerary,
          #printableItinerary * {
            visibility: visible;
          }
          #printableItinerary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER & RESORT SELECTOR */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
            Custom Wedding Itinerary Planner
          </span>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <i className="ph-fill ph-calendar-check text-[#6B0D24]"></i>
            Wedding Itinerary
          </h3>
        </div>

        {/* RESORT SELECTOR DROPDOWN (Shown if multiple resorts exist) */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {budgets.length > 1 ? (
            <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-2xl flex items-center gap-2">
              <i className="ph-fill ph-buildings text-[#6B0D24] text-base"></i>
              <select
                value={selectedResortId}
                onChange={(e) => setSelectedResortId(e.target.value)}
                className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
              >
                {budgets.map((b) => (
                  <option key={b.resortId || b.docId} value={b.resortId || b.docId}>
                    {b.resortName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5">
              <i className="ph-fill ph-buildings text-sm"></i>
              {activeBudget.resortName}
            </span>
          )}

          {/* PDF DOWNLOAD BUTTON */}
          <button
            onClick={handleDownloadPDF}
            className="bg-[#6B0D24] hover:bg-[#520a1a] text-white font-bold px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2"
          >
            <i className="ph-bold ph-file-pdf text-base text-[#C5A059]"></i>
            Download PDF
          </button>
        </div>
      </div>

      {/* ITINERARY CONTAINER (PRINTABLE AREA) */}
      <div id="printableItinerary" className="space-y-8">
        {/* BRIDE & GROOM HEADER BANNER */}
        <div className="bg-gradient-to-r from-[#6B0D24] to-[#8C1B36] text-white p-6 rounded-2xl shadow-sm border border-[#C5A059]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <i className="ph-fill ph-[#6B0D24] ph-crown text-[#C5A059] text-xl"></i>
              <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">
                Wedding Celebration
              </span>
            </div>

            {/* Editable Couple Name Input (Fixed Mobile Overflow) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 no-print w-full max-w-full">
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Bride & Groom Names"
                className="w-full sm:w-auto max-w-full bg-white/10 border border-white/20 text-white placeholder-gray-300 font-black text-base sm:text-xl md:text-2xl rounded-xl px-3 py-1.5 outline-none focus:border-[#C5A059] transition"
              />
              <span className="text-[11px] sm:text-xs text-[#C5A059] font-bold flex items-center gap-1 shrink-0">
                ✏️ Edit Names
              </span>
            </div>

            {/* Print View Name Header */}
            <h2 className="hidden print:block text-2xl font-black text-white">{coupleName}</h2>

            <p className="text-xs text-gray-200 font-medium mt-2 flex items-center gap-1.5">
              <i className="ph-fill ph-map-pin text-[#C5A059]"></i>
              {activeBudget.resortName} ({activeBudget.resortLocation || 'India'})
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#C5A059] border border-white/10 block mb-1">
              {overallDateRangeStr}
            </span>
            <span className="text-[10px] text-gray-300 font-medium block">
              {activeBudget.guests} Guests &bull; {activeBudget.days} Days Celebration
            </span>
          </div>
        </div>

        {/* DAY ZERO TOGGLE BUTTON */}
        {!hasDayZero && (
          <div className="no-print text-right">
            <button
              onClick={() => setHasDayZero(true)}
              className="bg-[#FAF6F0] text-[#6B0D24] hover:bg-[#6B0D24] hover:text-white border border-[#6B0D24]/20 font-bold px-4 py-2 rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-2xs"
            >
              <i className="ph-bold ph-plus text-sm"></i> Add Day Zero (Pre-Arrival Day)
            </button>
          </div>
        )}

        {/* DAYS & EVENTS TIMELINE CARDS */}
        <div className="space-y-6">
          {daySchedule.map((day) => {
            const dayEvents = itinerary[day.key] || [];

            return (
              <div
                key={day.key}
                className={`border rounded-2xl p-5 md:p-6 transition ${
                  day.isCheckOut
                    ? 'bg-stone-50 border-stone-200/80 opacity-90'
                    : 'bg-white border-gray-200 hover:border-[#6B0D24]/30 shadow-2xs'
                }`}
              >
                {/* Day Header Bar */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                        day.isCheckOut
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-[#6B0D24] text-white'
                      }`}
                    >
                      {day.label}
                    </span>
                    <h4 className="font-black text-gray-900 text-base md:text-lg">
                      {day.formattedDate}
                    </h4>

                    {/* DELETE DAY ZERO BUTTON */}
                    {day.key === 'day_0' && (
                      <button
                        onClick={() => {
                          setHasDayZero(false);
                          setItinerary((prev) => {
                            const copy = { ...prev };
                            delete copy.day_0;
                            return copy;
                          });
                        }}
                        className="no-print text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-xl transition flex items-center gap-1"
                        title="Remove Day Zero"
                      >
                        <i className="ph-bold ph-trash text-xs"></i> Delete Day 0
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#C5A059] bg-[#FAF6F0] border border-[#C5A059]/20 px-3 py-1 rounded-lg self-start sm:self-auto">
                    {day.sublabel}
                  </span>
                </div>

                {/* Day Events List */}
                <div className="mt-4 space-y-3">
                  {day.isCheckOut ? (
                    /* Checkout Day Placeholder */
                    <div className="p-4 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-2">
                        <i className="ph-fill ph-sign-out text-[#6B0D24] text-base"></i>
                        Guest Check Out & Bon Voyage
                      </span>
                      <span className="text-[10px] uppercase text-gray-400">11:00 AM Departure</span>
                    </div>
                  ) : dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium italic py-2">
                      No events added for this day yet. Click below to add an event.
                    </p>
                  ) : (
                    dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-gray-200 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-white border border-gray-200 text-[#6B0D24] font-black text-xs px-2.5 py-1 rounded-md shadow-2xs">
                              ⏰ {formatTime12Hr(evt.startTime)} - {formatTime12Hr(evt.endTime)}
                            </span>
                            <h5 className="font-black text-gray-900 text-sm">{evt.title}</h5>
                            {evt.isCustom && (
                              <span className="bg-[#FAF6F0] text-[#6B0D24] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                Custom Minor Event
                              </span>
                            )}
                          </div>

                          {evt.description && (
                            <p className="text-xs text-gray-500 font-medium mt-2 pl-1 border-l-2 border-[#C5A059]">
                              {evt.description}
                            </p>
                          )}
                        </div>

                        {/* Remove Event Button */}
                        <button
                          onClick={() => handleRemoveEvent(day.key, evt.id)}
                          className="no-print text-gray-400 hover:text-red-600 p-1 self-end sm:self-center transition"
                          title="Remove Event"
                        >
                          <i className="ph-bold ph-trash text-base"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* ADD EVENT BUTTONS (Disabled for Checkout Day) */}
                {!day.isCheckOut && (
                  <div className="no-print mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {addingDayKey === day.key ? (
                      /* Inline Event Creation Form */
                      <div className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h5 className="text-xs font-black uppercase text-[#6B0D24]">
                            Add Event to {day.label}
                          </h5>
                          <button
                            onClick={() => setAddingDayKey(null)}
                            className="text-gray-400 hover:text-black font-bold text-xs"
                          >
                            ✖ Cancel
                          </button>
                        </div>

                        {/* Choice: Hide Saved Categories for Day 0 */}
                        {day.key !== 'day_0' ? (
                          <div className="flex gap-2 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setIsMinorCustom(false)}
                              className={`px-3 py-1.5 rounded-lg border transition ${
                                !isMinorCustom
                                  ? 'bg-[#6B0D24] text-white border-[#6B0D24]'
                                  : 'bg-white text-gray-600 border-gray-200'
                              }`}
                            >
                              Select Saved Function Category
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsMinorCustom(true)}
                              className={`px-3 py-1.5 rounded-lg border transition ${
                                isMinorCustom
                                  ? 'bg-[#6B0D24] text-white border-[#6B0D24]'
                                  : 'bg-white text-gray-600 border-gray-200'
                              }`}
                            >
                              + Add Minor Custom Event
                            </button>
                          </div>
                        ) : (
                          <div className="bg-[#FAF6F0] p-2.5 rounded-xl border border-[#6B0D24]/10 text-xs font-bold text-[#6B0D24]">
                            <span>ℹ️ Day 0 (Pre-Arrival): Only custom minor events can be added.</span>
                          </div>
                        )}

                        {/* Event Name Input / Category Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Event Title
                          </label>
                          {!isMinorCustom ? (
                            availableCategoryOptions.length > 0 ? (
                              <select
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none"
                              >
                                <option value="">-- Choose Function Category from Saved Budget --</option>
                                {availableCategoryOptions.map((cat: string, idx: number) => (
                                  <option key={idx} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl font-bold border border-amber-200">
                                All saved function categories have been scheduled! Click "+ Add Minor Custom Event" to add additional events.
                              </p>
                            )
                          ) : (
                            <input
                              type="text"
                              value={eventCustomTitle}
                              onChange={(e) => setEventCustomTitle(e.target.value)}
                              placeholder="e.g. High Tea, Pool Party, Baraat Assembly, DJ Night"
                              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none"
                            />
                          )}
                        </div>

                        {/* Start & End Times (+Event Start Time & +Event End Time) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              + Event Start Time
                            </label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              + Event End Time
                            </label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800 outline-none"
                            />
                          </div>
                        </div>

                        {/* Optional Description / Note Button */}
                        {!showDescInput ? (
                          <button
                            type="button"
                            onClick={() => setShowDescInput(true)}
                            className="text-xs font-bold text-[#6B0D24] hover:underline flex items-center gap-1"
                          >
                            + Add Description / Dress Code Notes
                          </button>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Dress Code / Venue Notes
                            </label>
                            <textarea
                              value={eventDesc}
                              onChange={(e) => setEventDesc(e.target.value)}
                              placeholder="e.g. Pastel outfit. Venue: Poolside Lawn"
                              rows={2}
                              className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-medium text-gray-800 outline-none"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddEventSubmit(day.key)}
                          className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                        >
                          Confirm & Add Event to {day.label}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingDayKey(day.key);
                          if (day.key === 'day_0') {
                            setIsMinorCustom(true);
                          } else if (availableCategoryOptions.length > 0) {
                            setIsMinorCustom(false);
                            setEventTitle(availableCategoryOptions[0]);
                          } else {
                            // If all saved categories are used up, default to minor custom event
                            setIsMinorCustom(true);
                          }
                        }}
                        className="bg-white hover:bg-gray-50 text-[#6B0D24] border border-[#6B0D24]/30 hover:border-[#6B0D24] font-bold px-3.5 py-2 rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-2xs mt-2"
                      >
                        <i className="ph-bold ph-plus text-sm"></i>
                        {dayEvents.length > 0
                          ? `+ Add Another Event to ${day.label}`
                          : `Add Event to ${day.label}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}