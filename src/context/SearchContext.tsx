"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  mainSearchInput: string;
  setMainSearchInput: (val: string) => void;
  guestCount: string;
  setGuestCount: (val: string) => void;
  roomCount: string;
  setRoomCount: (val: string) => void;
  selectedSearchType: "resort" | "location" | "general";
  setSelectedSearchType: (type: "resort" | "location" | "general") => void;
  isResortLocked: boolean;
  setIsResortLocked: (locked: boolean) => void;
  resetSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [mainSearchInput, setMainSearchInput] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [selectedSearchType, setSelectedSearchType] = useState<"resort" | "location" | "general">("general");
  const [isResortLocked, setIsResortLocked] = useState(false);

  const resetSearch = () => {
    setMainSearchInput("");
    setGuestCount("");
    setRoomCount("");
    setSelectedSearchType("general");
    setIsResortLocked(false);
  };

  return (
    <SearchContext.Provider
      value={{
        mainSearchInput,
        setMainSearchInput,
        guestCount,
        setGuestCount,
        roomCount,
        setRoomCount,
        selectedSearchType,
        setSelectedSearchType,
        isResortLocked,
        setIsResortLocked,
        resetSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within a SearchProvider");
  return context;
}