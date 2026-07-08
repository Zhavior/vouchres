"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

type LiveData = {
  pitcher?: string;
  confidence?: number;
  line?: string;
};

type BoardRow = {
  id: string;
  player: string;
  team: string;
  pitcher?: string;
  confidence: number;
  line: string;
};

export function EdgeTerminal() {
  const [live, setLive] = useState<LiveData>({});
  const [rows, setRows] = useState<BoardRow[]>([]);

  useEffect(() => {
    async function load() {
      const [liveRes, boardRes] = await Promise.all([
        fetch("/api/mlb/live", { cache: "no-store" }),
        fetch("/api/mlb/hr-board/today?previewLimit=350", { cache: "no-store" }),
      ]);

      setLive(await liveRes.json());
      const board = await boardRes.json();
      setRows(board.rows ?? board.data?.rows ?? []);
    }

    load().catch(console.error);
  }, []);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Edge Island Live
          </div>
          <div className="mt-1 text-xs text-white/35">MLB intelligence stream</div>
        </div>
        <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_#34d399]" />
      </div>

      <div className="grid grid-cols-3 border-b border-white/10">
        <Stat label="Pitcher" value={live.pitcher ?? "SYNC"} />
        <Stat label="Confidence" value={`${live.confidence ?? 0}%`} active />
        <Stat label="Line" value={live.line ?? "LOAD"} />
      </div>

      <div className="p-6">
        <div className="mb-4 grid grid-cols-5 text-[10px] uppercase tracking-widest text-white/30">
          <span>Player</span>
          <span>Team</span>
          <span>Pitcher</span>
          <span>Edge</span>
          <span>Line</span>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-5 items-center rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm"
            >
              <strong>{row.player}</strong>
              <span className="text-white/45">{row.team}</span>
              <span className="text-white/45">{row.pitcher ?? "—"}</span>
              <span className="font-black text-emerald-300">{row.confidence}%</span>
              <span className="font-black text-cyan-300">{row.line}</span>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-white/35">
              Loading live signal...
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="border-r border-white/10 p-6">
      <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-black ${active ? "text-cyan-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
