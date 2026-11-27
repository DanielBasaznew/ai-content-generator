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

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("film");
  const [selectedDocId, setSelectedDocId] = useState<string>("REPORT.md");

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
      <main className="flex-1 w-full min-w-0 p-3.5 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-h-screen">
        <div className="animate-in fade-in duration-200">
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
