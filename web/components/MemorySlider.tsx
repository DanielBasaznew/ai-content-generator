"use client";

import React, { useState } from "react";
import { Sliders, Sparkles, HelpCircle } from "lucide-react";

export default function MemorySlider() {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const handleSliderMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Heritage Lens</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">The Memory vs. The Reality</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Explore the emotional core of the film: drag the slider to contrast the childhood memory of the Ras Makonnen bronze equestrian statue against the vacant roundabout in modern Harar following its 2020 demolition.
        </p>
      </div>

      {/* Interactive Split-Screen Comparison Viewport */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 overflow-hidden">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black select-none border border-slate-700 shadow-2xl">
          {/* Base Layer: Modern Reality (Empty Pedestal - Shot 09) */}
          <div className="absolute inset-0">
            <img
              src="/assets/keyframes/shot-09.png"
              alt="Empty pedestal in modern Harar (Shot 09)"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-slate-200">
              The Reality (Post-2020): Empty Roundabout (Shot 09)
            </div>
          </div>

          {/* Top Layer: Childhood Memory (Bronze Monument - Shot 04) clipped by sliderPosition */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 w-full h-full min-w-[640px] md:min-w-[800px] lg:min-w-[960px]">
              <img
                src="/assets/keyframes/shot-04.png"
                alt="Ras Makonnen Monument in childhood memory (Shot 04)"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-bold text-amber-300">
              The Memory (Childhood): Ras Makonnen Monument (Shot 04)
            </div>
          </div>

          {/* Vertical Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg font-bold text-xs">
              ↔
            </div>
          </div>

          {/* Invisible Range Input for Full-Area Dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={handleSliderMove}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
          />
        </div>

        {/* Caption & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Drag anywhere across the image to explore the visual transition</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-amber-300 font-semibold">Memory: {sliderPosition}%</span>
            <span className="text-slate-300 font-semibold">Reality: {100 - sliderPosition}%</span>
          </div>
        </div>
      </div>

      {/* Storytelling Context Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-amber-300 mb-2">Childhood Meaning</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            For a young child in Harar, seeing the Ras Makonnen statue was not a historical lecture—it was the thrill of family outings, holidays, and walking through Jugol. It became part of personal identity.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-sky-300 mb-2">The Central Message</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <em>"Physical landmarks may disappear, but the memories and cultural heritage connected to them remain."</em> The empty pedestal represents loss, while the story preserves the living heritage.
          </p>
        </div>
      </div>
    </div>
  );
}
