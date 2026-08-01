'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  User,
  ConfirmationResult,
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import ConsentPopup from '@/components/modals/ConsentPopup';

// =========================================================================
// CONFIGURATION: PRESELECTED STANDARD PACKAGE ITEMS & QUANTITIES
// =========================================================================
const DEFAULT_PRESELECTED_ITEM_IDS = [
  { id: "item_5jkjcz50r", qty: 1 },
  { id: "item_pw0a6i942", qty: 1 },
  { id: "item_65pstijc4", qty: 1 },
  { id: "item_xcdivtck6", qty: 1 },
  { id: "item_8ui88yk71", qty: 1 },
  { id: "item_u5657jjyc", qty: 1 },
  { id: "item_6bi3dvniv", qty: 1 },
  { id: "item_qlx4ui2wy", qty: 1 },
  { id: "item_3kqqkx0pv", qty: 1 },
  { id: "item_cyidrbqui", qty: 1 },
  { id: "item_40ct258ll", qty: 1 },
  { id: "item_m8it0857e", qty: 1 },
  { id: "item_2jq9166e0", qty: 1 },
  { id: "item_b9zktvs7e", qty: 1 },
  { id: "item_gh9dn56ii", qty: 1 },
  { id: "item_l9g2qoede", qty: 1 },
  { id: "item_p7y2xlgdd", qty: 1 },
  { id: "item_h2dr76nso", qty: 1 },
  { id: "item_6m8dmzfxe", qty: 1 },
  { id: "item_hrhftptlm", qty: 1 },
  { id: "item_xxkghnbzu", qty: 1 },
  { id: "item_yaokdg5v4", qty: 1 },
  { id: "item_iexgkwq6k", qty: 1 },
  { id: "item_1nig0lf37", qty: 1 },
  { id: "item_7wi5bzyt1", qty: 1 },
  { id: "item_k2y1nc792", qty: 1 },
  { id: "item_cia397us1", qty: 1 },
  { id: "item_9kz1nufil", qty: 1 },
  { id: "item_myr9mmjba", qty: 4 },
  { id: "item_6ybnqp8b3", qty: 2 },
  { id: "item_s8prgbx7u", qty: 2 },
  { id: "item_r2kgpb29i", qty: 1 },
  { id: "item_hv13o1qxd", qty: 1 },
  { id: "item_i7v8dp0oi", qty: 4 },
  { id: "item_op9axadi3", qty: 100 },
  { id: "item_275r7ucbt", qty: 4 },
  { id: "item_yn62qo7yi", qty: 4 },
  { id: "item_5cmba7bm4", qty: 100 },
  { id: "item_9ftxitw45", qty: 1 },
  { id: "item_akc027yro", qty: 8 },
  { id: "item_1c9k3hr6v", qty: 1 },
  { id: "item_c2epouscq", qty: 1 },
  { id: "item_mqnuhuslp", qty: 1 },
  { id: "item_hgozx05se", qty: 8 },
  { id: "item_ncge3qkw1", qty: 1 }
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CompareResortsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- WIZARD STEP & ROUTING STATE ---
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Finding Resort...");
  const [loadingSubtext, setLoadingSubtext] = useState<string>("Calculating Budget....");

  // --- STEP 1: BASICS STATE ---
  const [guestCountInput, setGuestCountInput] = useState<number>(150);
  const [checkInRaw, setCheckInRaw] = useState<string>('');
  const [checkInReadable, setCheckInReadable] = useState<string>('');
  const [checkOutRaw, setCheckOutRaw] = useState<string>('');
  const [checkOutReadable, setCheckOutReadable] = useState<string>('');

  // --- STEP 2: EVENTS STATE ---
  const [selectedEventNames, setSelectedEventNames] = useState<string[]>([]);

  // --- CATALOG & SCHEMA DATA ---
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [resortSchemaStructure, setResortSchemaStructure] = useState<any[]>([]);

  // --- CARD SELECTIONS STATE: Record<itemId, { checked: boolean, qty: number }> ---
  const [selections, setSelections] = useState<Record<string, { checked: boolean; qty: number }>>({});

  // --- STEP 5: TABS STATE ---
  const [activeEventTabIdx, setActiveEventTabIdx] = useState<number>(0);

  // --- RESULTS VIEW STATE ---
  const [results, setResults] = useState<any[]>([]);
  const [globalActiveItems, setGlobalActiveItems] = useState<any[]>([]);
  const [itemsPerPage] = useState<number>(10);
  const [currentDisplayCount, setCurrentDisplayCount] = useState<number>(10);

  // --- FILTERS & SORTS STATE ---
  const [sortOption, setSortOption] = useState<string>('price_low');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStar, setFilterStar] = useState<string>('all');
  const [filterBudget, setFilterBudget] = useState<string>('all');
  const [filterRooms, setFilterRooms] = useState<string>('all');

  // --- CALENDAR WIDGET STATE ---
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [calendarMode, setCalendarMode] = useState<'in' | 'out'>('in');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(new Date());
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number; isFixed: boolean }>({ top: 0, left: 0, isFixed: false });

  // --- ITEM DESC MODAL STATE ---
  const [itemModalDoc, setItemModalDoc] = useState<{ title: string; desc: string; rule: string; thumb: string } | null>(null);

  // --- AUTH & OTP MODAL STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authOtp, setAuthOtp] = useState<string>('');
  const [otpStep, setOtpStep] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [pendingResortRedirect, setPendingResortRedirect] = useState<{ id: string; name: string } | null>(null);

  // Manual Save State
  const [savedResortIds, setSavedResortIds] = useState<Set<string>>(new Set());
  const [pendingSaveResort, setPendingSaveResort] = useState<any | null>(null);

  // --- SAVE SINGLE RESORT BUDGET TO PROFILE (EXACT DATA MATCHING COMPARE-RESORT.HTML) ---
  const saveSingleResortBudget = async (resort: any, user: User) => {
    const guests = Number(sessionStorage.getItem('wedsaas_compare_guests')) || roundedGuests;
    const days = Number(sessionStorage.getItem('wedsaas_compare_days')) || 1;
    const checkInDate = sessionStorage.getItem('wedsaas_compare_checkin') || 'Not Selected';
    const checkOutDate = sessionStorage.getItem('wedsaas_compare_checkout') || 'Not Selected';

    // Synchronously read items saved in sessionStorage to ensure selectedItems is never empty []
    let itemsToSave = globalActiveItems;
    try {
      const storedActive = sessionStorage.getItem('wedsaas_compare_active_items');
      if (storedActive) {
        const parsed = JSON.parse(storedActive);
        if (Array.isArray(parsed) && parsed.length > 0) itemsToSave = parsed;
      }
    } catch (e) {}

    const docId = `${user.uid}_cmp_${resort.id}_${Date.now()}`;

    const budgetData = {
      userId: user.uid,
      resortId: resort.id,
      resortName: resort.name,
      resortLocation: resort.location,
      resortImage: resort.image,
      guests: guests,
      days: days,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      rooms: resort.rooms || 0,
      functions: selectedEventNames.length || 1,
      selectedItems: itemsToSave,
      quotes: resort.allQuotes || [],
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "saved_budgets", docId), budgetData);
    setSavedResortIds((prev) => new Set(prev).add(resort.id));
  };

  // Handler for "Save Budget" button click
  const handleSaveBudgetClick = async (e: React.MouseEvent, resort: any) => {
    e.stopPropagation();

    if (!currentUser) {
      setPendingSaveResort(resort);
      setAuthModalOpen(true);
      return;
    }

    try {
      await saveSingleResortBudget(resort, currentUser);
      alert(`Saved ${resort.name} budget to your user profile!`);
    } catch (err) {
      console.error("Error saving budget:", err);
      alert("Failed to save budget.");
    }
  };

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Master Catalog & Resort Schema from Firestore
  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      const [mcSnap, rsSnap] = await Promise.all([
        getDoc(doc(db, "schemas", "master_catalog_schema")),
        getDoc(doc(db, "schemas", "resort_schema"))
      ]);

      if (mcSnap.exists()) setMasterCatalog(mcSnap.data().structure || []);
      if (rsSnap.exists()) setResortSchemaStructure(rsSnap.data().structure || []);

      // Check Session Storage for saved comparison
      const savedResults = sessionStorage.getItem('wedsaas_compare_results');
      if (savedResults) {
        try {
          const parsedResults = JSON.parse(savedResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            setResults(parsedResults);
            
            // Restore active items from session storage
            const storedActive = sessionStorage.getItem('wedsaas_compare_active_items');
            if (storedActive) {
              try { setGlobalActiveItems(JSON.parse(storedActive)); } catch (e) {}
            }

            setStep(6); // Results view
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error("Init Data Fetch Error:", e);
    }
  };

  // Auto-rounding guest count helper (Matches compare-resort.html getRoundedGuests)
  const roundedGuests = useMemo(() => {
    let raw = Number(guestCountInput) || 150;
    let remainder = raw % 10;
    return remainder <= 5 ? (raw - remainder) : (raw + (10 - remainder));
  }, [guestCountInput]);

  // Quantity Delta Change Handler
  const handleCardQtyChange = (itemId: string, delta: number) => {
    setSelections((prev) => {
      const current = prev[itemId] || { checked: false, qty: 0 };
      const newQty = Math.max(0, current.qty + delta);
      return {
        ...prev,
        [itemId]: { checked: newQty > 0, qty: newQty },
      };
    });
  };

  // Checkbox Toggle Handler
  const handleCardToggle = (itemId: string) => {
    setSelections((prev) => {
      const current = prev[itemId] || { checked: false, qty: 0 };
      const newChecked = !current.checked;
      return {
        ...prev,
        [itemId]: { checked: newChecked, qty: newChecked ? 1 : 0 },
      };
    });
  };

  // --- CALENDAR OVERLAY ENGINE ---
  const toggleCalendar = (mode: 'in' | 'out', explicitCheckIn?: string, e?: React.MouseEvent) => {
    const activeCheckIn = explicitCheckIn !== undefined ? explicitCheckIn : checkInRaw;

    if (mode === 'out' && !activeCheckIn) {
      alert("Please select a Check-in date first.");
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCalendarPosition({ top: 0, left: 0, isFixed: true });
    } else if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCalendarPosition({
        top: window.scrollY + rect.bottom + 6,
        left: window.scrollX + rect.left,
        isFixed: false,
      });
    }

    setCalendarMode(mode);
    setCalendarOpen(true);

    const currentVal = mode === 'in' ? activeCheckIn : checkOutRaw;
    if (mode === 'out' && !currentVal && activeCheckIn) {
      setCalendarCurrentDate(new Date(activeCheckIn));
    } else {
      setCalendarCurrentDate(currentVal ? new Date(currentVal) : new Date());
    }
  };

  const changeMonth = (delta: number) => {
    setCalendarCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const selectCalendarDate = (year: number, month: number, day: number) => {
    const mNum = month + 1;
    const formattedRaw = `${year}-${String(mNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const formattedReadable = `${day} ${MONTHS[month].substring(0, 3)}, ${year}`;

    if (calendarMode === 'in') {
      setCheckInRaw(formattedRaw);
      setCheckInReadable(formattedReadable);

      if (checkOutRaw) {
        const outDate = new Date(checkOutRaw);
        outDate.setHours(0, 0, 0, 0);
        const minOut = new Date(dateObj); minOut.setDate(dateObj.getDate() + 1);
        const maxOut = new Date(dateObj); maxOut.setDate(dateObj.getDate() + 4);
        if (outDate.getTime() < minOut.getTime() || outDate.getTime() > maxOut.getTime()) {
          setCheckOutRaw('');
          setCheckOutReadable('');
        }
      }
      setCalendarOpen(false);

      setTimeout(() => {
        toggleCalendar('out', formattedRaw);
      }, 150);
    } else {
      setCheckOutRaw(formattedRaw);
      setCheckOutReadable(formattedReadable);
      setCalendarOpen(false);
    }
  };

 // --- FAST-TRACK PRESELECTED ITEMS APPLIER (FILTERED BY USER SELECTED EVENTS) ---
  const applyPreselectedConfigItems = () => {
    let targetConfigMap = new Map<string, number>();
    const storedConfig = typeof window !== 'undefined' ? localStorage.getItem('wsc_custom_preselected_items') : null;

    const parseConfigEntry = (item: any) => {
      if (!item) return;
      if (typeof item === 'object') {
        const rawId = item.id || item.name;
        if (typeof rawId === 'string' && rawId) {
          targetConfigMap.set(rawId.toLowerCase(), Number(item.qty !== undefined ? item.qty : 1));
        }
      } else if (typeof item === 'string') {
        targetConfigMap.set(item.toLowerCase(), 1);
      }
    };

    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        if (Array.isArray(parsed)) parsed.forEach(parseConfigEntry);
      } catch (e) {}
    }

    if (targetConfigMap.size === 0) {
      DEFAULT_PRESELECTED_ITEM_IDS.forEach(parseConfigEntry);
    }

    const newSelections: Record<string, { checked: boolean; qty: number }> = {};

    masterCatalog.forEach((group) => {
      const groupType = (group.type || '').toLowerCase();
      const groupName = group.name || '';

      // FIX: Only parse preselected items if the event was selected by the user in Step 2
      if (groupType === 'event' && !selectedEventNames.includes(groupName)) {
        return; // Skip unselected events
      }

      const parseItems = (items: any[]) => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          if (item.items && Array.isArray(item.items)) {
            parseItems(item.items);
          } else {
            const id = (item.id || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            let qtyToApply = 0;
            if (targetConfigMap.has(id)) qtyToApply = targetConfigMap.get(id)!;
            else if (targetConfigMap.has(name)) qtyToApply = targetConfigMap.get(name)!;

            if (qtyToApply > 0) {
              newSelections[item.id] = { checked: true, qty: qtyToApply };
            }
          }
        });
      };
      parseItems(group.items);
    });

    setSelections(newSelections);
    return newSelections;
  };

  const selectPackageMode = (mode: 'recommended' | 'custom') => {
    if (mode === 'recommended') {
      const preselected = applyPreselectedConfigItems();
      executeMathEngine(preselected);
    } else {
      setStep(4);
    }
  };

  // --- EXECUTE AI COST ENGINE (Calculations) ---
  const executeMathEngine = async (overrideSelections?: Record<string, { checked: boolean; qty: number }>) => {
    setLoadingText("Finding Resort...");
    setLoadingSubtext("Calculating Budget....");
    setLoading(true);

    const activeSelections = overrideSelections || selections;

    try {
      let imageFieldId: string | null = null;
      const findImageField = (nodes: any[]) => {
        if (!Array.isArray(nodes)) return;
        for (let node of nodes) {
          if (node.fieldType === 'image') { imageFieldId = node.id; return; }
          if (node.items && !imageFieldId) findImageField(node.items);
        }
      };
      findImageField(resortSchemaStructure);

      const guests = roundedGuests;

      // Safe Date Parsing
      let checkIn = new Date(checkInRaw + "T00:00:00");
      let checkOut = new Date(checkOutRaw + "T00:00:00");
      if (isNaN(checkIn.getTime())) checkIn = new Date();
      if (isNaN(checkOut.getTime())) {
        checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1);
      }

      let daysDiff = 1;
      if (checkOut > checkIn) {
        daysDiff = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }
      if (daysDiff < 1) daysDiff = 1;

      const eventsCount = selectedEventNames.length || 1;

      // Collect active selected items WITH Category
      const activeItems: any[] = [];
      masterCatalog.forEach((group) => {
        const categoryName = group.name || 'General Requirements';
        const parseItems = (items: any[]) => {
          if (!Array.isArray(items)) return;
          items.forEach((item) => {
            if (item.items && Array.isArray(item.items)) {
              parseItems(item.items);
            } else {
              const id = item.id;
              const rule = (item.pricingRule || item.rule || 'flat').toLowerCase();
              const name = item.name || 'Custom Element';
              const state = activeSelections[id];

              if (state && (state.checked || state.qty > 0)) {
                activeItems.push({
                  id,
                  name,
                  rule,
                  qty: state.qty > 0 ? state.qty : 1,
                  category: categoryName,
                });
              }
            }
          });
        };
        parseItems(group.items);
      });

      setGlobalActiveItems(activeItems);
      sessionStorage.setItem('wedsaas_compare_active_items', JSON.stringify(activeItems));

      const [resortsSnap, pricingSnap] = await Promise.all([
        getDocs(collection(db, "resort_data")),
        getDocs(collection(db, "resort_planner_pricing"))
      ]);

      const pricingByResort: Record<string, any[]> = {};
      pricingSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d.resortId) return;
        if (!pricingByResort[d.resortId]) pricingByResort[d.resortId] = [];
        pricingByResort[d.resortId].push(d);
      });

      const calculatedResortsList: any[] = [];

      resortsSnap.forEach((rDoc) => {
        const resort = rDoc.data();
        if (resort.core_hidden) return;
        const rId = rDoc.id;

        let resortRooms = Number(resort.core_rooms || resort.rooms || 0);
        let maxCap = resortRooms > 0 ? (resortRooms * 3) : Number(resort.maxCapacity || resort.capacity || 9999);

        if (maxCap < (guests - 20)) return;

        let basePrice = 8500;
        const pricingTiers: any[] = [];
        const extractTiers = (nodes: any[]) => {
          if (!Array.isArray(nodes)) return;
          nodes.forEach((node) => {
            if (node.type === 'subcategory' && node.items) {
              let minId: string | undefined, maxId: string | undefined, priceId: string | undefined;
              node.items.forEach((sub: any) => {
                if (sub.id === 'cond_min_guest' || sub.calcTag === 'cond_min_guest') minId = sub.id;
                if (sub.id === 'cond_max_guest' || sub.calcTag === 'cond_max_guest') maxId = sub.id;
                if (sub.id === 'calc_base_price' || sub.calcTag === 'calc_base_price') priceId = sub.id;
              });
              if (minId && maxId && priceId) {
                Object.keys(resort).forEach((key) => {
                  if (key.startsWith(priceId!)) {
                    const suffix = key.replace(priceId!, '');
                    pricingTiers.push({
                      min: Number(resort[minId! + suffix] || 0),
                      max: Number(resort[maxId! + suffix] || 999999),
                      price: Number(resort[priceId! + suffix] || 0)
                    });
                  }
                });
              }
            }
            if (node.items) extractTiers(node.items);
          });
        };
        extractTiers(resortSchemaStructure);

        if (pricingTiers.length > 0) {
          const matchingTier = pricingTiers.find((t) => guests >= t.min && guests <= t.max);
          basePrice = matchingTier ? matchingTier.price : Math.min(...pricingTiers.map((t) => t.price));
        }

        const calRules = resort.core_calendar || [];
        let totalStayCost = 0;
        for (let i = 0; i < daysDiff; i++) {
          let dateObj = new Date(checkIn); dateObj.setDate(checkIn.getDate() + i);
          let finalDaily = basePrice;

          calRules.forEach((rule: any) => {
            if (rule.dateType === 'range' && rule.adjustmentType === 'discount_percent') {
              const sD = new Date(rule.startDate); const eD = new Date(rule.endDate);
              sD.setHours(0, 0, 0, 0); eD.setHours(0, 0, 0, 0);
              if (dateObj >= sD && dateObj <= eD) finalDaily -= (finalDaily * (parseFloat(rule.value) / 100));
            }
          });
          totalStayCost += (finalDaily * guests);
        }

        let rawFlatFee = resort['id_8rypjw0pr'] || "0";
        let cleanFlatFee = rawFlatFee.toString().replace(/,/g, '').replace(/[^0-9.]/g, '');
        let resortFlatFee = Number(cleanFlatFee) || 0;
        const finalResortCost = totalStayCost + resortFlatFee;

        let resortImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80';
        if (imageFieldId && resort[imageFieldId]) {
          let rawImg = resort[imageFieldId];
          if (typeof rawImg === 'string') resortImage = rawImg.split(',')[0].trim();
          else if (Array.isArray(rawImg) && rawImg.length > 0) resortImage = rawImg[0];
        } else if (resort.image || resort.coverImage) {
          resortImage = resort.image || resort.coverImage;
        }

        const availablePlanners = pricingByResort[rId] || [];
        let generatedQuotes: any[] = [];
        let lowestQuote: any = null;
        let bestPlannerCost = 0;

        availablePlanners.forEach((pricingData) => {
          let pCost = 0;
          pCost += Number(pricingData.core_base_decor_3_events) || 0;
          if (eventsCount > 3) pCost += (eventsCount - 3) * (Number(pricingData.core_addon_decor_per_event) || 0);

          activeItems.forEach((item) => {
            const dbPrice = parseFloat(pricingData[item.id]) || 0;
            const rStr = item.rule; const q = item.qty;
            if (rStr.includes('flat') || rStr.includes('bundle')) pCost += dbPrice;
            else if (rStr === 'per_person') pCost += (dbPrice * guests);
            else if (rStr === 'per_person_event') pCost += (dbPrice * guests * eventsCount);
            else if (rStr === 'per_person_day') pCost += (dbPrice * guests * daysDiff);
            else if (rStr.includes('qty') && rStr.includes('event')) pCost += (dbPrice * q * eventsCount);
            else if (rStr.includes('qty') && rStr.includes('day')) pCost += (dbPrice * q * daysDiff);
            else if (rStr.includes('qty') || rStr.includes('quant') || rStr.includes('unit')) pCost += (dbPrice * q);
            else if (rStr.includes('item') && !rStr.includes('person')) pCost += (dbPrice * q);
          });

          let grandTotal = finalResortCost + pCost;
          let realPlannerName = pricingData.core_company || pricingData.plannerName || pricingData.planner_name || pricingData.name || pricingData._recordName || "Elite Planner";
          let realLogo = pricingData.core_logo || pricingData.logoUrl || pricingData.logo || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop";
          let realInsta = pricingData.core_insta || pricingData.instaUrl || pricingData.insta || "#";
          let realImage = pricingData.core_portfolio || pricingData.plannerImage || pricingData.image || resortImage;

          let currentQuote = {
            plannerName: realPlannerName,
            grandTotal: grandTotal,
            resortTotal: finalResortCost,
            plannerTotal: pCost,
            plannerImage: realImage,
            logoUrl: realLogo,
            instaUrl: realInsta
          };

          generatedQuotes.push(currentQuote);

          if (!lowestQuote || grandTotal < lowestQuote.grandTotal) {
            lowestQuote = currentQuote;
            bestPlannerCost = pCost;
          }
        });

        if (generatedQuotes.length === 0) {
          bestPlannerCost = 0;
          lowestQuote = {
            plannerName: "WedSaaS Estimate",
            grandTotal: finalResortCost,
            resortTotal: finalResortCost,
            plannerTotal: 0,
            plannerImage: resortImage,
            logoUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
            instaUrl: "@wedsaas"
          };
          generatedQuotes.push(lowestQuote);
        }

        calculatedResortsList.push({
          id: rId,
          name: resort._recordName || resort.resortName || resort.name || 'Unnamed Resort',
          location: resort.core_location || resort.location || resort.city || 'India',
          rooms: resortRooms,
          image: resortImage,
          starRatingStr: resort.core_star_rating || "Unrated",
          expertRating: resort.core_expert_rating || resort.expertRating || null,
          offer: resort.core_offer || null,
          tags: resort.core_tags || null,
          totalBudget: lowestQuote.grandTotal,
          breakdown: { resort: finalResortCost, planner: bestPlannerCost },
          allQuotes: generatedQuotes,
          lowestQuotePlannerName: lowestQuote.plannerName
        });
      });

      sessionStorage.setItem('wedsaas_compare_results', JSON.stringify(calculatedResortsList));
      sessionStorage.setItem('wedsaas_compare_guests', String(guests));
      sessionStorage.setItem('wedsaas_compare_days', String(daysDiff));
      sessionStorage.setItem('wedsaas_compare_checkin', checkInRaw || '');
      sessionStorage.setItem('wedsaas_compare_checkout', checkOutRaw || '');

      setResults(calculatedResortsList);
      setCurrentDisplayCount(10);
      setStep(6); // Show Results
    } catch (err: any) {
      console.error(err);
      alert("AI Cost Engine Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- REDIRECT ON RESORT CLICK (Direct Navigation) ---
  const logSaveAndRedirect = async (id: string, name: string) => {
    if (!currentUser) {
      setPendingResortRedirect({ id, name });
      setAuthModalOpen(true);
      return;
    }

    setLoadingText("Loading Resort...");
    setLoading(true);

    try {
      const activityId = currentUser.uid + "_" + Date.now();
      await setDoc(doc(db, "activity_logs", activityId), {
        action: "Compared & Viewed Resort",
        userId: currentUser.uid,
        resortClickedId: id,
        timestamp: new Date()
      });

      router.push(`/resort/${id}`);
    } catch (e) {
      router.push(`/resort/${id}`);
    } finally {
      setLoading(false);
    }
  };

  // --- AUTH OTP HANDLERS ---
  const handleSendOTP = async () => {
    if (!authName.trim()) { setAuthError("Please enter your Full Name."); return; }
    if (authPhone.length < 10) { setAuthError("Enter a valid 10-digit number."); return; }

    setAuthError('');
    setAuthLoading(true);

    try {
      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, 'compare-recaptcha-container', { size: 'invisible' });
        setRecaptchaVerifier(verifier);
      }

      const result = await signInWithPhoneNumber(auth, "+91" + authPhone.trim(), verifier);
      setConfirmationResult(result);
      setOtpStep(true);
    } catch (err: any) {
      setAuthError(err.message || "Failed to send OTP.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (authOtp.length !== 6) return;
    setAuthLoading(true);

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(authOtp);
        setCurrentUser(result.user);
        setAuthModalOpen(false);

        await setDoc(doc(db, "users", result.user.uid), {
          name: authName.trim(),
          phone: result.user.phoneNumber,
          lastLogin: new Date().toISOString()
        }, { merge: true });

        if (pendingSaveResort) {
          await saveSingleResortBudget(pendingSaveResort, result.user);
          setPendingSaveResort(null);
          alert(`Saved ${pendingSaveResort.name} budget to your profile!`);
        } else if (pendingResortRedirect) {
          router.push(`/resort/${pendingResortRedirect.id}`);
        }
      }
    } catch (err) {
      setAuthError("Invalid OTP.");
    } finally {
      setAuthLoading(false);
    }
  };

  // --- CASCADING DEPENDENT FILTERS ---
  const filteredResults = useMemo(() => {
    let temp = [...results];

    if (filterLocation !== 'all') {
      temp = temp.filter((r) => r.location === filterLocation);
    }
    if (filterStar !== 'all') {
      temp = temp.filter((r) => r.starRatingStr === filterStar);
    }
    if (filterBudget !== 'all') {
      const [bMin, bMax] = filterBudget.split('-').map(Number);
      temp = temp.filter((r) => r.totalBudget >= bMin && r.totalBudget < bMax);
    }
    if (filterRooms !== 'all') {
      const [rMin, rMax] = filterRooms.split('-').map(Number);
      temp = temp.filter((r) => Number(r.rooms) >= rMin && Number(r.rooms) < rMax);
    }

    if (sortOption === 'price_low') temp.sort((a, b) => a.totalBudget - b.totalBudget);
    else if (sortOption === 'price_high') temp.sort((a, b) => b.totalBudget - a.totalBudget);
    else if (sortOption === 'rooms_low') temp.sort((a, b) => a.rooms - b.rooms);
    else if (sortOption === 'rooms_high') temp.sort((a, b) => b.rooms - a.rooms);

    return temp;
  }, [results, filterLocation, filterStar, filterBudget, filterRooms, sortOption]);

  const resetComparison = () => {
    sessionStorage.removeItem('wedsaas_compare_results');
    sessionStorage.removeItem('wedsaas_compare_guests');
    sessionStorage.removeItem('wedsaas_compare_days');
    sessionStorage.removeItem('wedsaas_compare_checkin');
    sessionStorage.removeItem('wedsaas_compare_checkout');
    sessionStorage.removeItem('wedsaas_compare_active_items');
    setResults([]);
    setStep(1);
  };

  // Render Smart Card for Requirements with Info Modal Button
  const renderSmartCard = (item: any) => {
    if (!item || !item.name) return null;

    const ruleStr = (item.pricingRule || item.rule || 'flat').toLowerCase();
    const needsQty =
      ruleStr.includes('qty') || ruleStr.includes('quant') || ruleStr.includes('unit');

    const sel = selections[item.id] || { checked: false, qty: 0 };
    const isChecked = sel.checked || sel.qty > 0;

    const borderClass = isChecked ? 'border-[#6B0D24]' : 'border-gray-200';
    const checkBgClass = isChecked ? 'bg-[#6B0D24] border-[#6B0D24]' : 'bg-black/30 border-white';

    const thumb = item.thumbnail || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=300&h=200';
    const desc = item.description || 'No description provided for this element.';

    if (needsQty) {
      return (
        <div
          key={item.id}
          className={`block relative bg-white border ${borderClass} rounded-2xl shadow-xs pb-3 select-none flex flex-col h-full transition-all`}
        >
          {/* Card Thumbnail Header */}
          <div className="h-24 w-full bg-gray-100 relative rounded-t-2xl overflow-hidden mb-2 shrink-0">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <i className="ph-fill ph-image text-3xl" />
              </div>
            )}

            {/* INFO ICON BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setItemModalDoc({ title: item.name, desc, rule: ruleStr, thumb });
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#6B0D24] w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-30"
              title="View Item Description"
            >
              <i className="ph-fill ph-info text-xs" />
            </button>

            <div
              className={`absolute inset-0 bg-[#6B0D24]/10 transition-opacity ${
                isChecked ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          <div className="px-2.5 flex-1 flex flex-col">
            <h5 className="font-bold text-gray-900 text-xs leading-tight mb-1" title={item.name}>
              {item.name}
            </h5>
            <span className="text-[8px] font-bold text-[#6B0D24] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#6B0D24]/10 uppercase tracking-wider self-start">
              {(item.pricingRule || item.rule || '').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="mt-auto px-2.5 pt-2">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-1 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Qty
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCardQtyChange(item.id, -1)}
                  className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold">{sel.qty || 0}</span>
                <button
                  type="button"
                  onClick={() => handleCardQtyChange(item.id, 1)}
                  className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        onClick={() => handleCardToggle(item.id)}
        className={`relative bg-white border ${borderClass} rounded-2xl cursor-pointer hover:border-[#6B0D24]/40 transition-all shadow-xs pb-3 select-none flex flex-col h-full`}
      >
        {/* Checkmark Badge */}
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded-md border ${checkBgClass} flex items-center justify-center z-20`}
        >
          <i
            className={`ph-bold ph-check text-white text-[10px] ${
              isChecked ? 'opacity-100' : 'opacity-0'
            } transition-opacity`}
          />
        </div>

        {/* Card Thumbnail Header */}
        <div className="h-24 w-full bg-gray-100 relative rounded-t-2xl overflow-hidden mb-2 shrink-0">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <i className="ph-fill ph-image text-3xl" />
            </div>
          )}

          {/* INFO ICON BUTTON */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setItemModalDoc({ title: item.name, desc, rule: ruleStr, thumb });
            }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#6B0D24] w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-30"
            title="View Item Description"
          >
            <i className="ph-fill ph-info text-xs" />
          </button>

          <div
            className={`absolute inset-0 bg-[#6B0D24]/10 transition-opacity ${
              isChecked ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="px-2.5 flex-1 flex flex-col">
          <h5 className="font-bold text-gray-900 text-xs leading-tight mb-1" title={item.name}>
            {item.name}
          </h5>
          <span className="text-[8px] font-bold text-[#6B0D24] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#6B0D24]/10 uppercase tracking-wider self-start">
            {(item.pricingRule || item.rule || '').replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    );
  };

  // Group Event Specific Items
  const matchedEventGroups = useMemo(() => {
    return masterCatalog.filter((g) => (g.type || '').toLowerCase() === 'event' && selectedEventNames.includes(g.name));
  }, [masterCatalog, selectedEventNames]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col relative overflow-x-hidden">
      <Navbar />

      {/* FULLSCREEN AI ENGINE LOADER OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100000] bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6B0D24] text-[#C5A059] flex items-center justify-center text-3xl mb-4 animate-bounce shadow-lg shadow-[#6B0D24]/30">
            <i className="ph-fill ph-sparkle"></i>
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">{loadingText}</h3>
          <p className="text-gray-300 text-xs md:text-sm max-w-md font-medium leading-relaxed">{loadingSubtext}</p>
        </div>
      )}

      {/* PROGRESS BAR CONTAINER */}
      {step < 6 && (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-28 shrink-0">
          <div className="bg-white p-3 md:p-4 rounded-3xl border border-gray-100 shadow-sm">
            <div className="overflow-hidden h-2 mb-2.5 text-xs flex rounded-full bg-gray-100 p-0.5 border border-gray-200/50">
              <div
                style={{ width: `${(step / 5) * 100}%` }}
                className="shadow-xs flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[#6B0D24] to-[#8C1B36] rounded-full transition-all duration-500"
              />
            </div>
            <div className="grid grid-cols-5 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-wider text-center">
              <span className={step >= 1 ? "text-[#6B0D24] font-bold" : ""}>1. Basics</span>
              <span className={step >= 2 ? "text-[#6B0D24] font-bold" : ""}>2. Events</span>
              <span className={step >= 3 ? "text-[#6B0D24] font-bold" : ""}>3. Package</span>
              <span className={step >= 4 ? "text-[#6B0D24] font-bold" : ""}>4. Requirements</span>
              <span className={step >= 5 ? "text-[#6B0D24] font-bold" : ""}>5. Results</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT STEPPER */}
      <main className={`flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto ${step === 6 ? 'pt-24 md:pt-28' : ''}`}>

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
                <i className="ph-bold ph-sliders-horizontal text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Basic Details</h2>
                <p className="text-gray-400 text-xs font-medium">Choose your estimated dates and guest count.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="p-5 bg-[#FAF6F0] border border-[#6B0D24]/10 rounded-2xl">
              <label className="block text-[10px] font-black text-[#6B0D24] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ph-fill ph-users text-[#6B0D24] text-base"></i> Total Guest Count
              </label>
              <input
                type="number"
                value={guestCountInput}
                onChange={(e) => setGuestCountInput(parseInt(e.target.value) || 0)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B0D24] outline-none text-xl font-black text-gray-900 transition"
              />
              <p className="text-[10px] text-gray-500 mt-2 font-bold flex items-center gap-1">
                <i className="ph-fill ph-info text-xs text-[#6B0D24]"></i> Auto-rounds to match dynamic resort capacities ({roundedGuests} Guests).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl relative">
                <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ph-fill ph-calendar text-[#6B0D24]"></i> Check-in Date
                </label>
                <input
                  type="text"
                  readOnly
                  value={checkInReadable}
                  placeholder="Select Check-in Date"
                  onClick={(e) => toggleCalendar('in', undefined, e)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 text-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#6B0D24] transition"
                />
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl relative">
                <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ph-fill ph-calendar text-[#6B0D24]"></i> Check-out Date
                </label>
                <input
                  type="text"
                  readOnly
                  disabled={!checkInRaw}
                  value={checkOutReadable}
                  placeholder="Select Check-out Date"
                  onClick={(e) => toggleCalendar('out', undefined, e)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 text-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#6B0D24] disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!checkInRaw || !checkOutRaw) return alert("Please select Check-in and Check-out dates.");
                setStep(2);
              }}
              className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              Next: Select Events <i className="ph-bold ph-arrow-right text-base"></i>
            </button>
          </div>
        )}

        {/* STEP 2: CHOOSE EVENTS */}
        {step === 2 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-[#6B0D24] flex items-center gap-1 font-bold text-[10px] transition uppercase tracking-wider">
              <i className="ph-bold ph-arrow-left"></i> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
                <i className="ph-bold ph-tent text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Select Planned Functions</h2>
                <p className="text-gray-400 text-xs font-medium">Select at least 1 function to customize setups.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {masterCatalog
                .filter((g) => (g.type || '').toLowerCase() === 'event')
                .map((group) => {
                  const isChecked = selectedEventNames.includes(group.name);
                  return (
                    <label
                      key={group.name}
                      onClick={() => {
                        setSelectedEventNames((prev) =>
                          isChecked ? prev.filter((n) => n !== group.name) : [...prev, group.name]
                        );
                      }}
                      className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition shadow-xs ${
                        isChecked ? 'border-[#6B0D24] bg-[#FAF6F0]' : 'border-gray-200 hover:border-[#6B0D24] bg-white'
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} readOnly className="w-5 h-5 text-[#6B0D24] rounded border-gray-300" />
                      <span className="font-bold text-gray-900 text-sm">{group.name}</span>
                    </label>
                  );
                })}
            </div>

            <button
              onClick={() => {
                if (selectedEventNames.length === 0) return alert("Please select at least 1 function to continue.");
                setStep(3);
              }}
              className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              Next: Select Package Mode <i className="ph-bold ph-arrow-right text-base"></i>
            </button>
          </div>
        )}

        {/* STEP 3: SELECTION MODE */}
        {step === 3 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <button onClick={() => setStep(2)} className="text-gray-400 hover:text-[#6B0D24] flex items-center gap-1 font-bold text-[10px] transition uppercase tracking-wider">
              <i className="ph-bold ph-arrow-left"></i> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
                <i className="ph-bold ph-[#6B0D24] ph-gear text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Setup Configuration</h2>
                <p className="text-gray-400 text-xs font-medium">Choose standard automated setups or custom items.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => selectPackageMode('recommended')}
                className="group p-6 rounded-2xl border-2 border-[#6B0D24] bg-[#FAF6F0] hover:bg-white cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#6B0D24] text-white flex items-center justify-center mb-3 shadow-md shadow-[#6B0D24]/20 group-hover:scale-105 transition">
                    <i className="ph-fill ph-magic-wand text-lg text-[#C5A059]"></i>
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1">Preselected Setup</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 font-medium">
                    Instantly applies standard sound, stage lighting, and essential decor curated by wedding planners.
                  </p>
                </div>
                <button className="w-full py-3 bg-[#6B0D24] hover:bg-[#520a1a] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-xs">
                  Fast-Track <i className="ph-bold ph-arrow-right"></i>
                </button>
              </div>

              <div
                onClick={() => selectPackageMode('custom')}
                className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-gray-800 bg-white cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <i className="ph-bold ph-sliders-horizontal text-lg"></i>
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1">Customize Setup</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 font-medium">
                    Choose every sound system, decoration detail, and stage light manually step-by-step.
                  </p>
                </div>
                <button className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5">
                  Customize <i className="ph-bold ph-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: GENERAL REQUIREMENTS */}
        {step === 4 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <button onClick={() => setStep(3)} className="text-gray-400 hover:text-[#6B0D24] flex items-center gap-1 font-bold text-[10px] transition uppercase tracking-wider">
              <i className="ph-bold ph-arrow-left"></i> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
                <i className="ph-bold ph-package text-xl"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">General Requirements</h2>
                <p className="text-gray-400 text-xs font-medium">Select items needed across your entire celebration.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {masterCatalog
                .filter((g) => (g.type || '').toLowerCase() === 'general' || (g.name || '').toLowerCase().includes('general'))
                .flatMap((g) => {
                  const flatItems: any[] = [];
                  (g.items || []).forEach((item: any) => {
                    if (item.items && Array.isArray(item.items)) flatItems.push(...item.items);
                    else flatItems.push(item);
                  });
                  return flatItems;
                })
                .map((item) => renderSmartCard(item))}
            </div>

            <button onClick={() => setStep(5)} className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2">
              Next: Function Specific Elements <i className="ph-bold ph-arrow-right text-base"></i>
            </button>
          </div>
        )}

        {/* STEP 5: EVENT SPECIFIC ELEMENTS */}
        {step === 5 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <button onClick={() => setStep(4)} className="text-gray-400 hover:text-[#6B0D24] flex items-center gap-1 font-bold text-[10px] transition uppercase tracking-wider">
              <i className="ph-bold ph-arrow-left"></i> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
                <i className="ph-bold ph-[#6B0D24] ph-sparkle text-xl text-[#C5A059]"></i>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Function-Specific Elements</h2>
                <p className="text-gray-400 text-xs font-medium">Switch tabs below to configure items for each function.</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* EVENT TABS HEADER */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {matchedEventGroups.map((group, idx) => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => setActiveEventTabIdx(idx)}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs whitespace-nowrap transition flex items-center gap-2 ${
                    activeEventTabIdx === idx ? 'bg-[#6B0D24] text-white border-[#6B0D24]' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <span>{group.name}</span>
                </button>
              ))}
            </div>

            {/* EVENT TAB CONTENT PANEL */}
            {matchedEventGroups.length > 0 && matchedEventGroups[activeEventTabIdx] && (
              <div className="min-h-[200px]">
                <div className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl mb-4">
                  <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                    <i className="ph-fill ph-sparkle text-[#C5A059]"></i> Elements for {matchedEventGroups[activeEventTabIdx].name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(matchedEventGroups[activeEventTabIdx].items || []).flatMap((item: any) => {
                    if (item.items && Array.isArray(item.items)) return item.items;
                    return [item];
                  }).map((sub: any) => renderSmartCard(sub))}
                </div>
              </div>
            )}

            <button
  onClick={() => executeMathEngine()}
  className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
>
  <i className="ph-fill ph-sparkle text-lg text-[#C5A059]"></i> COMPARE ALL RESORTS
</button>
          </div>
        )}

        {/* STEP 6: RESULTS VIEW (MATCHED ISSUES 2 & 3) */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mb-1">Handpicked Resort Packages</h2>
                <p className="text-gray-400 text-xs font-medium">
                  Showing {filteredResults.length} Suitable Resorts For {roundedGuests} Guests.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={resetComparison}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition border border-gray-200"
                >
                  <i className="ph-bold ph-arrows-clockwise text-sm"></i> Restart Search
                </button>

                <div className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl shadow-xs flex items-center gap-2">
                  <i className="ph-bold ph-sort-descending text-gray-400"></i>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-700 outline-none cursor-pointer w-full"
                  >
                    <option value="price_low">Total Budget: Low to High</option>
                    <option value="price_high">Total Budget: High to Low</option>
                    <option value="rooms_low">Rooms: Low to High</option>
                    <option value="rooms_high">Rooms: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CASCADING DROPDOWNS FILTER BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-transparent">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Location</label>
                <div className="bg-white px-3 py-2.5 border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <i className="ph-bold ph-map-pin text-[#6B0D24] text-xs"></i>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-700 outline-none cursor-pointer w-full"
                  >
                    <option value="all">All Locations</option>
                    {[...new Set(results.map((r) => r.location).filter(Boolean))].sort().map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Category</label>
                <div className="bg-white px-3 py-2.5 border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <i className="ph-bold ph-star text-[#C5A059] text-xs"></i>
                  <select
                    value={filterStar}
                    onChange={(e) => setFilterStar(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-700 outline-none cursor-pointer w-full"
                  >
                    <option value="all">All Star Ratings</option>
                    {[...new Set(results.map((r) => r.starRatingStr).filter(Boolean))].sort().map((star) => (
                      <option key={star} value={star}>{star}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Budget Range</label>
                <div className="bg-white px-3 py-2.5 border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <i className="ph-bold ph-currency-inr text-[#6B0D24] text-xs"></i>
                  <select
                    value={filterBudget}
                    onChange={(e) => setFilterBudget(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-700 outline-none cursor-pointer w-full"
                  >
                    <option value="all">All Budgets</option>
                    <option value="0-2000000">Under 20 Lacs</option>
                    <option value="2000000-4000000">20 - 40 Lacs</option>
                    <option value="4000000-6000000">40 - 60 Lacs</option>
                    <option value="6000000-10000000">60 Lacs - 1 Cr</option>
                    <option value="10000000-999999999">Above 1 Cr</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Rooms Bracket</label>
                <div className="bg-white px-3 py-2.5 border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <i className="ph-bold ph-door text-[#6B0D24] text-xs"></i>
                  <select
                    value={filterRooms}
                    onChange={(e) => setFilterRooms(e.target.value)}
                    className="bg-transparent font-bold text-xs text-gray-700 outline-none cursor-pointer w-full"
                  >
                    <option value="all">All Rooms</option>
                    <option value="0-50">Under 50 Rooms</option>
                    <option value="50-100">50 - 100 Rooms</option>
                    <option value="100-200">100 - 200 Rooms</option>
                    <option value="200-999">Above 200 Rooms</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RESULTS CARDS LIST */}
            {filteredResults.length === 0 ? (
              <div className="p-10 bg-white border border-gray-200 rounded-3xl text-center">
                <i className="ph ph-mask-sad text-4xl text-gray-300 mb-2"></i>
                <h3 className="font-bold text-gray-800">No Match Found</h3>
                <p className="text-sm text-gray-500">No resorts match your active filtering parameters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResults.slice(0, currentDisplayCount).map((resort) => {
                  let starNum = parseInt(resort.starRatingStr) || 4;

                  return (
                    <div
                      key={resort.id}
                      onClick={() => logSaveAndRedirect(resort.id, resort.name)}
                      className="group bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-2xl hover:border-[#6B0D24] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col md:flex-row relative"
                    >
                      {resort.offer && (
                        <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg border border-red-500 animate-pulse">
                          {resort.offer}
                        </div>
                      )}

                      <div className="w-full md:w-80 h-60 md:h-auto relative overflow-hidden shrink-0">
                        <img src={resort.image} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                          {resort.expertRating && (
                            <div className="bg-gray-900/90 backdrop-blur-xs text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs text-[#C5A059] flex items-center gap-1 border border-gray-700">
                              <i className="ph-fill ph-star"></i> {resort.expertRating}
                            </div>
                          )}
                          {resort.rooms > 0 && (
                            <div className="bg-white/90 backdrop-blur-xs text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs text-gray-800 flex items-center gap-1 border border-gray-200">
                              <i className="ph-fill ph-door text-[#6B0D24]"></i> {resort.rooms} Rooms
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 bg-white">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] mb-2 text-[#C5A059]">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`ph-fill ph-star ${i < starNum ? 'text-[#C5A059]' : 'text-gray-200'}`} />
                            ))}
                            <span className="text-gray-400 ml-1 font-bold">{resort.starRatingStr}</span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight group-hover:text-[#6B0D24] transition line-clamp-2">
                            {resort.name}
                          </h3>
                          <p className="text-gray-500 text-xs font-semibold flex items-center gap-1.5 mt-2">
                            <i className="ph-fill ph-map-pin text-[#6B0D24] text-base"></i> {resort.location}
                          </p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#6B0D24] shrink-0">
                              <i className="ph-fill ph-bed text-lg"></i>
                            </div>
                            <div>
                              <span className="block text-gray-900 text-sm font-black">₹{resort.breakdown.resort.toLocaleString('en-IN')}</span>
                              Stay & Venue
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#6B0D24] shrink-0">
                              <i className="ph-fill ph-sparkle text-lg text-[#C5A059]"></i>
                            </div>
                            <div>
                              <span className="block text-gray-900 text-sm font-black">₹{resort.breakdown.planner.toLocaleString('en-IN')}</span>
                              Decor & Setup
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-72 bg-gradient-to-br from-stone-50 to-stone-100 p-6 md:p-8 flex flex-col justify-center items-center md:items-end text-center md:text-right shrink-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estd. Grand Total</p>
                        <h4 className="text-2xl md:text-3xl font-black text-[#6B0D24] mb-4 tracking-tight">
                          ₹{resort.totalBudget.toLocaleString('en-IN')}
                        </h4>
                        <button className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex justify-center items-center gap-2 mb-3.5">
  View Property <i className="ph-bold ph-arrow-right"></i>
</button>
                        <button
                        onClick={(e) => handleSaveBudgetClick(e, resort)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                          savedResortIds.has(resort.id)
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                            : 'bg-white hover:bg-gray-50 text-[#6B0D24] border border-[#6B0D24]/30 hover:border-[#6B0D24]'
                        }`}
                      >
                        {savedResortIds.has(resort.id) ? (
                          <>
                            <i className="ph-bold ph-check-circle text-base text-green-600"></i> Saved to Profile
                          </>
                        ) : (
                          <>
                            <i className="ph-bold ph-bookmark-simple text-base text-[#6B0D24]"></i> Shortlist
                          </>
                        )}
                      </button>
                      </div>
                    </div>
                  );
                })}

                {currentDisplayCount < filteredResults.length && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setCurrentDisplayCount((prev) => prev + itemsPerPage)}
                      className="bg-white border border-gray-200 text-gray-800 px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition shadow-xs inline-flex items-center gap-2"
                    >
                      <i className="ph-bold ph-caret-down"></i> Show More Resorts
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CALENDAR WIDGET MODAL */}
      {calendarOpen && (
        <div
          style={{
            position: calendarPosition.isFixed ? 'fixed' : 'absolute',
            top: calendarPosition.isFixed ? '50%' : calendarPosition.top,
            left: calendarPosition.isFixed ? '50%' : calendarPosition.left,
            transform: calendarPosition.isFixed ? 'translate(-50%, -50%)' : 'none',
          }}
          className="z-[9999] bg-white border border-gray-200 rounded-3xl shadow-2xl p-5 w-76"
        >
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition">
              <i className="ph-bold ph-caret-left"></i>
            </button>
            <span className="font-black text-sm text-gray-800">
              {MONTHS[calendarCurrentDate.getMonth()]} {calendarCurrentDate.getFullYear()}
            </span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition">
              <i className="ph-bold ph-caret-right"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-gray-400 mb-1.5">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-700">
            {(() => {
              const year = calendarCurrentDate.getFullYear();
              const month = calendarCurrentDate.getMonth();
              const today = new Date(); today.setHours(0, 0, 0, 0);

              let checkInDate: Date | null = null;
              if (checkInRaw) {
                checkInDate = new Date(checkInRaw);
                checkInDate.setHours(0, 0, 0, 0);
              }

              const firstDayIndex = new Date(year, month, 1).getDay();
              const totalDays = new Date(year, month + 1, 0).getDate();
              const cells = [];

              for (let i = 0; i < firstDayIndex; i++) {
                cells.push(<div key={`blank-${i}`} />);
              }

              for (let day = 1; day <= totalDays; day++) {
                const thisDate = new Date(year, month, day);
                thisDate.setHours(0, 0, 0, 0);
                const thisTime = thisDate.getTime();
                let isDisabled = false;

                if (calendarMode === 'in') {
                  if (thisTime < today.getTime()) isDisabled = true;
                } else {
                  if (!checkInDate) isDisabled = true;
                  else {
                    const minOut = new Date(checkInDate.getTime()); minOut.setDate(minOut.getDate() + 1);
                    const maxOut = new Date(checkInDate.getTime()); maxOut.setDate(maxOut.getDate() + 4);
                    if (thisTime < minOut.getTime() || thisTime > maxOut.getTime()) isDisabled = true;
                  }
                }

                if (isDisabled) {
                  cells.push(<div key={day} className="p-1.5 text-gray-300 cursor-not-allowed text-center">${day}</div>);
                } else {
                  cells.push(
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectCalendarDate(year, month, day)}
                      className="p-1.5 rounded-lg text-center font-black text-gray-700 hover:bg-[#6B0D24] hover:text-white transition duration-100"
                    >
                      {day}
                    </button>
                  );
                }
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* ITEM DESC MODAL */}
      {itemModalDoc && (
        <div className="fixed inset-0 z-[9999] bg-gray-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-56 bg-gray-100 shrink-0">
              <img src={itemModalDoc.thumb} alt={itemModalDoc.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setItemModalDoc(null)}
                className="absolute top-4 right-4 bg-white/90 text-gray-900 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white shadow-md transition"
              >
                <i className="ph-bold ph-x font-bold text-lg"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{itemModalDoc.title}</h3>
              <span className="inline-block bg-[#FAF6F0] text-[#6B0D24] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4 border border-[#6B0D24]/10">
                Pricing Rule: {itemModalDoc.rule.replace(/_/g, ' ')}
              </span>
              <p className="text-gray-600 text-sm leading-relaxed">{itemModalDoc.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* OTP AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex justify-center items-center">
              <i className="ph-bold ph-x text-lg"></i>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#6B0D24]/10 text-[#6B0D24] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#6B0D24]/20 shadow-xs">
                <i className="ph-fill ph-buildings text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-gray-900">View Resort Details</h3>
              <p className="text-gray-500 mt-1 text-xs font-medium">Verify your mobile number to view details and lock in your calculated quotes.</p>
            </div>

            {!otpStep ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-3 mb-4 border border-gray-300 rounded-xl outline-none font-bold text-gray-800 bg-white text-sm focus:ring-2 focus:ring-[#6B0D24]"
                />

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Phone Number</label>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden mb-6 focus-within:ring-2 focus-within:ring-[#6B0D24] bg-gray-50">
                  <span className="px-4 py-3 text-gray-600 font-black border-r border-gray-200 text-sm">+91</span>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="10 digit number"
                    className="w-full p-3 outline-none font-bold text-gray-800 tracking-wider bg-white text-sm"
                  />
                </div>
                <div id="compare-recaptcha-container" className="mb-4" />
                <button
                  onClick={handleSendOTP}
                  disabled={authLoading}
                  className="w-full bg-[#6B0D24] text-white font-bold py-3.5 rounded-2xl hover:bg-[#520a1a] transition shadow-lg text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {authLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 text-center">Enter 6-Digit Verification Code</label>
                <input
                  type="number"
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  placeholder="------"
                  className="w-full p-3.5 mb-6 border border-slate-300 rounded-xl outline-none font-black text-center tracking-[0.6em] text-2xl text-gray-900 bg-gray-50 focus:bg-white focus:border-[#6B0D24] transition"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={authLoading}
                  className="w-full bg-[#6B0D24] text-white font-black py-3.5 rounded-2xl hover:bg-[#520a1a] transition shadow-lg text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {authLoading ? 'Verifying...' : 'Verify & Proceed'}
                </button>
              </div>
            )}

            {authError && (
              <p className="text-red-500 text-xs font-bold text-center mt-4 bg-red-50 p-2 rounded-lg">{authError}</p>
            )}
          </div>
        </div>
      )}

      {/* User Consent Popup */}
      <ConsentPopup />
    </div>
  );
}

export default function CompareResortsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500 font-bold">
          <i className="ph-bold ph-spinner animate-spin text-4xl text-[#6B0D24] mb-2"></i>
          <p>Loading AI Resort Comparison Tool...</p>
        </div>
      }
    >
      <CompareResortsContent />
    </Suspense>
  );
}