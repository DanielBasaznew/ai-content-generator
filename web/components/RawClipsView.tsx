"use client";

import React, { useState } from "react";
import { Download, ArrowUpRight } from "lucide-react";
import { RAW_CLIPS } from "../lib/data";

interface RawClipsViewProps {
  onNavigate?: (tab: string) => void;
}

export default function RawClipsView({ onNavigate }: RawClipsViewProps) {
  const [showKeyframeCompare, setShowKeyframeCompare] = useState<Record<string, boolean>>({});

  const toggleCompare = (shotId: string) => {
    setShowKeyframeCompare((prev) => ({
      ...prev,
      [shotId]: !prev[shotId]
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
              Kaggle · Wan 2.2 TI2V-5B · 2× Nvidia T4
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Output · The 10 Raw Clips
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
              Unprocessed video stems straight from Kaggle before 1.35× temporal slowing, subtle zoompan tail extensions, and dual-aspect reframing. Toggle <span className="text-zinc-200">Compare Still</span> to verify keyframe adherence.
            </p>
          </div>

          <a
            href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
            download="harar_monument_horizontal_16x9.mp4"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition shrink-0 self-start"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Final Film</span>
          </a>
        </div>

        {/* Clean Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Resolution</span>
            <span className="font-medium text-zinc-200 tabular-nums">512×512 (480p)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Length per Clip</span>
            <span className="font-medium text-zinc-200 tabular-nums">73 frames · 24 fps (3.04s)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Kaggle Session Time</span>
            <span className="font-medium text-[#d4a359] tabular-nums">131.15 GPU min ($0.00)</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Peak VRAM (FAIL-004)</span>
            <span className="font-medium text-zinc-200 tabular-nums">12.91 / 15.64 GB (CPU offload)</span>
          </div>
        </div>
      </div>

      {/* Grid of 10 Clips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {RAW_CLIPS.map((clip) => {
          const isComparing = showKeyframeCompare[clip.shot_id];
          return (
            <div
              key={clip.shot_id}
              className="glass-card rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full bg-black overflow-hidden border-b border-zinc-800/80">
                  {isComparing ? (
                    <img
                      src={clip.keyframe_path}
                      alt={clip.title}
                      className="w-full h-full object-cover"
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

                  <div className="absolute top-2 left-2 bg-zinc-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200 border border-zinc-800 pointer-events-none">
                    Shot {clip.order}
                  </div>

                  <button
                    onClick={() => toggleCompare(clip.shot_id)}
                    className="absolute top-2 right-2 bg-zinc-950/85 hover:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 border border-zinc-700 transition"
                  >
                    {isComparing ? "Video" : "Still"}
                  </button>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                    <span>s{clip.order} · {clip.resolution.split(" ")[0]}</span>
                    <span>{clip.num_frames} frames</span>
                  </div>

                  <div className="text-xs font-semibold text-zinc-100 truncate" title={clip.title}>
                    {clip.title}
                  </div>

                  <div className="p-2 rounded bg-zinc-950/80 border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1 font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Inference</span>
                      <span className="text-zinc-200">{clip.gpu_inference_min} GPU min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Seed</span>
                      <span className="text-zinc-300">{clip.seed}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {clip.prompt}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-2.5 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                <span>Wan 2.2 TI2V</span>
                <span className="text-[#d4a359]">12.91 GB VRAM</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Rationale */}
      <div className="glass-panel rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#d4a359]">
            Temporal Extension Note
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Kaggle&apos;s 15.64 GB T4 VRAM limited raw generation to 73 frames (3.04s). During assembly, <code className="text-zinc-200 font-mono">pipeline/assembly.py</code> applies a 1.35× temporal slowdown and subtle 0%→7% zoompan continuation across tail frames to match each 6.5s–9.0s Amharic narration segment seamlessly.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("storyboard")}
            className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 shrink-0"
          >
            <span>View Storyboard</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
