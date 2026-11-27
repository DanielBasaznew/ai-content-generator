"use client";

import React, { useState } from "react";
import { 
  Video, 
  Sparkles, 
  Clock, 
  Layers, 
  Cpu, 
  Download, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  Maximize2,
  Eye,
  Sliders
} from "lucide-react";
import { RAW_CLIPS, RawClipData } from "../lib/data";

interface RawClipsViewProps {
  onNavigate?: (tab: string) => void;
}

export default function RawClipsView({ onNavigate }: RawClipsViewProps) {
  const [selectedClip, setSelectedClip] = useState<RawClipData | null>(null);
  const [showKeyframeCompare, setShowKeyframeCompare] = useState<Record<string, boolean>>({});

  const toggleCompare = (shotId: string) => {
    setShowKeyframeCompare((prev) => ({
      ...prev,
      [shotId]: !prev[shotId]
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0a0f1d] to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                Kaggle • Wan 2.2 TI2V-5B
              </span>
              <span>•</span>
              <span className="text-slate-400">Nvidia T4 GPU (16 GB VRAM)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Output • The 10 Raw Video Clips
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Each clip as Wan 2.2 produced it on Kaggle before being temporally extended (1.35x slowdown + dynamic zoompan forward push) and cropped into dual-aspect masters. Compare the moving video directly against the still FLUX.1 keyframes under Storyboard.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
              download="harar_monument_horizontal_16x9.mp4"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Master Film</span>
            </a>
          </div>
        </div>

        {/* Quick Model Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Clip Resolution</span>
            <span className="font-bold text-white text-sm">512×512 (480p)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Frames per Clip</span>
            <span className="font-bold text-white text-sm">73 frames @ 24 fps</span>
            <span className="text-[10px] text-slate-500 block">3.04s raw motion</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Kaggle Compute</span>
            <span className="font-bold text-amber-300 text-sm">77.2 GPU Minutes</span>
            <span className="text-[10px] text-emerald-400 block">$0.00 (Kaggle Quota)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Peak VRAM Usage</span>
            <span className="font-bold text-sky-400 text-sm">12.91 GB / 16 GB</span>
            <span className="text-[10px] text-slate-500 block">CPU offload (FAIL-004)</span>
          </div>
        </div>
      </div>

      {/* Grid of Raw Clips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {RAW_CLIPS.map((clip) => {
          const isComparing = showKeyframeCompare[clip.shot_id];
          return (
            <div
              key={clip.shot_id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between bg-slate-950/80 shadow-lg group"
            >
              <div>
                {/* Media Stage: Video or Keyframe Toggle */}
                <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center border-b border-slate-800">
                  {isComparing ? (
                    <img
                      src={clip.keyframe_path}
                      alt={clip.title}
                      className="w-full h-full object-cover animate-in fade-in duration-200"
                    />
                  ) : (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      poster={clip.keyframe_path}
                      className="w-full h-full object-cover"
                      src={clip.clip_path}
                    >
                      Your browser does not support HTML5 video.
                    </video>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-white border border-slate-700 pointer-events-none">
                    Shot 0{clip.order}
                  </div>

                  <button
                    onClick={() => toggleCompare(clip.shot_id)}
                    className="absolute top-2.5 right-2.5 bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-slate-300 border border-slate-700 transition"
                    title="Toggle comparison with still keyframe"
                  >
                    {isComparing ? "View Video" : "Compare Still"}
                  </button>
                </div>

                {/* Metadata & Tech Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-amber-300 font-bold">s{clip.order} • {clip.resolution.split(" ")[0]}</span>
                    <span>{clip.num_frames} frames</span>
                  </div>

                  <div className="text-xs font-bold text-white truncate" title={clip.title}>
                    {clip.title}
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kaggle T4:</span>
                      <span className="text-emerald-400 font-mono font-semibold">{clip.gpu_inference_min} GPU min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seed:</span>
                      <span className="font-mono text-slate-300">{clip.seed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Motion:</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{clip.camera.split("•")[0]}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed" title={clip.prompt}>
                    {clip.prompt}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 pt-0">
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span>Wan 2.2 I2V</span>
                  <span className="text-amber-400">12.91 GB VRAM</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Architectural Note */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <h3 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          How the 3.04s Raw Clips Were Assembled into the 80s Short Film
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          On Kaggle’s free 16 GB Nvidia T4 GPU, Wan 2.2 generates a maximum of 73 frames (3.04s) before hitting out-of-memory limits. Rather than jarring abrupt loops or static pauses, our automated assembly engine (<code className="text-amber-300 font-mono">pipeline/assembly.py</code>) applies a <strong>1.35x temporal slowdown</strong> (stretching motion to 4.10s) and an automated <strong>subtle zoompan push (0% $\to$ 7%)</strong> on the cloned tail frames. This bridges each shot naturally to match the 8.5-second emotional Amharic narration.
        </p>
      </div>
    </div>
  );
}
