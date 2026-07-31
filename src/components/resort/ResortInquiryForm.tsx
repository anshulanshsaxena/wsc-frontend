"use client";

import React, { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useFavorites } from "@/context/FavoritesContext";

interface ResortInquiryFormProps {
  resortId: string;
  resortName: string;
}

export default function ResortInquiryForm({ resortId, resortName }: ResortInquiryFormProps) {
  const { user } = useFavorites();

  const todayStr = new Date().toISOString().split("T")[0];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [alreadyInquired, setAlreadyInquired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Pre-fill user data & check existing inquiries
  useEffect(() => {
    async function checkUserInquiryState() {
      if (!user || !resortId) return;

      if (user.phoneNumber) {
        setPhone(user.phoneNumber);
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setName(userDoc.data().name);
        }

        const qInq = query(
          collection(db, "inquiries"),
          where("userId", "==", user.uid),
          where("resortId", "==", resortId)
        );
        const snapInq = await getDocs(qInq);
        if (!snapInq.empty) {
          setAlreadyInquired(true);
        }
      } catch (err) {
        console.error("Error checking user inquiry state:", err);
      }
    }

    checkUserInquiryState();
  }, [user, resortId]);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      alert("Please select Check-In and Check-Out dates.");
      return;
    }

    setLoading(true);

    if (user) {
      try {
        await addDoc(collection(db, "inquiries"), {
          userId: user.uid,
          resortId,
          resortName,
          customerName: name || user.displayName || "Customer",
          customerPhone: user.phoneNumber || phone,
          weddingDates: `${checkIn} to ${checkOut}`,
          submittedAt: new Date().toISOString(),
          status: "New",
        });
        setAlreadyInquired(true);
      } catch (err) {
        console.error("Error submitting inquiry:", err);
      } finally {
        setLoading(false);
      }
    } else {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
          });
        }

        const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        setConfirmationResult(result);
        setStep("otp");
      } catch (err) {
        console.error("Error sending OTP:", err);
        alert("Failed to send OTP. Please check your phone number.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || otp.length < 6) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const authenticatedUser = result.user;

      await addDoc(collection(db, "inquiries"), {
        userId: authenticatedUser.uid,
        resortId,
        resortName,
        customerName: name,
        customerPhone: authenticatedUser.phoneNumber,
        weddingDates: `${checkIn} to ${checkOut}`,
        submittedAt: new Date().toISOString(),
        status: "New",
      });

      setAlreadyInquired(true);
    } catch (err) {
      console.error("Invalid OTP:", err);
      alert("Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyInquired) {
    return (
      <div className="bg-[#FAF6F0] rounded-2xl md:rounded-3xl p-6 border border-[#6B0D24]/10 mb-6 text-center">
        <i className="ph-fill ph-check-circle text-[#C5A059] text-5xl mb-3 inline-block"></i>
        <h4 className="font-black text-gray-900 text-xl">Inquiry Already Sent</h4>
        <p className="text-sm text-gray-600 mt-2">
          We have received your request for this resort. The manager will be in touch with you shortly!
        </p>
      </div>
    );
  }

  return (
    <div
      id="inquiryWrapper"
      className="bg-[#FAF6F0] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#6B0D24]/10 mb-6 relative overflow-hidden"
    >
      <div id="inquiryFormUI">
        <h3 className="text-base md:text-lg font-black text-[#6B0D24] mb-1">Check Availability</h3>
        <p className="text-xs md:text-sm text-[#6B0D24]/90 mb-3 md:mb-5">
          Connect directly with the resort manager.
        </p>

        {step === "form" ? (
          <form id="inquiryForm" className="flex flex-col gap-2.5" onSubmit={handleSubmitInquiry}>
            <input
              type="text"
              id="inqName"
              placeholder="Your Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-sm font-medium text-gray-900"
            />

            <input
              type="tel"
              id="inqPhone"
              placeholder="Mobile Number (+91...)"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-sm font-medium text-gray-900"
            />

            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Check-In
                </label>
                <input
                  type="date"
                  id="inqDateStart"
                  min={todayStr}
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-xs font-bold text-gray-900"
                />
              </div>

              <div className="relative flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Check-Out
                </label>
                <input
                  type="date"
                  id="inqDateEnd"
                  min={checkIn || todayStr}
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-xs font-bold text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              id="sendInqBtn"
              disabled={loading}
              className="bg-[#6B0D24] text-white font-bold py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-[#520a1a] transition-colors shadow-md mt-1 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? <i className="ph-bold ph-spinner animate-spin"></i> : "Request Pricing"}
            </button>
          </form>
        ) : (
          <div id="otpSection" className="bg-white p-4 rounded-xl border border-[#6B0D24]/20 text-center">
            <p className="text-xs text-gray-500 font-medium mb-3">
              Enter the 6-digit code sent to <b id="otpDisplayPhone" className="text-gray-900">{phone}</b>
            </p>
            <input
              type="text"
              id="otpInput"
              placeholder="------"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-widest text-2xl px-4 py-2 rounded-lg border border-gray-200 focus:border-[#6B0D24] outline-none mb-3 font-bold text-gray-900"
            />
            <button
              type="button"
              id="verifyOtpBtn"
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-[#C5A059] text-white font-bold py-3 rounded-xl hover:bg-[#a37f3b] transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <i className="ph-bold ph-spinner animate-spin"></i> : "Verify & Send"}
            </button>
          </div>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}