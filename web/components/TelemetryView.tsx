"use client";

import React from "react";
import { TELEMETRY_STATS } from "../lib/data";

export default function TelemetryView() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-[#d4a359] mb-1.5">
          Execution Telemetry
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
          Telemetry &amp; Resource Accounting
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
          Measured calls, GPU minutes, latency, and test coverage audited from <code className="text-zinc-200 font-mono">runs.jsonl</code> and <code className="text-zinc-200 font-mono">COSTS.md</code>.
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="text-[10px] font-mono uppercase text-zinc-500">Logged Runs</div>
          <div className="text-2xl font-semibold text-zinc-100 mt-1 tabular-nums">{TELEMETRY_STATS.total_runs}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Verified in runs.jsonl</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="text-[10px] font-mono uppercase text-zinc-500">Automated Tests</div>
          <div className="text-2xl font-semibold text-zinc-100 mt-1 tabular-nums">{TELEMETRY_STATS.passing_unit_tests}</div>
          <div className="text-[11px] text-zinc-400 mt-1">0 failed across pytest</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="text-[10px] font-mono uppercase text-zinc-500">Cache Replay</div>
          <div className="text-2xl font-semibold text-zinc-100 mt-1 tabular-nums">0.15s</div>
          <div className="text-[11px] text-zinc-400 mt-1">SHA-256 hash match</div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="text-[10px] font-mono uppercase text-zinc-500">Actual Cash Spend</div>
          <div className="text-2xl font-semibold text-[#d4a359] mt-1 tabular-nums">$0.00</div>
          <div className="text-[11px] text-zinc-400 mt-1">$0.698 list equivalent</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-100 mb-4">Stage Breakdown</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase">
                <th className="pb-3 font-medium">Stage</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Engine / Model</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium text-right">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 tabular-nums">
              {TELEMETRY_STATS.stages.map((st, i) => (
                <tr key={i} className="hover:bg-zinc-900/50 transition">
                  <td className="py-3 font-medium text-zinc-200 pr-4">{st.name}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400 pr-4">{st.model}</td>
                  <td className="py-3 font-mono text-zinc-300 pr-4">{st.latency}</td>
                  <td className="py-3 font-mono text-[#d4a359] text-right">{st.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
