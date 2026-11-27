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
import { Download, ArrowUpRight, FileCode, Github, BookOpen, ChevronDown } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("film");
  const [selectedDocId, setSelectedDocId] = useState<string>("REPORT.md");
  const [headerDownloadOpen, setHeaderDownloadOpen] = useState<boolean>(false);

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab("documents");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSelectDoc={handleDocSelect} 
      />

      <main className="flex-1 w-full min-w-0 flex flex-col overflow-y-auto max-h-screen">
        {/* Clean Minimal Top Header Bar */}
        <div className="hidden sm:flex items-center justify-between gap-4 px-6 lg:px-10 py-3 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
          {/* Restrained Metadata Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <button
              onClick={() => setActiveTab("film")}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition"
            >
              AMHARIC AUDIO
            </button>
            <button
              onClick={() => setActiveTab("storyboard")}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition"
            >
              ENGLISH SUBTITLES
            </button>
            <button
              onClick={() => setActiveTab("raw-clips")}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition"
            >
              WAN 2.2 CLIPS
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition"
            >
              MADE WITH AI · -14.0 LUFS
            </button>
          </div>

          {/* Direct Action Links */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <a
              href="/assets/pipeline_diagram.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xl:inline">Pipeline SVG</span>
            </a>

            <button
              onClick={() => handleDocSelect("REPORT.md")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xl:inline">Report</span>
            </button>

            <a
              href="https://github.com/DanielBasaznew/ai-content-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <Github className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">GitHub</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-500" />
            </a>

            <div className="relative">
              <button
                onClick={() => setHeaderDownloadOpen(!headerDownloadOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-950 font-semibold hover:bg-white transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download film</span>
                <ChevronDown className={`w-3 h-3 transition ${headerDownloadOpen ? "rotate-180" : ""}`} />
              </button>

              {headerDownloadOpen && (
                <div className="absolute right-0 mt-1.5 w-52 p-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl z-50 text-xs space-y-0.5">
                  <a
                    href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
                    download="harar_monument_horizontal_16x9.mp4"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-zinc-800 text-zinc-200 transition"
                  >
                    <span>Horizontal (16:9)</span>
                    <span className="font-mono text-[10px] text-zinc-500">39 MB</span>
                  </a>
                  <a
                    href="/outputs/vertical/harar_monument_vertical_9x16.mp4"
                    download="harar_monument_vertical_9x16.mp4"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-zinc-800 text-zinc-200 transition"
                  >
                    <span>Vertical (9:16)</span>
                    <span className="font-mono text-[10px] text-zinc-500">47 MB</span>
                  </a>
                  <a
                    href="/assets/pipeline_diagram.svg"
                    download="harar_monument_pipeline_diagram.svg"
                    onClick={() => setHeaderDownloadOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-zinc-800 text-zinc-300 border-t border-zinc-800 transition"
                  >
                    <span>Architecture Diagram</span>
                    <span className="font-mono text-[10px] text-zinc-500">SVG</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Page Canvas */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
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
