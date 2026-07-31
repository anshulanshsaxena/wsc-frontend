import React from 'react';

interface QuoteSummaryCardProps {
  guests: number;
  dateStr: string;
  totalAmount: number;
  visible?: boolean;
}

export const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  guests = 150,
  dateStr = '...',
  totalAmount = 0,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-[#6B0D24] to-gray-900 rounded-3xl p-6 shadow-2xl mb-6 text-white border border-[#6B0D24]/30">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">
            <i className="ph-fill ph-check-circle text-sm text-[#FAF6F0]"></i> Quote Active
          </div>
          <h3 className="text-xl font-black">Est. Wedding Budget</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-medium">Guests</p>
          <p className="font-bold text-lg">
            <span>{guests}</span>
          </p>
        </div>
      </div>

      <div className="bg-white/10 rounded-2xl p-5 flex justify-between items-center backdrop-blur-md border border-white/10">
        <span className="text-white/90 font-medium text-sm">
          Est. Food & Stay <br />
          <span className="text-[10px] text-gray-400">{dateStr}</span>
        </span>
        <span className="text-3xl font-black text-white tracking-tight">
          ₹{totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};