"use client";

import React from "react";
import { Cpu, ArrowDown, Database, Video, Music, Volume2, Film } from "lucide-react";

export default function PipelineVisualizer() {
  const stages = [
    {
      id: "schema",
      title: "1. Storyboard Contract",
      badge: "Draft 2020-12",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      description: "storyboard.json single source of truth validated against strict JSON Schema. Defines all 10 shots, camera moves, and timings.",
      tech: "jsonschema • Draft 2020-12",
      icon: Database
    },
    {
      id: "generators",
      title: "2. Parallel Generative Engines",
      badge: "Multi-Model",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      description: "Generates synchronized assets with SHA-256 caching by input prompt and parameter hash:",
      substages: [
        { name: "Voice Narration", tech: "Edge-TTS Amharic (10 WAV clips, 80.0s total)", status: "10/10 OK" },
        { name: "Character & Style Sheets", tech: "Cloudflare FLUX.1 (4 reference PNGs)", status: "4/4 OK" },
        { name: "Keyframe Generation", tech: "Cloudflare FLUX.1 (10 shot keyframes)", status: "10/10 OK" },
        { name: "Image-to-Video Animation", tech: "Kaggle Wan 2.2 TI2V-5B (10 MP4 clips)", status: "10/10 OK" },
        { name: "Original Background Score", tech: "Kaggle ACE-Step 1.5 (Selected 83.0s WAV)", status: "Auditioned" }
      ],
      icon: Cpu
    },
    {
      id: "assembly",
      title: "3. Deterministic FFmpeg Final Assembly",
      badge: "Broadcast Standard",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description: "pipeline/assembly.py combines all stems into final deliverables with zero manual editing:",
      substages: [
        { name: "Temporal Motion Normalization", tech: "1.35x frame blending + subtle zoompan push for 6.5s-10s slots" },
        { name: "Dual Aspect Adaptations", tech: "Vertical 9:16 crop + Horizontal 16:9 ambient motion wings" },
        { name: "Sidechain Audio Ducking", tech: "Music attenuates by -12dB when voice speaks (6:1 ratio, 300ms attack)" },
        { name: "EBU R128 Loudness Mastering", tech: "Two-pass normalization to exact -14.0 LUFS / -1.0 dBTP" },
        { name: "Burned ASS Subtitles & AI End Card", tech: "2-line balanced captions + 3.0s ethics disclosure" }
      ],
      icon: Film
    },
    {
      id: "deliverables",
      title: "4. Final Production Exports",
      badge: "Validated",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "Exported to outputs/ and ready for immediate playback, evaluation, and publishing:",
      outputs: [
        "outputs/vertical/harar_monument_vertical_9x16.mp4 (1080x1920, 83.0s)",
        "outputs/horizontal/harar_monument_horizontal_16x9.mp4 (1920x1080, 83.0s)"
      ],
      icon: Video
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
          <Cpu className="w-4 h-4" />
          <span>System Architecture</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">How the Whole Pipeline Works</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          One storyboard file is the contract. Every generation stage reads it, writes cached outputs by hash, and passes verified assets to the automated FFmpeg assembly engine.
        </p>
      </div>

      {/* Vertical Pipeline Flow */}
      <div className="space-y-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="relative">
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{stage.title}</h3>
                      <p className="text-xs text-slate-400">{stage.tech || "Automated Stage"}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3">{stage.description}</p>

                {/* Sub-stages if any */}
                {stage.substages && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                    {stage.substages.map((sub, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="font-semibold text-slate-200">{sub.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{sub.tech}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deliverables if any */}
                {stage.outputs && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
                    {stage.outputs.map((out, oIdx) => (
                      <div key={oIdx} className="px-3 py-2 rounded-lg bg-slate-900 text-sky-300 border border-slate-800">
                        {out}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connecting Down Arrow */}
              {idx < stages.length - 1 && (
                <div className="flex justify-center my-2 text-slate-600">
                  <ArrowDown className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
