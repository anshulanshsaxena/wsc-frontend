"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchNavbar from "@/components/search/SearchNavbar";
import GlobalLoader from "@/components/layout/GlobalLoader";
import PersistentSearchBar from "@/components/search/PersistentSearchBar";
import HeroLanding from "@/components/search/HeroLanding";
import FilterSortBar, { ActiveFilterPill } from "@/components/search/FilterSortBar";
import MarketingTabs from "@/components/search/MarketingTabs";
import ResortsGrid from "@/components/search/ResortsGrid";

import SortDrawer from "@/components/search/SortDrawer";
import FilterDrawer from "@/components/search/FilterDrawer";
import FavoritesAuthModal from "@/components/modals/FavoritesAuthModal";
import PriceExplanationModal from "@/components/modals/PriceExplanationModal";
import ConsentPopup from "@/components/modals/ConsentPopup";

import { useSearchEngine, PRICE_RANGES, ROOM_RANGES } from "@/hooks/useSearchEngine";
import { useSearch } from "@/context/SearchContext";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    setMainSearchInput,
    setGuestCount,
    setRoomCount,
    setSelectedSearchType,
  } = useSearch();

  const searchEngine = useSearchEngine();
  const {
    allResorts,
    baseSearchResults,
    filteredResorts,
    isSearching,
    runSearch,
    priceFieldIds,
    selectedPriceRanges,
    setSelectedPriceRanges,
    selectedLocations,
    setSelectedLocations,
    selectedStars,
    setSelectedStars,
    selectedBrands,
    setSelectedBrands,
    selectedFeatures,
    setSelectedFeatures,
    selectedRooms,
    setSelectedRooms,
    marketingTag,
    setMarketingTag,
    sortOption,
    setSortOption,
    clearAllFilters,
    totalActiveFilterCount,
  } = searchEngine;

  const [hasSearched, setHasSearched] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeSortLabel, setActiveSortLabel] = useState("");
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // Read URL params and enforce strict mutual exclusivity
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const guests = parseInt(searchParams.get("guests") || "0") || 0;
    const rooms = parseInt(searchParams.get("rooms") || "0") || 0;

    setMainSearchInput(q);

    if (guests > 0) {
      setGuestCount(guests.toString());
      setRoomCount("");
    } else if (rooms > 0) {
      setRoomCount(rooms.toString());
      setGuestCount("");
    } else {
      setGuestCount("");
      setRoomCount("");
    }

    if (q) {
      setHasSearched(true);
      runSearch(q, guests, rooms, "general");
    }
  }, [searchParams]);

  // Execute Search Handler
  const handleExecuteSearch = (
    term: string,
    guests: number,
    rooms: number,
    type: "resort" | "location" | "general" | null,
    item?: any
  ) => {
    setHasSearched(true);

    const params = new URLSearchParams({ q: term });
    if (guests > 0) {
      params.set("guests", guests.toString());
      setRoomCount("");
    } else if (rooms > 0) {
      params.set("rooms", rooms.toString());
      setGuestCount("");
    }

    router.push(`/search?${params.toString()}`);
    runSearch(term, guests, rooms, type, item);
  };

  const handleQuickSearch = (destination: string) => {
    setMainSearchInput(destination);
    setSelectedSearchType("location");
    setGuestCount("");
    setRoomCount("");
    handleExecuteSearch(destination, 0, 0, "location");
  };

  const handleSelectSort = (sortType: string, label: string) => {
    setSortOption(sortType);
    setActiveSortLabel(label);
  };

  // Generate Active Filter Pills list
  const activePills = useMemo(() => {
    const pills: ActiveFilterPill[] = [];

    selectedPriceRanges.forEach((key) => {
      const match = PRICE_RANGES.find((p) => `${p.min}_${p.max}` === key);
      pills.push({
        id: key,
        type: "price",
        label: match ? match.label : key,
        value: key,
      });
    });

    selectedLocations.forEach((loc) => {
      pills.push({ id: loc, type: "location", label: loc, value: loc });
    });

    selectedStars.forEach((star) => {
      pills.push({ id: star, type: "star", label: `${star} Star`, value: star });
    });

    selectedBrands.forEach((brand) => {
      pills.push({ id: brand, type: "brand", label: brand, value: brand });
    });

    selectedFeatures.forEach((feat) => {
      pills.push({ id: feat, type: "features", label: feat, value: feat });
    });

    selectedRooms.forEach((key) => {
      const match = ROOM_RANGES.find((r) => `${r.min}_${r.max}` === key);
      pills.push({
        id: key,
        type: "rooms",
        label: match ? match.label : key,
        value: key,
      });
    });

    return pills;
  }, [
    selectedPriceRanges,
    selectedLocations,
    selectedStars,
    selectedBrands,
    selectedFeatures,
    selectedRooms,
  ]);

  const handleRemovePill = (pill: ActiveFilterPill) => {
    if (pill.type === "price") {
      setSelectedPriceRanges((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    } else if (pill.type === "location") {
      setSelectedLocations((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    } else if (pill.type === "star") {
      setSelectedStars((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    } else if (pill.type === "brand") {
      setSelectedBrands((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    } else if (pill.type === "features") {
      setSelectedFeatures((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    } else if (pill.type === "rooms") {
      setSelectedRooms((prev) => {
        const next = new Set(prev);
        next.delete(pill.value);
        return next;
      });
    }
  };

  return (
    <div className="bg-gray-50 font-sans text-gray-800 min-h-screen flex flex-col">
      <GlobalLoader isLoading={isSearching} />
      <SearchNavbar />
      <PersistentSearchBar onExecuteSearch={handleExecuteSearch} />

      {!hasSearched ? (
        <HeroLanding onQuickSearch={handleQuickSearch} />
      ) : (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6 fade-in">
          <div className="w-full space-y-3">
            <FilterSortBar
              activeFilterCount={totalActiveFilterCount}
              activeSortLabel={activeSortLabel}
              activePills={activePills}
              onOpenFilter={() => setIsFilterOpen(true)}
              onOpenSort={() => setIsSortOpen(true)}
              onReset={clearAllFilters}
              onRemovePill={handleRemovePill}
            />

            <MarketingTabs
              selectedTag={marketingTag}
              onSelectTag={(tag) => setMarketingTag(tag)}
            />
          </div>

          <ResortsGrid
            resorts={filteredResorts}
            priceFieldIds={priceFieldIds}
            onResetFilters={clearAllFilters}
            onOpenPriceExplanation={() => setIsPriceModalOpen(true)}
          />
        </main>
      )}

      <SortDrawer
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        onSelectSort={handleSelectSort}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        allResorts={allResorts}
        baseSearchResults={baseSearchResults}
        priceFieldIds={priceFieldIds}
        selectedPriceRanges={selectedPriceRanges}
        setSelectedPriceRanges={setSelectedPriceRanges}
        selectedLocations={selectedLocations}
        setSelectedLocations={setSelectedLocations}
        selectedStars={selectedStars}
        setSelectedStars={setSelectedStars}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        selectedFeatures={selectedFeatures}
        setSelectedFeatures={setSelectedFeatures}
        selectedRooms={selectedRooms}
        setSelectedRooms={setSelectedRooms}
        onResetAll={clearAllFilters}
      />

      <FavoritesAuthModal />
      <PriceExplanationModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
      />
      <ConsentPopup />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<GlobalLoader isLoading={true} />}>
      <SearchPageContent />
    </Suspense>
  );
}