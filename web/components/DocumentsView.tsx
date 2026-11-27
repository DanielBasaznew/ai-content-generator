"use client";

import React, { useState } from "react";
import { 
  FileText, 
  BookOpen, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Terminal, 
  Sparkles,
  FileCode
} from "lucide-react";

interface DocumentsViewProps {
  selectedDocId?: string;
  onSelectDoc?: (docId: string) => void;
}

export default function DocumentsView({ selectedDocId = "REPORT.md", onSelectDoc }: DocumentsViewProps) {
  const [activeDoc, setActiveDoc] = useState<string>(selectedDocId);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync if prop changes
  React.useEffect(() => {
    if (selectedDocId) {
      setActiveDoc(selectedDocId);
    }
  }, [selectedDocId]);

  const handleDocChange = (id: string) => {
    setActiveDoc(id);
    if (onSelectDoc) onSelectDoc(id);
  };

  const docList = [
    { 
      id: "REPORT.md", 
      title: "Comprehensive Written Report", 
      tag: "Primary Submission",
      desc: "Full 6-part narrative written from Daniel Basaznew's first-person perspective, addressing all 10 Academy evaluation criteria." 
    },
    { 
      id: "ARCHITECTURE.md", 
      title: "System Architecture & Flow", 
      tag: "Engineering",
      desc: "Visual pipeline dataflow, SHA-256 caching gate, signal processing specs, and stage-by-stage tool contracts." 
    },
    { 
      id: "DESIGN.md", 
      title: "Audience & Design Intention", 
      tag: "Design Thinking",
      desc: "Audience archetypes, emotional arc, and complete logs for Audience Test 1 (Radio Cut) and Audience Test 2 (Near-Final)." 
    },
    { 
      id: "EXPERIMENTS.md", 
      title: "Generation Experiments Log", 
      tag: "11 Experiments",
      desc: "Logged benchmarks comparing ElevenLabs vs Gemini TTS, SVD vs Wan 2.2, SDXL vs FLUX.1, and sidechain parameters." 
    },
    { 
      id: "FAILURES.md", 
      title: "Failures & Blockers Log", 
      tag: "10 Workarounds",
      desc: "Real documented roadblocks (Gemini 429 quota, Wan 2.2 Kaggle OOM, zoompan bug, ASS orphan words) and their fixes." 
    },
    { 
      id: "COSTS.md", 
      title: "Cost & Resource Accounting", 
      tag: "$0.00 Spend",
      desc: "Audited ledger of 46 model invocations, 77.2 Kaggle GPU minutes, and $0.00 cash outlay via developer free tiers." 
    },
    { 
      id: "ETHICS.md", 
      title: "Ethics, Consent & Provenance", 
      tag: "Transparency",
      desc: "Likeness Option A (purely synthetic characters), cultural sensitivity around the Harar monument, and AI disclosure." 
    },
    { 
      id: "README.md", 
      title: "Project Overview & Quickstart", 
      tag: "Quickstart",
      desc: "High-level summary, repository layout, installation guide, and single-command film reproduction instructions." 
    }
  ];

  const currentDocMeta = docList.find((d) => d.id === activeDoc) || docList[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://github.com/DanielBasaznew/ai-content-generator/blob/main/${activeDoc}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">
          <BookOpen className="w-4 h-4" />
          <span>Project Documentation Library</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Repository Reports & Technical Docs</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          All 8 markdown documentation files committed to the repository, addressing every requirement of the 10 Academy evaluation rubric.
        </p>
      </div>

      {/* Document Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {docList.map((doc) => {
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => handleDocChange(doc.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition border ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800"
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
              <span>{doc.id}</span>
            </button>
          );
        })}
      </div>

      {/* Active Document Viewer Panel */}
      <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentDocMeta.tag}
              </span>
              <span className="text-xs text-slate-400 font-mono">/{currentDocMeta.id}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{currentDocMeta.title}</h2>
            <p className="text-xs text-slate-300 mt-1">{currentDocMeta.desc}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
              title="Copy GitHub Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>

            <a
              href={`https://github.com/DanielBasaznew/ai-content-generator/blob/main/${activeDoc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow-sm"
            >
              <span>GitHub File</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Formatted Content Preview Based on Selected Document */}
        {activeDoc === "REPORT.md" && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <strong>Official Capstone Written Report:</strong> Authored in the first-person singular by Daniel Basaznew, covering all six evaluation dimensions.
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-1">
                1. System Architecture & Software Engineering (Rubric: 20 pts)
              </h3>
              <p>
                My pipeline for <em>"The Monument That Lives in My Memory"</em> is structured around a single source of truth: <code className="text-amber-300 font-mono">storyboard.json</code>, validated against strict JSON Schema (Draft 2020-12). It governs 10 narrative shots totaling exactly 80.0 seconds. Downstream stages (Gemini TTS narration, FLUX.1 keyframes, Wan 2.2 video clips, ACE-Step audio, and FFmpeg assembly) communicate strictly through files on disk, with deterministic SHA-256 caching ensuring that sub-second re-runs take only <strong>0.15s</strong>.
              </p>

              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-1 pt-2">
                2. Hardest Technical Decisions & Workarounds
              </h3>
              <p>
                <strong>The 3.04s Duration Ceiling:</strong> Running Wan 2.2 on Kaggle’s 16GB Nvidia T4 GPU capped generation to 73 frames (3.04s) to avoid out-of-memory errors (FAIL-004). Rather than abrupt loops, I engineered a <strong>1.35x temporal slowdown</strong> in FFmpeg combined with an automated <strong>subtle zoompan forward push (0% $\to$ 7%)</strong> on the cloned tail frame, seamlessly bridging each shot to the 8.5s narration.
              </p>
              <p>
                <strong>Dual-Aspect Composition:</strong> To prevent slicing off subjects when adapting 1080×1080 square frames to 16:9 widescreen, I split the video into a sharp centered foreground layered over a 36-sigma Gaussian-blurred motion background (<code className="text-amber-300 font-mono">gblur=sigma=36</code>).
              </p>

              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-1 pt-2">
                3. Design Thinking & Audience Testing
              </h3>
              <p>
                I conducted two complete audience testing cycles with 3 real participants each. <strong>Audience Test 1 (Radio Cut)</strong> revealed that early Amharic narration was slightly rushed and music overpowered the voice. I deepened the sidechain compressor ducking from -8 dB to -12 dB. <strong>Audience Test 2</strong> refined the 16:9 ambient wings and AI disclosure typography.
              </p>

              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-1 pt-2">
                4. Resource Efficiency & Ethics
              </h3>
              <p>
                Total actual production cost was <strong>$0.00</strong> across 46 model invocations, utilizing free tiers and Kaggle GPU quota (commercial equivalent: $0.698). Likeness follows <strong>Option A (purely synthetic)</strong>, ensuring no real persons were imitated, and the film honors the cultural memory of the Harar monument destroyed in 2020.
              </p>
            </div>
          </div>
        )}

        {activeDoc === "ARCHITECTURE.md" && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <h3 className="text-base font-bold text-white">Pipeline Specifications & Contracts</h3>
            <p>
              The production system is structured as a modular, reproducible pipeline with isolated stages under <code className="text-amber-300 font-mono">pipeline/</code>. Stages communicate through disk files and share <code className="text-amber-300 font-mono">storyboard.json</code>.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 space-y-1">
              <p>Stage 1: Contract Validation (schema/storyboard.schema.json)</p>
              <p>Stage 2: Narration (pipeline/narration.py $\to$ assets/narration/*.wav)</p>
              <p>Stage 3: Keyframes (pipeline/keyframes.py $\to$ assets/keyframes/*.png)</p>
              <p>Stage 4: Video Clips (pipeline/video.py $\to$ assets/clips/*.mp4)</p>
              <p>Stage 5: Soundtrack (pipeline/music.py $\to$ assets/music/*.wav)</p>
              <p>Stage 6: Assembly Engine (pipeline/assembly.py $\to$ outputs/*/*.mp4)</p>
            </div>
          </div>
        )}

        {activeDoc === "EXPERIMENTS.md" && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <h3 className="text-base font-bold text-white">11 Logged Model & Parameter Experiments</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-300">EXP-001 (TTS Model Comparison):</span> ElevenLabs vs OpenAI TTS vs Gemini 2.5 Flash TTS. <em>Result:</em> Gemini won for culturally authentic Amharic phonemes and natural breath cadence.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-300">EXP-004 (Video Model Comparison):</span> SVD vs AnimateDiff vs Wan 2.2. <em>Result:</em> Wan 2.2 retained architectural coherence and smooth camera vectors without morphing.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-300">EXP-008 (Audio Ducking Depth):</span> Tested -6 dB, -8 dB, -12 dB, -18 dB. <em>Result:</em> -12 dB provided optimal speech intelligibility over acoustic krar strings.
              </div>
            </div>
          </div>
        )}

        {activeDoc === "FAILURES.md" && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <h3 className="text-base font-bold text-white">10 Documented Production Roadblocks & Fixes</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-400">FAIL-001:</span> Gemini TTS 429 quota at 3 RPM. <em>Fix:</em> Implemented 21.0s pacing and persistent SHA-256 disk cache.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-400">FAIL-004:</span> Wan 2.2 Kaggle T4 VRAM OOM crash. <em>Fix:</em> Pre-encoded text on CPU with UMT5, offloaded from RAM, then loaded DiT transformer on GPU.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-400">FAIL-009:</span> FFmpeg zoompan frame counter reset on subclips. <em>Fix:</em> Switched from `in` to `on` (output frame counter).
              </div>
            </div>
          </div>
        )}

        {/* Fallback for other documents */}
        {!["REPORT.md", "ARCHITECTURE.md", "EXPERIMENTS.md", "FAILURES.md"].includes(activeDoc) && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <p>
              This document (<code className="text-amber-300 font-mono">{activeDoc}</code>) is fully committed in the repository root.
            </p>
            <p className="text-slate-400">
              Click <strong>"GitHub File"</strong> above to inspect the complete source on GitHub, or run <code className="text-slate-300 font-mono">cat {activeDoc}</code> in the terminal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
