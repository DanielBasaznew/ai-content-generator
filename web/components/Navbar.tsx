"use client";

import React, { useState } from "react";
import { 
  Film, 
  CheckSquare, 
  Sliders, 
  Layers, 
  Cpu, 
  BarChart3, 
  FileText, 
  Github, 
  ExternalLink,
  Menu,
  X,
  Video,
  Download,
  ChevronDown,
  ArrowUpRight
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectDoc?: (docId: string) => void;
}

export default function Navbar({ activeTab, setActiveTab, onSelectDoc }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const mainNavItems = [
    { id: "film", label: "Film", icon: Film },
    { id: "reviewers", label: "For Reviewers", icon: CheckSquare },
    { id: "storyboard", label: "Storyboard", icon: Layers },
    { id: "pipeline", label: "Pipeline", icon: Cpu },
    { id: "raw-clips", label: "Kaggle · Wan 2.2", icon: Video },
    { id: "memory-lens", label: "Memory Lens", icon: Sliders },
    { id: "telemetry", label: "Telemetry", icon: BarChart3 },
  ];

  const docNavItems = [
    { id: "REPORT.md", label: "Written Report" },
    { id: "ARCHITECTURE.md", label: "Architecture" },
    { id: "DESIGN.md", label: "Design & Audience" },
    { id: "EXPERIMENTS.md", label: "Experiments" },
    { id: "FAILURES.md", label: "Failures" },
    { id: "COSTS.md", label: "Costs" },
    { id: "ETHICS.md", label: "Ethics & Provenance" },
    { id: "README.md", label: "Overview" },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handleSelectDocument = (docId: string) => {
    setActiveTab("documents");
    if (onSelectDoc) onSelectDoc(docId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 select-none">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4a359]">
              Harar Heritage Short
            </span>
            <h1 className="text-sm font-semibold text-zinc-100 truncate max-w-[205px] sm:max-w-xs">
              The Monument That Lives in My Memory
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
              download="harar_monument_horizontal_16x9.mp4"
              className="px-2.5 py-1.5 rounded-md bg-zinc-100 text-zinc-950 font-medium text-[11px] flex items-center gap-1 hover:bg-white transition"
            >
              <Download className="w-3 h-3" />
              <span>Film</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Quick-Switch Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4 scrollbar-none text-xs">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0 font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#d4a359]" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="pt-3 pb-2 mt-2.5 border-t border-zinc-800/80 space-y-3 max-h-[75vh] overflow-y-auto">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2.5 block mb-1">
                Navigation
              </span>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                      isActive
                        ? "bg-zinc-800/90 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#d4a359]" : "text-zinc-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-0.5 pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2.5 block mb-1">
                Documents
              </span>
              {docNavItems.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-left transition"
                >
                  <span>{doc.label}</span>
                  <span className="text-[10px] font-mono text-zinc-600">{doc.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-60 border-r border-zinc-800/80 bg-[#0b0b0e] flex-col justify-between shrink-0 h-screen sticky top-0 px-3.5 py-5 z-40 select-none overflow-y-auto">
        <div className="space-y-6">
          {/* Editorial Brand Header */}
          <div className="px-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4a359] block mb-1">
              Harar Heritage Short
            </span>
            <h1 className="text-sm font-semibold text-zinc-100 leading-snug tracking-tight">
              The Monument That Lives in My Memory
            </h1>
            <p className="text-[11px] text-zinc-500 mt-1">Harar, Ethiopia · 2026</p>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition ${
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#d4a359]" : "text-zinc-500"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Documents List */}
          <div className="space-y-0.5 pt-3 border-t border-zinc-800/70">
            <div className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Documents
            </div>

            {docNavItems.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDocument(doc.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 text-left transition"
              >
                <span className="truncate">{doc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quiet Author & Source Footer */}
        <div className="pt-4 border-t border-zinc-800/70 space-y-3">
          <div className="px-1 relative">
            <button
              onClick={() => setDownloadOpen(!downloadOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium text-xs hover:border-zinc-700 transition"
            >
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Download film</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition ${downloadOpen ? "rotate-180" : ""}`} />
            </button>

            {downloadOpen && (
              <div className="absolute left-1 right-1 bottom-9 p-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl z-50 text-xs space-y-0.5">
                <a
                  href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
                  download="harar_monument_horizontal_16x9.mp4"
                  onClick={() => setDownloadOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200"
                >
                  <span>16:9 Horizontal</span>
                  <span className="font-mono text-[10px] text-zinc-500">39 MB</span>
                </a>
                <a
                  href="/outputs/vertical/harar_monument_vertical_9x16.mp4"
                  download="harar_monument_vertical_9x16.mp4"
                  onClick={() => setDownloadOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200"
                >
                  <span>9:16 Vertical</span>
                  <span className="font-mono text-[10px] text-zinc-500">47 MB</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-[#d4a359] font-semibold flex items-center justify-center text-[11px] shrink-0">
              DB
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-200 truncate">Daniel Basaznew</div>
              <a
                href="https://github.com/DanielBasaznew/ai-content-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition"
              >
                <span>Source on GitHub</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
