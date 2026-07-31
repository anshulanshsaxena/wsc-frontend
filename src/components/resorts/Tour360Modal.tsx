'use client';

import React, { useEffect, useState } from 'react';

interface Tour360ModalProps {
  isOpen: boolean;
  scenes?: { id: string; name: string; url: string; hotspots?: any[] }[];
  onClose: () => void;
}

export const Tour360Modal: React.FC<Tour360ModalProps> = ({
  isOpen,
  scenes = [],
  onClose,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || scenes.length === 0) return;

    let mounted = true;

    const loadTourScripts = async () => {
      setLoading(true);

      const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve(true);
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      try {
        if (typeof (window as any).THREE === 'undefined') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/105/three.min.js');
        }
        if (typeof (window as any).PANOLENS === 'undefined') {
          await loadScript('https://cdn.jsdelivr.net/npm/panolens@0.12.1/build/panolens.min.js');
        }

        if (mounted) {
          const PANOLENS = (window as any).PANOLENS;
          const container = document.getElementById('tour-canvas-container');

          if (container && !container.hasChildNodes()) {
            const viewer = new PANOLENS.Viewer({
              container,
              controlBar: true,
              autoRotate: true,
              autoRotateSpeed: 1.0,
              cameraFov: 75,
            });

            const panoramas: Record<string, any> = {};

            scenes.forEach((s) => {
              const pano = new PANOLENS.ImagePanorama(s.url);
              pano.sceneId = s.id;
              pano.sceneName = s.name;

              pano.addEventListener('enter', function (this: any) {
                const roomEl = document.getElementById('currentTourRoomName');
                if (roomEl) roomEl.textContent = this.sceneName;
              });

              panoramas[s.id] = pano;
              viewer.add(pano);
            });

            if (scenes[0] && panoramas[scenes[0].id]) {
              viewer.setPanorama(panoramas[scenes[0].id]);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load 360 viewer:', err);
        setLoading(false);
      }
    };

    loadTourScripts();

    return () => {
      mounted = false;
    };
  }, [isOpen, scenes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black">
      {loading && (
        <div className="absolute inset-0 bg-black z-[100002] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-[#6B0D24] rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold tracking-widest text-sm animate-pulse">
            RENDERING 3D SPACE...
          </p>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[100001] flex items-center gap-4">
        <span
          id="currentTourRoomName"
          className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"
        >
          Loading...
        </span>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full transition-colors shadow-2xl"
        >
          <i className="ph-bold ph-x text-xl"></i>
        </button>
      </div>

      <div
        id="tour-canvas-container"
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />
    </div>
  );
};