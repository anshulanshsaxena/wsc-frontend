'use client';

import React, { useState } from 'react';

interface ResortDetailsDynamicProps {
  dbData: Record<string, any>;
  schemaStructure: any[];
  resortName: string;
  resortLocation: string;
  description?: string;
  guests?: number;
  days?: number;
  startingPrice?: number;
  promoBudget?: number;
}

const SchemaFieldItem: React.FC<{
  node: any;
  val: any;
}> = ({ node, val }) => {
  const [expanded, setExpanded] = useState(false);

  if (val === undefined || val === null || val === '') return null;

  const isLongText = typeof val === 'string' && val.length > 150;
  const isLineBreakNeeded =
    node.name === 'Room Category Distribution' || node.name === 'Room Catagories Distribution';

  const formattedVal = typeof val === 'string' ? val : String(val);

  if (isLongText) {
    const shortText = formattedVal.substring(0, 150) + '...';
    return (
      <div className="flex flex-col py-3 border-b border-gray-100 last:border-0 w-full">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {node.name || node.label}
        </span>
        <div className="relative w-full">
          <span className="text-sm font-medium text-gray-700 leading-relaxed block w-full whitespace-pre-line">
            {expanded ? formattedVal : shortText}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#6B0D24] hover:text-[#520a1a] text-xs font-bold mt-2 focus:outline-none transition-colors w-max uppercase tracking-wider cursor-pointer"
          >
            {expanded ? 'Read Less' : 'Read More'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-1 border-b border-gray-100 last:border-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)]">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {node.name || node.label}
      </span>
      <span
        className={`text-sm font-semibold text-gray-900 break-words ${
          isLineBreakNeeded ? 'leading-relaxed font-medium text-gray-700 block whitespace-pre-line' : ''
        }`}
      >
        {formattedVal}
      </span>
    </div>
  );
};

export const ResortDetailsDynamic: React.FC<ResortDetailsDynamicProps> = ({
  dbData = {},
  schemaStructure = [],
  resortName,
  resortLocation,
  description,
  guests = 150,
  days = 2,
  startingPrice = 0,
  promoBudget = 0,
}) => {
  const [descExpanded, setDescExpanded] = useState(false);

  // Calculate estimated budget
  const calculatedBudget =
    promoBudget > 0
      ? promoBudget
      : startingPrice > 0
      ? startingPrice * guests * days
      : 0;

  // Extract Pet & Vendor Policies from dbData
  const petPolicy =
    dbData['id_lsnhe6a1s_0'] || dbData['id_lsnhe6a1s'] || dbData.core_pet_policy || 'not specified';
  const vendorPolicy =
    dbData['id_9r9c8ufz7_0'] || dbData['id_9r9c8ufz7'] || dbData.core_vendor_policy || 'allowed';

  const renderNode = (node: any, currentSuffix: string = ''): React.ReactNode => {
    if (
      node.calcTag &&
      (node.calcTag.includes('minimum') ||
        node.calcTag.includes('maximum') ||
        node.calcTag.includes('multiply'))
    ) {
      return null;
    }
    if (node.name && node.name.toLowerCase() === 'rates') return null;
    if (node.id === 'id_8rypjw0pr' || node.calcTag === 'calc_flat_fee') return null;

    if (node.type === 'category' || node.type === 'subcategory') {
      const count = node.isRepeatable ? dbData[`${node.id}_count`] || 1 : 1;
      const instances = [];

      for (let i = 0; i < count; i++) {
        const suffix = node.isRepeatable ? `_${i}` : currentSuffix;
        const children = (node.items || []).map((child: any) => renderNode(child, suffix));

        const hasContent = children.some((c) => c !== null);

        if (hasContent) {
          const instanceLabel = node.isRepeatable ? ` #${i + 1}` : '';
          instances.push(
            <div key={`${node.id}_${i}`} className="w-full mt-3 mb-1.5">
              <div className="w-[calc(100%+1.5rem)] md:w-[calc(100%+2.5rem)] -ml-3 md:-ml-5 bg-[#6B0D24] text-white py-1.5 px-3 md:px-5 rounded-none font-black text-xs uppercase tracking-wider shadow-xs border-l-4 border-[#C5A059]">
                <span>
                  {node.name || node.label}
                  {instanceLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 w-full mt-1.5 items-start">
                {children}
              </div>
            </div>
          );
        }
      }
      return instances.length > 0 ? (
        <React.Fragment key={node.id}>{instances}</React.Fragment>
      ) : null;
    }

    if (node.type === 'field') {
      if (node.fieldType === 'image' || node.fieldType === 'image_grid') return null;

      let val = dbData[`${node.id}${currentSuffix}`];
      if (node.fieldType === 'dimension_2d') {
        const l = dbData[`${node.id}${currentSuffix}_L`];
        const b = dbData[`${node.id}${currentSuffix}_B`];
        if (l && b) val = `${l} ft x ${b} ft`;
      }

      if (val === undefined || val === null || val === '') return null;

      return <SchemaFieldItem key={node.id + currentSuffix} node={node} val={val} />;
    }

    return null;
  };

  return (
    <div className="space-y-3 mb-6 bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
      {/* Description Section */}
      {description && (
        <section>
          <div className="relative">
            <p
              className={`text-gray-800 text-sm md:text-base leading-relaxed font-medium transition-all duration-300 ${
                !descExpanded ? 'line-clamp-4' : ''
              }`}
            >
              {description}
            </p>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-[#6B0D24] text-sm font-bold mt-2 hover:opacity-80 focus:outline-none flex items-center gap-1"
            >
              {descExpanded ? 'Read Less' : 'Read More'}{' '}
              <i className={`ph-bold ph-caret-${descExpanded ? 'up' : 'down'} text-xs`}></i>
            </button>
          </div>
        </section>
      )}

      {/* Dynamic Spec Sheet Fields */}
      {schemaStructure.map((node) => renderNode(node))}

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <section className="border-t border-gray-100 pt-6 mt-6 w-full">
        <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="ph-bold ph-question text-[#6B0D24] text-sm"></i> Frequently Asked Questions about {resortName}
        </h3>

        <div className="space-y-4 text-xs md:text-sm text-gray-700 font-medium w-full">
          {/* BUDGET QUESTIONS (HIDDEN IF NO BUDGET IS FETCHED) */}
          {calculatedBudget > 0 && (
            <>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-900 mb-1">
                  What is the estimated wedding budget at {resortName} for {guests} guests?
                </p>
                <p className="text-gray-600">
                  The total estimated package budget for {guests} guests over a duration of {days} days at {resortName} is approximately <strong className="text-gray-900">₹{calculatedBudget.toLocaleString('en-IN')}</strong>.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-900 mb-1">
                  What does this package budget include?
                </p>
                <p className="text-gray-600">
                  This package is comprehensive and covers your guest accommodation, buffet meals (including gala & semi-gala dinners), lawn/banquet venue access, decor setups, sound, and lighting logistics.
                </p>
              </div>
            </>
          )}

          {/* ROOMS FAQ */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">
              How many rooms are available for a wedding booking at {resortName}?
            </p>
            <p className="text-gray-600">
              The property provides {dbData.core_rooms || '--'} guest rooms and suites for accommodation.
            </p>
          </div>

          {/* LOCATION FAQ */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">Where is {resortName} located?</p>
            <p className="text-gray-600">
              {resortName} is located in {resortLocation || 'India'}.
            </p>
          </div>

          {/* VENDOR & PET POLICY FAQ */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">
              What are the rules regarding vendors and pets at {resortName}?
            </p>
            <p className="text-gray-600">
              At {resortName}, pet policy is: <strong className="text-gray-900">{petPolicy}</strong>, and decor vendor policy specifies: <strong className="text-gray-900">{vendorPolicy}</strong>.
            </p>
          </div>

          {/* SPECIAL ATMOSPHERE FEATURE FAQ */}
          {dbData.core_feature && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="font-bold text-gray-900 mb-1">
                Is {resortName} a riverside, beach, or mountain property?
              </p>
              <p className="text-gray-600">
                Yes, {resortName} is categorized and highly rated for its unique {dbData.core_feature} atmosphere and surroundings.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};