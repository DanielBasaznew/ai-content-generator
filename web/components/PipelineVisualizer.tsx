"use client";

import React, { useState } from "react";
import { 
  Play, 
  RotateCcw, 
  ExternalLink, 
  FileCode, 
  Image as ImageIcon,
  Volume2,
  Film,
  Terminal
} from "lucide-react";

interface PipelineNode {
  id: string;
  number: string;
  title: string;
  badge: string;
  summary: string;
  tech: string;
  inputs: string;
  outputs: string;
  command: string;
  latency: string;
  keyDetails: string[];
}

export default function PipelineVisualizer() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("schema");
  const [activeDiagramView, setActiveDiagramView] = useState<"pipeline" | "caching" | "signals">("pipeline");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<"idle" | "running" | "done">("idle");

  const nodes: Record<string, PipelineNode> = {
    schema: {
      id: "schema",
      number: "01",
      title: "Contract & Schema Gate (storyboard.json)",
      badge: "Draft 2020-12",
      summary: "storyboard.json serves as the strict, single source of truth connecting all Phase 1 and Phase 2 stages.",
      tech: "jsonschema · Draft 2020-12",
      inputs: "storyboard.json + schema/storyboard.schema.json",
      outputs: "Validated runtime state (10 shots, 80.0s)",
      command: "python make_film.py",
      latency: "0.02s check",
      keyDetails: [
        "Enforces contiguous shot order 1–10 and unique shot_id identifiers.",
        "Guarantees total shot timeline equals 80.0s (within 60–90s rubric window).",
        "Governs Amharic voice lines, English subtitles, prompts, seeds, and AI end card disclosures."
      ]
    },
    cache: {
      id: "cache",
      number: "02",
      title: "SHA-256 Input-Hash Cache Gate",
      badge: "0.15s Replay",
      summary: "Hashes prompts, models, seeds, and parameters per shot before model inference. Cache hits skip API/GPU inference straight from assets/.",
      tech: "hashlib.sha256 · Per-stage manifests",
      inputs: "Prompt strings, seeds, model IDs, dimensions",
      outputs: "keyframes_cache.json, clips_cache.json, assembly_cache.json",
      command: "Integrated across pipeline/*.py",
      latency: "0.15s cached rebuild",
      keyDetails: [
        "Cache Hit Route: Bypasses AI APIs and Kaggle GPUs, loading existing assets straight from assets/.",
        "Cache Miss Route: Re-runs inference for only the edited shot (Rubric Step 3 proof).",
        "Saved over 450 seconds of compute time across audio, subtitle, and end-card edits."
      ]
    },
    tts: {
      id: "tts",
      number: "03A",
      title: "Amharic Narration (Gemini 3.8 Flash TTS)",
      badge: "gemini-3.8-flash-tts",
      summary: "Synthesizes native Amharic narration (voice Charon) with natural cadence aligned to the childhood narrative.",
      tech: "gemini-3.8-flash-tts · Voice Charon",
      inputs: "Amharic narration lines in storyboard.json",
      outputs: "assets/narration/shot-*.wav (64.85s spoken audio)",
      command: "python -m pipeline.narration",
      latency: "21.0s RPM pacing",
      keyDetails: [
        "Audited via Gemini QA check (EXP-001) to catch mispronounced phrasing.",
        "21.0s pacing + retryDelay backoff eliminated HTTP 429 quota limits (FAIL-001).",
        "10 stems timed directly into the 80.0s film timeline."
      ]
    },
    keyframes: {
      id: "keyframes",
      number: "03B",
      title: "Photorealistic Keyframes (FLUX.2 Klein 4B)",
      badge: "flux-2-klein-4b",
      summary: "Generates 1024×1024 Harar street, character, and monument keyframes conditioned on Step 6 reference sheets.",
      tech: "Cloudflare Workers AI · @cf/black-forest-labs/flux-2-klein-4b",
      inputs: "Shot prompts, framing hints, 4 reference PNGs",
      outputs: "assets/keyframes/shot-*.png (1024×1024)",
      command: "python -m pipeline.keyframes",
      latency: "139.33s across 11 calls",
      keyDetails: [
        "Preserves Jugol stone wall textures, 1990s clothing, and bronze statue structure.",
        "Deterministic seeds (2001–2010) ensure visual consistency.",
        "Feeds directly into Phase 2 Kaggle 2× T4 image-to-video generation."
      ]
    },
    video: {
      id: "video",
      number: "03C",
      title: "Video Motion Clips (Kaggle Wan 2.2 TI2V-5B)",
      badge: "Wan 2.2 TI2V-5B",
      summary: "Animates the 10 Phase-1 still keyframes into 73-frame MP4 clips on Kaggle 2× Nvidia T4 GPUs.",
      tech: "Wan-AI/Wan2.2-TI2V-5B-Diffusers · 2× T4 GPU",
      inputs: "assets/keyframes/shot-*.png + seeds 3001–3020",
      outputs: "assets/clips/shot-*.mp4 (512×512, 73f @ 24fps)",
      command: "python -m pipeline.video",
      latency: "131.15 GPU session min",
      keyDetails: [
        "CPU UMT5 pre-encoding cleared 15.64 GB VRAM OOM errors on Kaggle (FAIL-004, 12.91 GB peak).",
        "All 10 raw clips are inspectable inside the Kaggle · Wan 2.2 tab.",
        "Cached in assets/clips/ and temporally extended during assembly."
      ]
    },
    music: {
      id: "music",
      number: "03D",
      title: "Original Score (ACE-Step 1.5)",
      badge: "ACE-Step 1.5",
      summary: "Auditioned four acoustic instrumental candidates on Kaggle T4 GPU; selected 83.0s master underscore.",
      tech: "ACE-Step/Ace-Step1.5 · Kaggle T4",
      inputs: "Musical mood cues in storyboard.json",
      outputs: "assets/music/harar_memory_score.wav (83.0s)",
      command: "python -m pipeline.music",
      latency: "7.87 GPU session min",
      keyDetails: [
        "Acoustic krar-inspired underscore avoids synthetic vocal artifacts.",
        "Mixed with 2.5s tail fade across the final 3.0s end card.",
        "Sidechain-ducked by -12 dB underneath narration."
      ]
    },
    subtitles: {
      id: "subtitles",
      number: "03E",
      title: "ASS Subtitle Engine (_balance_two_lines)",
      badge: "Deterministic Code",
      summary: "Wraps full English sentences into symmetric two-line ASS captions with zero single-word orphans.",
      tech: "pipeline/assembly.py · _balance_two_lines()",
      inputs: "storyboard.json → english_subtitle_text",
      outputs: "subtitles_vertical.ass & subtitles_horizontal.ass",
      command: "python make_film.py",
      latency: "< 0.05s generation",
      keyDetails: [
        "Eliminates awkward trailing single words via midpoint word wrapping (FAIL-009).",
        "Preserves complete readable sentences for both 9:16 mobile and 16:9 widescreen.",
        "Burned deterministically with libass during final encoding."
      ]
    },
    assembly: {
      id: "assembly",
      number: "04",
      title: "Deterministic FFmpeg Assembly Engine",
      badge: "Broadcast EBU R128",
      summary: "Combines Phase 1 stems, ASS subtitles, Pillow end card, and Phase 2 clips with zero manual editing.",
      tech: "FFmpeg 9.1 · Pillow 48-Step Gradient",
      inputs: "Verified Disk Store (assets/) + Subtitles",
      outputs: "outputs/vertical/*.mp4 & outputs/horizontal/*.mp4",
      command: "python make_film.py",
      latency: "0.15s cached · 460s full encode",
      keyDetails: [
        "Temporal Math: 1.35× slow motion + 0%→7% zoompan push across tail frames.",
        "Sidechain Ducking: -12 dB music dip when voice speaks (6:1 ratio, 300ms attack).",
        "Loudness: Two-pass EBU R128 loudnorm at -14.0 LUFS / -1.0 dBTP.",
        "Dual-Aspect: 16:9 uses 36σ Gaussian motion wings; 9:16 uses anchor crop."
      ]
    },
    deliverables: {
      id: "deliverables",
      number: "05",
      title: "Dual Broadcast Deliverables",
      badge: "Verified Masters",
      summary: "Final verified MP4 deliverables ready for vertical mobile distribution and horizontal archival screening.",
      tech: "H.264 High@L4.1 · AAC 192 kbps",
      inputs: "Assembled video + mastered audio + 3.0s AI disclosure",
      outputs: "9:16 (47 MB) & 16:9 (39 MB)",
      command: "make verify",
      latency: "CDN ready",
      keyDetails: [
        "Vertical 9:16: 1080×1920 | 83.0s | -14.0 LUFS | Full burned captions.",
        "Horizontal 16:9: 1920×1080 | 83.0s | -14.0 LUFS | Ambient motion wings.",
        "Tracked with 47 API/GPU runs + 3 FFmpeg builds and 42 unit tests."
      ]
    }
  };

  const selectedNode = nodes[selectedNodeId] || nodes.schema;

  const triggerLiveSimulation = () => {
    setSimulating(true);
    setSimStep("running");
    setTimeout(() => {
      setSimStep("done");
      setSimulating(false);
    }, 2200);
  };

  const resetSimulation = () => {
    setSimStep("idle");
    setSimulating(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          System Architecture
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Pipeline Architecture &amp; Dataflow
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
          Governed left-to-right by <code className="text-zinc-200 font-mono">storyboard.json</code>. Phase 1 validates the contract, routes SHA-256 cache hits/misses, and encodes both aspect masters; Phase 2 renders motion on Kaggle 2× T4 GPUs.
        </p>
      </div>

      {/* View Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveDiagramView("pipeline")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeDiagramView === "pipeline"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          1. System Diagram
        </button>

        <button
          onClick={() => setActiveDiagramView("caching")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeDiagramView === "caching"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          2. Selective Regeneration Demo
        </button>

        <button
          onClick={() => setActiveDiagramView("signals")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeDiagramView === "signals"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          3. Audio &amp; Aspect Specs
        </button>
      </div>

      {/* VIEW 1: VECTOR PIPELINE DIAGRAM */}
      {activeDiagramView === "pipeline" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-3 sm:p-5 bg-[#090a0d]">
            <div className="overflow-x-auto pb-2 rounded-lg border border-zinc-800/80 bg-[#090a0d]">
              <div className="min-w-[920px] w-full">
                <a
                  href="/assets/pipeline_diagram.svg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative cursor-zoom-in"
                  title="Open vector SVG full screen"
                >
                  <object
                    type="image/svg+xml"
                    data="/assets/pipeline_diagram.svg"
                    className="w-full aspect-[1600/1050] pointer-events-none block rounded"
                    aria-label="System Architecture Pipeline Diagram"
                  >
                    <img
                      src="/assets/pipeline_diagram.png"
                      alt="System Architecture Pipeline Diagram"
                      className="w-full h-auto block rounded"
                    />
                  </object>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3.5 pt-3 border-t border-zinc-800/80 px-1 text-xs">
              <span className="text-zinc-500">
                Click diagram to inspect full scale (scroll horizontally on phone). Animated dashes trace active data direction.
              </span>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="/assets/pipeline_diagram.svg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Full SVG</span>
                </a>
                <a
                  href="/assets/pipeline_diagram.svg"
                  download="harar_monument_pipeline_diagram.svg"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span>SVG</span>
                </a>
                <a
                  href="/assets/pipeline_diagram.png"
                  download="harar_monument_pipeline_diagram.png"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-950 font-semibold hover:bg-white transition"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </a>
              </div>
            </div>
          </div>

          {/* Stage Selector */}
          <div className="glass-panel rounded-xl p-4 sm:p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
              Select Component to Inspect Parameters
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.values(nodes).map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      isSelected
                        ? "bg-zinc-800/90 border-zinc-600 text-zinc-100"
                        : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className={`text-[10px] font-mono mb-0.5 ${isSelected ? "text-[#d4a359]" : "text-zinc-600"}`}>
                      {node.number}
                    </div>
                    <div className="text-xs font-medium truncate">{node.title.split("(")[0].trim()}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SELECTIVE REGENERATION DEMO */}
      {activeDiagramView === "caching" && (
        <div className="glass-panel rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-5 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Selective Invalidation Trace (Walkthrough Proof)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Editing one shot invalidates only its SHA-256 hash while all remaining shots replay directly from assets/ in 0.15s.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={triggerLiveSimulation}
                disabled={simulating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{simulating ? "Hashing..." : "Simulate Edit Shot 01"}</span>
              </button>
              {simStep !== "idle" && (
                <button
                  onClick={resetSimulation}
                  className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-zinc-100">Shot 01 · Hash Mismatch</span>
                <span className="text-[10px] font-mono text-[#d4a359]">Re-generated</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Triggers single model invocation for the modified prompt, writing an updated asset without touching Shots 02–10.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-zinc-100">Shots 02–10 · Hash Match</span>
                <span className="text-[10px] font-mono text-zinc-400">0.15s Cache Hit</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Bypasses all API and GPU stages, reading existing verified stems straight from disk into assembly.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-black p-4 border border-zinc-800 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-500 pb-2 mb-2 border-b border-zinc-900">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                python -m pipeline.keyframes &amp;&amp; python make_film.py
              </span>
              <span className="text-[10px]">exit 0</span>
            </div>

            {simStep === "idle" && (
              <p className="text-zinc-600 py-1">Click &quot;Simulate Edit Shot 01&quot; above to inspect the console output.</p>
            )}
            {simStep === "running" && (
              <div className="space-y-1 text-zinc-300">
                <p className="text-zinc-400">[Stage 1/3] Validating storyboard.json Draft 2020-12 schema... OK</p>
                <p className="text-[#d4a359]">[Stage 2/3] Shot 01 hash mismatch → regenerating FLUX keyframe...</p>
                <p className="text-zinc-500">[Stage 2/3] Shots 02–10 hash match → skipped [0.15s]</p>
              </div>
            )}
            {simStep === "done" && (
              <div className="space-y-1 text-zinc-300">
                <p className="text-zinc-200">{"{'model': '@cf/black-forest-labs/flux-2-klein-4b', 'generated': 1, 'cached': 9}"}</p>
                <p className="text-zinc-400">[Stage 3/3] Re-assembled vertical 9:16 &amp; horizontal 16:9 masters (-14.0 LUFS)</p>
                <p className="text-[#d4a359]">Done: 1 regenerated, 9 cached.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SIGNAL SPECS */}
      {activeDiagramView === "signals" && (
        <div className="glass-panel rounded-xl p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Audio &amp; Visual Signal Processing (FFmpeg)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automated signal chain inside <code className="font-mono text-zinc-300">pipeline/assembly.py</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-[#d4a359]" />
                  Sidechain Ducking
                </span>
                <span className="font-mono text-[10px] text-zinc-500">-12 dB · -14.0 LUFS</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Narration triggers <code className="text-zinc-300 font-mono">sidechaincompress</code> (ratio 6:1, 300ms attack, 1500ms release), dipping background music by 12 dB during speech before 2-pass <code className="text-zinc-300 font-mono">loudnorm</code> mastering.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-[#d4a359]" />
                  Dual-Aspect Framing
                </span>
                <span className="font-mono text-[10px] text-zinc-500">16:9 &amp; 9:16</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Widescreen 16:9 composites sharp square motion over 36-sigma Gaussian-blurred ambient wings (<code className="text-zinc-300 font-mono">gblur=sigma=36</code>); vertical 9:16 applies an anchor-aware focus crop.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Card */}
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[#d4a359] font-mono text-xs">
              {selectedNode.number}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{selectedNode.title}</h3>
              <p className="text-xs font-mono text-zinc-500">{selectedNode.tech}</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 self-start sm:self-auto">
            {selectedNode.badge}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 mb-4 leading-relaxed">
          {selectedNode.summary}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Input</div>
            <div className="text-zinc-200 mt-0.5 truncate">{selectedNode.inputs}</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Output</div>
            <div className="text-zinc-200 mt-0.5 truncate">{selectedNode.outputs}</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Command</div>
            <div className="font-mono text-[#d4a359] mt-0.5 truncate">{selectedNode.command}</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Performance</div>
            <div className="text-zinc-200 mt-0.5 tabular-nums">{selectedNode.latency}</div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Implementation Details</div>
          {selectedNode.keyDetails.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2 text-zinc-300">
              <span className="text-[#d4a359] shrink-0">·</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
