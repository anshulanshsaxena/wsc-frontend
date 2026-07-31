"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface Resort360ViewerProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: any[];
}

export default function Resort360Viewer({ isOpen, onClose, scenes }: Resort360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [panolensLoaded, setPanolensLoaded] = useState(false);

  // Polyfill window.process for Panolens.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).process = (window as any).process || {
        env: { NODE_ENV: "production" },
      };
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !threeLoaded || !panolensLoaded || !scenes || scenes.length === 0) return;

    const windowObj = window as any;
    if (typeof windowObj.PANOLENS === "undefined" || typeof windowObj.THREE === "undefined") return;

    try {
      const viewer = new windowObj.PANOLENS.Viewer({
        container: containerRef.current,
        controlBar: true,
        autoRotate: true,
        autoRotateSpeed: 1.0,
        cameraFov: 75,
      });

      const panoramas: Record<string, any> = {};

      scenes.forEach((scene) => {
        if (!scene || !scene.url) return;
        const pano = new windowObj.PANOLENS.ImagePanorama(scene.url);
        pano.sceneName = scene.name || "360 Scene";

        pano.addEventListener("load", () => setLoading(false));
        panoramas[scene.id] = pano;
        viewer.add(pano);
      });

      if (scenes[0] && panoramas[scenes[0].id]) {
        viewer.setPanorama(panoramas[scenes[0].id]);
      }

      return () => {
        try {
          viewer.destroy();
        } catch (e) {
          console.error("360 cleanup error:", e);
        }
      };
    } catch (err) {
      console.error("Error initializing 360 viewer:", err);
      setLoading(false);
    }
  }, [isOpen, threeLoaded, panolensLoaded, scenes]);

  if (!isOpen) return null;

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/105/three.min.js"
        strategy="lazyOnload"
        onLoad={() => setThreeLoaded(true)}
      />

      {threeLoaded && (
        <Script
          src="https://cdn.jsdelivr.net/npm/panolens@0.12.1/build/panolens.min.js"
          strategy="lazyOnload"
          onLoad={() => setPanolensLoaded(true)}
        />
      )}

      <div id="tour360Modal" className="fixed inset-0 z-[200000] bg-black">
        {loading && (
          <div id="tourLoader" className="absolute inset-0 bg-black z-[200002] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-[#6B0D24] rounded-full animate-spin mb-4" />
            <p className="text-white font-bold tracking-widest text-sm animate-pulse">
              RENDERING 3D SPACE...
            </p>
          </div>
        )}

        <div className="absolute top-4 right-4 z-[200001] flex items-center gap-4">
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full transition-colors shadow-2xl cursor-pointer"
          >
            <i className="ph-bold ph-x text-xl"></i>
          </button>
        </div>

        <div id="tour-canvas-container" ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab z-0" />
      </div>
    </>
  );
}