"use client";

import React from "react";
import { 
  Film, 
  CheckSquare, 
  Sliders, 
  Layers, 
  Cpu, 
  BarChart3, 
  FileText, 
  Github, 
  ExternalLink 
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: "film", label: "Film", icon: Film },
    { id: "reviewers", label: "For Reviewers", icon: CheckSquare },
    { id: "memory-lens", label: "Memory Lens", icon: Sliders },
    { id: "storyboard", label: "Storyboard", icon: Layers },
    { id: "pipeline", label: "Pipeline", icon: Cpu },
    { id: "telemetry", label: "Telemetry", icon: BarChart3 },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0b1120]/95 flex flex-col justify-between shrink-0 h-screen sticky top-0 p-4 z-40 select-none">
      <div>
        {/* Brand / Logo */}
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase">
              Heritage Short
            </span>
          </div>
          <h1 className="text-base font-bold text-white leading-snug">
            The Monument That Lives in My Memory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Harar, Ethiopia</p>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.id === "memory-lens" && (
                  <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & GitHub */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <a
          href="https://github.com/DanielBasaznew/ai-content-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <span className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5" />
            GitHub Repository
          </span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>

        <div className="px-2 text-[11px] text-slate-500 space-y-0.5">
          <p>By Daniel Basaznew</p>
          <p>10 Academy • B2W0 Challenge</p>
        </div>
      </div>
    </aside>
  );
}
