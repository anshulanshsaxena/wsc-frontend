'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  User,
  ConfirmationResult,
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { extractCoverImage, getResortBasePrice } from '@/lib/pricing';

import Navbar from '@/components/layout/Navbar';
import ConsentPopup from '@/components/modals/ConsentPopup';
import InlineSearchBar from '@/components/home/InlineSearchBar';
import PromoBracket from '@/components/home/PromoBracket';
import AllOffersModal from '@/components/modals/AllOffersModal';
import WeddingItineraryCreator from '@/components/profile/WeddingItineraryCreator';
import SandboxDrawer from '@/components/modals/SandboxDrawer';

function UserProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoOpen = searchParams.get('autoOpen') === 'true';

  // Auth & User States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  // Phone OTP Login Overlay States
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(40);

  // 40-Second Resend OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (otpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (!otpStep) {
      setResendTimer(40);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpStep, resendTimer]);

  // Saved Budgets Data States
  const [budgets, setBudgets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(8);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);

  // Hero Launchpad Interactive States
  const [getStartedClicked, setGetStartedClicked] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Similar Resorts Recommendations
  const [similarByLocation, setSimilarByLocation] = useState<Record<string, any[]>>({});

  // Modals & Drawers States
  const [selectedQuoteDoc, setSelectedQuoteDoc] = useState<any | null>(null);

  // Sandbox Live Estimator Drawer
  const [sandboxDoc, setSandboxDoc] = useState<any | null>(null);

  // Compare Selections
  const [compareSelections, setCompareSelections] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Promo Bracket All Offers Modal States
  const [isAllOffersModalOpen, setIsAllOffersModalOpen] = useState(false);
  const [selectedOfferBracket, setSelectedOfferBracket] = useState<number | null>(null);
  const [allResortOffers, setAllResortOffers] = useState<any[]>([]);

  // View All Similar Resorts Modal
  const [viewAllLocation, setViewAllLocation] = useState('');
  const [viewAllResorts, setViewAllResorts] = useState<any[]>([]);
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);

  // Record budget card click timestamp for priority sorting (Moves clicked card to #1 position)
  const recordBudgetClick = (docId: string) => {
    try {
      const clicks = JSON.parse(localStorage.getItem('wsc_budget_clicks') || '{}');
      clicks[docId] = Date.now();
      localStorage.setItem('wsc_budget_clicks', JSON.stringify(clicks));

      setBudgets((prev) => {
        const updated = [...prev];
        updated.sort((a, b) => {
          const cA = clicks[a.docId] || 0;
          const cB = clicks[b.docId] || 0;
          if (cA !== cB) return cB - cA;

          const tA = a.createdAt
            ? typeof a.createdAt.toMillis === 'function'
              ? a.createdAt.toMillis()
              : new Date(a.createdAt).valueOf()
            : 0;
          const tB = b.createdAt
            ? typeof b.createdAt.toMillis === 'function'
              ? b.createdAt.toMillis()
              : new Date(b.createdAt).valueOf()
            : 0;
          return tB - tA;
        });
        return updated;
      });
    } catch (e) {}
  };

  // Fetch resort offers for AllOffersModal
  useEffect(() => {
    async function fetchOffers() {
      try {
        const snap = await getDocs(collection(db, 'resort_offers'));
        const offers: any[] = [];
        snap.forEach((d) => {
          if (d.data().isActive !== false) {
            offers.push(d.data());
          }
        });
        setAllResortOffers(offers);
      } catch (err) {
        console.error('Error fetching resort offers:', err);
      }
    }
    fetchOffers();
  }, []);

  const handleOpenAllOffers = (bracket: number) => {
    setSelectedOfferBracket(bracket);
    setIsAllOffersModalOpen(true);
  };

  // -------------------------------------------------------------
  // COUNTDOWN HELPER
  // -------------------------------------------------------------
  const latestBudget = budgets.length > 0 ? budgets[0] : null;

  const countdownDays = useMemo(() => {
    if (!latestBudget || !latestBudget.checkInDate || latestBudget.checkInDate === 'Not Selected') {
      return null;
    }

    let checkIn: Date;
    const checkInStr = latestBudget.checkInDate;
    if (checkInStr.includes('T')) {
      checkIn = new Date(checkInStr);
    } else if (checkInStr.includes('-')) {
      checkIn = new Date(checkInStr + 'T00:00:00');
    } else {
      checkIn = new Date(checkInStr);
    }

    if (isNaN(checkIn.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);

    const diffTime = checkIn.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  }, [latestBudget]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        setLoading(true);

        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists() && userDocSnap.data().name) {
            setDisplayName(userDocSnap.data().name);
          } else if (user.displayName) {
            setDisplayName(user.displayName);
          } else if (user.phoneNumber) {
            setDisplayName(user.phoneNumber);
          }
        } catch (e) {}

        await Promise.all([fetchUserBudgets(user.uid), fetchUserFavorites(user.uid)]);

        setLoading(false);
      } else {
        setBudgets([]);
        setUserFavorites([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch User Budgets (With Click Timestamp Sorting)
  const fetchUserBudgets = async (uid: string) => {
    try {
      const qBudgets = query(collection(db, 'saved_budgets'), where('userId', '==', uid));
      const snapBudgets = await getDocs(qBudgets);

      if (!snapBudgets.empty) {
        const allDocs = snapBudgets.docs.map((docSnap) => ({
          docId: docSnap.id,
          ...docSnap.data(),
        }));

        let clicks: Record<string, number> = {};
        try {
          clicks = JSON.parse(localStorage.getItem('wsc_budget_clicks') || '{}');
        } catch (e) {}

        allDocs.sort((a: any, b: any) => {
          const cA = clicks[a.docId] || 0;
          const cB = clicks[b.docId] || 0;
          if (cA !== cB) return cB - cA;

          const tA = a.createdAt
            ? typeof a.createdAt.toMillis === 'function'
              ? a.createdAt.toMillis()
              : new Date(a.createdAt).valueOf()
            : 0;
          const tB = b.createdAt
            ? typeof b.createdAt.toMillis === 'function'
              ? b.createdAt.toMillis()
              : new Date(b.createdAt).valueOf()
            : 0;
          return tB - tA;
        });

        const seen = new Set();
        const uniqueBudgets: any[] = [];
        const missingImageDocs: any[] = [];

        for (const b of allDocs as any[]) {
          if (b.resortId && b.resortId !== 'UNKNOWN') {
            if (seen.has(b.resortId)) continue;
            seen.add(b.resortId);
          }

          if (!b.resortImage && b.resortId) {
            missingImageDocs.push(b);
          }
          uniqueBudgets.push(b);
        }

        await Promise.all(
          missingImageDocs.map(async (b) => {
            try {
              const resSnap = await getDoc(doc(db, 'resort_data', b.resortId));
              if (resSnap.exists()) {
                const rd = resSnap.data();
                b.resortImage = extractCoverImage(rd);
                b.resortName = rd._recordName || b.resortName;
                b.resortLocation = rd.core_location || b.resortLocation;
              }
            } catch (e) {}
          })
        );

        setBudgets(uniqueBudgets);

        if (autoOpen && uniqueBudgets.length > 0) {
          setSelectedQuoteDoc(uniqueBudgets[0]);
        }

        fetchSimilarRecommendations(uniqueBudgets);
      } else {
        setBudgets([]);
      }
    } catch (e) {
      console.error('Error fetching budgets:', e);
    }
  };

  // Fetch Favorites
  const fetchUserFavorites = async (uid: string) => {
    try {
      const qFavs = query(collection(db, 'favorites'), where('userId', '==', uid));
      const snapFavs = await getDocs(qFavs);

      const promises = snapFavs.docs.map(async (docSnap) => {
        const f = docSnap.data();
        if (!f.resortId) return null;
        try {
          const resDoc = await getDoc(doc(db, 'resort_data', f.resortId));
          if (resDoc.exists()) {
            const rd = resDoc.data();
            return {
              id: f.resortId,
              name: rd._recordName || f.resortName || 'Luxury Resort',
              location: rd.core_location || 'India',
              rooms: rd.core_rooms || rd.rooms || 0,
              image: extractCoverImage(rd),
            };
          }
        } catch (e) {}
        return null;
      });

      const results = await Promise.all(promises);
      setUserFavorites(results.filter(Boolean));
    } catch (e) {
      console.error('Error fetching favorites:', e);
    }
  };

  // Recommendations
  const fetchSimilarRecommendations = async (userBudgetsList: any[]) => {
    try {
      const snap = await getDocs(collection(db, 'resort_data'));
      const allResorts: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (!data.core_hidden) {
          allResorts.push({ id: d.id, ...data });
        }
      });

      const userResortIds = new Set(userBudgetsList.map((b) => b.resortId));
      const targetRoomCounts = userBudgetsList
        .map((b) => Number(b.rooms || 0))
        .filter((rc) => rc > 0);

      if (targetRoomCounts.length === 0) return;

      const matches = allResorts.filter((r) => {
        if (userResortIds.has(r.id)) return false;
        const rc = Number(r.core_rooms || r.rooms || 0);
        if (rc <= 0) return false;
        return targetRoomCounts.some((trc) => Math.abs(rc - trc) <= 15);
      });

      const grouped: Record<string, any[]> = {};
      matches.forEach((r) => {
        const locRaw = r.core_location || r.location || 'India';
        const loc = locRaw.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
        if (!grouped[loc]) grouped[loc] = [];
        grouped[loc].push({
          id: r.id,
          name: r._recordName || r.name || 'Luxury Resort',
          location: loc,
          rooms: r.core_rooms || r.rooms || 0,
          image: extractCoverImage(r),
          price: getResortBasePrice(r, []),
        });
      });

      setSimilarByLocation(grouped);
    } catch (e) {
      console.error('Error fetching recommendations:', e);
    }
  };

  // Search Filter
  const filteredBudgets = useMemo(() => {
    if (!searchQuery.trim()) return budgets;
    const q = searchQuery.toLowerCase();
    return budgets.filter(
      (b) =>
        (b.resortName && b.resortName.toLowerCase().includes(q)) ||
        (b.resortLocation && b.resortLocation.toLowerCase().includes(q))
    );
  }, [budgets, searchQuery]);

  // Login Handlers (Permanent Fix for Google reCAPTCHA Registry)
  const handleSendLoginOTP = async () => {
    if (loginPhone.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    setLoginLoading(true);

    try {
      // 1. Get existing verifier or create a fresh one with a new DOM node
      let verifier = (window as any).recaptchaVerifier;

      if (!verifier) {
        // Replace DOM node to bypass Google reCAPTCHA internal memory registry
        const oldContainer = document.getElementById('login-recaptcha-container');
        if (oldContainer && oldContainer.parentNode) {
          const newContainer = document.createElement('div');
          newContainer.id = 'login-recaptcha-container';
          oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        }

        verifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
        (window as any).recaptchaVerifier = verifier;
      }

      // 2. Send OTP
      const result = await signInWithPhoneNumber(auth, '+91' + loginPhone.trim(), verifier);
      setConfirmationResult(result);
      setResendTimer(40);
      setOtpStep(true);
    } catch (error: any) {
      console.error('Error sending OTP:', error);

      // Clear verifier instance on error so next attempt starts fresh
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }

      if (error.code === 'auth/too-many-requests') {
        alert('Firebase SMS rate limit reached for this number. Please try another phone number or wait a few minutes.');
      } else {
        alert('Error sending OTP: ' + (error.message || 'Please check your mobile number.'));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyLoginOTP = async () => {
    if (loginOtp.length < 6) {
      alert('Please enter valid 6-digit OTP');
      return;
    }
    if (!loginName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setLoginLoading(true);

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(loginOtp);
        const user = result.user;

        await setDoc(
          doc(db, 'users', user.uid),
          {
            name: loginName.trim(),
            phone: user.phoneNumber,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // RESET ALL LOGIN OVERLAY STATES UPON SUCCESSFUL LOGIN
        setLoginName('');
        setLoginPhone('');
        setLoginOtp('');
        setOtpStep(false);
        setConfirmationResult(null);
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      alert('Invalid OTP code. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Reset all login states so the user gets a clean login screen
      setLoginName('');
      setLoginPhone('');
      setLoginOtp('');
      setOtpStep(false);
      setConfirmationResult(null);
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }
      router.push('/');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  // SILENT BACKGROUND DELETION
  const handleDeleteBudget = async (docId: string, resortId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this saved quote? All saved versions for this resort will be removed.'
      )
    )
      return;

    setBudgets((prev) => prev.filter((b) => b.resortId !== resortId && b.docId !== docId));
    setCompareSelections((prev) => prev.filter((id) => id !== docId));

    try {
      if (currentUser && resortId) {
        const q = query(
          collection(db, 'saved_budgets'),
          where('userId', '==', currentUser.uid),
          where('resortId', '==', resortId)
        );
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'saved_budgets', d.id)));
        await Promise.all(deletePromises);
      } else {
        await deleteDoc(doc(db, 'saved_budgets', docId));
      }
    } catch (e) {
      console.error('Error deleting budget:', e);
    }
  };

  // Favorite Delete
  const handleRemoveFavorite = async (resortId: string) => {
    if (!currentUser) return;
    setUserFavorites((prev) => prev.filter((f) => f.id !== resortId));
    try {
      await deleteDoc(doc(db, 'favorites', `${currentUser.uid}_${resortId}`));
    } catch (e) {
      console.error('Error removing favorite:', e);
    }
  };

  // Compare Selections
  const handleToggleCompare = (docId: string, checked: boolean) => {
    if (checked) {
      setCompareSelections((prev) => [...prev, docId]);
    } else {
      setCompareSelections((prev) => prev.filter((id) => id !== docId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
        <i className="ph-bold ph-spinner animate-spin text-5xl mb-4 text-[#6B0D24]"></i>
        <p className="font-bold text-gray-500 text-lg">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen flex flex-col relative overflow-x-hidden text-gray-900">
      {/* Navbar */}
      <Navbar />

     {/* LOGGED OUT LOGIN OVERLAY WITH LUXURY BACKGROUND IMAGE */}
      {!currentUser && (
        <div className="fixed top-16 md:top-20 inset-x-0 bottom-0 z-40 flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Background Cover Image */}
          <img
            src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/cover%20image%20login%20screen.jpeg?alt=media&token=ef78069e-5263-44aa-a0b1-a5e25fbea24a"
            alt="Luxury Destination Wedding"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />

          {/* Dark Backdrop Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/75 to-gray-950/80 backdrop-blur-xs z-2" />

          {/* Central Glassmorphism Login Card */}
          <div className="relative z-20 w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#6B0D24]/10 text-[#6B0D24] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <i className="ph-fill ph-user-circle text-4xl"></i>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
              <p className="text-gray-500 font-medium text-xs mt-1">
                Log in to view your saved budgets, quotes & itinerary
              </p>
            </div>

            {!otpStep ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 font-bold text-sm outline-none focus:border-[#6B0D24] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center font-black text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="9999999999"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-14 pr-4 font-bold text-sm outline-none focus:border-[#6B0D24] transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendLoginOTP}
                  disabled={loginLoading}
                  className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white font-black py-4 rounded-2xl transition-all shadow-lg text-xs uppercase tracking-wider disabled:opacity-70 mt-2"
                >
                  {loginLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">
                    Enter 6-Digit Verification OTP
                  </label>
                  <input
                    type="number"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="------"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 text-center text-2xl font-black tracking-[0.6em] outline-none focus:border-[#6B0D24] transition-all"
                  />
                </div>

                <button
                  onClick={handleVerifyLoginOTP}
                  disabled={loginLoading}
                  className="w-full bg-[#6B0D24] hover:bg-[#520a1a] text-white font-black py-4 rounded-2xl transition-all shadow-lg text-xs uppercase tracking-wider disabled:opacity-70"
                >
                  {loginLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <div className="flex justify-between items-center text-xs font-bold pt-2">
                  {/* Resend OTP Button with 40s Timer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (resendTimer === 0) {
                        setResendTimer(40);
                        handleSendLoginOTP();
                      }
                    }}
                    disabled={resendTimer > 0 || loginLoading}
                    className="text-[#6B0D24] hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>

                  {/* Change Number Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setLoginOtp('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Change Number
                  </button>
                </div>
              </div>
            )}

            <div id="login-recaptcha-container" />
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT (LOGGED IN) */}
      {currentUser && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-24 md:pt-28 pb-32">
          {/* Top User Greeting Banner */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
                User Dashboard
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                Welcome, {displayName || 'Wedding Couple'}!
              </h1>
            </div>

            {/* DESKTOP COUNTDOWN BADGE */}
            {countdownDays !== null && (
              <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-[#6B0D24] to-[#8C1B36] text-white px-5 py-3 rounded-2xl shadow-md border border-[#C5A059]/30">
                <i className="ph-fill ph-hourglass text-2xl text-[#C5A059] animate-pulse"></i>
                <div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block">
                    Countdown To Wedding
                  </span>
                  <span className="text-lg font-black tracking-tight">
                    {countdownDays} Days To Go
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="bg-stone-100 text-[#6B0D24] hover:bg-stone-200 border border-stone-200 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Sign Out
            </button>
          </div>

          {/* MOBILE COUNTDOWN CARD */}
          {countdownDays !== null && (
            <div className="md:hidden mb-8 bg-gradient-to-r from-[#6B0D24] to-[#8C1B36] text-white p-5 rounded-3xl shadow-lg border border-[#C5A059]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[#C5A059] text-2xl shrink-0">
                  <i className="ph-fill ph-hourglass animate-pulse"></i>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block">
                    Countdown To Wedding
                  </span>
                  <h3 className="text-sm font-black truncate max-w-[150px]">
                    {latestBudget?.resortName}
                  </h3>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl text-center border border-white/10 shrink-0">
                <span className="text-2xl font-black text-[#C5A059] leading-none block">
                  {countdownDays}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-200">
                  Days Left
                </span>
              </div>
            </div>
          )}

          {/* EMPTY DASHBOARD HERO LAUNCHPAD (WHEN NO SAVED BUDGETS EXIST) */}
          {budgets.length === 0 && (
            <div className="mb-12 space-y-12">
              {/* HERO COVER LAUNCHPAD */}
              <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl min-h-[380px] md:min-h-[460px] flex flex-col justify-end p-6 md:p-12 text-white border border-gray-100">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/profileuser%20heroimage.webp?alt=media&token=28492e73-220d-4383-839f-309e3738ef26"
                  alt="Destination Wedding"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent z-10" />

                <div className="relative z-20 max-w-2xl space-y-4">
                  <span className="bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Start Your Destination Planning
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-md">
                    Plan Your Dream Destination Wedding
                  </h2>
                  <p className="text-sm md:text-lg text-gray-200 font-medium leading-relaxed">
                    Discover luxury venues, 360° virtual tours, and instant transparent pricing—all in one place.
                  </p>

                  {/* INITIAL GET STARTED BUTTON */}
                  {!getStartedClicked ? (
                    <button
                      onClick={() => setGetStartedClicked(true)}
                      className="bg-[#6B0D24] hover:bg-[#520a1a] text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2 text-sm uppercase tracking-wider mt-2"
                    >
                      <i className="ph-fill ph-sparkle text-[#C5A059] text-lg"></i>
                      <span>Get Started</span>
                    </button>
                  ) : (
                    /* REVEALED ACTION BUTTONS */
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowSearchInput(true)}
                          className="bg-white text-gray-900 hover:bg-gray-100 font-black px-6 py-3.5 rounded-xl transition shadow-lg flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider"
                        >
                          <i className="ph-bold ph-magnifying-glass text-[#6B0D24] text-lg"></i>
                          <span>Search Resorts</span>
                        </button>

                        <Link
                          href="/compare-resorts"
                          className="bg-[#6B0D24] text-white hover:bg-[#520a1a] font-black px-6 py-3.5 rounded-xl transition shadow-lg flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider"
                        >
                          <i className="ph-bold ph-lightning text-[#C5A059] text-lg"></i>
                          <span>Get Express Quote</span>
                        </Link>
                      </div>

                      {/* HERO SEARCH COMPONENT */}
                      {showSearchInput && (
                        <div className="pt-2">
                          <InlineSearchBar />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* FAVORITES (IF ADDED BEFORE SAVING BUDGET) */}
              {userFavorites.length > 0 && (
                <section>
                  <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <i className="ph-fill ph-heart text-[#6B0D24]"></i> Favorite Resorts
                  </h3>

                  <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x scroll-smooth">
                    {userFavorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="shrink-0 w-44 h-44 rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer snap-start border border-gray-150"
                      >
                        <Link href={`/resort/${fav.id}`} className="absolute inset-0 z-0">
                          <img
                            src={fav.image}
                            alt={fav.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        </Link>

                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm hover:bg-red-50 rounded-full flex items-center justify-center text-[#6B0D24] transition shadow-sm z-10"
                          title="Remove Favorite"
                        >
                          <i className="ph-fill ph-heart text-lg"></i>
                        </button>

                        <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end text-white pointer-events-none z-10">
                          <h4 className="font-black text-xs md:text-sm leading-tight mb-1 truncate">
                            {fav.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-200 mt-0.5">
                            <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                              <i className="ph-fill ph-map-pin"></i> {fav.location}
                            </span>
                            <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                              <i className="ph-fill ph-door"></i> {fav.rooms} Rooms
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* PROMOTIONAL OFFER TILES BRACKET */}
              <section>
                <PromoBracket guestCount={latestBudget?.guests || 150} onViewAll={handleOpenAllOffers} />
              </section>

              {/* SIMILAR RESORTS TO FAVORITES */}
              {Object.keys(similarByLocation).length > 0 && (
                <section className="space-y-10">
                  {Object.entries(similarByLocation).map(([location, list]) => {
                    const hasMoreThan10 = list.length > 10;
                    const visibleList = list.slice(0, 10);

                    return (
                      <div key={location} className="mb-10">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> More Similar Resorts in {location}
                          </h4>
                          {hasMoreThan10 && (
                            <button
                              onClick={() => {
                                setViewAllLocation(location);
                                setViewAllResorts(list);
                                setViewAllModalOpen(true);
                              }}
                              className="text-xs text-[#6B0D24] font-black hover:underline bg-[#6B0D24]/5 hover:bg-[#6B0D24]/10 px-4 py-2 rounded-full transition-colors"
                            >
                              View All
                            </button>
                          )}
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x scroll-smooth">
                          {visibleList.map((res) => (
                            <Link
                              key={res.id}
                              href={`/resort/${res.id}`}
                              className="shrink-0 w-64 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-pointer snap-start"
                            >
                              <div className="h-36 w-full relative bg-gray-100 overflow-hidden">
                                <img
                                  src={res.image}
                                  alt={res.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <span className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                                  <i className="ph-fill ph-door"></i> {res.rooms} Rooms
                                </span>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-black text-gray-900 leading-tight mb-1 truncate text-sm">
                                    {res.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                                    <i className="ph-fill ph-map-pin text-gray-400"></i> {res.location}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                      Price Per Person
                                    </span>
                                    <span className="text-sm font-black text-[#6B0D24]">
                                      {res.price > 0 ? `₹${res.price.toLocaleString('en-IN')}` : 'Get Quote'}
                                    </span>
                                  </div>
                                  <span className="w-8 h-8 bg-gray-50 hover:bg-[#6B0D24] hover:text-white rounded-full flex items-center justify-center text-gray-600 transition">
                                    <i className="ph-bold ph-arrow-right text-xs"></i>
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </div>
          )}

          {/* DASHBOARD CONTENT WHEN BUDGETS EXIST */}
          {budgets.length > 0 && (
            <div className="space-y-12">
              {/* SHORTLISTED RESORTS (SAVED BUDGETS CAROUSEL) */}
              <section id="quotes">
                <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                      <i className="ph-fill ph-buildings text-[#6B0D24]"></i> Short Listed Resorts
                    </h3>
                  </div>
                  <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <i className="ph-bold ph-magnifying-glass text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search resorts by name..."
                      className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#6B0D24] focus:border-[#6B0D24] block w-full pl-10 p-2.5 shadow-sm outline-none"
                    />
                  </div>
                </div>

                {filteredBudgets.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-3xl border border-gray-200 text-gray-500">
                    No saved budgets found. Try customizing a resort quote!
                  </div>
                ) : (
                  <>
                    <div className="flex gap-6 overflow-x-auto pb-6 pt-2 hide-scrollbar snap-x scroll-smooth">
                      {filteredBudgets.slice(0, displayLimit).map((b) => {
                        const sortedQuotes = [...(b.quotes || [])].sort(
                          (x, y) => (x.grandTotal || 0) - (y.grandTotal || 0)
                        );
                        const cheapest = sortedQuotes[0] || {
                          grandTotal: 0,
                          resortTotal: 0,
                          plannerTotal: 0,
                        };

                        const startingTotal = cheapest.grandTotal || 0;
                        const stayCost = cheapest.resortTotal || 0;
                        const stayPercent =
                          startingTotal > 0 ? Math.round((stayCost / startingTotal) * 100) : 50;
                        const decorPercent = 100 - stayPercent;

                        const isCompareChecked = compareSelections.includes(b.docId);

                        return (
                          <div
                            key={b.docId}
                            className="shrink-0 w-[310px] sm:w-[350px] bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col relative overflow-hidden group transition-all duration-300 snap-start"
                          >
                            {/* Compare Checkbox */}
                            <label className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-900 flex items-center gap-1.5 shadow-sm cursor-pointer border border-gray-200 z-10">
                              <input
                                type="checkbox"
                                checked={isCompareChecked}
                                onChange={(e) => handleToggleCompare(b.docId, e.target.checked)}
                                className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 focus:ring-[#6B0D24]"
                              />
                              <span>Compare</span>
                            </label>

                            {/* Trash Delete Button */}
                            <button
                              onClick={() => handleDeleteBudget(b.docId, b.resortId)}
                              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-600 transition w-9 h-9 rounded-full flex items-center justify-center z-10 shadow-sm"
                            >
                              <i className="ph-bold ph-trash text-lg"></i>
                            </button>

                            {/* Resort Image & Title */}
                            <Link
                              href={`/resort/${b.resortId}`}
                              onClick={() => recordBudgetClick(b.docId)}
                              className="relative h-60 w-full block bg-gray-100 overflow-hidden"
                            >
                              <img
                                src={
                                  b.resortImage ||
                                  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
                                }
                                alt={b.resortName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/30 to-transparent"></div>

                              {/* Location Badge */}
                              <div className="absolute top-14 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-900 flex items-center gap-1 shadow-sm z-10">
                                <i className="ph-fill ph-map-pin text-[#6B0D24]"></i>
                                <span>{b.resortLocation || 'India'}</span>
                              </div>

                              {/* Resort Name */}
                              <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 z-10">
                                <h3 className="text-lg md:text-xl font-black text-white leading-tight break-words group-hover:underline drop-shadow-sm">
                                  {b.resortName || 'Luxury Resort'}
                                </h3>
                              </div>
                            </Link>

                            {/* Card Body Details */}
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 font-bold flex-wrap">
                                <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <i className="ph-fill ph-users text-[#6B0D24] text-lg"></i>{' '}
                                  {b.guests || 150} Guests
                                </span>
                                <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <i className="ph-fill ph-moon text-[#6B0D24] text-lg"></i>{' '}
                                  {b.days || 2} Days
                                </span>
                                <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <i className="ph-fill ph-door text-[#6B0D24] text-lg"></i>{' '}
                                  {b.rooms || '--'} Rooms
                                </span>
                              </div>

                              {/* Cost Split Progress Bar */}
                              <div className="mb-5 space-y-1">
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                                  <div
                                    className="bg-[#6B0D24] h-full"
                                    style={{ width: `${stayPercent}%` }}
                                  />
                                  <div
                                    className="bg-[#C5A059] h-full"
                                    style={{ width: `${decorPercent}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                  <span>Stay ({stayPercent}%)</span>
                                  <span>Decor ({decorPercent}%)</span>
                                </div>
                              </div>

                              {/* View Resort Link */}
                              <Link
                                href={`/resort/${b.resortId}`}
                                onClick={() => recordBudgetClick(b.docId)}
                                className="w-full mb-4 bg-white hover:bg-gray-50 text-[#6B0D24] border border-[#6B0D24]/30 hover:border-[#6B0D24] font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-sm"
                              >
                                <i className="ph-bold ph-eye text-base"></i> View Resort
                              </Link>

                              {/* Grand Total Footer */}
                              <div className="mt-auto bg-gray-50 p-5 rounded-2xl flex items-center justify-between border border-gray-100 mb-4">
                                <div>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                                    Estd. Grand Total
                                  </p>
                                  <p className="text-2xl font-black text-[#6B0D24]">
                                    ₹ {startingTotal.toLocaleString('en-IN')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    recordBudgetClick(b.docId);
                                    setSelectedQuoteDoc(b);
                                  }}
                                  className="bg-[#6B0D24] text-white hover:bg-[#6B0D24]/90 font-bold w-12 h-12 rounded-xl transition shadow-md flex items-center justify-center shrink-0"
                                >
                                  <i className="ph-bold ph-arrow-right text-xl"></i>
                                </button>
                              </div>

                              {/* Actions: Modify & Recalculate */}
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => {
                                    recordBudgetClick(b.docId);
                                    setSandboxDoc({ ...b });
                                  }}
                                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-sm"
                                >
                                  <i className="ph-bold ph-sliders text-base text-[#6B0D24]"></i> Modify
                                </button>
                                <Link
                                  href={`/resort/${b.resortId}?recalc=true`}
                                  onClick={() => recordBudgetClick(b.docId)}
                                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-sm text-center"
                                >
                                  <i className="ph-bold ph-arrows-clockwise text-base text-[#6B0D24]"></i> Recalculate
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredBudgets.length > displayLimit && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setDisplayLimit((prev) => prev + 8)}
                          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3 px-8 rounded-xl shadow-sm transition inline-flex items-center gap-2 text-xs uppercase tracking-wider"
                        >
                          Load More Saved Resorts ({filteredBudgets.length - displayLimit} Remaining) <i className="ph-bold ph-caret-down"></i>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* CUSTOM WEDDING ITINERARY CREATOR */}
              {budgets.length > 0 && (
                <WeddingItineraryCreator budgets={budgets} userName={displayName} />
              )}

              {/* DYNAMIC RECOMMENDATIONS BY LOCATION */}
              {Object.keys(similarByLocation).length > 0 && (
                <section className="space-y-10">
                  {Object.entries(similarByLocation).map(([location, list]) => {
                    const hasMoreThan10 = list.length > 10;
                    const visibleList = list.slice(0, 10);

                    return (
                      <div key={location} className="mb-10">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <i className="ph-fill ph-map-pin text-[#6B0D24]"></i> More Similar Resorts in {location}
                          </h4>
                          {hasMoreThan10 && (
                            <button
                              onClick={() => {
                                setViewAllLocation(location);
                                setViewAllResorts(list);
                                setViewAllModalOpen(true);
                              }}
                              className="text-xs text-[#6B0D24] font-black hover:underline bg-[#6B0D24]/5 hover:bg-[#6B0D24]/10 px-4 py-2 rounded-full transition-colors"
                            >
                              View All
                            </button>
                          )}
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x scroll-smooth">
                          {visibleList.map((res) => (
                            <Link
                              key={res.id}
                              href={`/resort/${res.id}`}
                              className="shrink-0 w-64 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-pointer snap-start"
                            >
                              <div className="h-36 w-full relative bg-gray-100 overflow-hidden">
                                <img
                                  src={res.image}
                                  alt={res.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <span className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                                  <i className="ph-fill ph-door"></i> {res.rooms} Rooms
                                </span>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-black text-gray-900 leading-tight mb-1 truncate text-sm">
                                    {res.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                                    <i className="ph-fill ph-map-pin text-gray-400"></i> {res.location}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                      Price Per Person
                                    </span>
                                    <span className="text-sm font-black text-[#6B0D24]">
                                      {res.price > 0 ? `₹${res.price.toLocaleString('en-IN')}` : 'Get Quote'}
                                    </span>
                                  </div>
                                  <span className="w-8 h-8 bg-gray-50 hover:bg-[#6B0D24] hover:text-white rounded-full flex items-center justify-center text-gray-600 transition">
                                    <i className="ph-bold ph-arrow-right text-xs"></i>
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {/* FAVORITE RESORTS CAROUSEL */}
              <section>
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 mt-12 border-t border-gray-200 pt-10">
                  <i className="ph-fill ph-heart text-[#6B0D24]"></i> Favorite Resorts
                </h3>

                {userFavorites.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500">
                    No favorite resorts saved yet. Click the heart icon on any resort page to save!
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar snap-x scroll-smooth">
                    {userFavorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="shrink-0 w-44 h-44 rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer snap-start border border-gray-150"
                      >
                        <Link href={`/resort/${fav.id}`} className="absolute inset-0 z-0">
                          <img
                            src={fav.image}
                            alt={fav.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        </Link>

                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm hover:bg-red-50 rounded-full flex items-center justify-center text-[#6B0D24] transition shadow-sm z-10"
                          title="Remove Favorite"
                        >
                          <i className="ph-fill ph-heart text-lg"></i>
                        </button>

                        <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end text-white pointer-events-none z-10">
                          <h4 className="font-black text-xs md:text-sm leading-tight mb-1 truncate">
                            {fav.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-200 mt-0.5">
                            <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                              <i className="ph-fill ph-map-pin"></i> {fav.location}
                            </span>
                            <span className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                              <i className="ph-fill ph-door"></i> {fav.rooms} Rooms
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      )}

      {/* SANDBOX ESTIMATOR DRAWER */}
      {sandboxDoc && (
        <SandboxDrawer
          sandboxDoc={sandboxDoc}
          onClose={() => setSandboxDoc(null)}
          onSaveComplete={() => {
            if (currentUser) fetchUserBudgets(currentUser.uid);
          }}
        />
      )}

      {/* COMPARE FLOATING BAR */}
      {compareSelections.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] p-4 z-[9999] flex justify-between items-center max-w-4xl mx-auto rounded-t-2xl">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <i className="ph-bold ph-check-square-offset text-[#6B0D24] text-lg"></i>
            <span>{compareSelections.length}</span> Venue(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareSelections([])}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setCompareModalOpen(true)}
              className="bg-[#6B0D24] text-white hover:bg-[#6B0D24]/90 font-bold px-6 py-3 rounded-xl shadow-md transition text-sm flex items-center gap-2"
            >
              Compare <i className="ph-bold ph-columns text-base"></i>
            </button>
          </div>
        </div>
      )}

      {/* COMPARATIVE TABLE MODAL */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-[20000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <i className="ph-fill ph-columns text-[#6B0D24]"></i> Head-to-Head Comparison
              </h3>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition shadow-sm shrink-0"
              >
                <i className="ph-bold ph-x text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-4 bg-gray-100 font-bold text-gray-900 border border-gray-200">
                      Package Matrix
                    </th>
                    {compareSelections.map((docId) => {
                      const b = budgets.find((item) => item.docId === docId);
                      return (
                        <th
                          key={docId}
                          className="p-4 bg-gray-100 font-black text-gray-900 border border-gray-200 text-center"
                        >
                          <span className="block text-base">{b?.resortName || 'Resort'}</span>
                          <span className="block text-xs text-gray-500 font-semibold mt-1">
                            <i className="ph-fill ph-map-pin"></i> {b?.resortLocation || 'India'}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 font-bold border border-gray-200">Visual Portfolio</td>
                    {compareSelections.map((docId) => {
                      const b = budgets.find((item) => item.docId === docId);
                      return (
                        <td key={docId} className="p-4 border border-gray-200 text-center">
                          <img
                            src={b?.resortImage}
                            alt="Resort"
                            className="w-44 h-28 object-cover rounded-xl mx-auto shadow-sm"
                          />
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold border border-gray-200">Starting Budget</td>
                    {compareSelections.map((docId) => {
                      const b = budgets.find((item) => item.docId === docId);
                      const cheapest = (b?.quotes || []).sort(
                        (x: any, y: any) => (x.grandTotal || 0) - (y.grandTotal || 0)
                      )[0];
                      return (
                        <td key={docId} className="p-4 border border-gray-200 text-center">
                          <p className="text-xl font-black text-[#6B0D24]">
                            ₹ {(cheapest?.grandTotal || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[9px] text-gray-400 font-bold block mt-1">
                            Planner: {cheapest?.plannerName || 'Default'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold border border-gray-200">Capacity & Duration</td>
                    {compareSelections.map((docId) => {
                      const b = budgets.find((item) => item.docId === docId);
                      return (
                        <td
                          key={docId}
                          className="p-4 border border-gray-200 text-center font-bold text-gray-700"
                        >
                          <p>{b?.guests || 150} Guests</p>
                          <p className="text-xs text-gray-500">{b?.days || 2} Days</p>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold border border-gray-200">Selected Setup Items</td>
                    {compareSelections.map((docId) => {
                      const b = budgets.find((item) => item.docId === docId);
                      return (
                        <td key={docId} className="p-4 border border-gray-200 text-left vertical-top">
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar text-xs">
                            {(b?.selectedItems || []).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between border-b pb-1">
                                <span className="font-semibold text-gray-800">{item.name}</span>
                                <span className="text-[#6B0D24] font-bold">x{item.qty || 1}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PLANNER QUOTE DETAILS MODAL */}
      {selectedQuoteDoc && (
        <div className="fixed inset-0 z-[20000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900">{selectedQuoteDoc.resortName}</h2>
                <p className="text-sm text-[#6B0D24] font-bold mt-1">
                  {selectedQuoteDoc.guests} Guests &bull; {selectedQuoteDoc.days} Days &bull;{' '}
                  {selectedQuoteDoc.functions || 1} Events
                </p>
                {selectedQuoteDoc.checkInDate && (
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {selectedQuoteDoc.checkInDate} &rarr; {selectedQuoteDoc.checkOutDate}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedQuoteDoc(null)}
                className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition shrink-0"
              >
                <i className="ph-bold ph-x text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-x-auto flex-1 bg-gray-50">
              <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-max mx-auto pb-4">
                {(selectedQuoteDoc.quotes || []).map((planner: any, idx: number) => {
                  const stayCost = planner.resortTotal || 0;
                  const decorCost = planner.plannerTotal || 0;
                  const grandTotal = planner.grandTotal || stayCost + decorCost;

                  const stayPercent = grandTotal > 0 ? Math.round((stayCost / grandTotal) * 100) : 50;
                  const decorPercent = 100 - stayPercent;

                  return (
                    <div
                      key={idx}
                      className="min-w-[300px] md:min-w-[340px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col relative overflow-hidden shrink-0"
                    >
                      {/* Banner Image */}
                      <div className="h-32 w-full bg-gray-100 relative">
                        <img
                          src={
                            planner.plannerImage ||
                            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'
                          }
                          alt="Planner Work"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                      </div>

                      <div className="p-6 flex-1 flex flex-col relative">
                        {/* Logo Badge */}
                        <div className="absolute -top-10 right-6 w-14 h-14 bg-white p-1 rounded-full shadow-md">
                          <img
                            src={
                              planner.logoUrl ||
                              'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80'
                            }
                            alt="Logo"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>

                        <div className="mb-5 border-b border-gray-100 pb-5 pr-12">
                          <h3 className="font-black text-xl text-gray-900 leading-tight">
                            {planner.plannerName || 'Wedding Planner'}
                          </h3>
                          <a
                            href={`https://instagram.com/${(planner.instaUrl || '').replace(
                              '@',
                              ''
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[#6B0D24] font-bold hover:underline flex items-center gap-1 mt-1"
                          >
                            <i className="ph-fill ph-instagram-logo"></i> {planner.instaUrl}
                          </a>
                        </div>

                        {/* Segment Cost Splits */}
                        <div className="space-y-4 mb-6">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                            Segment Cost Splits
                          </p>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-gray-700">
                              <span className="flex items-center gap-1">
                                <i className="ph-fill ph-house text-[#6B0D24]"></i> Resort Stay & Food
                              </span>
                              <span>
                                {stayPercent}% &bull; ₹{stayCost.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#6B0D24] h-full rounded-full"
                                style={{ width: `${stayPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1 border-t border-gray-50 pt-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-gray-700">
                              <span className="flex items-center gap-1">
                                <i className="ph-fill ph-sparkle text-[#C5A059]"></i> Decor, Setup & Elements
                              </span>
                              <span>
                                {decorPercent}% &bull; ₹{decorCost.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#C5A059] h-full rounded-full"
                                style={{ width: `${decorPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Grand Total & View Planner Profile Button */}
                        <div className="bg-gray-900 p-5 rounded-xl mt-auto shadow-lg">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                            Total Estimated Budget
                          </p>
                          <p className="text-3xl font-black text-white">
                            ₹{grandTotal.toLocaleString('en-IN')}
                          </p>

                          <Link
                            href={
                              planner.plannerId
                                ? `/planner?id=${planner.plannerId}`
                                : '#'
                            }
                            target="_blank"
                            className="mt-4 flex items-center justify-center w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-black hover:to-gray-900 border border-gray-600 hover:border-blue-500 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-md group"
                          >
                            <span>View Planner Profile</span>
                            <i className="ph-bold ph-arrow-up-right ml-2 text-[#C5A059] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ALL SIMILAR RESORTS MODAL */}
      {viewAllModalOpen && (
        <div className="fixed inset-0 z-[30000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <i className="ph-fill ph-buildings text-[#6B0D24]"></i> Similar Resorts in {viewAllLocation}
                </h3>
              </div>
              <button
                onClick={() => setViewAllModalOpen(false)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition shrink-0"
              >
                <i className="ph-bold ph-x text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {viewAllResorts.map((res) => (
                  <Link
                    key={res.id}
                    href={`/resort/${res.id}`}
                    className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition group flex flex-col"
                  >
                    <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
                      <img
                        src={res.image}
                        alt={res.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <i className="ph-fill ph-door"></i> {res.rooms} Rooms
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-gray-900 leading-tight mb-1 truncate text-base">
                          {res.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <i className="ph-fill ph-map-pin text-gray-400"></i> {res.location}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                            Price Per Person
                          </span>
                          <span className="text-base font-black text-[#6B0D24]">
                            {res.price > 0 ? `₹${res.price.toLocaleString('en-IN')}` : 'Get Quote'}
                          </span>
                        </div>
                        <span className="w-9 h-9 bg-gray-50 hover:bg-[#6B0D24] hover:text-white rounded-full flex items-center justify-center text-gray-600 transition">
                          <i className="ph-bold ph-arrow-right text-sm"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL OFFERS MODAL */}
      <AllOffersModal
        isOpen={isAllOffersModalOpen}
        onClose={() => setIsAllOffersModalOpen(false)}
        bracket={selectedOfferBracket}
        offers={allResortOffers}
      />

      {/* User Consent */}
      <ConsentPopup />
    </div>
  );
}

export default function UserProfilePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center">
          <i className="ph-bold ph-spinner animate-spin text-5xl mb-4 text-[#6B0D24]"></i>
          <p className="font-bold text-gray-500 text-lg">Loading Profile Dashboard...</p>
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}