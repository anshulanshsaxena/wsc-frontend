'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface QuickLoginModalProps {
  isOpen: boolean;
  mode?: 'favorite' | 'budget';
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const QuickLoginModal: React.FC<QuickLoginModalProps> = ({
  isOpen,
  mode = 'favorite',
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setName('');
      setPhone('');
      setOtp('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBudgetMode = mode === 'budget';

  const handleSendOtp = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : '+91' + phone.trim();

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'quick-recaptcha-container', {
          size: 'invisible',
        });
      }

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );
      confirmationResultRef.current = result;
      setStep(2);
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please check the mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 6) {
      alert('Enter valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      if (confirmationResultRef.current) {
        const result = await confirmationResultRef.current.confirm(otp);
        const user = result.user;

        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              name: name.trim(),
              phone: user.phoneNumber,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          // Non-blocking error
        }

        onSuccess(user);
        onClose();
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-[fadeIn_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <i className="ph-bold ph-x text-lg"></i>
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
            <i
              className={`ph-fill ${
                isBudgetMode ? 'ph-calculator text-[#6B0D24]' : 'ph-heart text-rose-500'
              } text-2xl`}
            ></i>
          </div>

          <h3 className="text-2xl font-black text-gray-900 mb-2">
            {isBudgetMode ? 'Calculate & Save Budget' : 'Save this resort'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {isBudgetMode
              ? 'Enter your mobile number to view and save your custom budget.'
              : 'Enter your details to log in and save to favorites.'}
          </p>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#6B0D24] focus:border-[#6B0D24] block p-3 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#6B0D24] focus:border-[#6B0D24] block p-3 outline-none transition"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-white bg-[#6B0D24] hover:bg-[#520a1a] font-bold rounded-xl text-sm px-5 py-3.5 text-center transition shadow-md shadow-[#6B0D24]/20 mt-4 disabled:opacity-70"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl mb-4 border border-blue-100">
                OTP sent to <span className="font-bold">{phone}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Enter 6-digit OTP
                </label>
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-center tracking-[0.5em] text-lg font-bold rounded-xl focus:ring-[#6B0D24] focus:border-[#6B0D24] block p-3 outline-none transition"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full text-white bg-[#C5A059] hover:bg-[#a37f3b] font-bold rounded-xl text-sm px-5 py-3.5 text-center transition shadow-md shadow-[#C5A059]/20 mt-4 disabled:opacity-70"
              >
                {loading
                  ? 'Verifying...'
                  : isBudgetMode
                  ? 'Verify & View Budget'
                  : 'Verify & Save Favorite'}
              </button>
            </div>
          )}

          <div id="quick-recaptcha-container" />
        </div>
      </div>
    </div>
  );
};