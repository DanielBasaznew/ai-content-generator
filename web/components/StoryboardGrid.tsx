"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { SHOTS, ShotData } from "../lib/data";

export default function StoryboardGrid() {
  const [selectedShot, setSelectedShot] = useState<ShotData | null>(null);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          Pre-Production Blueprint
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Storyboard Matrix
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
          Ten shots governing the 80.0-second narrative arc in Harar. Every card preserves complete uncropped narration lines in Amharic and English alongside deterministic framing prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SHOTS.map((shot) => (
          <div
            key={shot.shot_id}
            onClick={() => setSelectedShot(shot)}
            className="glass-card rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden border-b border-zinc-800/80">
                <img
                  src={shot.keyframe_url}
                  alt={shot.visual_description}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                />
                <div className="absolute top-3 left-3 bg-zinc-950/85 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-100 border border-zinc-800">
                  Shot {shot.order}
                </div>
                <div className="absolute top-3 right-3 bg-zinc-950/85 px-2 py-0.5 rounded text-[11px] font-mono text-[#d4a359] border border-zinc-800 tabular-nums">
                  {shot.duration_seconds}s
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-zinc-950/85 backdrop-blur-sm px-2.5 py-1.5 rounded text-[11px] text-zinc-300 border border-zinc-800/90 font-mono truncate">
                  {shot.camera.movement} · {shot.camera.framing}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {shot.visual_description}
                </p>

                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] space-y-1.5">
                  <p className="font-medium text-[#e5be7e] leading-relaxed">{shot.narration.am}</p>
                  <p className="text-zinc-400 italic leading-relaxed">{shot.narration.en}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between group-hover:text-zinc-200 transition">
              <span>Inspect prompt &amp; specs</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedShot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel max-w-2xl w-full rounded-xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedShot(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              aria-label="Close shot details"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[#d4a359] text-xs font-mono">
                Shot {selectedShot.order}
              </span>
              <h3 className="text-base font-semibold text-zinc-100">Shot Specification</h3>
              <span className="text-xs font-mono text-zinc-500 tabular-nums">{selectedShot.duration_seconds}s</span>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-4 border border-zinc-800">
              <img
                src={selectedShot.keyframe_url}
                alt={selectedShot.visual_description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Visual Description</h4>
                <p className="text-zinc-200 leading-relaxed">{selectedShot.visual_description}</p>
              </div>

              <div>
                <h4 className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-1">FLUX &amp; Wan 2.2 Prompt</h4>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed">
                  {selectedShot.prompt}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <h5 className="font-mono text-[10px] uppercase text-[#d4a359] mb-1">Amharic Narration</h5>
                  <p className="text-zinc-200 leading-relaxed">{selectedShot.narration.am}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <h5 className="font-mono text-[10px] uppercase text-zinc-500 mb-1">English Subtitle</h5>
                  <p className="text-zinc-300 leading-relaxed">{selectedShot.narration.en}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 text-[11px] font-mono text-zinc-500 border-t border-zinc-800">
                <span>Camera: {selectedShot.camera.movement} ({selectedShot.camera.focal_length_hint})</span>
                <span>Framing: {selectedShot.camera.framing}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
