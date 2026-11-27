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
  Sparkles,
  Video,
  Download,
  BookOpen,
  ChevronDown
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
    { id: "film", label: "Film", icon: Film, badge: "Master" },
    { id: "reviewers", label: "For Reviewers", icon: CheckSquare, badge: "Rubric" },
    { id: "storyboard", label: "Storyboard", icon: Layers, badge: "10 Shots" },
    { id: "pipeline", label: "Pipeline", icon: Cpu, badge: "Graph" },
    { id: "raw-clips", label: "Kaggle - Wan 2.2", icon: Video, badge: "10 Clips" },
    { id: "memory-lens", label: "Memory Lens", icon: Sliders, badge: "Interactive" },
    { id: "telemetry", label: "Telemetry", icon: BarChart3, badge: "Logs" },
  ];

  const docNavItems = [
    { id: "REPORT.md", label: "Comprehensive Report" },
    { id: "ARCHITECTURE.md", label: "Architecture" },
    { id: "DESIGN.md", label: "Design & Audience" },
    { id: "EXPERIMENTS.md", label: "Experiments" },
    { id: "FAILURES.md", label: "Failures & Blockers" },
    { id: "COSTS.md", label: "Costs & Accounting" },
    { id: "ETHICS.md", label: "Ethics & Likeness" },
    { id: "README.md", label: "Project Overview" },
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
      {/* MOBILE TOP BAR (Visible on < lg screens) */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Heritage Short
              </span>
              <h1 className="text-sm font-bold text-white truncate max-w-[190px] sm:max-w-xs">
                The Monument That Lives in My Memory
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
              download="harar_monument_horizontal_16x9.mp4"
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm"
              title="Download Master Film"
            >
              <Download className="w-3 h-3" />
              <span>Film</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick-Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 -mx-4 px-4 scrollbar-none text-xs">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="pt-3 pb-3 mt-2 border-t border-slate-800/80 space-y-3 animate-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 font-semibold">
                Main Views
              </span>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "text-slate-300 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 font-semibold">
                Documentation Library
              </span>
              {docNavItems.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>{doc.label}</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">.{doc.id.split(".")[1]}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
              <a
                href="https://github.com/DanielBasaznew/ai-content-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-400 hover:underline"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub Repo
              </a>
              <span>By Daniel Basaznew</span>
            </div>
          </div>
        )}
      </header>

      {/* DESKTOP SIDEBAR (Visible on >= lg screens) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-[#0b1120]/95 flex-col justify-between shrink-0 h-screen sticky top-0 p-4 z-40 select-none overflow-y-auto">
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="px-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Heritage Short
              </span>
            </div>
            <h1 className="text-base font-bold text-white leading-snug">
              The Monument That Lives in My Memory
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Harar, Ethiopia • 2026</p>
          </div>

          {/* Download Film Dropdown Action */}
          <div className="px-1 relative">
            <button
              onClick={() => setDownloadOpen(!downloadOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                <span>Download Film</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition ${downloadOpen ? "rotate-180" : ""}`} />
            </button>

            {downloadOpen && (
              <div className="absolute left-1 right-1 mt-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in duration-100">
                <a
                  href="/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
                  download="harar_monument_horizontal_16x9.mp4"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  <span>🖥️ Horizontal (16:9)</span>
                  <span className="font-mono text-[10px] text-slate-400">39 MB</span>
                </a>
                <a
                  href="/outputs/vertical/harar_monument_vertical_9x16.mp4"
                  download="harar_monument_vertical_9x16.mp4"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
                >
                  <span>📱 Vertical (9:16)</span>
                  <span className="font-mono text-[10px] text-slate-400">47 MB</span>
                </a>
              </div>
            )}
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-1">
              Main Showcase
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-amber-500/20 text-amber-300" : "bg-slate-900 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* DOCUMENTS Section (Inspired by Kidus Paulos showcase) */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-1 flex items-center justify-between">
              <span>DOCUMENTS</span>
              <BookOpen className="w-3 h-3 text-slate-500" />
            </div>

            {docNavItems.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDocument(doc.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 text-left transition"
              >
                <span className="flex items-center gap-2 truncate">
                  <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{doc.label}</span>
                </span>
                <span className="text-[9px] font-mono text-slate-600 shrink-0">.{doc.id.split(".")[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Info & Author Card */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-xs">
                DB
              </div>
              <div className="text-[11px] leading-tight">
                <div className="font-bold text-white">Daniel Basaznew</div>
                <a
                  href="https://github.com/DanielBasaznew/ai-content-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  <span>Source on GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="px-2 text-[10px] text-slate-500">
            <p>10 Academy • Week 0 Capstone</p>
          </div>
        </div>
      </aside>
    </>
  );
}
