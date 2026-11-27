"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sliders, Sparkles, MoveHorizontal } from "lucide-react";

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
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Heritage Lens</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">The Memory vs. The Reality</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Explore the emotional core of the film: drag the slider to contrast the childhood memory of the Ras Makonnen bronze equestrian statue against the vacant roundabout discovered upon returning to Harar in 2026 (the monument having been demolished in 2020 while away).
        </p>
      </div>

      {/* Interactive Split-Screen Comparison Viewport */}
      <div className="glass-panel rounded-2xl p-3 sm:p-5 border border-slate-800 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative w-full aspect-video rounded-xl overflow-hidden bg-black select-none border border-slate-700 shadow-2xl"
        >
          {/* Base Layer: Modern Reality (Empty Pedestal - Shot 09) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/assets/keyframes/shot-09.png"
              alt="Empty pedestal in modern Harar (Shot 09)"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/85 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 text-[10px] sm:text-xs font-bold text-slate-200 shadow-lg">
              The Reality (2026 Return): Empty Roundabout (Shot 09)
            </div>
          </div>

          {/* Top Layer: Childhood Memory (Bronze Monument - Shot 04) clipped by sliderPosition */}
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
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-black/85 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-amber-500/50 text-[10px] sm:text-xs font-bold text-amber-300 shadow-lg">
              The Memory (Childhood): Ras Makonnen Monument (Shot 04)
            </div>
          </div>

          {/* Vertical Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 sm:w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] pointer-events-none z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl font-bold text-xs border border-slate-300">
              <MoveHorizontal className="w-3.5 h-3.5 text-slate-900" />
            </div>
          </div>

          {/* Interactive Range Input for Full-Area Dragging on Desktop and Mobile */}
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

        {/* Caption & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Drag slider anywhere across the image to reveal memory vs reality</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Memory: {sliderPosition}%
            </span>
            <span className="text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Reality: {100 - sliderPosition}%
            </span>
          </div>
        </div>
      </div>

      {/* Storytelling Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-amber-300 mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Childhood Meaning (Memory)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            For a young child in Harar, seeing the Ras Makonnen bronze equestrian statue was not an abstract history lesson—it was the excitement of holidays, buying new clothes, and family strolls through Jugol. It formed an indelible part of personal identity.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            2026 Discovery (Reality)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Returning home in 2026 after university, the sudden sight of an empty stone plinth surrounded by everyday traffic created an unsettling dissonance. The physical bronze was gone (demolished in 2020), but the monument remains indestructible inside memory.
          </p>
        </div>
      </div>
    </div>
  );
}
