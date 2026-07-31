"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Link from "next/link";
import "swiper/css";

interface ResortCardSliderProps {
  sectionId: string;
}

export default function ResortCardSlider({ sectionId }: ResortCardSliderProps) {
  const [sectionHeading, setSectionHeading] = useState("");
  const [resorts, setResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSectionData() {
      try {
        const docSnap = await getDoc(doc(db, "homepage_sections", sectionId));
        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }

        const sectionData = docSnap.data();
        setSectionHeading(sectionData.heading || "");

        let resortList: any[] = [];

        if (sectionData.type === "auto_rooms" && sectionData.roomMin && sectionData.roomMax) {
          const minNum = Number(sectionData.roomMin);
          const maxNum = Number(sectionData.roomMax);

          let autoSnap = await getDocs(
            query(
              collection(db, "resort_data"),
              where("core_rooms", ">=", minNum),
              where("core_rooms", "<=", maxNum)
            )
          );

          if (autoSnap.empty) {
            const allSnap = await getDocs(collection(db, "resort_data"));
            allSnap.forEach((r) => {
              const rooms = Number(r.data().core_rooms);
              if (!isNaN(rooms) && rooms >= minNum && rooms <= maxNum) {
                resortList.push({ id: r.id, data: r.data() });
              }
            });
          } else {
            autoSnap.forEach((r) => resortList.push({ id: r.id, data: r.data() }));
          }
        } else if (sectionData.type === "auto_location" && sectionData.locationTarget) {
          let locSnap = await getDocs(
            query(collection(db, "resort_data"), where("core_location", "==", sectionData.locationTarget))
          );
          locSnap.forEach((r) => resortList.push({ id: r.id, data: r.data() }));
        } else {
          for (let rId of sectionData.resortIds || []) {
            const rDoc = await getDoc(doc(db, "resort_data", rId));
            if (rDoc.exists()) resortList.push({ id: rId, data: rDoc.data() });
          }
        }

        setResorts(resortList);
      } catch (err) {
        console.error("Error building section slider:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSectionData();
  }, [sectionId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-5" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[280px] h-[320px] bg-gray-200 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (resorts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 overflow-hidden">
      {sectionHeading && (
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-5">{sectionHeading}</h2>
      )}

      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={16}
        loop={resorts.length > 3}
        autoplay={{ delay: 3500, disableOnInteraction: true }}
        className="w-full !overflow-visible"
      >
        {resorts.map((item) => {
          const rId = item.id;
          const rData = item.data;
          const name = rData._recordName || "Luxury Resort";
          const location = rData.core_location || "India";
          const rooms = rData.core_rooms || "--";
          const expertRating = rData.core_expert_rating || "4.5";

          let imgUrl =
            rData.core_thumbnail ||
            rData._thumbnailUrl ||
            "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80";

          // Process core tags cleanly
          const tagsArray = rData.core_tags
            ? Array.isArray(rData.core_tags)
              ? rData.core_tags
              : rData.core_tags.split(",")
            : [];

          return (
            <SwiperSlide key={rId} className="!w-[280px] md:!w-[320px]">
              <Link href={`/resort/${rId}`}>
                <div className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl border border-gray-100 flex flex-col h-full cursor-pointer transition-shadow relative">
                  <div className="w-full h-48 rounded-xl bg-gray-200 overflow-hidden relative">
                    <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur text-gray-950 text-[11px] font-black px-2 py-1.5 rounded-lg flex items-center shadow border border-gray-100 z-10">
                      <i className="ph-fill ph-check-circle text-green-500 mr-1"></i> Expert: {expertRating}
                      {rData.core_star_rating && (
                        <>
                          <span className="ml-1 text-gray-300">|</span>
                          <span className="ml-1 text-yellow-500 flex items-center gap-0.5">
                            <i className="ph-fill ph-star text-[10px]"></i> {rData.core_star_rating} Star
                          </span>
                        </>
                      )}
                    </div>
                    {rData.core_offer && (
                      <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] uppercase font-black px-2 py-1 rounded shadow-md z-10">
                        {rData.core_offer}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 px-1 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 leading-tight truncate">{name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
                      <i className="ph-fill ph-map-pin text-red-500"></i> {location}
                    </p>

                    {tagsArray.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {tagsArray.slice(0, 2).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4 flex justify-between items-center">
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <i className="ph-fill ph-door"></i> {rooms} Rooms
                      </span>
                      <span className="text-gray-400 hover:text-blue-600 transition-colors">
                        <i className="ph-bold ph-arrow-right text-xl"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}