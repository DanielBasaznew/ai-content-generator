"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FilmPlayer from "../components/FilmPlayer";
import ReviewerRubric from "../components/ReviewerRubric";
import MemorySlider from "../components/MemorySlider";
import StoryboardGrid from "../components/StoryboardGrid";
import PipelineVisualizer from "../components/PipelineVisualizer";
import RawClipsView from "../components/RawClipsView";
import TelemetryView from "../components/TelemetryView";
import DocumentsView from "../components/DocumentsView";
import { Download, ExternalLink, FileCode, Github, BookOpen, ChevronDown, Video, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("film");
  const [selectedDocId, setSelectedDocId] = useState<string>("REPORT.md");
  const [headerDownloadOpen, setHeaderDownloadOpen] = useState<boolean>(false);

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab("documents");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#080d1a] text-slate-100 selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
      {/* Responsive Navigation: Top bar on mobile + Sticky sidebar with DOCUMENTS on desktop */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSelectDoc={handleDocSelect} 
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 flex flex-col overflow-y-auto max-h-screen">
        {/* GLOBAL TOP UTILITY HEADER BAR (Desktop & Tablet — Eliminates empty top header space!) */}
        <div className="hidden sm:flex items-center justify-between gap-4 px-6 lg:px-10 py-3 border-b border-slate-800/80 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
          {/* Interactive Provenance & Feature Pills */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold tracking-wider">
            <button
              onClick={() => setActiveTab("film")}
              className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
            >
              AMHARIC NARRATION
            </button>
            <button
              onClick={() => setActiveTab("storyboard")}
              className="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition"
            >
              ENGLISH SUBTITLES
            </button>
            <button
              onClick={() => setActiveTab("raw-clips")}
              className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition"
            >
              WAN 2.2 CLIPS
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
            >
              MADE WITH AI • -14.0 LUFS
            </button>
          </div>

          {/* Direct Action Links in Header */}
          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            <a
              href="/assets/pipeline_diagram.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 hover:text-white hover:border-sky-500/50 transition"
              title="Open standalone animated Pipeline SVG"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Pipeline SVG</span>
            </a>

            <button
              onClick={() => handleDocSelect("REPORT.md")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Report</span>
            </button>

            <a
              href="https://github.com/DanielBasaznew/ai-content-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden md:inline">GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            {/* Download Film Button */}
            <div className="relative">
              <button
                onClick={() => setHeaderDownloadOpen(!headerDownloadOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download film</span>
                <ChevronDown className={`w-3 h-3 transition ${headerDownloadOpen ? "rotate-180" : ""}`} />
              </button>

              {headerDownloadOpen && (
                <div className="absolute right-0 mt-2 w-56 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs space-y-1">
                  <a
                    href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
                    download="harar_monument_horizontal_16x9.mp4"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                  >
                    <span>🖥️ Horizontal (16:9)</span>
                    <span className="font-mono text-[10px] text-slate-400">39 MB</span>
                  </a>
                  <a
                    href="/outputs/vertical/harar_monument_vertical_9x16.mp4"
                    download="harar_monument_vertical_9x16.mp4"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                  >
                    <span>📱 Vertical (9:16)</span>
                    <span className="font-mono text-[10px] text-slate-400">47 MB</span>
                  </a>
                  <a
                    href="/assets/pipeline_diagram.svg"
                    download="harar_monument_pipeline_diagram.svg"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-sky-300 border-t border-slate-800 transition"
                  >
                    <span>📐 Architecture Diagram</span>
                    <span className="font-mono text-[10px] text-slate-400">SVG</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active View Content */}
        <div className="p-3.5 sm:p-6 md:p-8 lg:p-10 animate-in fade-in duration-200">
          {activeTab === "film" && <FilmPlayer onNavigate={setActiveTab} />}
          {activeTab === "pipeline" && <PipelineVisualizer />}
          {activeTab === "raw-clips" && <RawClipsView onNavigate={setActiveTab} />}
          {activeTab === "reviewers" && <ReviewerRubric />}
          {activeTab === "memory-lens" && <MemorySlider />}
          {activeTab === "storyboard" && <StoryboardGrid />}
          {activeTab === "telemetry" && <TelemetryView />}
          {activeTab === "documents" && (
            <DocumentsView 
              selectedDocId={selectedDocId} 
              onSelectDoc={setSelectedDocId} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
