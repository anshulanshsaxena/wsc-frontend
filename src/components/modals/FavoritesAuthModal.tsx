"use client";

import React, { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useFavorites } from "@/context/FavoritesContext";
import { useRouter } from "next/navigation";

export default function FavoritesAuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, setIsAuthModalOpen, pendingBudgetSave, autoSavePendingBudget } =
    useFavorites();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    try {
      if (!window.favRecaptchaVerifier) {
        window.favRecaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-fav", {
          size: "invisible",
        });
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.favRecaptchaVerifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      console.error("Firebase Phone Auth Error:", err);
      alert("Failed to deliver OTP. Please verify your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || otp.length < 6) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const authenticatedUser = result.user;

      await setDoc(
        doc(db, "users", authenticatedUser.uid),
        { name, phone: authenticatedUser.phoneNumber, lastLogin: new Date() },
        { merge: true }
      );

      if (pendingBudgetSave) {
        await autoSavePendingBudget(authenticatedUser, pendingBudgetSave);
        setIsAuthModalOpen(false);
        router.push("/user-profile");
      } else {
        setIsAuthModalOpen(false);
      }

      setStep("phone");
      setOtp("");
    } catch (err) {
      console.error("OTP verification failed:", err);
      alert("Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative animate-scale-in">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <i className="ph-bold ph-x text-xl"></i>
        </button>

        {step === "phone" ? (
          <div>
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto shadow-inner">
              <i className="ph-fill ph-heart"></i>
            </div>
            <h3 className="text-lg font-black text-center text-gray-900 mb-1">
              {pendingBudgetSave ? "Calculate & Save Budget" : "Save to Favorites"}
            </h3>
            <p className="text-xs text-center text-gray-500 mb-6">
              {pendingBudgetSave
                ? "Enter your mobile number to view and save your custom budget."
                : "Enter your details to save your selected venues directly to your dashboard."}
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50 text-xs font-bold text-gray-900"
              />
              <input
                type="tel"
                placeholder="Mobile Number (+91...)"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50 text-xs font-bold text-gray-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white text-xs font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-md mt-1 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <i className="ph-bold ph-spinner animate-spin"></i> : "Send OTP"}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-black text-center text-gray-900 mb-1">Verify Number</h3>
            <p className="text-xs text-center text-gray-500 mb-4">
              Enter the 6-digit code sent to <b className="text-gray-900 text-xs">{phone}</b>
            </p>

            <input
              type="text"
              placeholder="------"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-black px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none mb-2 bg-gray-50 text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-green-600 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-green-700 transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <i className="ph-bold ph-spinner animate-spin"></i>
              ) : pendingBudgetSave ? (
                "Verify & View Budget"
              ) : (
                "Verify & Save"
              )}
            </button>
          </div>
        )}

        <div id="recaptcha-container-fav" className="mt-4 flex justify-center"></div>
      </div>
    </div>
  );
}