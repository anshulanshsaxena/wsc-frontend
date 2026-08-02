'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { extractCoverImage } from '@/lib/pricing';
import FavoritesModal, { FavoriteItem } from '@/components/modals/FavoritesModal';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Synchronous initial state from localStorage (0ms delay, no flash)
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wsc_user_name') || '';
    }
    return '';
  });

  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('wsc_user_favorites');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const pathname = usePathname();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          let fetchedName = '';
          if (userDocSnap.exists() && userDocSnap.data().name) {
            fetchedName = userDocSnap.data().name;
          } else if (user.displayName) {
            fetchedName = user.displayName;
          }

          if (fetchedName) {
            setUserName(fetchedName);
            localStorage.setItem('wsc_user_name', fetchedName);
          }
        } catch (e) {}
      } else {
        setUserName('');
        setUserFavorites([]);
        localStorage.removeItem('wsc_user_name');
        localStorage.removeItem('wsc_user_favorites');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch User Favorites from Firestore & Keep Cache Updated
  useEffect(() => {
    if (!currentUser) return;

    const fetchFavorites = async () => {
      try {
        const qFavs = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
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
                name: rd._recordName || rd.core_name || f.resortName || 'Luxury Resort',
                location: rd.core_location || 'India',
                rooms: rd.core_rooms || rd.rooms || 0,
                image: extractCoverImage(rd),
              };
            }
          } catch (e) {}
          return null;
        });

        const results = await Promise.all(promises);
        const validFavs = results.filter(Boolean) as FavoriteItem[];

        setUserFavorites(validFavs);

        if (validFavs.length > 0) {
          localStorage.setItem('wsc_user_favorites', JSON.stringify(validFavs));
        } else {
          localStorage.removeItem('wsc_user_favorites');
        }
      } catch (e) {
        console.error('Error fetching favorites for navbar:', e);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('wsc_user_name');
      localStorage.removeItem('wsc_user_favorites');
      setUserName('');
      setUserFavorites([]);
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    return isActive(path)
      ? 'text-[#6B0D24] font-bold transition-colors'
      : 'hover:text-[#6B0D24] text-gray-700 transition-colors font-medium';
  };

  return (
    <>
      {/* FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9.firebasestorage.app/o/uploads%2Fthumbnails%2F1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview%20(1).webp?alt=media&token=81e74d46-ca11-4d55-bdd7-3ccada95aecf"
              alt="Wedding Support Company Logo"
              className="h-20 md:h-24 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link href="/" className={getLinkClasses('/')}>
              Home
            </Link>
            <Link href="/user-profile" className={getLinkClasses('/user-profile')}>
              Dashboard
            </Link>
            <Link href="/about-us" className={getLinkClasses('/about-us')}>
              About Us
            </Link>
            <Link href="/contact" className={getLinkClasses('/contact')}>
              Contact
            </Link>
            <Link href="/blogs" className={getLinkClasses('/blogs')}>
              Blogs
            </Link>
          </div>

          {/* SLEEK & ELEGANT COMPACT PILLS CONTAINER (h-8 = 32px height) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* 1. FAVORITES PILL */}
            {userFavorites.length > 0 && (
              <button
                onClick={() => setFavoritesModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#6B0D24] bg-[#FAF6F0] hover:bg-[#6B0D24] hover:text-white border border-[#6B0D24]/20 transition-all shadow-2xs group cursor-pointer shrink-0"
                title="View Favorite Resorts"
              >
                <i className="ph-fill ph-heart text-xs text-[#6B0D24] group-hover:text-white transition-colors"></i>
                <span>Favorites ({userFavorites.length})</span>
              </button>
            )}

            {/* 2. USER NAME PILL & SIGN OUT BUTTON */}
            {currentUser || userName ? (
              <div className="flex items-center gap-2">
                {userName && userName.trim() !== '' && (
                  <span className="inline-flex items-center justify-center h-8 px-3 rounded-full text-[11px] font-black uppercase tracking-wider text-[#6B0D24] bg-[#6B0D24]/5 border border-[#6B0D24]/15 shrink-0">
                    {userName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-[#6B0D24] hover:bg-stone-900 transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/user-profile"
                className="inline-flex items-center justify-center h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#6B0D24] hover:text-stone-900 bg-[#6B0D24]/10 hover:bg-[#6B0D24]/20 border border-[#6B0D24]/20 transition-colors shrink-0"
              >
                Sign In
              </Link>
            )}

            {/* 3. GET A QUOTE PILL */}
            <Link
              href="/compare-resorts"
              className="inline-flex items-center justify-center h-8 px-4 rounded-full text-[11px] font-black uppercase tracking-wider text-white bg-gray-900 hover:bg-[#6B0D24] transition-colors shadow-2xs shrink-0"
            >
              Get a Quote
            </Link>
          </div>

          {/* Mobile Hamburger & Favorites Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            {userFavorites.length > 0 && (
              <button
                onClick={() => setFavoritesModalOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20"
                title="View Favorites"
              >
                <i className="ph-fill ph-heart text-xs"></i>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-900 p-2 focus:outline-none"
              aria-label="Open Mobile Menu"
            >
              <i className="ph ph-list text-3xl"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU BACKDROP OVERLAY */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* COMPACT VERTICAL MOBILE DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-[65vw] sm:w-[50vw] bg-white z-[110] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-24 px-5 shadow-2xl border-l border-gray-100 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="absolute top-0 left-0 right-0 h-20 px-5 flex items-center justify-between border-b border-gray-100">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview%20(1).png?alt=media&token=957241cc-a7d9-4c40-a1c7-24533166d0a7"
            alt="Company Logo"
            className="h-16 w-auto object-contain"
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-900 p-2 focus:outline-none"
            aria-label="Close Mobile Menu"
          >
            <i className="ph ph-x text-3xl"></i>
          </button>
        </div>

        {/* Mobile User Header */}
        {(currentUser || userName) && userName.trim() !== '' && (
          <div className="flex flex-col gap-1 pb-4 mb-2 border-b border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
              Logged In As
            </span>
            <span className="text-sm font-black text-gray-900 truncate">{userName}</span>
          </div>
        )}

        {/* Drawer Navigation Links */}
        <div className="flex flex-col gap-4 text-sm font-bold text-gray-900 mt-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`border-b border-gray-100 pb-3 flex justify-between items-center ${
              isActive('/') ? 'text-[#6B0D24]' : 'text-gray-900'
            }`}
          >
            Home <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/user-profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`border-b border-gray-100 pb-3 flex justify-between items-center ${
              isActive('/user-profile') ? 'text-[#6B0D24]' : 'text-gray-900'
            }`}
          >
            Dashboard <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/about-us"
            onClick={() => setMobileMenuOpen(false)}
            className={`border-b border-gray-100 pb-3 flex justify-between items-center ${
              isActive('/about-us') ? 'text-[#6B0D24]' : 'text-gray-900'
            }`}
          >
            About Us <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`border-b border-gray-100 pb-3 flex justify-between items-center ${
              isActive('/contact') ? 'text-[#6B0D24]' : 'text-gray-900'
            }`}
          >
            Contact <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/blogs"
            onClick={() => setMobileMenuOpen(false)}
            className={`border-b border-gray-100 pb-3 flex justify-between items-center ${
              isActive('/blogs') ? 'text-[#6B0D24]' : 'text-gray-900'
            }`}
          >
            Blogs <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2">
          {userFavorites.length > 0 && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setFavoritesModalOpen(true);
              }}
              className="bg-[#FAF6F0] text-[#6B0D24] border border-[#6B0D24]/20 w-full py-3 rounded-xl font-bold text-center block text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              <i className="ph-fill ph-heart text-sm"></i> View Favorites ({userFavorites.length})
            </button>
          )}

          <Link
            href="/compare-resorts"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-[#780522] text-white w-full py-3.5 rounded-xl font-bold text-center block text-xs shadow-md uppercase tracking-widest hover:bg-stone-900 transition-colors"
          >
            Get an Instant Quote
          </Link>

          {(currentUser || userName) && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full bg-stone-100 text-[#6B0D24] border border-stone-200 hover:bg-stone-200 py-3 rounded-xl font-bold text-center block text-xs transition-colors uppercase tracking-wider mt-2"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* FAVORITES MODAL */}
      <FavoritesModal
        isOpen={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favorites={userFavorites}
      />
    </>
  );
}