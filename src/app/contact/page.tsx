'use client';

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import ConsentPopup from '@/components/modals/ConsentPopup';

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inquiryData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      inquiryType,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'contact_inquiries'), inquiryData);
      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setInquiryType('');
      setMessage('');

      setTimeout(() => {
        setSubmitted(false);
      }, 4000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Something went wrong while sending your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 font-sans min-h-screen flex flex-col justify-between overflow-x-hidden text-gray-900">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 w-full relative z-10 pb-20 pt-16 md:pt-20">
        {/* Header Hero Banner */}
        <section className="bg-white border-b border-gray-200 pt-16 pb-20 md:pt-24 md:pb-32 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-40">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[60%] bg-[#6B0D24]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[50%] bg-[#C5A059]/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10 pt-4">
            <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-6">
              <i className="ph-fill ph-headset text-[#6B0D24]"></i> We're here to help
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-6">
              Get in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B0D24] to-[#C5A059]">
                touch.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
              Have a question about a venue, need help planning, or want to partner with us? Our team is ready to assist you.
            </p>
          </div>
        </section>

        {/* Contact Info Cards & Form Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left Column: Info Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Email Card */}
              <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-transform hover:-translate-y-1 duration-300">
                <div className="w-14 h-14 bg-[#6B0D24]/10 text-[#6B0D24] rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                  <i className="ph-fill ph-envelope-simple"></i>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Chat with us</h3>
                <p className="text-gray-500 font-medium mb-4">Our friendly team is here to help.</p>
                <a
                  href="mailto:info@weddingsupportcompany.com"
                  className="text-lg font-bold text-black hover:text-[#6B0D24] transition-colors break-all"
                >
                  info@weddingsupportcompany.com
                </a>
              </div>

              {/* Phone Card */}
              <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-transform hover:-translate-y-1 duration-300">
                <div className="w-14 h-14 bg-[#C5A059]/10 text-[#C5A059] rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                  <i className="ph-fill ph-phone"></i>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Call us directly</h3>
                <p className="text-gray-500 font-medium mb-4">Mon-Fri from 9am to 6pm.</p>
                <a
                  href="tel:+918006806666"
                  className="text-lg font-bold text-black hover:text-[#C5A059] transition-colors"
                >
                  +91 8006806666
                </a>
              </div>

              {/* Office HQ Card */}
              <div className="bg-gray-900 p-8 rounded-[32px] shadow-xl border border-gray-800 transition-transform hover:-translate-y-1 duration-300 text-white">
                <div className="w-14 h-14 bg-gray-800 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 border border-gray-700">
                  <i className="ph-fill ph-map-pin"></i>
                </div>
                <h3 className="text-xl font-black mb-2">Visit our office</h3>
                <p className="text-gray-400 font-medium mb-4">Come say hello at our HQ.</p>
                <p className="text-lg font-bold text-white leading-snug">
                  F-14 Satyam Enclave,<br />
                  Vivek Vihar<br />
                  New Delhi, India
                </p>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-[32px] shadow-[0_20px_50px_rgb(0,0,0,0.08)] border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-500 font-medium mb-8">We usually reply within 24 hours.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#6B0D24] focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#6B0D24] focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#6B0D24] focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    What can we help you with?
                  </label>
                  <div className="relative">
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#6B0D24] focus:bg-white transition appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select an option...
                      </option>
                      <option value="resort">I need help finding a Resort</option>
                      <option value="planning">I have a question about Wedding Planning</option>
                      <option value="vendor">I am a vendor wanting to partner</option>
                      <option value="other">Other inquiry</option>
                    </select>
                    <i className="ph-bold ph-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more about your requirements..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#6B0D24] focus:bg-white transition resize-none custom-scrollbar"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-black text-lg py-5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                    submitted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[#6B0D24] text-white hover:bg-[#520a1a] shadow-[#6B0D24]/10'
                  }`}
                >
                  {loading ? (
                    <>
                      <i className="ph-bold ph-spinner animate-spin text-xl"></i> Sending...
                    </>
                  ) : submitted ? (
                    <>
                      <i className="ph-bold ph-check-circle text-xl"></i> Message Sent!
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <i className="ph-bold ph-paper-plane-right"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 font-medium text-lg">
              Everything you need to know about planning your destination wedding in India.
            </p>
          </div>

          <div className="space-y-4">
            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                What services does Wedding Support Company provide?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                We are a specialized consultancy firm providing <strong>destination wedding budget planning</strong>, premium <strong>wedding decor</strong>, and end-to-end management. We act as your expert guide to find the perfect venue and manage the logistics and aesthetics of your big day.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Can I book a resort directly through your website?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                No. We operate as a <strong>luxury wedding resort booking consultancy</strong>, not a travel agent. We provide the tools to compare prices, and once you shortlist a venue, we facilitate a direct connection with the resort's sales team so you can sign contracts and pay them directly.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                How accurate is the "Instant Wedding Budget" calculator?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                Our tool provides a highly realistic <strong>destination wedding cost estimate in India</strong> based on current data. However, final prices are subject to seasonal availability and resort confirmation. We follow up every calculation with a human-led <strong>wedding budget consultation</strong> to verify the numbers.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Do I pay Wedding Support Company for my resort rooms?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                No. Wedding Support Company <strong>never accepts payments against resort bookings</strong>. All accommodation payments must be settled directly with the venue. We only accept payments for our proprietary <strong>wedding decor and planning packages</strong>.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Why do you require my phone number to calculate a budget?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                We use your number to verify the request and provide a personalized service. A destination wedding has many moving parts; our experts call you to ensure the <strong>wedding venue selection</strong> truly fits your guest count and vision, which an algorithm cannot do alone.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Will my number be shared with the resorts?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                If you request a formal quote or express high interest in a specific venue, we share your details with that resort’s sales department. This allows them to check real-time availability for your dates and provide you with a formal contract.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Do you provide decor services for weddings outside your listed resorts?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                Yes! While we specialize in <strong>luxury destination wedding decor</strong> at our partner resorts, our creative team is available for premium wedding planning and decor execution at any venue of your choice across India.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                What is included in your wedding planning service?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                Our services cover vendor management, logistics, timeline coordination, and end-to-end decor execution. We also specialize in <strong>wedding budget planning for NRIs</strong>, providing local "boots-on-the-ground" support to make long-distance planning seamless.
              </div>
            </details>

            <details className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden list-none">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-lg text-gray-900 hover:text-[#6B0D24] transition-colors select-none">
                Why should I choose Wedding Support Company over traditional planning?
                <span className="transition group-open:rotate-180">
                  <i className="ph-bold ph-caret-down text-gray-400"></i>
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-500 font-medium leading-relaxed border-t border-gray-50 mt-2 pt-4">
                Wedding Support Company is a tech-driven consultancy designed to modernize the <strong>destination wedding booking experience</strong>. Our platform eliminates weeks of manual coordination by providing <strong>instant wedding quotes</strong> and transparency.
                <br />
                <br />
                Our Unique Selling Points include:
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li>
                    <strong>Dynamic Pricing:</strong> View real-time, date-based resort discounts to find the most cost-effective dates for your celebration.
                  </li>
                  <li>
                    <strong>360° Virtual Walkthroughs:</strong> Tour luxury venues from the comfort of your home, saving you the time and expense of multiple site visits.
                  </li>
                  <li>
                    <strong>Instant Estimates:</strong> Get a comprehensive budget breakdown in seconds, allowing you to make data-backed decisions immediately.
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 font-medium text-sm">
        <p>&copy; {new Date().getFullYear()} Wedding Support Company. All Rights Reserved.</p>
      </footer>

      {/* User Consent Modal */}
      <ConsentPopup />
    </div>
  );
}