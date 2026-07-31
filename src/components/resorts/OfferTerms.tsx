import React from 'react';

export const OfferTerms: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-10 space-y-4">
      <h3 className="text-base font-black text-gray-900 flex items-center gap-2 mb-1">
        <i className="ph-bold ph-warning-circle text-[#780522]"></i> Terms & Conditions
      </h3>
      <ol className="list-decimal list-inside space-y-2.5 text-xs text-gray-600 font-medium leading-relaxed pl-1">
        <li>This Offer is subject to availability and is only valid for selected dates.</li>
        <li>
          Wedding Support Company has discrete power to terminate this offer at any time without any prior intimation.
        </li>
        <li>
          This offer can be availed only through Wedding Support Company and not directly from the resort.
        </li>
        <li>
          Wedding Support Company does not take any amount against the booking of the resort; during the process of availing this offer, the resort payment will be made directly to the resort by the customer.
        </li>
      </ol>
    </div>
  );
};