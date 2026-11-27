"use client";

import React, { useState } from "react";
import { FileText, ArrowUpRight, Copy, Check } from "lucide-react";

interface DocumentsViewProps {
  selectedDocId?: string;
  onSelectDoc?: (docId: string) => void;
}

export default function DocumentsView({ selectedDocId = "REPORT.md", onSelectDoc }: DocumentsViewProps) {
  const [activeDoc, setActiveDoc] = useState<string>(selectedDocId);
  const [copied, setCopied] = useState<boolean>(false);

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
      desc: "First-person technical & creative reflection by Daniel Basaznew covering all rubric dimensions." 
    },
    { 
      id: "ARCHITECTURE.md", 
      title: "System Architecture & Dataflow", 
      tag: "Engineering",
      desc: "Pipeline stages, SHA-256 caching logic, signal processing specs, and contract enforcement." 
    },
    { 
      id: "DESIGN.md", 
      title: "Audience & Design Intention", 
      tag: "Design Thinking",
      desc: "Target audience profiles, emotional narrative structure, and User Test 1 & 2 transcripts." 
    },
    { 
      id: "EXPERIMENTS.md", 
      title: "Generation Experiments Log", 
      tag: "11 Experiments",
      desc: "Controlled comparisons across TTS voices, video models, keyframe prompts, and audio ducking." 
    },
    { 
      id: "FAILURES.md", 
      title: "Failures & Blockers Log", 
      tag: "10 Workarounds",
      desc: "Documented technical incidents (Gemini 429, Kaggle T4 OOM, zoompan reset, ASS orphan wrap) and fixes." 
    },
    { 
      id: "COSTS.md", 
      title: "Cost & Resource Accounting", 
      tag: "$0.00 Spend",
      desc: "Audited ledger of 47 API/GPU invocations, 139.02 Kaggle GPU minutes, and $0.698 list equivalent." 
    },
    { 
      id: "ETHICS.md", 
      title: "Ethics, Consent & Provenance", 
      tag: "Provenance",
      desc: "Synthetic likeness Option A statement, cultural framing, and AI transparency disclosures." 
    },
    { 
      id: "README.md", 
      title: "Project Overview & Quickstart", 
      tag: "Setup",
      desc: "Repository layout, environment setup, and single-command film regeneration guide." 
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
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          Documentation Library
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Reports &amp; Engineering Logs
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
          All eight repository markdown documents detailing system architecture, controlled experiments, failure postmortems, and resource telemetry.
        </p>
      </div>

      {/* Document Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {docList.map((doc) => {
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => handleDocChange(doc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono shrink-0 transition border ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                  : "bg-zinc-950 text-zinc-500 hover:text-zinc-200 border-zinc-800/80"
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? "text-[#d4a359]" : "text-zinc-600"}`} />
              <span>{doc.id}</span>
            </button>
          );
        })}
      </div>

      {/* Viewer Panel */}
      <div className="glass-panel rounded-xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[#d4a359]">
                {currentDocMeta.tag}
              </span>
              <span className="text-xs text-zinc-500 font-mono">/{currentDocMeta.id}</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">{currentDocMeta.title}</h2>
            <p className="text-xs text-zinc-400 mt-1">{currentDocMeta.desc}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#d4a359]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? "Copied" : "Copy link"}</span>
            </button>

            <a
              href={`https://github.com/DanielBasaznew/ai-content-generator/blob/main/${activeDoc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition"
            >
              <span>Source</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Content */}
        {activeDoc === "REPORT.md" && (
          <div className="space-y-5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs">
              <span className="font-mono text-[#d4a359] uppercase text-[10px] mr-2">Executive Note</span>
              Authored in first-person singular by Daniel Basaznew, mapping implementation proofs to all six assessment dimensions.
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-1.5">
                1. System Architecture &amp; Software Engineering
              </h3>
              <p>
                My production system is anchored by <code className="text-zinc-200 font-mono">storyboard.json</code>, validated against JSON Schema Draft 2020-12 across 10 narrative shots totaling 80.0 seconds. Each stage runs idempotently through SHA-256 input hashing, yielding 0.15-second cached re-runs.
              </p>

              <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-1.5 pt-2">
                2. Hardest Technical Decisions
              </h3>
              <p>
                <strong>Wan 2.2 Duration Limit:</strong> Generating moving video on Kaggle 2× T4 hardware capped clips at 73 frames (3.04s) due to 15.64 GB VRAM constraints. I bridged the duration gap in FFmpeg using a 1.35× temporal slowdown paired with a 0%→7% dynamic tail zoompan push, matching each 6.5s–9.0s narration clip smoothly.
              </p>
              <p>
                <strong>Dual-Aspect Composition:</strong> Rather than cropping square generations destructively or adding flat pillarboxes for 16:9 widescreen, my assembly script composites the crisp foreground over 36-sigma Gaussian-blurred ambient wings.
              </p>

              <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-1.5 pt-2">
                3. Audience Testing &amp; Ethics
              </h3>
              <p>
                Two formal audience test cycles with real viewers refined voice pacing and deepened sidechain music ducking to -12 dB. Total cash spend was <strong className="text-zinc-100">$0.00</strong> ($0.698 list equivalent), using strictly synthetic character likenesses (Option A) with a 3-second AI provenance card.
              </p>
            </div>
          </div>
        )}

        {activeDoc === "ARCHITECTURE.md" && (
          <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <h3 className="text-sm font-semibold text-zinc-100">Stage Isolation &amp; Contracts</h3>
            <p>
              All pipeline modules live inside <code className="text-zinc-200 font-mono">pipeline/</code> and communicate solely via hashed disk artifacts governed by <code className="text-zinc-200 font-mono">storyboard.json</code>.
            </p>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5">
              <p>1. Contract Check · schema/storyboard.schema.json</p>
              <p>2. Amharic Narration · pipeline/narration.py → assets/narration/*.wav</p>
              <p>3. FLUX Keyframes · pipeline/keyframes.py → assets/keyframes/*.png</p>
              <p>4. Wan 2.2 Motion · pipeline/video.py → assets/clips/*.mp4</p>
              <p>5. ACE-Step Score · pipeline/music.py → assets/music/*.wav</p>
              <p>6. Final Assembly · pipeline/assembly.py → outputs/*/*.mp4</p>
            </div>
          </div>
        )}

        {activeDoc === "EXPERIMENTS.md" && (
          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Logged Experiments</h3>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-[#d4a359] mr-2">EXP-001</span> gemini-3.8-flash-tts (Charon) validated for natural Amharic cadence via Gemini audio QA.
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-[#d4a359] mr-2">EXP-004</span> Wan 2.2 TI2V-5B selected for camera coherence and historical architectural fidelity over SVD.
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-[#d4a359] mr-2">EXP-008</span> -12 dB sidechain attenuation chosen over -8 dB after Listener Test 1 noted vocal masking.
            </div>
          </div>
        )}

        {activeDoc === "FAILURES.md" && (
          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Documented Blockers &amp; Fixes</h3>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-zinc-100 mr-2">FAIL-001</span> Gemini TTS 429 quota at 3 RPM. Resolved via 21.0s pacing and retryDelay handling.
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-zinc-100 mr-2">FAIL-004</span> Wan 2.2 T4 OOM crash. Resolved by isolating UMT5 text encoding on CPU before GPU diffusion (12.91 GB peak).
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="font-mono text-zinc-100 mr-2">FAIL-009</span> FFmpeg zoompan counter reset on subclips &amp; orphan words in subtitles. Fixed with output frame index <code className="font-mono">on</code> and <code className="font-mono">_balance_two_lines()</code>.
            </div>
          </div>
        )}

        {!["REPORT.md", "ARCHITECTURE.md", "EXPERIMENTS.md", "FAILURES.md"].includes(activeDoc) && (
          <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <p>
              Full markdown specification committed at <code className="text-zinc-100 font-mono">/{activeDoc}</code>.
            </p>
            <p className="text-zinc-500 text-xs">
              Click <span className="text-zinc-300">Source</span> above to inspect the complete file on GitHub.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
