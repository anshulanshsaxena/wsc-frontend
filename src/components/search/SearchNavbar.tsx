"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchNavbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleBackNav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {/* TOP FIXED NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          {/* Back Button & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleBackNav}
              aria-label="Go Back"
              className="text-gray-900 p-1 hover:text-[#780522] transition-colors cursor-pointer"
            >
              <i className="ph-bold ph-arrow-left text-2xl"></i>
            </button>
            <Link href="/" className="flex items-center">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9.firebasestorage.app/o/uploads%2Fthumbnails%2F1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview%20(1).webp?alt=media&token=81e74d46-ca11-4d55-bdd7-3ccada95aecf"
                alt="Wedding Support Company Logo"
                className="h-20 md:h-24 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="/user-profile" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link
              href="/about-us-wedding-support-company"
              className="hover:text-blue-600 transition-colors"
            >
              About Us
            </Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">
              Contact
            </Link>
            <Link href="/blogs" className="hover:text-blue-600 transition-colors">
              Blogs
            </Link>
          </div>

          {/* Right Action CTA */}
          <div className="hidden md:block">
            <Link
              href="/compare-resorts"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition-colors inline-block"
            >
              Get a Quote
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-gray-900 p-2 focus:outline-none cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <i className="ph ph-list text-3xl"></i>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU BACKDROP OVERLAY */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000] transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* COMPACT VERTICAL MOBILE DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-[65vw] sm:w-[50vw] bg-white z-[100001] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-6 px-5 shadow-2xl border-l border-gray-100 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview%20(1).png?alt=media&token=957241cc-a7d9-4c40-a1c7-24533166d0a7"
            alt="Company Logo"
            className="h-16 w-auto object-contain"
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-900 p-1 hover:text-[#780522] transition-colors focus:outline-none cursor-pointer"
          >
            <i className="ph ph-x text-3xl"></i>
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm font-bold text-gray-900">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-gray-100 pb-3 flex justify-between items-center"
          >
            Home <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/user-profile"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-gray-100 pb-3 flex justify-between items-center"
          >
            Dashboard <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/about-us-wedding-support-company"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-gray-100 pb-3 flex justify-between items-center"
          >
            About Us <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-gray-100 pb-3 flex justify-between items-center"
          >
            Contact <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
          <Link
            href="/blogs"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-gray-100 pb-3 flex justify-between items-center"
          >
            Blogs <i className="ph ph-caret-right text-gray-400"></i>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/compare-resorts"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-[#780522] text-white w-full py-3.5 rounded-xl font-bold text-center block text-xs shadow-md uppercase tracking-widest hover:bg-stone-900 transition-colors"
          >
            Get an Instant Quote
          </Link>
        </div>
      </div>
    </>
  );
}