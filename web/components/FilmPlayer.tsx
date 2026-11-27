"use client";

import React, { useState } from "react";
import { Smartphone, Monitor, Cpu, ArrowRight } from "lucide-react";
import { FILM_METADATA, SHOTS } from "../lib/data";

interface FilmPlayerProps {
  onNavigate?: (tab: string) => void;
}

export default function FilmPlayer({ onNavigate }: FilmPlayerProps) {
  const [aspect, setAspect] = useState<"vertical" | "horizontal">("horizontal");
  const [selectedShot, setSelectedShot] = useState<number>(0);

  const currentShot = SHOTS[selectedShot] || SHOTS[0];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-xl p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-2">
              10 Academy Capstone · Harar Heritage Short
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              {FILM_METADATA.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 max-w-2xl leading-relaxed">
              {FILM_METADATA.summary}
            </p>
          </div>

          <div className="flex items-center self-start shrink-0">
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setAspect("vertical")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  aspect === "vertical" 
                    ? "bg-zinc-800 text-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Vertical</span>
              </button>
              <button
                onClick={() => setAspect("horizontal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  aspect === "horizontal" 
                    ? "bg-zinc-800 text-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9 Horizontal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Tabular Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-5 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Storyboard</span>
            <span className="font-medium text-zinc-200 tabular-nums">10 shots · 83.0s</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Aspect Formats</span>
            <span className="font-medium text-zinc-200">9:16 &amp; 16:9</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Loudness</span>
            <span className="font-medium text-zinc-200 tabular-nums">-14.0 LUFS (EBU R128)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Cache Replay</span>
            <span className="font-medium text-zinc-200 tabular-nums">0.15s (SHA-256)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Net Spend</span>
            <span className="font-medium text-[#d4a359] tabular-nums">$0.00 (Free Tiers)</span>
          </div>
        </div>
      </div>

      {/* Main Screening Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 glass-panel rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center bg-black/60 min-h-[380px] sm:min-h-[470px]">
          <div className={`relative overflow-hidden rounded-lg bg-black border border-zinc-800 flex items-center justify-center ${
            aspect === "vertical" 
              ? "w-full max-w-[270px] sm:max-w-[300px] aspect-[9/16]" 
              : "w-full aspect-video"
          }`}>
            <video
              key={aspect}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              src={aspect === "vertical" ? FILM_METADATA.videos.vertical : FILM_METADATA.videos.horizontal}
            >
              Your browser does not support HTML5 video.
            </video>
          </div>

          <div className="w-full mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 px-1">
            <span>-12 dB sidechain ducking · balanced ASS captions</span>
            <span>24 fps · H.264 High@L4.1 · AAC 48kHz</span>
          </div>
        </div>

        {/* Script & Scene Chapters */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-800/80">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Shot {currentShot.order} of 10
              </h3>
              <span className="text-xs font-mono text-zinc-400 tabular-nums">
                {currentShot.duration_seconds}s
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="text-[10px] font-mono text-[#d4a359] uppercase tracking-wider block mb-1">
                  Amharic Narration
                </span>
                <p className="text-sm text-zinc-100 leading-relaxed">
                  {currentShot.narration.am}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  English Subtitle
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentShot.narration.en}
                </p>
              </div>

              <div className="text-[11px] text-zinc-500 space-y-1 pt-2 border-t border-zinc-800/80">
                <p><span className="text-zinc-300">Camera:</span> {currentShot.camera.movement} ({currentShot.camera.focal_length_hint})</p>
                <p><span className="text-zinc-300">Framing:</span> {currentShot.camera.framing}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Scene Selector</h4>
              <span className="text-[10px] font-mono text-zinc-600">10 beats</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SHOTS.map((s, idx) => (
                <button
                  key={s.shot_id}
                  onClick={() => setSelectedShot(idx)}
                  className={`py-1.5 rounded-md text-xs font-mono font-medium transition ${
                    selectedShot === idx
                      ? "bg-zinc-100 text-zinc-950"
                      : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  S{s.order}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Shortcut Panel */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4a359] shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Reproducible Pipeline Architecture
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              storyboard.json → SHA-256 Cache → Gemini TTS / FLUX / Wan 2.2 / ACE-Step → FFmpeg
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("pipeline")}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-medium hover:bg-zinc-800 transition shrink-0"
          >
            <span>Inspect Pipeline Diagram</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#d4a359]" />
          </button>
        )}
      </div>
    </div>
  );
}
