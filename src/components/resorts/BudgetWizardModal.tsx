'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PricingTier,
  CalendarRule,
  SelectedItem,
  calculateQuoteResults,
  QuoteCalculationResult,
} from '@/lib/pricing';

interface BudgetWizardModalProps {
  isOpen: boolean;
  resortId: string;
  resortName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  masterCatalog: any[];
  pricingTiers: PricingTier[];
  calendarRules: CalendarRule[];
  dbDataGlobal: Record<string, any>;
  resortPlannersPricing: Record<string, any>[];
  plannerProfiles: Record<string, any>;
  onClose: () => void;
  onCalculateComplete: (result: QuoteCalculationResult, items: SelectedItem[]) => void;
}

export const BudgetWizardModal: React.FC<BudgetWizardModalProps> = ({
  isOpen,
  checkIn,
  checkOut,
  guests,
  masterCatalog = [],
  pricingTiers = [],
  calendarRules = [],
  dbDataGlobal = {},
  resortPlannersPricing = [],
  plannerProfiles = {},
  onClose,
  onCalculateComplete,
}) => {
  const [step, setStep] = useState(2); // Step 2 = Select Events, Step 3 = General, Step 4+ = Event details
  const [selectedEventIndexes, setSelectedEventIndexes] = useState<number[]>([]);
  const [selections, setSelections] = useState<Record<string, { checked: boolean; qty: number }>>({});
  const [itemModalDoc, setItemModalDoc] = useState<{
    title: string;
    desc: string;
    rule: string;
    thumb: string;
  } | null>(null);

  // FIX 4: Ref for auto-scrolling to top on step transition
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(2);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // FIX 4: Automatically scroll body container to top whenever step changes
  useEffect(() => {
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [step]);

  if (!isOpen) return null;

  // FIX 3: Sort selected indices numerically so events ALWAYS follow database sequence order
  const sortedSelectedEventIndexes = [...selectedEventIndexes].sort((a, b) => a - b);
  const selectedEvents = sortedSelectedEventIndexes.map((i) => masterCatalog[i]).filter(Boolean);
  const totalSteps = 3 + (selectedEvents.length || 1);

  const toggleEventSelect = (index: number) => {
    setSelectedEventIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCardToggle = (itemId: string, rule: string) => {
    setSelections((prev) => {
      const current = prev[itemId] || { checked: false, qty: 0 };
      const newChecked = !current.checked;
      return {
        ...prev,
        [itemId]: { checked: newChecked, qty: newChecked ? 1 : 0 },
      };
    });
  };

  const handleCardQtyChange = (itemId: string, delta: number) => {
    setSelections((prev) => {
      const current = prev[itemId] || { checked: false, qty: 0 };
      const newQty = Math.max(0, current.qty + delta);
      return {
        ...prev,
        [itemId]: { checked: newQty > 0, qty: newQty },
      };
    });
  };

  const renderSmartCard = (item: any, categoryName: string) => {
    if (!item || !item.name) return null;

    const ruleStr = (item.pricingRule || item.rule || '').toLowerCase();
    const needsQty =
      ruleStr.includes('qty') || ruleStr.includes('quant') || ruleStr.includes('unit');

    const sel = selections[item.id] || { checked: false, qty: 0 };
    const isChecked = sel.checked || sel.qty > 0;

    const borderClass = isChecked ? 'border-[#6B0D24]' : 'border-gray-200';
    const checkBgClass = isChecked ? 'bg-[#6B0D24] border-[#6B0D24]' : 'bg-black/30 border-white';

    const thumb = item.thumbnail || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=300&h=200';
    const desc = item.description || 'No description provided for this element.';

    if (needsQty) {
      return (
        <div
          key={item.id}
          className={`block relative bg-white border ${borderClass} rounded-2xl shadow-xs pb-3 select-none flex flex-col h-full transition-all`}
        >
          {/* Card Thumbnail Header */}
          <div className="h-24 w-full bg-gray-100 relative rounded-t-2xl overflow-hidden mb-2 shrink-0">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <i className="ph-fill ph-image text-3xl" />
              </div>
            )}

            {/* INFO ICON BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setItemModalDoc({ title: item.name, desc, rule: ruleStr, thumb });
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#6B0D24] w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-30"
              title="View Item Description"
            >
              <i className="ph-fill ph-info text-xs" />
            </button>

            <div
              className={`absolute inset-0 bg-[#6B0D24]/10 transition-opacity ${
                isChecked ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          <div className="px-2.5 flex-1 flex flex-col">
            <h5 className="font-bold text-gray-900 text-xs leading-tight mb-1" title={item.name}>
              {item.name}
            </h5>
            <span className="text-[8px] font-bold text-[#6B0D24] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#6B0D24]/10 uppercase tracking-wider self-start">
              {(item.pricingRule || item.rule || '').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="mt-auto px-2.5 pt-2">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-1 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Qty
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCardQtyChange(item.id, -1)}
                  className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold">{sel.qty || 0}</span>
                <button
                  type="button"
                  onClick={() => handleCardQtyChange(item.id, 1)}
                  className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        onClick={() => handleCardToggle(item.id, item.pricingRule)}
        className={`relative bg-white border ${borderClass} rounded-2xl cursor-pointer hover:border-[#6B0D24]/40 transition-all shadow-xs pb-3 select-none flex flex-col h-full`}
      >
        {/* Checkmark Badge */}
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded-md border ${checkBgClass} flex items-center justify-center z-20`}
        >
          <i
            className={`ph-bold ph-check text-white text-[10px] ${
              isChecked ? 'opacity-100' : 'opacity-0'
            } transition-opacity`}
          />
        </div>

        {/* Card Thumbnail Header */}
        <div className="h-24 w-full bg-gray-100 relative rounded-t-2xl overflow-hidden mb-2 shrink-0">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <i className="ph-fill ph-image text-3xl" />
            </div>
          )}

          {/* INFO ICON BUTTON */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setItemModalDoc({ title: item.name, desc, rule: ruleStr, thumb });
            }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#6B0D24] w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110 z-30"
            title="View Item Description"
          >
            <i className="ph-fill ph-info text-xs" />
          </button>

          <div
            className={`absolute inset-0 bg-[#6B0D24]/10 transition-opacity ${
              isChecked ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="px-2.5 flex-1 flex flex-col">
          <h5 className="font-bold text-gray-900 text-xs leading-tight mb-1" title={item.name}>
            {item.name}
          </h5>
          <span className="text-[8px] font-bold text-[#6B0D24] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#6B0D24]/10 uppercase tracking-wider self-start">
            {(item.pricingRule || item.rule || '').replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    );
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (selectedEventIndexes.length === 0) {
        alert('⚠️ Please select at least 1 event to continue.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step >= 4) {
      if (step < totalSteps) {
        setStep((prev) => prev + 1);
      } else {
        // Final Step: Execute calculation
        const selectedItemsList: SelectedItem[] = [];

        masterCatalog.forEach((group) => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach((item: any) => {
              const subItems = item.items || [item];
              subItems.forEach((sub: any) => {
                const state = selections[sub.id];
                if (state && (state.checked || state.qty > 0)) {
                  selectedItemsList.push({
                    id: sub.id,
                    name: sub.name || 'Selected Element',
                    qty: state.qty || 1,
                    rule: sub.pricingRule || sub.rule || 'flat',
                    category: group.name || 'GENERAL REQUIREMENTS',
                  });
                }
              });
            });
          }
        });

        const calculationResult = calculateQuoteResults({
          checkInVal: checkIn,
          checkOutVal: checkOut,
          guests,
          eventsCount: selectedEvents.length || 1,
          pricingTiers,
          calendarRules,
          dbDataGlobal,
          resortPlannersPricing,
          plannerProfiles,
          selectedItems: selectedItemsList,
        });

        onCalculateComplete(calculationResult, selectedItemsList);
        onClose();
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      onClose();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100005] bg-white flex flex-col h-[100dvh] w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 p-4 md:px-8 flex justify-between items-center shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] flex items-center justify-center text-[#6B0D24]">
            <i className="ph-bold ph-calculator text-xl"></i>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-gray-900 leading-tight">
              Customize Wedding Budget
            </h3>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">
              {step === 2
                ? 'Step 2: Select Events'
                : step === 3
                ? 'Step 3: General Requirements'
                : `Event ${step - 3} of ${selectedEvents.length}: ${selectedEvents[step - 4]?.name || ''}`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center font-bold"
        >
          <i className="ph-bold ph-x text-xl"></i>
        </button>
      </div>

      {/* Scrollable Body (with ref for auto-scrolling to top) */}
      <div
        ref={scrollBodyRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col"
      >
        {/* FIX 1: Step 2 Vertically Centered & Compacted */}
        {step === 2 && (
          <div className="my-auto max-w-2xl mx-auto w-full py-4">
            <h4 className="text-base md:text-xl font-black text-gray-900 mb-1 text-center">
              Select Your Planned Functions
            </h4>
            <p className="text-xs text-gray-400 mb-6 font-medium text-center">
              Choose functions you plan to host (minimum 1 required).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterCatalog.map((group, idx) => {
                if (idx === 0 || group.name?.toLowerCase().includes('general')) return null;
                const isSelected = selectedEventIndexes.includes(idx);
                return (
                  /* FIX 2: Full Card Click Selection */
                  <div
                    key={group.name + idx}
                    onClick={() => toggleEventSelect(idx)}
                    className={`flex items-center gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-[#6B0D24] bg-[#FAF6F0] shadow-xs'
                        : 'border-gray-200 hover:border-[#6B0D24] bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-5 h-5 text-[#6B0D24] rounded border-gray-300 pointer-events-none"
                    />
                    <span className="font-bold text-gray-900 text-xs md:text-sm">
                      {group.name || 'Unnamed Event'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="text-base md:text-lg font-black text-gray-900 mb-1">
              General Requirements
            </h4>
            <p className="text-xs text-gray-400 mb-5 font-medium">
              Logistics, Sound, Stage & Base Decor requirements.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {masterCatalog[0]?.items?.map((item: any) => {
                const subItems = item.items || [item];
                return subItems.map((sub: any) => renderSmartCard(sub, 'General'));
              })}
            </div>
          </div>
        )}

        {step >= 4 && (
          <div>
            <div className="mb-4">
              <h4 className="text-base md:text-lg font-black text-[#6B0D24] flex items-center gap-2 border-b border-gray-100 pb-2">
                <i className="ph-fill ph-tent text-[#C5A059]"></i>{' '}
                {selectedEvents[step - 4]?.name || 'Event Setup'} ({step - 3} of {selectedEvents.length})
              </h4>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Select custom elements for this specific function.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedEvents[step - 4]?.items?.map((item: any) => {
                const subItems = item.items || [item];
                return subItems.map((sub: any) =>
                  renderSmartCard(sub, selectedEvents[step - 4]?.name || 'Event')
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
<div className="bg-white border-t border-gray-100 p-4 pb-8 md:pb-10 md:px-8 shrink-0 shadow-lg z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrevStep}
            className="text-xs md:text-sm font-bold text-gray-600 hover:text-[#6B0D24] px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <i className="ph-bold ph-caret-left text-base"></i> Back
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="bg-[#6B0D24] text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:bg-[#520a1a] transition-all flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider ml-auto"
          >
            <span>{step === totalSteps ? 'Calculate Budget' : 'Continue'}</span>
            <i
              className={`ph-bold ${
                step === totalSteps ? 'ph-magic-wand' : 'ph-caret-right'
              } text-base`}
            ></i>
          </button>
        </div>
      </div>

      {/* ITEM DESCRIPTION MODAL OVERLAY */}
      {itemModalDoc && (
        <div className="fixed inset-0 z-[100010] bg-gray-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-56 bg-gray-100 shrink-0">
              <img src={itemModalDoc.thumb} alt={itemModalDoc.title} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setItemModalDoc(null)}
                className="absolute top-4 right-4 bg-white/90 text-gray-900 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white shadow-md transition"
              >
                <i className="ph-bold ph-x font-bold text-lg"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{itemModalDoc.title}</h3>
              <span className="inline-block bg-[#FAF6F0] text-[#6B0D24] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4 border border-[#6B0D24]/10">
                Pricing Rule: {itemModalDoc.rule.replace(/_/g, ' ')}
              </span>
              <p className="text-gray-600 text-sm leading-relaxed">{itemModalDoc.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};