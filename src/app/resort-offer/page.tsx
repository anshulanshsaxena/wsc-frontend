'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { getResortBasePrice, extractCoverImage } from '@/lib/pricing';

import Navbar from '@/components/layout/Navbar';
import { HeroSlider } from '@/components/resorts/HeroSlider';
import { ResortGallery } from '@/components/resorts/ResortGallery';
import { ResortDetailsDynamic } from '@/components/resorts/ResortDetailsDynamic';
import { RelatedResorts } from '@/components/resorts/RelatedResorts';
import { SimilarBudgetResorts } from '@/components/resorts/SimilarBudgetResorts';
import { SimilarOtherResorts } from '@/components/resorts/SimilarOtherResorts';
import { InquiryForm } from '@/components/resorts/InquiryForm';
import { LightboxModal } from '@/components/resorts/LightboxModal';
import { QuickLoginModal } from '@/components/resorts/QuickLoginModal';
import { Tour360Modal } from '@/components/resorts/Tour360Modal';
import ConsentPopup from '@/components/modals/ConsentPopup';

import { OfferCampaignHeader } from '@/components/resorts/OfferCampaignHeader';
import { OfferInclusions } from '@/components/resorts/OfferInclusions';
import { OfferTerms } from '@/components/resorts/OfferTerms';
import { OfferStickyBottomBar } from '@/components/resorts/OfferStickyBottomBar';

function OfferPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const resortId = searchParams.get('id') || '';
  const offerGuests = parseInt(searchParams.get('guests') || '150', 10);
  const offerDays = parseInt(searchParams.get('days') || '2', 10);

  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState<Record<string, any>>({});
  const [offerData, setOfferData] = useState<Record<string, any>>({});
  const [schemaStructure, setSchemaStructure] = useState<any[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [allGalleryImages, setAllGalleryImages] = useState<string[]>([]);
  const [tourScenesData, setTourScenesData] = useState<any[]>([]);

  const [groupedInclusions, setGroupedInclusions] = useState<Record<string, any[]>>({});

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasAlreadyInquired, setHasAlreadyInquired] = useState(false);
  const [savedBudgetsMap, setSavedBudgetsMap] = useState<Map<string, number>>(new Map());

  // Modal States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const [tour360Open, setTour360Open] = useState(false);

  useEffect(() => {
    if (!resortId) return;

    const fetchOfferData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Schema
        let schemaTree: any[] = [];
        try {
          const schemaSnap = await getDoc(doc(db, 'schemas', 'resort_schema'));
          if (schemaSnap.exists()) {
            schemaTree = schemaSnap.data().structure || [];
            setSchemaStructure(schemaTree);
          }
        } catch (e) {
          console.error('Error fetching schema:', e);
        }

        // 2. Fetch Specific Offer Package
        const offerId = `${resortId}_offer_${offerGuests}_${offerDays}days`;
        const offerSnap = await getDoc(doc(db, 'resort_offers', offerId));

        if (!offerSnap.exists()) {
          alert('This campaign offer has expired or is unavailable.');
          router.push('/');
          return;
        }

        const offer = offerSnap.data();
        setOfferData(offer);

        // 3. Fetch Master Catalog Schema for Grouping Items
        const groupMap = new Map<string, string>();
        try {
          const mcSnap = await getDoc(doc(db, 'schemas', 'master_catalog_schema'));
          if (mcSnap.exists()) {
            const structure = mcSnap.data().structure || [];
            structure.forEach((group: any) => {
              const groupName = group.name;
              const parseItems = (itemsList: any[]) => {
                if (!itemsList || !Array.isArray(itemsList)) return;
                itemsList.forEach((item) => {
                  if (item.items && Array.isArray(item.items)) {
                    parseItems(item.items);
                  } else if (item.id) {
                    groupMap.set(item.id.toLowerCase(), groupName);
                  }
                });
              };
              parseItems(group.items);
            });
          }
        } catch (e) {}

        // Group selected items
        const grouped: Record<string, any[]> = {};
        (offer.selectedItems || []).forEach((item: any) => {
          const itemId = (item.id || '').toLowerCase();
          const rawGroup = groupMap.get(itemId) || 'General Elements';
          const groupName = rawGroup.toLowerCase().includes('general')
            ? 'General Requirements'
            : rawGroup;

          if (!grouped[groupName]) grouped[groupName] = [];
          grouped[groupName].push(item);
        });
        setGroupedInclusions(grouped);

        // 4. Fetch Resort Data
        const resortSnap = await getDoc(doc(db, 'resort_data', resortId));
        if (resortSnap.exists()) {
          const data = resortSnap.data();
          setDbData(data);

          // Collect Gallery Images
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
              const scenes = typeof raw360 === 'string' ? JSON.parse(raw360) : raw360;
              setTourScenesData(scenes);
            } catch (e) {
              setTourScenesData([]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading offer page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferData();
  }, [resortId, offerGuests, offerDays, router]);

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
          const budgetQ = query(collection(db, 'saved_budgets'), where('userId', '==', user.uid));
          const budgetSnap = await getDocs(budgetQ);
          const map = new Map<string, number>();
          budgetSnap.forEach((d) => {
            const b = d.data();
            if (b.resortId && b.quotes && b.quotes.length > 0) {
              map.set(b.resortId, b.quotes[0].grandTotal || 0);
            }
          });
          setSavedBudgetsMap(map);
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, [resortId]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      setQuickLoginOpen(true);
      return;
    }

    const favRef = doc(db, 'favorites', `${currentUser.uid}_${resortId}`);
    try {
      if (isFavorited) {
        await deleteDoc(favRef);
        setIsFavorited(false);
      } else {
        await setDoc(favRef, { resortId, userId: currentUser.uid, timestamp: new Date() });
        setIsFavorited(true);
      }
    } catch (e) {}
  };

  const currentResortName = dbData._recordName || dbData.core_name || 'Luxury Resort';
  const resortLocationName = dbData.core_location || 'India';
  const resortRooms = Number(dbData.core_rooms || 0);
  const resortBasePrice = getResortBasePrice(dbData, schemaStructure);

  const formatDate = (dStr?: string) =>
    dStr
      ? new Date(dStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
        <i className="ph-bold ph-spinner-gap text-4xl text-[#6B0D24] animate-spin mb-3"></i>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Assembling Campaign Offer...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]/30 text-gray-900 font-sans pb-48 md:pb-56">
      {/* Navbar */}
      <Navbar />

      {/* Mobile Resort Name Bar */}
      <div className="block md:hidden fixed top-16 left-0 w-full bg-[#6B0D24] text-white py-3 px-4 text-center z-40 shadow-sm border-b border-[#520a1a]">
        <span className="font-black tracking-tight text-sm uppercase">{currentResortName}</span>
      </div>

      {/* Hero Cover Slider */}
      <HeroSlider
        images={heroImages}
        lowestPrice={offerData.calculatedBudget || null}
        has360Tour={tourScenesData.length > 0}
        onOpen360={() => setTour360Open(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-4 relative z-20">
        {/* Campaign Header & Budget Split Matrix */}
        <OfferCampaignHeader
          campaignTitle={offerData.campaignTitle}
          resortName={currentResortName}
          validFrom={formatDate(offerData.validFrom)}
          validTo={formatDate(offerData.validTo)}
          guests={offerGuests}
          days={offerDays}
          totalBudget={offerData.calculatedBudget || 0}
          resortSplit={offerData.breakdown?.resort || 0}
          plannerSplit={offerData.breakdown?.planner || 0}
          plannerName={offerData.plannerName}
          onLockPricingClick={() => {
            const el = document.getElementById('inquirySectionAnchor');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Package Inclusions Checklist */}
        <OfferInclusions
          eventsList={offerData.checkedEventNames || []}
          groupedInclusions={groupedInclusions}
        />

        {/* Dynamic Resort Spec Sheet */}
        <ResortDetailsDynamic
  dbData={dbData}
  schemaStructure={schemaStructure}
  resortName={currentResortName}
  resortLocation={resortLocationName}
  description={dbData.core_description || dbData.description}
  guests={offerGuests}
  days={offerDays}
  promoBudget={offerData.calculatedBudget || 0}
/>

        {/* Related Resorts */}
        <RelatedResorts
          currentResortId={resortId}
          currentRooms={resortRooms}
          currentLocation={resortLocationName}
          savedBudgetsMap={savedBudgetsMap}
        />

        {/* Similar Resorts in Other Locations */}
        <SimilarOtherResorts
          currentResortId={resortId}
          currentRooms={resortRooms}
          currentLocation={resortLocationName}
          savedBudgetsMap={savedBudgetsMap}
        />

        {/* Similar Budget Resorts */}
        <SimilarBudgetResorts
          currentResortId={resortId}
          currentBasePrice={resortBasePrice}
          schemaStructure={schemaStructure}
          savedBudgetsMap={savedBudgetsMap}
        />

        {/* Inquiry Form */}
        <InquiryForm
          resortId={resortId}
          resortName={currentResortName}
          hasAlreadyInquired={hasAlreadyInquired}
        />

        {/* Terms & Conditions */}
        <OfferTerms />
      </main>

      {/* Offer Sticky Bottom Bar */}
      <OfferStickyBottomBar
        resortName={currentResortName}
        isFavorited={isFavorited}
        onToggleFavorite={handleToggleFavorite}
        onInquiryClick={() => {
          const el = document.getElementById('inquirySectionAnchor');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
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
        mode="favorite"
        onClose={() => setQuickLoginOpen(false)}
        onSuccess={() => handleToggleFavorite()}
      />

      <Tour360Modal
        isOpen={tour360Open}
        scenes={tourScenesData}
        onClose={() => setTour360Open(false)}
      />
    </div>
  );
}

export default function ResortOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
          <i className="ph-bold ph-spinner-gap text-4xl text-[#6B0D24] animate-spin mb-3"></i>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Loading Offer Package...
          </p>
        </div>
      }
    >
      <OfferPageContent />
    </Suspense>
  );
}