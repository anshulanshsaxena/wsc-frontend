"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function ConsentPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check localStorage client-side only
    const hasConsented = localStorage.getItem("wsc_user_consent");
    if (!hasConsented) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("wsc_user_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-x-4 bottom-6 md:inset-x-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[9999]">
        <div className="bg-black text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 max-w-md w-full mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <i className="ph-fill ph-shield-check text-4xl text-white"></i>
            </div>
            <h3 className="text-lg font-bold uppercase tracking-widest mb-3">User Agreement</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              By proceeding to use this platform, you acknowledge and agree to our{" "}
              <Link
                href="/terms-of-service"
                className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors font-semibold"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors font-semibold"
              >
                Privacy Policy
              </Link>
              . We use cookies to enhance your budget calculation experience.
            </p>
            <button
              onClick={handleAccept}
              className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-full font-bold uppercase tracking-tighter text-sm transition-all duration-300 active:scale-95"
            >
              Proceed to Website
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
    </>
  );
}