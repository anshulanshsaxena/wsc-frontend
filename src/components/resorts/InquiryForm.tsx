'use client';

import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

interface InquiryFormProps {
  resortId: string;
  resortName: string;
  hasAlreadyInquired?: boolean;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({
  resortId,
  resortName,
  hasAlreadyInquired = false,
}) => {
  const [alreadyInquired, setAlreadyInquired] = useState(hasAlreadyInquired);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [otp, setOtp] = useState('');

  const [minCheckout, setMinCheckout] = useState('');
  const [maxCheckout, setMaxCheckout] = useState('');

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    setAlreadyInquired(hasAlreadyInquired);
  }, [hasAlreadyInquired]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startVal = e.target.value;
    setDateStart(startVal);

    if (startVal) {
      const startDate = new Date(startVal);

      const minD = new Date(startDate);
      minD.setDate(minD.getDate() + 1);
      const minStr = minD.toISOString().split('T')[0];
      setMinCheckout(minStr);

      const maxD = new Date(startDate);
      maxD.setDate(maxD.getDate() + 4);
      const maxStr = maxD.toISOString().split('T')[0];
      setMaxCheckout(maxStr);

      if (dateEnd && (dateEnd < minStr || dateEnd > maxStr)) {
        setDateEnd('');
      }
    } else {
      setMinCheckout('');
      setMaxCheckout('');
      setDateEnd('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : '+91' + phone.trim();
    const user = auth.currentUser;

    const cleanInputPhone = formattedPhone.replace(/[\s\-\(\)]/g, '');
    const cleanUserPhone = user && user.phoneNumber ? user.phoneNumber.replace(/[\s\-\(\)]/g, '') : '';

    if (user && cleanInputPhone === cleanUserPhone) {
      try {
        await addDoc(collection(db, 'inquiries'), {
          userId: user.uid,
          resortId,
          resortName,
          customerName: name.trim(),
          customerPhone: user.phoneNumber,
          weddingDates: `${dateStart} to ${dateEnd}`,
          submittedAt: new Date().toISOString(),
          status: 'New',
        });
        setAlreadyInquired(true);
      } catch (error) {
        console.error('Error submitting inquiry:', error);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'inquiry-recaptcha-container', {
            size: 'invisible',
          });
        }

        const result = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaVerifierRef.current
        );
        confirmationResultRef.current = result;
        setStep('otp');
      } catch (error) {
        console.error('Error sending OTP:', error);
        alert('Failed to send OTP. Please check your mobile number.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);

    try {
      if (confirmationResultRef.current) {
        const result = await confirmationResultRef.current.confirm(otp);
        const user = result.user;

        await addDoc(collection(db, 'inquiries'), {
          userId: user.uid,
          resortId,
          resortName,
          customerName: name.trim(),
          customerPhone: user.phoneNumber,
          weddingDates: `${dateStart} to ${dateEnd}`,
          submittedAt: new Date().toISOString(),
          status: 'New',
        });
        setAlreadyInquired(true);
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="inquirySectionAnchor"
      className="bg-[#FAF6F0] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#6B0D24]/10 mb-6 relative overflow-hidden"
    >
      {!alreadyInquired ? (
        <div>
          <h3 className="text-base md:text-lg font-black text-[#6B0D24] mb-1">Check Availability</h3>
          <p className="text-xs md:text-sm text-[#6B0D24]/90 mb-3 md:mb-5">
            Connect directly with the resort manager.
          </p>

          {step === 'form' ? (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-sm"
                required
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number (+91...)"
                className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-sm"
                required
              />

              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <label className="absolute text-[8px] md:text-[10px] font-bold text-gray-400 uppercase top-1.5 left-3 md:left-4 pointer-events-none">
                    Check-In
                  </label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={handleStartChange}
                    className="w-full h-12 px-3 pt-5 pb-2 md:px-4 md:pt-5 md:pb-2 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-xs md:text-sm"
                    required
                  />
                </div>

                <div className="relative flex-1">
                  <label className="absolute text-[8px] md:text-[10px] font-bold text-gray-400 uppercase top-1.5 left-3 md:left-4 pointer-events-none">
                    Check-Out
                  </label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    min={minCheckout}
                    max={maxCheckout}
                    disabled={!dateStart}
                    className="w-full h-12 px-3 pt-5 pb-2 md:px-4 md:pt-5 md:pb-2 rounded-lg md:rounded-xl border border-[#6B0D24]/20 focus:outline-none focus:border-[#6B0D24] bg-white text-xs md:text-sm disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#6B0D24] text-white font-bold py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-[#520a1a] transition-colors shadow-md mt-1 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <i className="ph-bold ph-spinner animate-spin text-sm"></i> Processing...
                  </>
                ) : (
                  'Request Pricing'
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <div className="bg-white p-4 rounded-xl border border-[#6B0D24]/20 text-center">
                <p className="text-xs text-gray-500 font-medium mb-3">
                  Enter the 6-digit code sent to <br />
                  <b className="text-gray-900 text-sm">{phone}</b>
                </p>
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="------"
                  className="w-full text-center tracking-widest text-2xl px-4 py-2 rounded-lg border border-gray-200 focus:border-[#6B0D24] outline-none mb-3"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-[#C5A059] text-white font-bold py-3 rounded-xl hover:bg-[#a37f3b] transition shadow disabled:opacity-70"
                >
                  {loading ? 'Verifying...' : 'Verify & Send'}
                </button>
              </div>
            </div>
          )}

          <div id="inquiry-recaptcha-container" />
        </div>
      ) : (
        <div className="text-center py-6">
          <i className="ph-fill ph-check-circle text-[#C5A059] text-5xl mb-3"></i>
          <h4 className="font-black text-gray-900 text-xl">Inquiry Already Sent</h4>
          <p className="text-sm text-gray-600 mt-2">
            We have received your request for this resort. The manager will be in touch with you shortly!
          </p>
        </div>
      )}
    </div>
  );
};