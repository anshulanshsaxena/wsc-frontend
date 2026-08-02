'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareSelections: string[]; // array of docIds
  budgets: any[];
}

export default function CompareModal({
  isOpen,
  onClose,
  compareSelections,
  budgets,
}: CompareModalProps) {
  const [schemaStructure, setSchemaStructure] = useState<any[]>([]);
  const [resortDetailsMap, setResortDetailsMap] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch resort_schema and selected resort_data documents dynamically
  useEffect(() => {
    if (!isOpen || compareSelections.length === 0) return;

    const fetchComparisonData = async () => {
      setLoadingDetails(true);
      try {
        // 1. Fetch Resort Schema Structure (Matches ResortDetailsDynamic)
        const schemaSnap = await getDoc(doc(db, 'schemas', 'resort_schema'));
        let schemaNodes: any[] = [];
        if (schemaSnap.exists()) {
          schemaNodes = schemaSnap.data().structure || [];
        }
        setSchemaStructure(schemaNodes);

        // 2. Fetch resort_data for selected budgets
        const selectedBudgets = budgets.filter((b) => compareSelections.includes(b.docId));
        const detailsMap: Record<string, any> = {};

        await Promise.all(
          selectedBudgets.map(async (b) => {
            if (!b.resortId) return;
            try {
              const resDoc = await getDoc(doc(db, 'resort_data', b.resortId));
              if (resDoc.exists()) {
                detailsMap[b.resortId] = resDoc.data();
              }
            } catch (e) {
              console.error('Error fetching compare resort detail:', e);
            }
          })
        );

        setResortDetailsMap(detailsMap);
      } catch (err) {
        console.error('Error fetching compare data:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchComparisonData();
  }, [isOpen, compareSelections, budgets]);

  // Extract active dynamic fields from schema that have values in at least one compared resort
  const activeDynamicFields = useMemo(() => {
    if (!schemaStructure || schemaStructure.length === 0) return [];
    const fieldsList: { id: string; name: string; fieldType: string }[] = [];

    const traverse = (node: any) => {
      if (!node) return;
      if (
        node.calcTag &&
        (node.calcTag.includes('minimum') ||
          node.calcTag.includes('maximum') ||
          node.calcTag.includes('multiply'))
      ) {
        return;
      }
      if (node.name && node.name.toLowerCase() === 'rates') return;
      if (node.id === 'id_8rypjw0pr' || node.calcTag === 'calc_flat_fee') return;

      // HIDE SPECIFIC FIELD IDs
      if (node.id === 'id_zs5fy1nq1' || node.id === 'id_z9l3ev1k1') return;

      if (node.type === 'field') {
        if (node.fieldType === 'image' || node.fieldType === 'image_grid') return;
        fieldsList.push({
          id: node.id,
          name: node.name || node.label || node.id,
          fieldType: node.fieldType,
        });
      }

      if (node.items && Array.isArray(node.items)) {
        node.items.forEach(traverse);
      }
    };

    schemaStructure.forEach(traverse);

    // Only keep fields that actually have a value in AT LEAST ONE compared resort
    const selectedBudgets = budgets.filter((b) => compareSelections.includes(b.docId));

    return fieldsList.filter((f) => {
      return selectedBudgets.some((b) => {
        const rd = resortDetailsMap[b.resortId] || {};
        const val = rd[f.id] || rd[`${f.id}_0`] || rd[`${f.id}_L`];
        return val !== undefined && val !== null && val !== '';
      });
    });
  }, [schemaStructure, resortDetailsMap, compareSelections, budgets]);

  // Helper: Format field value dynamically from resort_data
  const getFieldValue = (rd: any, field: { id: string; fieldType: string }): string => {
    if (!rd) return '—';
    let val = rd[field.id];
    if (val === undefined || val === null || val === '') {
      val = rd[`${field.id}_0`];
    }

    if (field.fieldType === 'dimension_2d') {
      const l = rd[`${field.id}_L`] || rd[`${field.id}_0_L`];
      const b = rd[`${field.id}_B`] || rd[`${field.id}_0_B`];
      if (l && b) val = `${l} ft x ${b} ft`;
    }

    if (val === undefined || val === null || val === '') return '—';
    return typeof val === 'string' ? val : String(val);
  };

  if (!isOpen || compareSelections.length === 0) return null;

  const selectedBudgets = budgets.filter((b) => compareSelections.includes(b.docId));

  return (
    <div className="fixed inset-0 z-[20000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] text-[#6B0D24] flex items-center justify-center font-black">
              <i className="ph-fill ph-columns text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                Dynamic Venue Spec Comparison
              </h3>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                Comparing {selectedBudgets.length} Selected Luxury Properties
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition shadow-sm shrink-0"
          >
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-x-auto flex-1 custom-scrollbar">
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <i className="ph-bold ph-spinner animate-spin text-4xl mb-3 text-[#6B0D24]"></i>
              <p className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Fetching Dynamic Resort Specs from Database...
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs md:text-sm">
              <thead>
                <tr>
                  <th className="p-4 bg-stone-100 font-black text-gray-900 border border-gray-200 uppercase tracking-wider text-[10px] w-52 shrink-0">
                    Property Specs
                  </th>
                  {selectedBudgets.map((b) => (
                    <th
                      key={b.docId}
                      className="p-4 bg-stone-50 font-black text-gray-900 border border-gray-200 text-center min-w-[260px]"
                    >
                      <span className="block text-base leading-tight">{b.resortName || 'Resort'}</span>
                      <span className="block text-xs text-[#6B0D24] font-bold mt-1">
                        <i className="ph-fill ph-map-pin"></i> {b.resortLocation || 'India'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. Visual Portfolio */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    Visual Portfolio
                  </td>
                  {selectedBudgets.map((b) => (
                    <td key={b.docId} className="p-4 border border-gray-200 text-center">
                      <img
                        src={b.resortImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'}
                        alt={b.resortName}
                        className="w-52 h-32 object-cover rounded-2xl mx-auto shadow-sm"
                      />
                    </td>
                  ))}
                </tr>

                {/* 2. Estd. Starting Budget */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    Estd. Grand Total
                  </td>
                  {selectedBudgets.map((b) => {
                    const sortedQuotes = [...(b.quotes || [])].sort(
                      (x: any, y: any) => (x.grandTotal || 0) - (y.grandTotal || 0)
                    );
                    const cheapest = sortedQuotes[0] || { grandTotal: 0, plannerName: 'Default' };
                    return (
                      <td key={b.docId} className="p-4 border border-gray-200 text-center">
                        <p className="text-xl font-black text-[#6B0D24]">
                          ₹ {(cheapest.grandTotal || 0).toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-gray-400 font-bold block mt-1 uppercase tracking-wider">
                          Lowest Quote: {cheapest.plannerName || 'WedSaaS Estimate'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Cost Split Breakdown */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    Cost Split Breakdown
                  </td>
                  {selectedBudgets.map((b) => {
                    const sortedQuotes = [...(b.quotes || [])].sort((x: any, y: any) => (x.grandTotal || 0) - (y.grandTotal || 0));
                    const cheapest = sortedQuotes[0] || { grandTotal: 0, resortTotal: 0, plannerTotal: 0 };
                    const grand = cheapest.grandTotal || 1;
                    const stay = cheapest.resortTotal || 0;
                    const decor = cheapest.plannerTotal || 0;
                    const stayPct = Math.round((stay / grand) * 100);
                    const decorPct = 100 - stayPct;

                    return (
                      <td key={b.docId} className="p-4 border border-gray-200 text-center">
                        <div className="space-y-1 max-w-[200px] mx-auto">
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                            <div className="bg-[#6B0D24] h-full" style={{ width: `${stayPct}%` }} />
                            <div className="bg-[#C5A059] h-full" style={{ width: `${decorPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-gray-600">
                            <span>Stay: ₹{stay.toLocaleString('en-IN')} ({stayPct}%)</span>
                            <span>Decor: ₹{decor.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Capacity & Duration */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    Capacity & Duration
                  </td>
                  {selectedBudgets.map((b) => (
                    <td key={b.docId} className="p-4 border border-gray-200 text-center font-bold text-gray-800">
                      <p className="text-sm">{b.guests || 150} Guests</p>
                      <p className="text-xs text-gray-500 font-medium">{b.days || 2} Days Celebration</p>
                    </td>
                  ))}
                </tr>

                {/* DYNAMIC SCHEMA FIELDS (Excluding id_zs5fy1nq1 & id_z9l3ev1k1) */}
                {activeDynamicFields.map((field) => (
                  <tr key={field.id}>
                    <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                      {field.name}
                    </td>
                    {selectedBudgets.map((b) => {
                      const rd = resortDetailsMap[b.resortId];
                      const valStr = getFieldValue(rd, field);
                      return (
                        <td
                          key={b.docId}
                          className="p-4 border border-gray-200 text-center text-xs font-medium text-gray-800 whitespace-pre-line break-words"
                        >
                          {valStr}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Selected Custom Setup Items */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    Selected Setup Items
                  </td>
                  {selectedBudgets.map((b) => (
                    <td key={b.docId} className="p-4 border border-gray-200 text-left vertical-top">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar text-xs">
                        {(b.selectedItems || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="font-bold text-gray-800">{item.name}</span>
                            <span className="text-[#6B0D24] font-black text-[10px] bg-[#6B0D24]/5 px-1.5 py-0.5 rounded">
                              x{item.qty || 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* View Full Property Action */}
                <tr>
                  <td className="p-4 font-black bg-stone-50/50 text-gray-800 border border-gray-200">
                    View Full Property
                  </td>
                  {selectedBudgets.map((b) => (
                    <td key={b.docId} className="p-4 border border-gray-200 text-center">
                      <Link
                        href={`/resort/${b.resortId}`}
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-1.5 bg-[#6B0D24] hover:bg-[#520a1a] text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
                      >
                        <span>View Details</span>
                        <i className="ph-bold ph-arrow-right"></i>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}