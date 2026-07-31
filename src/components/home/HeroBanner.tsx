"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface BannerOffer {
  id: string;
  imageUrl: string;
  type: "resort" | "lead";
  url?: string;
  discountText?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export default function HeroBanner({ onOpenLeadModal }: { onOpenLeadModal?: () => void }) {
  const [banners, setBanners] = useState<BannerOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanners() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const snap = await getDocs(collection(db, "offers_banners"));
        const validBanners: BannerOffer[] = [];

        snap.forEach((d) => {
          const data = d.data() as BannerOffer;
          const isAfterStart = !data.startDate || today >= data.startDate;
          const isBeforeEnd = !data.endDate || today <= data.endDate;

          if (data.isActive !== false && isAfterStart && isBeforeEnd) {
            validBanners.push({ ...data, id: d.id });
          }
        });

        setBanners(validBanners);
      } catch (err) {
        console.error("Error loading hero banners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full mb-8 relative z-0 px-4 md:px-8">
        <div className="w-full h-[200px] md:h-[400px] bg-gray-200 animate-pulse rounded-2xl md:rounded-[2rem] shadow-xl" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto w-full mb-8 relative z-0 px-4 md:px-8">
      <div className="rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={banners.length > 1}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className="w-full h-[200px] md:h-[400px]"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div
                onClick={() => {
                  if (banner.type === "resort" && banner.url) {
                    window.location.href = banner.url;
                  } else {
                    onOpenLeadModal?.();
                  }
                }}
                className="relative w-full h-full cursor-pointer group"
              >
                <img
                  src={banner.imageUrl}
                  alt="Offer Banner"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                {banner.discountText && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white font-black px-4 py-2 rounded-xl shadow-xl border-2 border-white text-sm md:text-lg z-10 transform rotate-[-3deg] group-hover:rotate-0 transition-transform">
                    {banner.discountText}
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}