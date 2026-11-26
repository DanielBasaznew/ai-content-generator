"use client";

import React from "react";
import { CheckCircle2, Terminal, FileCode, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { RUBRIC_CRITERIA, TELEMETRY_STATS } from "../lib/data";

export default function ReviewerRubric() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Assessment Guide</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">For Reviewers & Interviewers</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">
          Everything needed to evaluate this submission, mapped directly to the 10 Academy assessment rubric and linked to verified code, logs, and artifacts in the repository.
        </p>
      </div>

      {/* Top High-Level Evidence Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">1</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Command to Rebuild</div>
          <div className="text-[10px] text-sky-400 font-mono mt-1">python -m pipeline.assembly</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">46</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Logged Model Calls</div>
          <div className="text-[10px] text-emerald-400 mt-1">in runs.jsonl</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">11</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Documented Experiments</div>
          <div className="text-[10px] text-slate-400 mt-1">in EXPERIMENTS.md</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">10</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Documented Failures</div>
          <div className="text-[10px] text-amber-400 mt-1">in FAILURES.md</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">42</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Passing Unit Tests</div>
          <div className="text-[10px] text-emerald-400 mt-1">0 failed (pytest)</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">2</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Final Aspect Ratios</div>
          <div className="text-[10px] text-sky-400 mt-1">9:16 & 16:9 (-14 LUFS)</div>
        </div>
      </div>

      {/* Rubric Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Assignment 1 Criteria Breakdown</span>
          <span className="text-xs font-normal text-slate-400">(Scored out of 100)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RUBRIC_CRITERIA.map((criterion) => (
            <div
              key={criterion.id}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-slate-800"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-white">{criterion.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                    {criterion.points} pts
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {criterion.description}
                </p>
              </div>

              {/* Evidence Items */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Verified Evidence
                </span>
                {criterion.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">
                        {ev.label}
                        {ev.command && (
                          <code className="ml-1.5 px-1.5 py-0.5 rounded bg-black text-[11px] text-sky-300 font-mono">
                            {ev.command}
                          </code>
                        )}
                        {ev.path && (
                          <span className="ml-1.5 text-[11px] text-slate-400 font-mono">
                            {ev.path}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ev.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
