import type { HrWatchRow } from "../../../types/hrWatch";

import React from "react";

interface Props {
  rows: HrWatchRow[];
}

export default function IntelligenceWorkspaceView({ rows }: Props) {
  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Intelligence Workspace
        </p>

        <h1 className="text-3xl font-black text-white">
          Decision Intelligence
        </h1>

        <p className="max-w-3xl text-sm text-zinc-400">
          Review the strongest evidence, understand key risks, and quickly
          determine which matchups deserve the most attention.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 text-zinc-400">
        Intelligence Workspace coming online.
        Loaded players: {rows.length}
      </div>
    </section>
  );
}
