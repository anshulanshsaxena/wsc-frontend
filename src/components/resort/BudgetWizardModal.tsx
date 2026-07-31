"use client";

import React, { useState, useEffect } from "react";
import {
  CatalogGroup,
  WizardItem,
  SelectedItemState,
  fetchMasterCatalog,
  fetchPlannerPricing,
  calculateWeddingQuotes,
  saveBudgetToFirestore,
} from "@/lib/wizardEngine";
import { useFavorites } from "@/context/FavoritesContext";
import { useRouter } from "next/navigation";

interface BudgetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  resort: any;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  onBudgetCalculated?: (quotes: any[]) => void;
}

export default function BudgetWizardModal({
  isOpen,
  onClose,
  resort,
  checkInDate,
  checkOutDate,
  guestsCount,
  onBudgetCalculated = () => {},
}: BudgetWizardModalProps) {
  const router = useRouter();
  const { user, setIsAuthModalOpen, setPendingBudgetSave } = useFavorites();

  const [step, setStep] = useState(2); // Step 2: Events, Step 3: General, Step 4: Event Setup
  const [catalog, setCatalog] = useState<CatalogGroup[]>([]);
  const [selectedEventIndices, setSelectedEventIndices] = useState<number[]>([]);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);

  const [itemSelections, setItemSelections] = useState<Record<string, SelectedItemState>>({});
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [plannerProfiles, setPlannerProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function initWizard() {
      setLoading(true);
      const cat = await fetchMasterCatalog();
      setCatalog(cat);

      if (resort?.id) {
        const { pricingList: pList, plannerProfiles: pProfiles } = await fetchPlannerPricing(resort.id);
        setPricingList(pList);
        setPlannerProfiles(pProfiles);
      }
      setLoading(false);
    }

    initWizard();
  }, [isOpen, resort?.id]);

  if (!isOpen) return null;

  const toggleEventSelect = (originalIdx: number) => {
    if (selectedEventIndices.includes(originalIdx)) {
      setSelectedEventIndices(selectedEventIndices.filter((i) => i !== originalIdx));
    } else {
      setSelectedEventIndices([...selectedEventIndices, originalIdx]);
    }
  };

  const handleCardCheckChange = (itemId: string, checked: boolean) => {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: { checked, qty: checked ? 1 : 0 },
    }));
  };

  const handleQtyChange = (itemId: string, delta: number) => {
    setItemSelections((prev) => {
      const currentQty = prev[itemId]?.qty || 0;
      const newQty = Math.max(0, currentQty + delta);
      return {
        ...prev,
        [itemId]: { checked: newQty > 0, qty: newQty },
      };
    });
  };

  const flattenAllCatalogItems = (): WizardItem[] => {
    const list: WizardItem[] = [];
    const extract = (arr: WizardItem[]) => {
      arr.forEach((item) => {
        list.push(item);
        if (item.items) extract(item.items);
      });
    };
    catalog.forEach((group) => extract(group.items || []));
    return list;
  };

  const handleNextStep = async () => {
    if (step === 2) {
      if (selectedEventIndices.length === 0) {
        alert("Please select at least 1 event to continue.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      setCurrentEventIdx(0);
    } else if (step === 4) {
      if (currentEventIdx < selectedEventIndices.length - 1) {
        setCurrentEventIdx((prev) => prev + 1);
      } else {
        // FINAL STEP: Calculate Quotes & Selected Items
        const catalogItems = flattenAllCatalogItems();
        const { quotes, selectedItems } = calculateWeddingQuotes(
          resort,
          checkInDate,
          checkOutDate,
          guestsCount,
          selectedEventIndices.length,
          itemSelections,
          catalogItems,
          pricingList,
          plannerProfiles
        );

        if (onBudgetCalculated) {
          onBudgetCalculated(quotes);
        }

        const budgetData = {
          resortId: resort.id,
          resortName: resort._recordName || resort.core_name || "Resort",
          resortLocation: resort.core_location || resort.location || "India",
          guests: guestsCount,
          days: 2,
          checkInDate,
          checkOutDate,
          rooms: parseInt(resort.core_rooms || "0", 10),
          functions: selectedEventIndices.length,
          selectedItems,
          quotes,
        };

        if (user) {
          await saveBudgetToFirestore(
            user,
            resort.id,
            resort._recordName || resort.core_name || "Resort",
            resort.core_location || resort.location || "India",
            guestsCount,
            2,
            checkInDate,
            checkOutDate,
            parseInt(resort.core_rooms || "0", 10),
            selectedEventIndices.length,
            quotes,
            selectedItems
          );
          onClose();
          router.push("/user-profile");
        } else {
          setPendingBudgetSave(budgetData);
          onClose();
          setIsAuthModalOpen(true);
        }
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 3) setStep(2);
    else if (step === 4) {
      if (currentEventIdx > 0) setCurrentEventIdx((prev) => prev - 1);
      else setStep(3);
    }
  };

  const renderSmartCard = (item: WizardItem) => {
    const ruleStr = (item.pricingRule || "").toLowerCase();
    const needsQty = ruleStr.includes("qty") || ruleStr.includes("unit");
    const state = itemSelections[item.id] || { checked: false, qty: 0 };
    const isChecked = state.checked || state.qty > 0;

    return (
      <div
        key={item.id}
        className={`smart-card-wrapper relative bg-white border ${
          isChecked ? "border-[#6B0D24]" : "border-gray-200"
        } rounded-2xl p-2.5 shadow-xs flex flex-col justify-between h-full transition-all`}
      >
        <div className="h-20 w-full bg-gray-100 relative rounded-xl overflow-hidden mb-2">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <i className="ph-fill ph-image text-2xl"></i>
            </div>
          )}
        </div>

        <h5 className="font-bold text-gray-900 text-xs leading-tight mb-2 truncate" title={item.name}>
          {item.name}
        </h5>

        {needsQty ? (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-1 rounded-xl mt-auto">
            <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Qty</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQtyChange(item.id, -1)}
                className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-900">{state.qty}</span>
              <button
                type="button"
                onClick={() => handleQtyChange(item.id, 1)}
                className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-between cursor-pointer mt-auto">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Select</span>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleCardCheckChange(item.id, e.target.checked)}
              className="w-4 h-4 text-[#6B0D24] rounded border-gray-300 focus:ring-[#6B0D24] cursor-pointer"
            />
          </label>
        )}
      </div>
    );
  };

  const selectedEventGroup = catalog[selectedEventIndices[currentEventIdx]];

  return (
    <div id="budgetWizardModal" className="fixed inset-0 z-[100005] bg-white flex flex-col h-[100dvh] w-full overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 md:px-8 flex justify-between items-center shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] flex items-center justify-center text-[#6B0D24]">
            <i className="ph-bold ph-calculator text-xl"></i>
          </div>
          <div>
            <h3 id="wizModalTitle" className="text-sm md:text-base font-black text-gray-900 leading-tight">
              Customize Wedding Budget
            </h3>
            <p id="wizModalSubtitle" className="text-[10px] md:text-xs text-gray-400 font-medium">
              {step === 2 && "Step 2: Select Events"}
              {step === 3 && "Step 3: General Requirements"}
              {step === 4 && `Event ${currentEventIdx + 1} of ${selectedEventIndices.length}`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center font-bold cursor-pointer"
        >
          <i className="ph-bold ph-x text-xl"></i>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <i className="ph-bold ph-spinner animate-spin text-3xl text-[#6B0D24] mb-2" />
            <p className="text-xs font-bold text-gray-400">Loading master catalog...</p>
          </div>
        ) : (
          <>
            {/* STEP 2: Select Events (Excludes General Group) */}
            {step === 2 && (
              <div id="wizStep2">
                <h4 className="text-base md:text-lg font-black text-gray-900 mb-1">Select Your Events</h4>
                <p className="text-xs text-gray-400 mb-5 font-medium">
                  Choose functions you plan to host (minimum 1 required).
                </p>
                <div id="wizEventsContainer" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalog.map((group, originalIdx) => {
                    if (originalIdx === 0 || group.name?.toLowerCase().includes("general")) {
                      return null; // Exclude General Requirements from Step 2 event checkboxes!
                    }

                    const isChecked = selectedEventIndices.includes(originalIdx);

                    return (
                      <label
                        key={originalIdx}
                        onClick={() => toggleEventSelect(originalIdx)}
                        className={`flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer transition bg-white ${
                          isChecked ? "border-[#6B0D24] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#6B0D24]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-5 h-5 text-[#6B0D24] rounded border-gray-300"
                        />
                        <span className="font-bold text-gray-900 text-xs md:text-sm">
                          {group.name || `Event #${originalIdx + 1}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Mandatory General Requirements */}
            {step === 3 && (
              <div id="wizStep3">
                <h4 className="text-base md:text-lg font-black text-gray-900 mb-1">General Requirements</h4>
                <p className="text-xs text-gray-400 mb-5 font-medium">
                  Logistics, Sound, Stage & Base Decor requirements.
                </p>
                <div id="wizGeneralContainer" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(catalog[0]?.items || []).map((item) => renderSmartCard(item))}
                </div>
              </div>
            )}

            {/* STEP 4: Specific Event Setup */}
            {step === 4 && selectedEventGroup && (
              <div id="wizStep4">
                <h4 id="wizEventTitle" className="text-base md:text-lg font-black text-[#6B0D24] mb-1 flex items-center gap-2">
                  <i className="ph-fill ph-tent"></i> {selectedEventGroup.name}
                </h4>
                <p className="text-xs text-gray-400 mb-5 font-medium">
                  Select custom elements for this specific function.
                </p>
                <div id="wizSpecificContainer" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(selectedEventGroup.items || []).map((item) => renderSmartCard(item))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="bg-white border-t border-gray-100 p-4 md:px-8 shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrevStep}
            id="wizPrevBtn"
            className="text-xs md:text-sm font-bold text-gray-600 hover:text-[#6B0D24] px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ph-bold ph-caret-left text-base"></i> Back
          </button>

          <button
            onClick={handleNextStep}
            id="wizNextBtn"
            className="bg-[#6B0D24] text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:bg-[#520a1a] transition-all flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider ml-auto cursor-pointer"
          >
            <span>
              {step === 4 && currentEventIdx === selectedEventIndices.length - 1
                ? "Calculate Budget"
                : "Continue"}
            </span>{" "}
            <i className="ph-bold ph-caret-right text-base"></i>
          </button>
        </div>
      </div>
    </div>
  );
}