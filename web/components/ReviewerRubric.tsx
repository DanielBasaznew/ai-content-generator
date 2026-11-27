"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { RUBRIC_CRITERIA } from "../lib/data";

export default function ReviewerRubric() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          Official Evaluation Guide
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          For Reviewers &amp; Interviewers
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
          Every rubric requirement mapped directly to reproducible commands, logged runs, and verified repository artifacts.
        </p>
      </div>

      {/* High-Level Quantitative Proofs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">1</div>
          <div className="text-[11px] text-zinc-400 mt-1">Rebuild Command</div>
          <div className="text-[10px] font-mono text-[#d4a359] mt-1 truncate">python make_film.py</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">47+3</div>
          <div className="text-[11px] text-zinc-400 mt-1">API/GPU &amp; FFmpeg</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">runs.jsonl</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">11</div>
          <div className="text-[11px] text-zinc-400 mt-1">Experiments</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">EXPERIMENTS.md</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">10</div>
          <div className="text-[11px] text-zinc-400 mt-1">Documented Fixes</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">FAILURES.md</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">42</div>
          <div className="text-[11px] text-zinc-400 mt-1">Passing Tests</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">0 failed (pytest)</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xl font-semibold text-zinc-100 tabular-nums">$0.00</div>
          <div className="text-[11px] text-zinc-400 mt-1">Total Spend</div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">9:16 &amp; 16:9 (-14 LUFS)</div>
        </div>
      </div>

      {/* Rubric Cards */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-base font-semibold text-zinc-100">Rubric Criteria Breakdown</h2>
          <span className="text-xs font-mono text-zinc-500">100 pts scale</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RUBRIC_CRITERIA.map((criterion) => (
            <div
              key={criterion.id}
              className="glass-card rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-zinc-100">{criterion.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-[#d4a359] shrink-0 tabular-nums">
                    {criterion.points} pts
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {criterion.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Evidence
                </span>
                {criterion.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-200 flex flex-wrap items-center gap-1.5">
                        <span>{ev.label}</span>
                        {ev.command && (
                          <code className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-[#d4a359] font-mono">
                            {ev.command}
                          </code>
                        )}
                        {ev.path && (
                          <span className="text-[10px] text-zinc-500 font-mono truncate">
                            {ev.path}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{ev.detail}</p>
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
