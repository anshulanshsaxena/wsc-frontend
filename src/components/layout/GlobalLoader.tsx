"use client";

import React from "react";

interface GlobalLoaderProps {
  isLoading: boolean;
}

export default function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  if (!isLoading) return null;

  return (
    <div
      id="globalLoader"
      className="fixed inset-0 z-[999] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300 opacity-100 pointer-events-auto"
    >
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
        Preparing your venues...
      </h2>
      <p className="text-sm text-gray-500 font-medium animate-pulse">
        It may take few seconds
      </p>
    </div>
  );
}