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
  Sparkles
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "film", label: "Film", icon: Film, badge: "Master" },
    { id: "pipeline", label: "Pipeline", icon: Cpu, badge: "Graph" },
    { id: "reviewers", label: "For Reviewers", icon: CheckSquare, badge: "Rubric" },
    { id: "memory-lens", label: "Memory Lens", icon: Sliders, badge: "Interactive" },
    { id: "storyboard", label: "Storyboard", icon: Layers, badge: "10 Shots" },
    { id: "telemetry", label: "Telemetry", icon: BarChart3, badge: "Logs" },
    { id: "documents", label: "Documents", icon: FileText, badge: "8 Files" },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
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
                Harar Heritage
              </span>
              <h1 className="text-sm font-bold text-white truncate max-w-[210px] sm:max-w-xs">
                The Monument That Lives in My Memory
              </h1>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Horizontal Quick-Pill Bar for 1-Tap Switching */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 -mx-4 px-4 scrollbar-none text-xs">
          {navItems.map((item) => {
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

        {/* Mobile Drawer Dropdown when Hamburger Tapped */}
        {mobileMenuOpen && (
          <div className="pt-3 pb-2 mt-2 border-t border-slate-800/80 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "text-slate-300 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {item.badge}
                  </span>
                </button>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
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
      <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-[#0b1120]/95 flex-col justify-between shrink-0 h-screen sticky top-0 p-4 z-40 select-none">
        <div>
          {/* Brand / Logo */}
          <div className="mb-6 px-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Heritage Short Film
              </span>
            </div>
            <h1 className="text-base font-bold text-white leading-snug">
              The Monument That Lives in My Memory
            </h1>
            <p className="text-xs text-slate-400 mt-1">Harar, Ethiopia • 2026</p>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_14px_rgba(245,158,11,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-amber-500/20 text-amber-300" : "bg-slate-900 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & GitHub */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Broadcast Standard</span>
            </div>
            <p className="text-[11px] text-slate-400">
              EBU R128 (-14.0 LUFS) • Dual Aspect 9:16 & 16:9 • SHA-256 Cached
            </p>
          </div>

          <a
            href="https://github.com/DanielBasaznew/ai-content-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <span className="flex items-center gap-2">
              <Github className="w-3.5 h-3.5" />
              GitHub Repository
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <div className="px-2 text-[11px] text-slate-500 space-y-0.5">
            <p className="font-medium text-slate-400">Daniel Basaznew</p>
            <p>10 Academy • B2W0 Capstone</p>
          </div>
        </div>
      </aside>
    </>
  );
}
