"use client";

import React, { useState } from "react";
import { FileText, BookOpen, ExternalLink, Download } from "lucide-react";

export default function DocumentsView() {
  const [selectedDoc, setSelectedDoc] = useState<string>("REPORT.md");

  const docList = [
    { id: "REPORT.md", title: "Comprehensive Written Report", desc: "Full 6-part narrative addressing all assignment rubric criteria" },
    { id: "README.md", title: "Project Overview & Quickstart", desc: "Installation, architecture summary, and 1-command rebuild" },
    { id: "ARCHITECTURE.md", title: "System Architecture", desc: "Pipeline design, stage contracts, and tool specifications" },
    { id: "DESIGN.md", title: "Audience & Design Intention", desc: "Target audiences, emotional arc, and user test logs (Test 1 & 2)" },
    { id: "EXPERIMENTS.md", title: "Generation Experiments Log", desc: "11 logged experiments with hypothesis, changes, and results" },
    { id: "FAILURES.md", title: "Failures & Workarounds Log", desc: "10 documented real blockers (zoompan, ducking, fonts) and fixes" },
    { id: "COSTS.md", title: "Cost & Resource Accounting", desc: "Detailed breakdown of latency, GPU minutes, and cost ($0.00)" },
    { id: "ETHICS.md", title: "Ethics, Consent & AI Provenance", desc: "Consent verification, licensing, and mandatory AI disclosures" }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Project Documentation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Repository Documents & Reports</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Direct access to the complete written documentation files committed in the repository.
        </p>
      </div>

      {/* Document Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {docList.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc.id)}
            className={`p-4 rounded-xl text-left border transition ${
              selectedDoc === doc.id
                ? "bg-sky-500/15 text-white border-sky-500/40 shadow-lg shadow-sky-500/10"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-bold text-sky-300">{doc.id}</span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{doc.title}</h4>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{doc.desc}</p>
          </button>
        ))}
      </div>

      {/* Document Viewer Frame */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>{selectedDoc}</span>
            </h2>
            <p className="text-xs text-slate-400">Available in the project root directory</p>
          </div>

          <a
            href={`https://github.com/DanielBasaznew/ai-content-generator/blob/main/${selectedDoc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Informative Preview Note */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p>
            This file is committed directly to the GitHub repository at <code className="text-sky-300 font-mono">/{selectedDoc}</code>.
          </p>
          <p className="text-slate-400">
            For Assignment 1 submission, you can submit the GitHub link directly or copy the contents of <strong className="text-white">REPORT.md</strong> into a PDF document.
          </p>
        </div>
      </div>
    </div>
  );
}
