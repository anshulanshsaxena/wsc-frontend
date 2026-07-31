'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearch } from '@/context/SearchContext';
import { usePlaceholderAnimation } from '@/hooks/usePlaceholderAnimation';
import { useGuestRoomSequencer } from '@/hooks/useGuestRoomSequencer';

interface SearchIndexItem {
  id?: string;
  name: string;
  location?: string;
  rooms?: number;
  type: 'resort' | 'location';
}

interface InlineSearchBarProps {
  onSearchStart?: () => void;
}

const PLACEHOLDERS = [
  'Where do you want to get married?',
  'Jim Corbett',
  'Jaipur',
  'Mussoorie',
  'Goa',
];

export default function InlineSearchBar({ onSearchStart }: InlineSearchBarProps) {
  const router = useRouter();
  const {
    mainSearchInput,
    setMainSearchInput,
    guestCount,
    setGuestCount,
    roomCount,
    setRoomCount,
    selectedSearchType,
    setSelectedSearchType,
  } = useSearch();

  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [filteredLocs, setFilteredLocs] = useState<SearchIndexItem[]>([]);
  const [filteredResorts, setFilteredResorts] = useState<SearchIndexItem[]>([]);
  const calendarCells = [];

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentPlaceholder, fadeState } = usePlaceholderAnimation(PLACEHOLDERS);

  // State Freeze Rules
  const isResortSearch = selectedSearchType === 'resort';
  const guestsDisabled = isResortSearch || parseInt(roomCount) > 0;
  const roomsDisabled = isResortSearch || parseInt(guestCount) > 0;

  // Interruption check for guest/room sequencer
  const isInterrupted = Boolean(guestCount || roomCount || isResortSearch);
  const { guestPlaceholder, roomPlaceholder, guestState, roomState } =
    useGuestRoomSequencer({ isInterrupted });

  // Lazy Fetch Search Index from Firestore / Cache
  const loadSearchIndex = async () => {
    if (searchIndex.length > 0) return;

    const cached = sessionStorage.getItem('wsc_search_index_cache');
    if (cached) {
      try {
        setSearchIndex(JSON.parse(cached));
        return;
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

    try {
      const snap = await getDocs(collection(db, 'resort_data'));
      const locs: string[] = [];
      const resorts: SearchIndexItem[] = [];

      snap.forEach((d) => {
        const data = d.data();
        if (data.core_hidden) return;

        const name = data._recordName || data.name || '';
        const location = data.core_location || data.location || '';
        const rooms = parseInt(data.core_rooms || data.rooms || 0);

        resorts.push({
          id: d.id,
          name,
          location,
          rooms,
          type: 'resort',
        });

        if (location && !locs.includes(location)) {
          locs.push(location);
        }
      });

      const fullIndex: SearchIndexItem[] = [
        ...locs.map((loc) => ({ name: loc, type: 'location' as const })),
        ...resorts,
      ];

      setSearchIndex(fullIndex);
      sessionStorage.setItem('wsc_search_index_cache', JSON.stringify(fullIndex));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  // Outside click listener for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter autocomplete suggestions on typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMainSearchInput(val);

    if (!val.trim()) {
      setDropdownOpen(false);
      setSelectedSearchType('general');
      return;
    }

    const raw = val.toLowerCase().trim();
    const locs = searchIndex.filter(
      (i) => i.type === 'location' && i.name.toLowerCase().includes(raw)
    );
    const res = searchIndex.filter(
      (i) => i.type === 'resort' && i.name.toLowerCase().includes(raw)
    );

    setFilteredLocs(locs.slice(0, 5));
    setFilteredResorts(res.slice(0, 5));
    setDropdownOpen(locs.length > 0 || res.length > 0);
  };

  // Handle Suggestion Item Click
  const handleSelectSuggestion = (item: SearchIndexItem) => {
    setMainSearchInput(item.name);
    setSelectedSearchType(item.type);
    setDropdownOpen(false);

    if (item.type === 'resort') {
      setGuestCount('');
      setRoomCount('');
    }
  };

  const activeGuests = parseInt(guestCount) || 0;
  const activeRooms = parseInt(roomCount) || 0;
  const isLocationSearch = selectedSearchType === 'location' || selectedSearchType === 'general';
  const isBtnDimmed = mainSearchInput.trim() && isLocationSearch && !activeGuests && !activeRooms;

  // Execute Search Redirect
  const handleSearchExecute = () => {
    const term = mainSearchInput.trim();
    if (!term) {
      alert('Please enter a resort name or location to begin search.');
      return;
    }

    if (isLocationSearch && !activeGuests && !activeRooms) {
      setWarningVisible(true);
      setTimeout(() => setWarningVisible(false), 2000);
      return;
    }

    sessionStorage.setItem('wsc_prev_search_q', term);
    sessionStorage.setItem('wsc_prev_search_guests', activeGuests ? activeGuests.toString() : '');
    sessionStorage.setItem('wsc_prev_search_rooms', activeRooms ? activeRooms.toString() : '');

    onSearchStart?.();

    const queryParams = new URLSearchParams({ q: term });
    if (activeGuests > 0) queryParams.set('guests', activeGuests.toString());
    if (activeRooms > 0) queryParams.set('rooms', activeRooms.toString());

    setTimeout(() => {
      router.push(`/search?${queryParams.toString()}`);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchExecute();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-50 my-4" ref={dropdownRef}>
      <div className="w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-[0_15px_50px_rgba(0,0,0,0.1)] p-2 md:p-3 relative">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 items-stretch text-left">
          {/* Main Input Column */}
          <div className="w-full md:flex-1 p-4 flex flex-col justify-center relative min-w-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              City, Property Name Or Location
            </span>
            <div className="relative flex items-center">
              <input
                type="text"
                value={mainSearchInput}
                onFocus={loadSearchIndex}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={currentPlaceholder}
                className={`w-full bg-transparent border-none outline-none text-base md:text-lg font-black text-gray-900 placeholder-gray-300 py-1 transition-opacity ${
                  fadeState === 'fade-out' ? 'placeholder-fade-out' : 'placeholder-active'
                }`}
                autoComplete="off"
              />
            </div>

            {/* Suggestions Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-[120] custom-scrollbar p-2">
                {filteredLocs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-3 py-1.5">
                      Destinations
                    </div>
                    {filteredLocs.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-[#780522] rounded-xl flex items-center gap-2 transition"
                      >
                        <i className="ph-fill ph-map-pin text-gray-400"></i> {item.name}
                      </button>
                    ))}
                  </div>
                )}

                {filteredResorts.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-3 py-1.5">
                      Venues
                    </div>
                    {filteredResorts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-[#780522] rounded-xl flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2">
                          <i className="ph-fill ph-buildings text-gray-400"></i> {item.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {item.location}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guests & Rooms Row */}
          <div className="w-full md:w-auto flex flex-row divide-x divide-gray-100">
            {/* Guest Block */}
            <div
              className={`w-1/2 md:w-56 p-4 flex flex-col justify-center transition-all duration-300 ${
                guestsDisabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                Guests <i className="ph ph-users text-gray-400"></i>
              </span>
              <input
                type="number"
                value={guestCount}
                disabled={guestsDisabled}
                onChange={(e) => setGuestCount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={guestPlaceholder}
                className={`w-full bg-transparent border-none outline-none text-base md:text-lg font-black text-gray-900 py-1 transition-opacity ${
                  guestsDisabled || guestState === 'frozen'
                    ? 'placeholder-gray-400'
                    : guestState === 'fade-out'
                    ? 'placeholder-fade-out'
                    : 'placeholder-active'
                }`}
                min="1"
              />
            </div>

            {/* Room Block */}
            <div
              className={`w-1/2 md:w-56 p-4 flex flex-col justify-center transition-all duration-300 ${
                roomsDisabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                Or Rooms <i className="ph ph-door text-gray-400"></i>
              </span>
              <input
                type="number"
                value={roomCount}
                disabled={roomsDisabled}
                onChange={(e) => setRoomCount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={roomPlaceholder}
                className={`w-full bg-transparent border-none outline-none text-base md:text-lg font-black text-gray-900 py-1 transition-opacity ${
                  roomsDisabled || roomState === 'frozen'
                    ? 'placeholder-gray-400'
                    : roomState === 'fade-out'
                    ? 'placeholder-fade-out'
                    : 'placeholder-active'
                }`}
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button & Warning Tooltip */}
      <div className="flex flex-col items-center justify-center -mt-4 relative z-[110]">
        <button
          onClick={handleSearchExecute}
          className={`bg-[#780522] hover:bg-stone-900 text-white font-black px-16 py-4 rounded-full shadow-[0_8px_30px_rgba(120,5,34,0.3)] transition-all text-sm uppercase tracking-widest flex items-center gap-2 ${
            isBtnDimmed
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-[0_8px_30px_rgba(120,5,34,0.5)] hover:scale-[1.02]'
          }`}
        >
          Search <i className="ph-bold ph-magnifying-glass"></i>
        </button>

        {/* Warning Tooltip */}
        <div
          className={`text-xs text-red-600 font-bold mt-3 bg-white/95 px-4 py-1.5 rounded-full border border-red-100 shadow-sm transition-opacity duration-300 ${
            warningVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          Please Enter Number Of Guest Or Number Of Rooms
        </div>
      </div>
    </div>
  );
}