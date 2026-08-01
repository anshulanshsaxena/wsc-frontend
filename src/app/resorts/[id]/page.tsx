'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  extractResortPricingTiers,
  getResortBasePrice,
  extractCoverImage,
  PricingTier,
  CalendarRule,
  SelectedItem,
  QuoteCalculationResult,
} from '@/lib/pricing';

import Navbar from '@/components/layout/Navbar';
import { HeaderInfoCard } from '@/components/resorts/HeaderInfoCard';
import { HeroSlider } from '@/components/resorts/HeroSlider';
import { ResortGallery } from '@/components/resorts/ResortGallery';
import { LocationMapCard } from '@/components/resorts/LocationMapCard';
import { ResortDetailsDynamic } from '@/components/resorts/ResortDetailsDynamic';
import { PricingDisclaimer } from '@/components/resorts/PricingDisclaimer';
import { AvailabilityCalendar } from '@/components/resorts/AvailabilityCalendar';
import { QuoteSummaryCard } from '@/components/resorts/QuoteSummaryCard';
import {
  StickyBottomBar,
  SavedBudgetData,
} from '@/components/resorts/StickyBottomBar';
import { InquiryForm } from '@/components/resorts/InquiryForm';
import { LightboxModal } from '@/components/resorts/LightboxModal';
import { QuickLoginModal } from '@/components/resorts/QuickLoginModal';
import { BudgetWizardStep1 } from '@/components/resorts/BudgetWizardStep1';
import { BudgetWizardModal } from '@/components/resorts/BudgetWizardModal';
import { Tour360Modal } from '@/components/resorts/Tour360Modal';
import { RelatedResorts } from '@/components/resorts/RelatedResorts';
import { SimilarBudgetResorts } from '@/components/resorts/SimilarBudgetResorts';
import { SimilarOtherResorts } from '@/components/resorts/SimilarOtherResorts';
import { ResortOffers } from '@/components/resorts/ResortOffers';
import ConsentPopup from '@/components/modals/ConsentPopup';

function ResortPageContent({ resortId }: { resortId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecalcMode = searchParams.get('recalc') === 'true';

  // Instant Route Prefetching for Profile Page
  useEffect(() => {
    router.prefetch('/user-profile?autoOpen=true');
  }, [router]);

  // Page Data States
  const [loading, setLoading] = useState(true);
  const [isSavingAndRedirecting, setIsSavingAndRedirecting] = useState(false);
  const [dbData, setDbData] = useState<Record<string, any>>({});
  const [schemaStructure, setSchemaStructure] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [calendarRules, setCalendarRules] = useState<CalendarRule[]>([]);
  const [resortPlannersPricing, setResortPlannersPricing] = useState<Record<string, any>[]>([]);
  const [plannerProfiles, setPlannerProfiles] = useState<Record<string, any>>({});
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [allGalleryImages, setAllGalleryImages] = useState<string[]>([]);
  const [tourScenesData, setTourScenesData] = useState<any[]>([]);

  // Selected Date Price State
  const [selectedDatePrice, setSelectedDatePrice] = useState<number | null>(null);

  // User Auth & Saved Data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasAlreadyInquired, setHasAlreadyInquired] = useState(false);
  const [savedBudgetsMap, setSavedBudgetsMap] = useState<Map<string, number>>(new Map());
  const [activeSavedBudgetData, setActiveSavedBudgetData] = useState<SavedBudgetData | null>(null);

  // Controls whether the inline Step 1 Calculator card is visible
  const [showStep1Inline, setShowStep1Inline] = useState(true);

  // Handle Recalculate Mode (?recalc=true) AFTER page loading finishes
  useEffect(() => {
    if (!loading && isRecalcMode) {
      setShowStep1Inline(true);

      // Wait 400ms for DOM to render after loading becomes false
      const timer = setTimeout(() => {
        const el = document.getElementById('resortBudgetCalculatorContainer');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [loading, isRecalcMode]);

  // Active Quote State
  const [activeQuote, setActiveQuote] = useState<QuoteCalculationResult | null>(null);
  const [quoteItems, setQuoteItems] = useState<SelectedItem[]>([]);

  // Modal States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const [quickLoginMode, setQuickLoginMode] = useState<'favorite' | 'budget'>('favorite');

  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [wizardParams, setWizardParams] = useState({ checkIn: '', checkOut: '', guests: 150 });

  const [tour360Open, setTour360Open] = useState(false);

  // Fetch Resort Document & Datasets
  useEffect(() => {
    if (!resortId) return;

    const fetchResortPageData = async () => {
      setLoading(true);
      try {
        const resortRef = doc(db, 'resort_data', resortId);
        const resortSnap = await getDoc(resortRef);

        if (!resortSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = resortSnap.data();
        setDbData(data);

        // Fetch Schema Structure
        let schemaTree: any[] = [];
        try {
          const schemaRef = doc(db, 'schemas', 'resort_schema');
          const schemaSnap = await getDoc(schemaRef);
          if (schemaSnap.exists()) {
            schemaTree = schemaSnap.data().structure || [];
            setSchemaStructure(schemaTree);
          }
        } catch (e) {
          console.error('Error fetching schema:', e);
        }

        // Tiers
        const tiers = extractResortPricingTiers(data, schemaTree);
        setPricingTiers(tiers);

        // Calendar Discount Rules
        const rawCalendar = data.core_calendar || data.core_calendar_rules;
        if (rawCalendar) {
          try {
            const parsedRules =
              typeof rawCalendar === 'string'
                ? JSON.parse(rawCalendar)
                : rawCalendar;
            setCalendarRules(parsedRules);
          } catch (e) {
            setCalendarRules([]);
          }
        }

        // Images
        const collectedImages: string[] = [];
        Object.keys(data).forEach((key) => {
          if (
            typeof data[key] === 'string' &&
            data[key].includes('firebasestorage.googleapis.com')
          ) {
            const urls = data[key]
              .split(',')
              .map((u: string) => u.trim())
              .filter((u: string) => u);
            urls.forEach((url: string) => {
              if (!collectedImages.includes(url)) collectedImages.push(url);
            });
          }
        });
        setAllGalleryImages(collectedImages);
        setHeroImages(collectedImages.slice(0, 5));

        // 360 Scenes
        const raw360 = data.tour_360_scenes || data.core_360_data;
        if (raw360) {
          try {
            const scenes =
              typeof raw360 === 'string' ? JSON.parse(raw360) : raw360;
            setTourScenesData(scenes);
          } catch (e) {
            setTourScenesData([]);
          }
        }

        // Fetch Master Catalog Schema
        try {
          const mcSnap = await getDoc(doc(db, 'schemas', 'master_catalog_schema'));
          if (mcSnap.exists()) {
            setMasterCatalog(mcSnap.data().structure || []);
          } else {
            const fallbackSnap = await getDoc(doc(db, 'catalogs', 'master_catalog'));
            if (fallbackSnap.exists()) {
              setMasterCatalog(fallbackSnap.data().groups || []);
            }
          }
        } catch (e) {
          console.error('Error fetching master catalog:', e);
        }

        // Fetch Planners Pricing
        try {
          const plannersQ = query(
            collection(db, 'resort_planner_pricing'),
            where('resortId', '==', resortId)
          );
          const plannersSnap = await getDocs(plannersQ);
          const plannersList: any[] = [];
          plannersSnap.forEach((d) => plannersList.push(d.data()));
          setResortPlannersPricing(plannersList);

          const profilesMap: Record<string, any> = {};
          for (const p of plannersList) {
            if (p.plannerId && !profilesMap[p.plannerId]) {
              const pSnap = await getDoc(doc(db, 'planner_data', p.plannerId));
              if (pSnap.exists()) {
                profilesMap[p.plannerId] = pSnap.data();
              }
            }
          }
          setPlannerProfiles(profilesMap);
        } catch (e) {
          console.error('Error fetching planners:', e);
        }
      } catch (err) {
        console.error('Error loading resort:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResortPageData();
  }, [resortId]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user && resortId) {
        try {
          const favRef = doc(db, 'favorites', `${user.uid}_${resortId}`);
          const favSnap = await getDoc(favRef);
          setIsFavorited(favSnap.exists());
        } catch (e) {}

        try {
          const inqQ = query(
            collection(db, 'inquiries'),
            where('userId', '==', user.uid),
            where('resortId', '==', resortId)
          );
          const inqSnap = await getDocs(inqQ);
          setHasAlreadyInquired(!inqSnap.empty);
        } catch (e) {}

        try {
          const budgetQ = query(
            collection(db, 'saved_budgets'),
            where('userId', '==', user.uid)
          );
          const budgetSnap = await getDocs(budgetQ);
          const map = new Map<string, number>();

          budgetSnap.forEach((d) => {
            const b = d.data();
            if (b.resortId && b.quotes && b.quotes.length > 0) {
              const cheapest = [...b.quotes].sort((a, b) => a.grandTotal - b.grandTotal);
              map.set(b.resortId, cheapest[0].grandTotal || 0);
            }
          });
          setSavedBudgetsMap(map);

          const thisResortBudgetRef = doc(db, 'saved_budgets', `${user.uid}_${resortId}`);
          const thisResortBudgetSnap = await getDoc(thisResortBudgetRef);
          if (thisResortBudgetSnap.exists()) {
            const b = thisResortBudgetSnap.data();
            const sortedQuotes = [...(b.quotes || [])].sort((a, b) => a.grandTotal - b.grandTotal);
            setActiveSavedBudgetData({
              guests: b.guests || 150,
              days: b.days || 2,
              quotes: sortedQuotes,
            });
            setShowStep1Inline(false);
          } else {
            setActiveSavedBudgetData(null);
            setShowStep1Inline(true);
          }
        } catch (e) {
          console.error('Error fetching saved budgets:', e);
        }
      } else {
        setIsFavorited(false);
        setHasAlreadyInquired(false);
        setSavedBudgetsMap(new Map());
        setActiveSavedBudgetData(null);
        setShowStep1Inline(true);
      }
    });

    return () => unsubscribe();
  }, [resortId]);

  // Favorite Toggle
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      setQuickLoginMode('favorite');
      setQuickLoginOpen(true);
      return;
    }

    const favRef = doc(db, 'favorites', `${currentUser.uid}_${resortId}`);
    try {
      if (isFavorited) {
        await deleteDoc(favRef);
        setIsFavorited(false);
      } else {
        await setDoc(favRef, { resortId, userId: currentUser.uid });
        setIsFavorited(true);
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const handleRecalculateClick = () => {
    setShowStep1Inline(true);
    setTimeout(() => {
      const el = document.getElementById('resortBudgetCalculatorContainer');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Calculation Completed
  const handleCalculateComplete = async (
    result: QuoteCalculationResult,
    items: SelectedItem[]
  ) => {
    setActiveQuote(result);
    setQuoteItems(items);

    if (currentUser) {
      setIsSavingAndRedirecting(true);
      await saveFinalBudgetToDatabase(currentUser, result, items);
    } else {
      setQuickLoginMode('budget');
      setQuickLoginOpen(true);
    }
  };

  const saveFinalBudgetToDatabase = async (
    user: User,
    calcResult: QuoteCalculationResult,
    items: SelectedItem[]
  ) => {
    if (!calcResult.quotes || calcResult.quotes.length === 0) return;

    try {
      setIsSavingAndRedirecting(true);

      // 1. DELETE ANY OLD HISTORICAL COPIES FOR THIS RESORT FIRST
      const existingQuery = query(
        collection(db, 'saved_budgets'),
        where('userId', '==', user.uid),
        where('resortId', '==', resortId)
      );
      const existingSnap = await getDocs(existingQuery);
      const deleteOldPromises = existingSnap.docs.map((d) => deleteDoc(doc(db, 'saved_budgets', d.id)));
      await Promise.all(deleteOldPromises);

      // 2. SAVE FRESH OVERWRITTEN BUDGET
      const budgetData = {
        userId: user.uid,
        resortId,
        resortName: dbData._recordName || dbData.core_name || 'Luxury Resort',
        resortLocation: dbData.core_location || 'India',
        resortImage: extractCoverImage(dbData),
        guests: calcResult.guests,
        days: calcResult.daysDiff,
        checkInDate: wizardParams.checkIn,
        checkOutDate: wizardParams.checkOut,
        rooms: Number(dbData.core_rooms || 0),
        functions: calcResult.eventsCount,
        selectedItems: items,
        quotes: calcResult.quotes,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'saved_budgets', `${user.uid}_${resortId}`), budgetData);
      router.push('/user-profile?autoOpen=true');
    } catch (err) {
      console.error('Error saving budget to database:', err);
      setIsSavingAndRedirecting(false);
    }
  };

  const currentResortName = dbData._recordName || dbData.core_name || 'Luxury Resort';
  const resortLocationName = dbData.core_location || 'India';
  const resortRooms = Number(dbData.core_rooms || 0);
  const resortBasePrice = getResortBasePrice(dbData, schemaStructure);
  const coverImage = extractCoverImage(dbData);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
        <i className="ph-bold ph-spinner-gap text-4xl text-[#6B0D24] animate-spin mb-3"></i>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Curating Luxury...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]/30 text-gray-900 font-sans pb-48 md:pb-56">
      {/* Navbar */}
      <Navbar />

      {/* Hero Cover Slider */}
      <HeroSlider
        images={heroImages}
        lowestPrice={activeSavedBudgetData?.quotes[0]?.grandTotal || null}
        has360Tour={tourScenesData.length > 0}
        onOpen360={() => setTour360Open(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20">
        <HeaderInfoCard
          resortName={currentResortName}
          location={resortLocationName}
          brand={dbData.core_brand}
          starRating={dbData.core_star_rating}
          address={dbData.core_address}
          rooms={dbData.core_rooms}
          startingPrice={selectedDatePrice !== null ? selectedDatePrice : resortBasePrice}
          offer={dbData.core_offer}
        />

        {activeQuote && activeQuote.quotes.length > 0 && (
          <QuoteSummaryCard
            guests={activeQuote.guests}
            dateStr={`${wizardParams.checkIn} to ${wizardParams.checkOut}`}
            totalAmount={activeQuote.quotes[0].grandTotal}
            visible={true}
          />
        )}

        <PricingDisclaimer />

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <AvailabilityCalendar
            pricingTiers={pricingTiers}
            calendarRules={calendarRules}
            basePrice={resortBasePrice}
            guestCount={wizardParams.guests}
            onDateSelect={(_date, pricePerPerson) => setSelectedDatePrice(pricePerPerson)}
          />

          <LocationMapCard
            resortName={currentResortName}
            address={dbData.core_address}
            location={resortLocationName}
            geolocation={dbData.core_geolocation}
          />
        </div>

        <ResortGallery
          images={allGalleryImages}
          onOpenLightbox={(imgs, idx) => {
            setLightboxIndex(idx);
            setLightboxOpen(true);
          }}
        />

        {/* INLINE CALCULATOR CARD: UNHIDDEN WHEN RECALC IS CLICKED */}
        {showStep1Inline && (
          <BudgetWizardStep1
            rooms={resortRooms}
            onStartWizard={(params) => {
              setWizardParams(params);
              setWizardModalOpen(true);
            }}
          />
        )}

        <ResortDetailsDynamic
          dbData={dbData}
          schemaStructure={schemaStructure}
          resortName={currentResortName}
          resortLocation={resortLocationName}
          description={dbData.core_description || dbData.description}
          guests={wizardParams.guests}
          startingPrice={selectedDatePrice !== null ? selectedDatePrice : resortBasePrice}
        />

        {/* OFFERS FOR THIS RESORT */}
        <ResortOffers resortId={resortId} coverImageUrl={coverImage} />

        <RelatedResorts
          currentResortId={resortId}
          currentRooms={resortRooms}
          currentLocation={resortLocationName}
          savedBudgetsMap={savedBudgetsMap}
        />

        <SimilarOtherResorts
          currentResortId={resortId}
          currentRooms={resortRooms}
          currentLocation={resortLocationName}
          savedBudgetsMap={savedBudgetsMap}
        />

        <SimilarBudgetResorts
          currentResortId={resortId}
          currentBasePrice={resortBasePrice}
          schemaStructure={schemaStructure}
          savedBudgetsMap={savedBudgetsMap}
        />

        <InquiryForm
          resortId={resortId}
          resortName={currentResortName}
          hasAlreadyInquired={hasAlreadyInquired}
        />
      </main>

      {/* Sticky Bottom Bar */}
      <StickyBottomBar
        resortName={currentResortName}
        isFavorited={isFavorited}
        savedBudgetData={activeSavedBudgetData}
        onToggleFavorite={handleToggleFavorite}
        onOpenBudgetWizard={handleRecalculateClick}
        onInquiryClick={() => {
          const el = document.getElementById('inquirySectionAnchor');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      <ConsentPopup />

      <LightboxModal
        isOpen={lightboxOpen}
        images={allGalleryImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <QuickLoginModal
        isOpen={quickLoginOpen}
        mode={quickLoginMode}
        onClose={() => setQuickLoginOpen(false)}
        onSuccess={(user) => {
          if (quickLoginMode === 'favorite') {
            handleToggleFavorite();
          } else if (quickLoginMode === 'budget' && activeQuote) {
            saveFinalBudgetToDatabase(user, activeQuote, quoteItems);
          }
        }}
      />

      <BudgetWizardModal
        isOpen={wizardModalOpen}
        resortId={resortId}
        resortName={currentResortName}
        checkIn={wizardParams.checkIn}
        checkOut={wizardParams.checkOut}
        guests={wizardParams.guests}
        masterCatalog={masterCatalog}
        pricingTiers={pricingTiers}
        calendarRules={calendarRules}
        dbDataGlobal={dbData}
        resortPlannersPricing={resortPlannersPricing}
        plannerProfiles={plannerProfiles}
        onClose={() => setWizardModalOpen(false)}
        onCalculateComplete={handleCalculateComplete}
      />

      <Tour360Modal
        isOpen={tour360Open}
        scenes={tourScenesData}
        onClose={() => setTour360Open(false)}
      />

      {/* FULL-SCREEN LOADER DURING SAVE & REDIRECT */}
      {isSavingAndRedirecting && (
        <div className="fixed inset-0 z-[200000] bg-gray-950/85 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#6B0D24] text-[#C5A059] flex items-center justify-center text-3xl mb-4 animate-bounce shadow-lg shadow-[#6B0D24]/30">
            <i className="ph-fill ph-sparkle"></i>
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">Saving Your Custom Budget</h3>
          <p className="text-gray-300 text-xs md:text-sm font-medium">Transferring quotes to your user profile dashboard...</p>
        </div>
      )}
    </div>
  );
}

export default function ResortPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
          <i className="ph-bold ph-spinner-gap text-4xl text-[#6B0D24] animate-spin mb-3"></i>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loading Resort...
          </p>
        </div>
      }
    >
      <ResortPageContent resortId={resolvedParams.id} />
    </Suspense>
  );
}