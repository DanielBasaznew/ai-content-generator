"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FilmPlayer from "../components/FilmPlayer";
import ReviewerRubric from "../components/ReviewerRubric";
import MemorySlider from "../components/MemorySlider";
import StoryboardGrid from "../components/StoryboardGrid";
import PipelineVisualizer from "../components/PipelineVisualizer";
import TelemetryView from "../components/TelemetryView";
import DocumentsView from "../components/DocumentsView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("film");

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Sidebar Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-h-screen">
        <div className="animate-in fade-in duration-200">
          {activeTab === "film" && <FilmPlayer />}
          {activeTab === "reviewers" && <ReviewerRubric />}
          {activeTab === "memory-lens" && <MemorySlider />}
          {activeTab === "storyboard" && <StoryboardGrid />}
          {activeTab === "pipeline" && <PipelineVisualizer />}
          {activeTab === "telemetry" && <TelemetryView />}
          {activeTab === "documents" && <DocumentsView />}
        </div>
      </main>
    </div>
  );
}
