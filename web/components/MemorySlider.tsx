"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sliders, MoveHorizontal } from "lucide-react";

export default function MemorySlider() {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleSliderMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          Comparative Visual Study
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Memory vs. Reality
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
          Contrast the childhood memory of the Ras Makonnen bronze equestrian statue against the empty stone plinth encountered upon returning to Harar in 2026 (demolished in 2020 while away).
        </p>
      </div>

      {/* Comparison Viewport */}
      <div className="glass-panel rounded-xl p-3 sm:p-4 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-black select-none border border-zinc-800"
        >
          {/* Base: Reality */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/assets/keyframes/shot-09.png"
              alt="Empty pedestal in modern Harar (Shot 09)"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 bg-zinc-950/85 backdrop-blur-sm px-2.5 py-1 rounded border border-zinc-800 text-[10px] sm:text-xs font-mono text-zinc-200">
              Reality · 2026 Return (Shot 09)
            </div>
          </div>

          {/* Overlay: Memory */}
          <div
            className="absolute inset-0 h-full overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <div 
              className="absolute inset-0 h-full"
              style={{ width: `${containerWidth}px` }}
            >
              <img
                src="/assets/keyframes/shot-04.png"
                alt="Ras Makonnen Monument in childhood memory (Shot 04)"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-3 left-3 bg-zinc-950/85 backdrop-blur-sm px-2.5 py-1 rounded border border-[#d4a359]/40 text-[10px] sm:text-xs font-mono text-[#e5be7e]">
              Memory · Childhood (Shot 04)
            </div>
          </div>

          {/* Divider */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-100 pointer-events-none z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-lg">
              <MoveHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={handleSliderMove}
            aria-label="Split image comparison slider"
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30 touch-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3.5 px-1 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
            <span>Drag across the frame to compare compositions</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
            <span className="text-[#d4a359]">Memory {sliderPosition}%</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300">Reality {100 - sliderPosition}%</span>
          </div>
        </div>
      </div>

      {/* Narrative Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#d4a359] mb-2">
            Childhood Context
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Growing up in Harar, passing the Ras Makonnen equestrian statue marked holidays, family outings, and walks toward Jugol—anchoring civic presence directly inside childhood joy.
          </p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
            Return in 2026
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Returning after university years in Adama and Addis Ababa, the vacant stone plinth amidst modern traffic framed the emotional core: physical bronze disappeared in 2020, yet cultural memory remains intact.
          </p>
        </div>
      </div>
    </div>
  );
}
