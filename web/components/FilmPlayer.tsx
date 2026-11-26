"use client";

import React, { useState } from "react";
import { Play, Pause, Volume2, Maximize2, Smartphone, Monitor, Info, Sparkles } from "lucide-react";
import { FILM_METADATA, SHOTS } from "../lib/data";

export default function FilmPlayer() {
  const [aspect, setAspect] = useState<"vertical" | "horizontal">("horizontal");
  const [selectedShot, setSelectedShot] = useState<number>(0);
  const [language, setLanguage] = useState<"am" | "en">("en");

  const currentShot = SHOTS[selectedShot] || SHOTS[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30">10 Academy Submission</span>
              <span>•</span>
              <span>Harar Heritage Short</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{FILM_METADATA.title}</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {FILM_METADATA.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setAspect("vertical")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  aspect === "vertical" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Vertical 9:16
              </button>
              <button
                onClick={() => setAspect("horizontal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  aspect === "horizontal" ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Horizontal 16:9
              </button>
            </div>
          </div>
        </div>

        {/* Quick Badges */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div><span className="font-semibold text-white">10</span> shots in storyboard</div>
          <div><span className="font-semibold text-white">83.0s</span> total runtime</div>
          <div><span className="font-semibold text-white">2</span> aspect ratios</div>
          <div><span className="font-semibold text-sky-400">-14.0 LUFS</span> EBU R128 mastered</div>
          <div><span className="font-semibold text-emerald-400">$0.00</span> spent (free tiers)</div>
        </div>
      </div>

      {/* Cinema Player Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Video Viewport */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 flex flex-col items-center justify-center bg-black/40 border border-slate-800 min-h-[480px]">
          <div className={`relative overflow-hidden rounded-xl bg-black border border-slate-800 transition-all duration-300 shadow-2xl ${
            aspect === "vertical" ? "w-[270px] h-[480px]" : "w-full max-w-[640px] aspect-video"
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

          <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sidechain Ducked Audio + Hardcoded Subtitles
            </span>
            <span className="text-slate-500">24 fps • H.264 High@L4.1 • AAC Stereo</span>
          </div>
        </div>

        {/* Live Shot Narration & Subtitle Sync */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Scene Chapters (Shot {currentShot.order} of 10)
              </h3>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-[11px] text-slate-300">
                <span>{currentShot.duration_seconds}s</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide block mb-1">
                  Amharic Narration
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {currentShot.narration.am}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wide block mb-1">
                  English Subtitle
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentShot.narration.en}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <p><strong className="text-slate-300">Camera:</strong> {currentShot.camera.movement} ({currentShot.camera.focal_length_hint})</p>
                <p><strong className="text-slate-300">Framing:</strong> {currentShot.camera.framing}</p>
              </div>
            </div>
          </div>

          {/* Chapter Quick Selector */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Jump to Shot</h4>
            <div className="grid grid-cols-5 gap-2">
              {SHOTS.map((s, idx) => (
                <button
                  key={s.shot_id}
                  onClick={() => setSelectedShot(idx)}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${
                    selectedShot === idx
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  S{s.order}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
