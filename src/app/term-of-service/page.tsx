import React from 'react';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'Terms of Use | Wedding Support Company',
  description: 'Terms of Service and Conditions of Use for Wedding Support Company.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function TermsOfServicePage() {
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
                Terms of Use
              </h1>
              <p className="text-[#6B0D24] font-bold tracking-wide uppercase text-xs">
                Effective Date: May 13, 2026
              </p>
            </header>

            {/* Legal Content Body */}
            <div className="space-y-8 text-gray-700 leading-relaxed text-sm md:text-base">
              
              <p className="text-base font-medium text-gray-800">
                By accessing <strong>Wedding Support Company (WSC)</strong>, you agree to comply with and be bound by the following terms and conditions. If you do not agree, please refrain from using our platform.
              </p>

              {/* 2-COLUMN HIGHLIGHT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-5 bg-[#FAF6F0] rounded-2xl border border-[#6B0D24]/10">
                  <i className="ph-bold ph-scales text-2xl text-[#6B0D24] mb-2 block"></i>
                  <h3 className="font-black text-gray-900 text-sm mb-1">Legal Capacity</h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    You must be at least 18 years of age to use this website and generate wedding budget estimates.
                  </p>
                </div>

                <div className="p-5 bg-[#FAF6F0] rounded-2xl border border-[#6B0D24]/10">
                  <i className="ph-bold ph-hand-coins text-2xl text-[#6B0D24] mb-2 block"></i>
                  <h3 className="font-black text-gray-900 text-sm mb-1">Service Scope</h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    WSC provides consultancy, decor, and planning. We do not accept resort booking payments.
                  </p>
                </div>
              </div>

              {/* SECTION 1 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  1. Use of Budget Calculators
                </h2>
                <p>
                  The "Instant Budget" and "Compare Resort" features are for <strong>informational purposes only</strong>. While we strive for 100% accuracy, these tools provide mathematical estimates based on current market trends. WSC is not liable for minor discrepancies between the generated estimate and the final resort quote.
                </p>
              </section>

              {/* SECTION 2 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  2. Intellectual Property
                </h2>
                <p>
                  All content, including our proprietary 360° virtual tours, budget calculation logic, graphics, and resort descriptions, is the intellectual property of Wedding Support Company. You may not copy, reproduce, or "scrape" our data for commercial use without written permission.
                </p>
              </section>

              {/* SECTION 3 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  3. Prohibited Conduct
                </h2>
                <p className="mb-3 font-medium">Users agree not to:</p>
                <ul className="list-disc ml-6 space-y-2 text-gray-600 font-medium text-xs md:text-sm">
                  <li>Use the calculator to generate fake leads or spam our resort partners.</li>
                  <li>Attempt to bypass our security measures or "Command Center" admin panels.</li>
                  <li>Provide false contact information (phone numbers or emails) during the budgeting process.</li>
                </ul>
              </section>

              {/* SECTION 4 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  4. Limitation of Liability
                </h2>
                <p className="mb-3 font-medium">In no event shall Wedding Support Company be liable for any direct, indirect, or incidental damages resulting from:</p>
                <ul className="list-disc ml-6 space-y-2 text-gray-600 font-medium text-xs md:text-sm">
                  <li>A resort being unavailable for your selected dates.</li>
                  <li>Price increases implemented by the resort after an estimate was generated on our site.</li>
                  <li>Any disputes between the user and a resort partner once the user has been introduced.</li>
                </ul>
              </section>

              {/* SECTION 5 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  5. Modification of Terms
                </h2>
                <p>
                  We reserve the right to update these Terms at any time. Your continued use of the platform after changes are posted constitutes your acceptance of the new Terms.
                </p>
              </section>

              {/* SECTION 6 */}
              <section>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3 border-t border-gray-100 pt-8">
                  6. Governing Law
                </h2>
                <p>
                  These terms are governed by the laws of India. Any disputes arising from the use of this website shall be subject to the exclusive jurisdiction of the courts in India.
                </p>
              </section>

              {/* CONTACT FOOTER NOTE */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <p className="text-xs md:text-sm text-gray-500 font-medium italic">
                  For questions regarding our Terms of Use, please contact us at{' '}
                  <a
                    href="mailto:legal@weddingsupportcompany.com"
                    className="text-[#6B0D24] font-bold not-italic hover:underline"
                  >
                    legal@weddingsupportcompany.com
                  </a>
                </p>
              </div>

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