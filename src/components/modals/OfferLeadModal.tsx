"use client";

import React, { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface OfferLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferLeadModal({ isOpen, onClose }: OfferLeadModalProps) {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-lead", {
          size: "invisible",
        });
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length < 6) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      
      // Save lead details to Firestore
      await addDoc(collection(db, "offer_leads"), {
        name,
        date,
        guests: parseInt(guests) || 0,
        phone: `+91${phone}`,
        createdAt: new Date(),
      });

      alert("Offer claimed successfully! Our team will contact you shortly.");
      onClose();
      // Reset form
      setStep("form");
      setName("");
      setDate("");
      setGuests("");
      setPhone("");
      setOtp("");
    } catch (err) {
      console.error("Invalid OTP:", err);
      alert("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-[100] flex items-center justify-center px-4 backdrop-blur-sm animate-scale-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl"
        >
          &times;
        </button>

        <div className="bg-blue-600 p-6 text-center text-white">
          <h2 className="text-2xl font-black mb-1">Claim Your Offer</h2>
          <p className="text-blue-100 text-sm">Enter details to unlock your exclusive discount</p>
        </div>

        <div className="p-6">
          {step === "form" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm"
                />
                <input
                  type="number"
                  placeholder="No. of Guests"
                  required
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-sm"
                />
              </div>
              <div className="flex">
                <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg p-3 text-gray-500 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-r-lg outline-none focus:border-blue-600 text-sm"
                />
              </div>

              <div id="recaptcha-container-lead" />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-2 transition hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {loading ? <i className="ph-bold ph-spinner animate-spin" /> : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-2">
                We sent a 6-digit code to your phone.
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-600 text-center tracking-[0.5em] font-bold text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg transition hover:bg-green-700 flex items-center justify-center gap-2"
              >
                {loading ? <i className="ph-bold ph-spinner animate-spin" /> : "Verify & Claim Offer"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Global declaration for window recaptcha
declare global {
  interface Window {
    recaptchaVerifier: any;
    favRecaptchaVerifier: any;
  }
}