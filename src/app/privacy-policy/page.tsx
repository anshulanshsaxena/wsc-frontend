import React from 'react';
import Metadata from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'Privacy Policy | Wedding Support Company',
  description: 'Privacy Policy and Terms of Service for Wedding Support Company.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col relative overflow-x-hidden">
      {/* Shared Site Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 sm:p-10 md:p-16">
            
            {/* Header */}
            <header className="mb-10 border-b border-gray-100 pb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-2">
                Legal & Compliance
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                Privacy Policy & Terms
              </h1>
              <p className="text-[#6B0D24] font-bold tracking-wide uppercase text-xs">
                Effective Date: May 13, 2026
              </p>
            </header>

            {/* Legal Content Body */}
            <div className="space-y-8 text-gray-700 leading-relaxed text-sm md:text-base">
              
              {/* SECTION 1 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-info text-[#6B0D24] text-xl md:text-2xl"></i> 
                  1. Nature of Services
                </h2>
                <p className="mb-4">
                  Wedding Support Company (WSC) operates as a <strong>consultancy and event management platform</strong>. It is important to understand the scope of our business:
                </p>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-5 text-amber-950 text-xs md:text-sm font-medium rounded-r-2xl flex items-start gap-2.5">
                  <i className="ph-bold ph-warning-circle text-amber-600 text-lg shrink-0 mt-0.5"></i>
                  <div>
                    <strong>No Direct Resort Bookings:</strong> This website does not sell or book resort rooms directly. We are not a travel agency or a resort booking engine.
                  </div>
                </div>

                <ul className="list-disc ml-6 space-y-2 text-gray-600 font-medium text-xs md:text-sm">
                  <li>
                    <strong>No Payments for Resorts:</strong> We cannot and do not accept any payments or deposits against the booking of a resort or venue. All room/venue payments must be settled directly with the respective resort.
                  </li>
                  <li>
                    <strong>Consultancy Only:</strong> Our involvement regarding resorts is limited to consultation, price estimation, and lead facilitation.
                  </li>
                  <li>
                    <strong>Billable Services:</strong> We exclusively sell and accept payments for <strong>Wedding Decor</strong> and <strong>Wedding Planning Services</strong>.
                  </li>
                </ul>
              </section>

              {/* SECTION 2 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-8">
                  <i className="ph-fill ph-phone text-[#6B0D24] text-xl md:text-2xl"></i> 
                  2. Collection of Contact Information
                </h2>
                <p className="mb-4">
                  To provide accurate budgeting and personalized support, we collect your mobile number when you use our calculators or request custom estimates.
                </p>

                <div className="bg-[#FAF6F0] border-l-4 border-[#6B0D24] p-4 my-5 text-gray-800 text-xs md:text-sm font-medium rounded-r-2xl">
                  <strong>Consent to Call:</strong> By providing your number, you consent to receive calls or WhatsApp messages from our consultants to discuss your resort interests and wedding requirements.
                </div>
              </section>

              {/* SECTION 3 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-8">
                  <i className="ph-fill ph-users-three text-[#6B0D24] text-xl md:text-2xl"></i> 
                  3. Sharing with Resort Partners
                </h2>
                <p>
                  When you express interest in a specific resort through our comparison or calculator tools, we may share your contact details and requirements with that resort’s sales team so they may contact you regarding room availability and formal venue contracts.
                </p>
              </section>

              {/* SECTION 4 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-8">
                  <i className="ph-fill ph-calculator text-[#6B0D24] text-xl md:text-2xl"></i> 
                  4. Accuracy & Pricing Disclaimer
                </h2>
                <p>
                  All "Instant Budgets" for resorts generated on this website are <strong>preliminary estimates</strong> provided for planning purposes. Because we do not control resort inventory, final pricing and availability are subject to the resort's direct confirmation.
                </p>
              </section>

              {/* SECTION 5 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-8">
                  <i className="ph-fill ph-shield-check text-[#6B0D24] text-xl md:text-2xl"></i> 
                  5. Data Security
                </h2>
                <p>
                  We implement strict security measures to protect your data. Your information is only shared with relevant resort partners you have expressed interest in and is never sold to unrelated third-party marketers.
                </p>
              </section>

              {/* SECTION 6 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-8">
                  <i className="ph-fill ph-envelope-simple text-[#6B0D24] text-xl md:text-2xl"></i> 
                  6. Contact & Data Removal
                </h2>
                <p className="mb-4">
                  To opt-out of communications or request data deletion, please contact us:
                </p>

                <div className="p-6 bg-[#FAF6F0] rounded-2xl border border-[#6B0D24]/10 inline-block space-y-1">
                  <p className="font-black text-gray-900 text-base">Wedding Support Company</p>
                  <p className="text-[#6B0D24] font-bold text-sm">
                    Email:{' '}
                    <a
                      href="mailto:contact@weddingsupportcompany.com"
                      className="hover:underline"
                    >
                      contact@weddingsupportcompany.com
                    </a>
                  </p>
                  <p className="text-gray-500 text-xs font-medium">Subject: Legal/Privacy Inquiry</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 text-center bg-white text-xs font-semibold text-gray-400">
        <p>© 2026 Wedding Support Company. All Rights Reserved.</p>
      </footer>
    </div>
  );
}