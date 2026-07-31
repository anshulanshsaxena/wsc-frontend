'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SandboxDrawerProps {
  sandboxDoc: any | null;
  onClose: () => void;
  onSaveComplete: () => void;
}

export default function SandboxDrawer({
  sandboxDoc,
  onClose,
  onSaveComplete,
}: SandboxDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dynamic parameters fetched from Firestore
  const [resortData, setResortData] = useState<any>(null);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [basePrice, setBasePrice] = useState<number>(8500);
  const [resortPlannersPricing, setResortPlannersPricing] = useState<any[]>([]);

  // Interactive slider & checklist state
  const [guests, setGuests] = useState<number>(150);
  const [days, setDays] = useState<number>(1);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Initialize data on mount when sandboxDoc changes
  useEffect(() => {
    if (!sandboxDoc) return;

    let isMounted = true;
    setLoading(true);

    // Populate initial state from saved budget document
    setGuests(sandboxDoc.guests || 150);
    setDays(sandboxDoc.days || 1);
    setSelectedItems(
      sandboxDoc.selectedItems ? JSON.parse(JSON.stringify(sandboxDoc.selectedItems)) : []
    );

    const fetchDynamicParams = async () => {
      try {
        const [resSnap, schemaSnapRes, pricingSnap] = await Promise.all([
          getDoc(doc(db, 'resort_data', sandboxDoc.resortId)),
          getDoc(doc(db, 'schemas', 'resort_schema')),
          getDocs(
            query(
              collection(db, 'resort_planner_pricing'),
              where('resortId', '==', sandboxDoc.resortId)
            )
          ),
        ]);

        if (!isMounted) return;

        if (resSnap.exists()) {
          const rData = resSnap.data();
          setResortData(rData);

          // Extract pricing tiers from schema
          const extractedTiers: any[] = [];
          let extractedBasePrice = 8500;

          if (schemaSnapRes.exists()) {
            const schemaStructure = schemaSnapRes.data().structure || [];

            const extractTiers = (nodes: any[]) => {
              if (!Array.isArray(nodes)) return;
              nodes.forEach((node) => {
                if (node.type === 'subcategory' && node.items) {
                  let minId: string | undefined;
                  let maxId: string | undefined;
                  let priceId: string | undefined;

                  node.items.forEach((sub: any) => {
                    if (sub.id === 'cond_min_guest' || sub.calcTag === 'cond_min_guest')
                      minId = sub.id;
                    if (sub.id === 'cond_max_guest' || sub.calcTag === 'cond_max_guest')
                      maxId = sub.id;
                    if (sub.id === 'calc_base_price' || sub.calcTag === 'calc_base_price')
                      priceId = sub.id;
                  });

                  if (minId && maxId && priceId) {
                    Object.keys(rData).forEach((key) => {
                      if (key.startsWith(priceId!)) {
                        const suffix = key.replace(priceId!, '');
                        extractedTiers.push({
                          min: Number(rData[minId + suffix] || 0),
                          max: Number(rData[maxId + suffix] || 999999),
                          price: Number(rData[priceId + suffix] || 0),
                        });
                      }
                    });
                  }
                }
                if (node.items) extractTiers(node.items);
              });
            };

            extractTiers(schemaStructure);
            if (extractedTiers.length > 0) {
              extractedBasePrice = Math.min(...extractedTiers.map((t) => t.price));
            }
          }

          setPricingTiers(extractedTiers);
          setBasePrice(extractedBasePrice);
        }

        const plannersData: any[] = [];
        pricingSnap.forEach((d) => plannersData.push(d.data()));
        setResortPlannersPricing(plannersData);
      } catch (err) {
        console.error('Error fetching sandbox parameters:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDynamicParams();

    return () => {
      isMounted = false;
    };
  }, [sandboxDoc]);

  // LIVE CALCULATION ENGINE (Exact Production Algorithm)
  const calculationResult = useMemo(() => {
    if (!sandboxDoc || !resortData)
      return { cheapestTotal: 0, updatedQuotes: [] };

    let activeRate = basePrice;
    if (pricingTiers && pricingTiers.length > 0) {
      const matchingTier = pricingTiers.find(
        (t) => guests >= t.min && guests <= t.max
      );
      if (matchingTier) activeRate = matchingTier.price;
    }

    let checkInDateStr = sandboxDoc.checkInDate;
    if (!checkInDateStr || checkInDateStr === 'Not Selected') {
      const today = new Date();
      checkInDateStr = today.toISOString().split('T')[0];
    }
    const checkIn = new Date(checkInDateStr + 'T00:00:00');

    const calendarRules = resortData.core_calendar || [];
    let totalResortStayCost = 0;

    for (let i = 0; i < days; i++) {
      let dateObj = new Date(checkIn);
      dateObj.setDate(checkIn.getDate() + i);
      let finalDaily = activeRate;

      calendarRules.forEach((rule: any) => {
        if (rule.dateType === 'range') {
          const sD = new Date(rule.startDate);
          const eD = new Date(rule.endDate);
          sD.setHours(0, 0, 0, 0);
          eD.setHours(0, 0, 0, 0);
          if (
            dateObj >= sD &&
            dateObj <= eD &&
            rule.adjustmentType === 'discount_percent'
          ) {
            finalDaily = finalDaily - finalDaily * (parseFloat(rule.value) / 100);
          }
        }
      });
      totalResortStayCost += finalDaily * guests;
    }

    let rawFlatFee = resortData['id_8rypjw0pr'] || '0';
    let cleanFlatFee = rawFlatFee.toString().replace(/,/g, '').replace(/[^0-9.]/g, '');
    let resortFlatFee = Number(cleanFlatFee) || 0;

    let finalResortCost = totalResortStayCost + resortFlatFee;
    let computedCheapestTotal = Infinity;

    const rawQuotes = sandboxDoc.quotes || [];
    const updatedQuotes = rawQuotes.map((quote: any) => {
      const plannerId = quote.plannerId || quote.planner_data?.id;
      const pricingData = resortPlannersPricing.find(
        (p) => p.plannerId === plannerId || p.planner_data?.id === plannerId
      );

      let finalPlannerCost = 0;

      if (pricingData) {
        const eventsCount = sandboxDoc.functions || 1;

        finalPlannerCost += Number(pricingData.core_base_decor_3_events) || 0;
        if (eventsCount > 3) {
          finalPlannerCost +=
            (eventsCount - 3) * (Number(pricingData.core_addon_decor_per_event) || 0);
        }

        selectedItems.forEach((item: any) => {
          const itemId = item.id;
          const ruleStr = (item.rule || item.pricingRule || '').toLowerCase();
          const itemPrice = parseFloat(pricingData[itemId]) || 0;
          const qty = item.qty || 0;

          if (qty > 0) {
            if (ruleStr.includes('flat') || ruleStr.includes('bundle')) {
              finalPlannerCost += itemPrice;
            } else if (ruleStr === 'per_person') {
              finalPlannerCost += itemPrice * guests;
            } else if (ruleStr === 'per_person_event') {
              finalPlannerCost += itemPrice * guests * eventsCount;
            } else if (ruleStr === 'per_person_day') {
              finalPlannerCost += itemPrice * guests * days;
            } else if (ruleStr.includes('qty') && ruleStr.includes('event')) {
              finalPlannerCost += itemPrice * qty * eventsCount;
            } else if (ruleStr.includes('qty') && ruleStr.includes('day')) {
              finalPlannerCost += itemPrice * qty * days;
            } else if (
              ruleStr.includes('qty') ||
              ruleStr.includes('quant') ||
              ruleStr.includes('unit')
            ) {
              finalPlannerCost += itemPrice * qty;
            } else if (ruleStr.includes('item') && !ruleStr.includes('person')) {
              finalPlannerCost += itemPrice * qty;
            }
          }
        });
      } else {
        const prevGuests = sandboxDoc.guests || 150;
        const guestFactor = guests / (prevGuests || 1);
        finalPlannerCost = Math.round((quote.plannerTotal || 0) * guestFactor);
      }

      const sandboxResortTotal = Math.round(finalResortCost);
      const sandboxPlannerTotal = Math.round(finalPlannerCost);
      const sandboxGrandTotal = sandboxResortTotal + sandboxPlannerTotal;

      if (sandboxGrandTotal < computedCheapestTotal) {
        computedCheapestTotal = sandboxGrandTotal;
      }

      return {
        ...quote,
        sandboxResortTotal,
        sandboxPlannerTotal,
        sandboxGrandTotal,
      };
    });

    return {
      cheapestTotal: computedCheapestTotal === Infinity ? 0 : computedCheapestTotal,
      updatedQuotes,
    };
  }, [
    sandboxDoc,
    resortData,
    pricingTiers,
    basePrice,
    resortPlannersPricing,
    guests,
    days,
    selectedItems,
  ]);

  // Group Selected Items by Category
  const groupedItems = useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) return {};
    const groups: Record<string, { item: any; originalIndex: number }[]> = {};

    selectedItems.forEach((item, index) => {
      const cat = item.category || 'General Elements';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ item, originalIndex: index });
    });

    // Sort General Elements first
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower.includes('general')) return -1;
      if (bLower.includes('general')) return 1;
      return aLower.localeCompare(bLower);
    });

    const sortedGroups: Record<string, { item: any; originalIndex: number }[]> = {};
    sortedKeys.forEach((key) => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [selectedItems]);

  // Quantity Change Handler
  const handleItemQtyChange = (index: number, delta: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        let current = parseInt(updated[index].qty) || 0;
        current = Math.max(0, current + delta);
        updated[index] = { ...updated[index], qty: current };
      }
      return updated;
    });
  };

  // Toggle Checkbox Handler
  const handleToggleItem = (index: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], qty: checked ? 1 : 0 };
      }
      return updated;
    });
  };

  // Save Modified Parameters to Firestore
  const handleSave = async () => {
    if (!sandboxDoc) return;
    setSaving(true);

    try {
      const finalQuotes = calculationResult.updatedQuotes.map((q: any) => ({
        plannerName: q.plannerName,
        instaUrl: q.instaUrl || '#',
        logoUrl: q.logoUrl,
        plannerImage: q.plannerImage,
        resortTotal: q.sandboxResortTotal || q.resortTotal,
        plannerTotal: q.sandboxPlannerTotal || q.plannerTotal,
        grandTotal: q.sandboxGrandTotal || q.grandTotal,
      }));

      const bRef = doc(db, 'saved_budgets', sandboxDoc.docId);
      await setDoc(
        bRef,
        {
          guests,
          days,
          selectedItems,
          quotes: finalQuotes,
        },
        { merge: true }
      );

      // Save click timestamp to localStorage
      try {
        const clicks = JSON.parse(localStorage.getItem('wsc_budget_clicks') || '{}');
        clicks[sandboxDoc.docId] = Date.now();
        localStorage.setItem('wsc_budget_clicks', JSON.stringify(clicks));
      } catch (e) {}

      onSaveComplete();
      onClose();
    } catch (err) {
      console.error('Failed sandbox save:', err);
      alert('Error saving modified parameters.');
    } finally {
      setSaving(false);
    }
  };

  if (!sandboxDoc) return null;

  return (
    <div className="fixed inset-0 z-[20001] bg-gray-900/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <i className="ph-fill ph-sliders text-[#6B0D24]"></i> Live Estimator
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
              {sandboxDoc.resortName || 'Resort Budget Sandbox'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
          >
            <i className="ph-bold ph-x text-xl"></i>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <i className="ph-bold ph-spinner animate-spin text-4xl mb-3 text-[#6B0D24]"></i>
              <p className="font-bold text-sm">Loading dynamic parameters...</p>
            </div>
          ) : (
            <>
              {/* Sliders Configuration Card */}
              <div className="bg-stone-50 border border-stone-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                <p className="text-xs font-bold text-[#6B0D24] uppercase tracking-widest flex items-center gap-1">
                  <i className="ph-fill ph-sliders"></i> Configuration Variables
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Guest Count</span>
                      <span className="text-[#6B0D24]">{guests} Guests</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="600"
                      step="10"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 150)}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#6B0D24]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Celebration Days</span>
                      <span className="text-[#6B0D24]">{days} Days</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#6B0D24]"
                    />
                  </div>
                </div>
              </div>

              {/* Grouped Setup Items Checklist */}
              {Object.keys(groupedItems).length > 0 ? (
                Object.entries(groupedItems).map(([cat, itemsList]) => (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-[10px] font-black text-[#6B0D24] uppercase tracking-widest border-b border-stone-200 pb-2">
                      {cat}
                    </h4>

                    <div className="space-y-2">
                      {itemsList.map(({ item, originalIndex }) => {
                        const ruleLabel = (
                          item.rule ||
                          item.pricingRule ||
                          'flat fee'
                        )
                          .replace(/_/g, ' ')
                          .toLowerCase();

                        const isQty =
                          ruleLabel.includes('qty') ||
                          ruleLabel.includes('quant') ||
                          ruleLabel.includes('unit') ||
                          (ruleLabel.includes('item') &&
                            !ruleLabel.includes('person') &&
                            !ruleLabel.includes('flat'));

                        return (
                          <div
                            key={item.id || originalIndex}
                            className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition p-3.5 rounded-xl border border-gray-100"
                          >
                            <div className="mr-2">
                              <span
                                className={`font-bold text-gray-800 text-xs block ${
                                  item.qty === 0 ? 'line-through text-gray-400' : ''
                                }`}
                              >
                                {item.name || 'Custom Element'}
                              </span>
                              <span className="text-[9px] font-bold text-[#6B0D24] bg-[#6B0D24]/5 border border-[#6B0D24]/10 px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
                                {ruleLabel}
                              </span>
                            </div>

                            <div className="shrink-0">
                              {isQty ? (
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-lg">
                                  <button
                                    onClick={() => handleItemQtyChange(originalIndex, -1)}
                                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold text-gray-900 w-6 text-center">
                                    {item.qty || 0}
                                  </span>
                                  <button
                                    onClick={() => handleItemQtyChange(originalIndex, 1)}
                                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={item.qty > 0}
                                  onChange={(e) =>
                                    handleToggleItem(originalIndex, e.target.checked)
                                  }
                                  className="w-5 h-5 text-[#6B0D24] rounded border-gray-300 cursor-pointer accent-[#6B0D24]"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <i className="ph-fill ph-package text-2xl"></i>
                  </div>
                  <p className="font-bold text-gray-700 text-xs">Base Venue Calculation</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Live Calculated Amount & Save Action */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500">
              Live Estimated Budget
            </span>
            <span className="text-2xl font-black text-[#6B0D24]">
              ₹ {calculationResult.cheapestTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full bg-[#6B0D24] hover:bg-[#6B0D24]/90 text-white font-black py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <i className="ph-bold ph-spinner animate-spin text-lg"></i> Saving...
              </>
            ) : (
              <>
                <i className="ph-bold ph-floppy-disk"></i> Save Changes to Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}