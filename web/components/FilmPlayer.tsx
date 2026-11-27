"use client";

import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize2, 
  Smartphone, 
  Monitor, 
  Info, 
  Sparkles,
  Cpu,
  ArrowRight,
  Database,
  Film as FilmIcon,
  CheckCircle2
} from "lucide-react";
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
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                10 Academy Capstone
              </span>
              <span>•</span>
              <span>Harar Heritage Short</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {FILM_METADATA.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {FILM_METADATA.summary}
            </p>
          </div>

          <div className="flex items-center self-start sm:self-auto shrink-0">
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-lg">
              <button
                onClick={() => setAspect("vertical")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  aspect === "vertical" 
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Vertical 9:16</span>
              </button>
              <button
                onClick={() => setAspect("horizontal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  aspect === "horizontal" 
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Horizontal 16:9</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div><span className="font-bold text-white">10</span> shots in contract</div>
          <div><span className="font-bold text-white">83.0s</span> broadcast duration</div>
          <div><span className="font-bold text-amber-400">-14.0 LUFS</span> EBU R128 mastered</div>
          <div><span className="font-bold text-sky-400">0.15s</span> SHA-256 cache replay</div>
          <div><span className="font-bold text-emerald-400">$0.00</span> spent (free tiers)</div>
        </div>
      </div>

      {/* Cinema Player Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Video Viewport */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center bg-black/50 border border-slate-800 min-h-[380px] sm:min-h-[480px]">
          <div className={`relative overflow-hidden rounded-xl bg-black border border-slate-800 transition-all duration-300 shadow-2xl flex items-center justify-center ${
            aspect === "vertical" 
              ? "w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16]" 
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

          <div className="w-full mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>-12 dB Sidechain Ducking • ASS Balanced Subtitles</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">24 fps • H.264 High@L4.1 • AAC Stereo</span>
          </div>
        </div>

        {/* Live Shot Narration & Subtitle Sync */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Scene Chapter (Shot {currentShot.order} of 10)
              </h3>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-[11px] font-mono text-amber-400 border border-slate-800">
                <span>{currentShot.duration_seconds}s</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                  Amharic Narration (Gemini TTS)
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed font-sans">
                  {currentShot.narration.am}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide block mb-1">
                  English Subtitle
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentShot.narration.en}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                <p><strong className="text-slate-300">Camera:</strong> {currentShot.camera.movement} ({currentShot.camera.focal_length_hint})</p>
                <p><strong className="text-slate-300">Framing:</strong> {currentShot.camera.framing}</p>
              </div>
            </div>
          </div>

          {/* Chapter Quick Selector */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-400">Jump to Shot</h4>
              <span className="text-[10px] text-slate-500 font-mono">10 beats</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {SHOTS.map((s, idx) => (
                <button
                  key={s.shot_id}
                  onClick={() => setSelectedShot(idx)}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    selectedShot === idx
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
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

      {/* Pipeline Quick-View & Architecture Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Automated Pipeline Architecture
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1-Command Rebuild
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                storyboard.json contract $\to$ Gemini TTS $\to$ FLUX.1 $\to$ Wan 2.2 $\to$ ACE-Step $\to$ FFmpeg Dual-Aspect
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate("pipeline")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 shrink-0 self-stretch md:self-auto justify-center"
            >
              <span>Explore Interactive Pipeline Graph</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
