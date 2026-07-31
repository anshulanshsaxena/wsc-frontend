"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import GlobalLoader from "@/components/layout/GlobalLoader";
import HeroSearch from "@/components/home/HeroSearch";
import HeroBanner from "@/components/home/HeroBanner";
import CompareResortsCTA from "@/components/home/CompareResortsCTA";
import DynamicSortings from "@/components/home/DynamicSortings";
import PromoBracket from "@/components/home/PromoBracket";
import Top10Collections from "@/components/home/Top10Collections";

// Modals
import OfferLeadModal from "@/components/modals/OfferLeadModal";
import TileResortsModal from "@/components/modals/TileResortsModal";
import AllOffersModal from "@/components/modals/AllOffersModal";
import FavoritesAuthModal from "@/components/modals/FavoritesAuthModal";
import PriceExplanationModal from "@/components/modals/PriceExplanationModal";
import ConsentPopup from "@/components/modals/ConsentPopup";

// Firestore & Engine Helpers
import { getPriceFieldIds } from "@/lib/sortingsEngine";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  
  const [isTileModalOpen, setIsTileModalOpen] = useState(false);
  const [tileCategory, setTileCategory] = useState("");
  const [tileHeading, setTileHeading] = useState("");
  const [matchedTileResorts, setMatchedTileResorts] = useState<any[]>([]);

  const [isAllOffersModalOpen, setIsAllOffersModalOpen] = useState(false);
  const [selectedOfferBracket, setSelectedOfferBracket] = useState<number | null>(null);
  const [allResortOffers, setAllResortOffers] = useState<any[]>([]);

  const [priceFieldIds, setPriceFieldIds] = useState<string[]>([]);

  // Automatically turn off loader whenever homepage mounts or user navigates back
  useEffect(() => {
    setIsRedirecting(false);

    const handleRestorePage = () => {
      setIsRedirecting(false);
    };

    window.addEventListener("pageshow", handleRestorePage);
    window.addEventListener("popstate", handleRestorePage);

    return () => {
      window.removeEventListener("pageshow", handleRestorePage);
      window.removeEventListener("popstate", handleRestorePage);
    };
  }, []);

  useEffect(() => {
    async function initData() {
      const ids = await getPriceFieldIds();
      setPriceFieldIds(ids);

      try {
        const snap = await getDocs(collection(db, "resort_offers"));
        const offers: any[] = [];
        snap.forEach((d) => {
          if (d.data().isActive !== false) {
            offers.push(d.data());
          }
        });
        setAllResortOffers(offers);
      } catch (err) {
        console.error("Error fetching resort offers:", err);
      }
    }
    initData();
  }, []);

  const handleTileClick = async (sectionId: string, tileId: string) => {
    try {
      const { fetchHomepageSortings } = await import("@/lib/sortingsEngine");
      const sortings = await fetchHomepageSortings();
      const sec = sortings.find((s) => s.id === sectionId);
      if (!sec) return;
      const tile = sec.tiles.find((t) => t.id === tileId);
      if (!tile) return;

      setTileCategory(sec.heading);
      setTileHeading(tile.label);

      const matchedIds = (tile.assignedResortIds || []).map((id) => String(id));
      const resortSnap = await getDocs(collection(db, "resort_data"));
      const matched: any[] = [];

      resortSnap.forEach((d) => {
        const data = d.data();
        if (!data.core_hidden) {
          const docId = String(d.id);
          const customId = String(data.id || data._recordId || "");

          if (matchedIds.includes(docId) || matchedIds.includes(customId)) {
            matched.push({ id: d.id, ...data });
          }
        }
      });

      setMatchedTileResorts(matched);
      setIsTileModalOpen(true);
    } catch (err) {
      console.error("Error opening tile modal:", err);
    }
  };

  const handleOpenAllOffers = (bracket: number) => {
    setSelectedOfferBracket(bracket);
    setIsAllOffersModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <GlobalLoader isLoading={isRedirecting} />
      <Navbar />

      {/* Hero Header & Search */}
      <HeroSearch onSearchStart={() => setIsRedirecting(true)} />
      <HeroBanner onOpenLeadModal={() => setIsLeadModalOpen(true)} />

      {/* Compare Resorts CTA */}
      <CompareResortsCTA />

      {/* Manual Sequence 10 Sorting Categories */}
      <DynamicSortings sequenceFilter={10} onTileClick={handleTileClick} />

      {/* Promotional Offer Brackets */}
      <PromoBracket guestCount={100} onViewAll={handleOpenAllOffers} />
      <PromoBracket guestCount={150} onViewAll={handleOpenAllOffers} />
      <PromoBracket guestCount={200} onViewAll={handleOpenAllOffers} />

      {/* Main Dynamic Category Tiles */}
      <DynamicSortings onTileClick={handleTileClick} />

      {/* Promotional Offer Brackets */}
      <PromoBracket guestCount={250} onViewAll={handleOpenAllOffers} />
      <PromoBracket guestCount={300} onViewAll={handleOpenAllOffers} />

      {/* Netflix-style Top 10 Collections */}
      <Top10Collections />

      {/* Manual Sequence 20 Sorting Categories */}
      <DynamicSortings sequenceFilter={20} onTileClick={handleTileClick} />

      {/* Modals & Overlays */}
      <OfferLeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <TileResortsModal
        isOpen={isTileModalOpen}
        onClose={() => setIsTileModalOpen(false)}
        category={tileCategory}
        heading={tileHeading}
        resorts={matchedTileResorts}
        priceFieldIds={priceFieldIds}
        onOpenPriceModal={() => setIsPriceModalOpen(true)}
      />
      <AllOffersModal
        isOpen={isAllOffersModalOpen}
        onClose={() => setIsAllOffersModalOpen(false)}
        bracket={selectedOfferBracket}
        offers={allResortOffers}
      />
      <FavoritesAuthModal />
      <PriceExplanationModal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} />
      <ConsentPopup />
    </div>
  );
}