"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ResortDetails } from "@/lib/resortService";

interface ResortSchemaSpecsProps {
  resort: ResortDetails;
}

export default function ResortSchemaSpecs({ resort }: ResortSchemaSpecsProps) {
  const [schemaStructure, setSchemaStructure] = useState<any[]>([]);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  // Priority: Expert Verdict (id_zs5fy1nq1_0) -> Description (id_z9l3ev1k1_0) -> Fallback
  const descriptionText =
    resort.id_zs5fy1nq1_0 ||
    resort.id_z9l3ev1k1_0 ||
    resort.description ||
    resort.core_description ||
    "";

  useEffect(() => {
    async function loadSchema() {
      try {
        const snap = await getDoc(doc(db, "schemas", "resort_schema"));
        if (snap.exists()) {
          setSchemaStructure(snap.data().structure || []);
        }
      } catch (err) {
        console.error("Error loading resort schema:", err);
      }
    }
    loadSchema();
  }, []);

  const toggleFieldExpand = (fieldKey: string) => {
    setExpandedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // Recursive Schema Node Renderer
  const renderNode = (node: any, suffix = ""): React.ReactNode => {
    if (!node) return null;

    // Filter out description/verdict nodes (to prevent duplicate text) & cost calculation fields
    if (
      node.id === "id_z9l3ev1k1_0" ||
      node.id === "id_zs5fy1nq1_0" ||
      node.id?.startsWith("id_z9l3ev1k1") ||
      node.id?.startsWith("id_zs5fy1nq1") ||
      node.name?.toLowerCase().includes("description") ||
      node.label?.toLowerCase().includes("description") ||
      node.calcTag === "calc_flat_fee" ||
      (node.calcTag &&
        (node.calcTag.includes("minimum") ||
          node.calcTag.includes("maximum") ||
          node.calcTag.includes("multiply")))
    ) {
      return null;
    }
    if (node.name && node.name.toLowerCase() === "rates") return null;
    if (node.id === "id_8rypjw0pr") return null;

    if (node.type === "category" || node.type === "subcategory") {
      const count = node.isRepeatable ? resort[`${node.id}_count`] || 1 : 1;
      const elements: React.ReactNode[] = [];

      for (let i = 0; i < count; i++) {
        const currentSuffix = node.isRepeatable ? `_${i}` : suffix;
        const children = (node.items || [])
          .map((child: any) => renderNode(child, currentSuffix))
          .filter(Boolean);

        if (children.length > 0) {
          const instanceLabel = node.isRepeatable ? ` #${i + 1}` : "";
          const title = `${node.name || node.label || "Information"}${instanceLabel}`;

          elements.push(
            <div key={`${node.id}_${i}`} className="w-full mt-3 mb-2">
              {/* Maroon Banner Strip */}
              <div className="w-[calc(100%+1.5rem)] md:w-[calc(100%+2.5rem)] -ml-3 md:-ml-5 bg-[#6B0D24] text-white py-1.5 px-3 md:px-5 font-black text-xs uppercase tracking-wider shadow-xs border-l-4 border-[#C5A059]">
                <span>{title}</span>
              </div>

              {/* Category Grid Fields */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 w-full mt-1.5 items-start">
                {children}
              </div>
            </div>
          );
        }
      }
      return elements.length > 0 ? <React.Fragment key={node.id}>{elements}</React.Fragment> : null;
    }

    if (node.type === "field") {
      if (node.fieldType === "image" || node.fieldType === "image_grid") return null;

      let val = resort[`${node.id}${suffix}`];
      if (node.fieldType === "dimension_2d") {
        const l = resort[`${node.id}${suffix}_L`];
        const b = resort[`${node.id}${suffix}_B`];
        if (l && b) val = `${l} ft x ${b} ft`;
      }

      if (val === undefined || val === null || val === "") return null;

      const fieldKey = `${node.id}${suffix}`;
      const isLongText = typeof val === "string" && val.length > 150;
      const isExpanded = expandedFields[fieldKey];

      if (isLongText) {
        return (
          <div key={fieldKey} className="flex flex-col py-3 border-b border-gray-100 last:border-0 w-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {node.name || node.label}
            </span>
            <div className="relative w-full">
              <p className="text-sm font-medium text-gray-700 leading-relaxed">
                {isExpanded ? val : `${val.substring(0, 150)}...`}
              </p>
              <button
                onClick={() => toggleFieldExpand(fieldKey)}
                className="text-[#6B0D24] hover:text-[#520a1a] text-xs font-bold mt-2 focus:outline-none transition-colors uppercase tracking-wider cursor-pointer"
              >
                {isExpanded ? "Read Less" : "Read More"}
              </button>
            </div>
          </div>
        );
      }

      return (
        <div
          key={fieldKey}
          className="flex flex-col py-1 border-b border-gray-100 last:border-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)]"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {node.name || node.label}
          </span>
          <span className="text-sm font-semibold text-gray-900 break-words">{String(val)}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      id="resortDetailsContainer"
      className="space-y-3 mb-6 bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
    >
      {/* Description / Expert Verdict Box */}
      {descriptionText && (
        <section className="mb-4">
          <div className="relative">
            <p
              id="uiResortDescription"
              className={`text-gray-800 text-sm md:text-base leading-relaxed font-medium transition-all duration-300 ${
                !isDescExpanded ? "line-clamp-4" : ""
              }`}
            >
              {descriptionText}
            </p>
            <button
              id="readMoreBtn"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="text-[#6B0D24] text-sm font-bold mt-2 hover:opacity-80 focus:outline-none flex items-center gap-1 cursor-pointer"
            >
              {isDescExpanded ? "Read Less" : "Read More"}
              <i className={`ph-bold ph-caret-${isDescExpanded ? "up" : "down"} text-xs`}></i>
            </button>
          </div>
        </section>
      )}

      {/* Schema-driven Category Sections */}
      {schemaStructure.map((node) => renderNode(node))}
    </div>
  );
}