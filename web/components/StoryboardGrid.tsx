"use client";

import React, { useState } from "react";
import { Camera, Clock, MessageSquare, Play, Sparkles } from "lucide-react";
import { SHOTS, ShotData } from "../lib/data";

export default function StoryboardGrid() {
  const [selectedShot, setSelectedShot] = useState<ShotData | null>(null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
          <Camera className="w-4 h-4" />
          <span>Pre-Production Blueprint</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Interactive Storyboard Matrix</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          10 shots defining the 80.0-second narrative arc in Harar. Each shot is governed by strict schema contracts, specifying framing, camera movement, generative prompts, and dual-language narration.
        </p>
      </div>

      {/* Grid of Shot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SHOTS.map((shot) => (
          <div
            key={shot.shot_id}
            onClick={() => setSelectedShot(shot)}
            className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-sky-500/50 cursor-pointer transition flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail Header */}
              <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                <img
                  src={shot.keyframe_url}
                  alt={shot.visual_description}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-slate-700">
                  Shot {shot.order}
                </div>
                <div className="absolute top-3 right-3 bg-sky-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-white">
                  {shot.duration_seconds}s
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md p-2 rounded-lg text-[11px] text-slate-300 border border-slate-800">
                  <span className="font-semibold text-sky-300">{shot.camera.movement}</span> • {shot.camera.framing}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2.5">
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {shot.visual_description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] space-y-1">
                  <p className="font-medium text-amber-300 line-clamp-1">{shot.narration.am}</p>
                  <p className="text-slate-400 line-clamp-1 italic">{shot.narration.en}</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800/80 text-[11px] text-sky-400 flex items-center justify-between font-medium">
              <span>View details & prompt</span>
              <span className="group-hover:translate-x-1 transition">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Inspector */}
      {selectedShot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedShot(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">
                Shot {selectedShot.order}
              </span>
              <h3 className="text-lg font-bold text-white">Shot Details</h3>
              <span className="text-xs text-slate-400">Duration: {selectedShot.duration_seconds}s</span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-4 border border-slate-700">
              <img
                src={selectedShot.keyframe_url}
                alt={selectedShot.visual_description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">Visual Description</h4>
                <p className="text-slate-200">{selectedShot.visual_description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">FLUX & Wan 2.2 Prompt</h4>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-sky-300 leading-relaxed">
                  {selectedShot.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <h5 className="font-semibold text-amber-300 mb-1">Amharic Narration</h5>
                  <p className="text-slate-200">{selectedShot.narration.am}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <h5 className="font-semibold text-sky-300 mb-1">English Subtitle</h5>
                  <p className="text-slate-200">{selectedShot.narration.en}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 border-t border-slate-800">
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
