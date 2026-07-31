"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface PendingFavorite {
  id: string;
  name?: string;
}

interface FavoritesContextType {
  user: User | null;
  userFavorites: string[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  pendingFavorite: PendingFavorite | null;
  setPendingFavorite: (fav: PendingFavorite | null) => void;
  toggleFavorite: (resortId: string, resortName?: string) => Promise<void>;
  isFavorite: (resortId: string) => boolean;
  [key: string]: any;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState<PendingFavorite | null>(null);

  // Load existing user favorites from Firestore "favorites" collection
  const loadUserFavorites = async (currentUser: User) => {
    try {
      const q = query(collection(db, "favorites"), where("userId", "==", currentUser.uid));
      const snap = await getDocs(q);
      const favIds: string[] = [];
      snap.forEach((d) => {
        if (d.data().resortId) {
          favIds.push(String(d.data().resortId));
        }
      });
      setUserFavorites(favIds);
      return favIds;
    } catch (err) {
      console.error("Error loading user favorites:", err);
      return [];
    }
  };

  // Save the resort user clicked before logging in
  const autoSavePendingFavorite = async (currentUser: User, currentFavs: string[]) => {
    if (!pendingFavorite) return;
    const resId = pendingFavorite.id;
    const favRef = doc(db, "favorites", `${currentUser.uid}_${resId}`);
    try {
      await setDoc(favRef, {
        userId: currentUser.uid,
        resortId: resId,
        resortName: pendingFavorite.name || "Resort",
        timestamp: new Date(),
      });

      if (!currentFavs.includes(resId)) {
        setUserFavorites((prev) => [...prev, resId]);
      }
    } catch (err) {
      console.error("Auto saving pending favorite failed:", err);
    } finally {
      setPendingFavorite(null);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const currentFavs = await loadUserFavorites(currentUser);
        if (pendingFavorite) {
          await autoSavePendingFavorite(currentUser, currentFavs);
        }
      } else {
        setUserFavorites([]);
      }
    });
    return () => unsubscribe();
  }, [pendingFavorite]);

  // Toggle Favorite
  const toggleFavorite = async (resortId: string, resortName?: string) => {
    if (!user) {
      setPendingFavorite({ id: resortId, name: resortName });
      setIsAuthModalOpen(true);
      return;
    }

    const favRef = doc(db, "favorites", `${user.uid}_${resortId}`);

    try {
      if (userFavorites.includes(resortId)) {
        await deleteDoc(favRef);
        setUserFavorites((prev) => prev.filter((id) => id !== resortId));
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          resortId: resortId,
          resortName: resortName || "Resort",
          timestamp: new Date(),
        });
        setUserFavorites((prev) => [...prev, resortId]);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const isFavorite = (resortId: string) => userFavorites.includes(resortId);

  return (
    <FavoritesContext.Provider
      value={{
        user,
        userFavorites,
        isAuthModalOpen,
        setIsAuthModalOpen,
        pendingFavorite,
        setPendingFavorite,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
}