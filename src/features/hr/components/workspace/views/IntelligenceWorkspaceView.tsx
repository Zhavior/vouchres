import React, { useMemo } from "react";

import type { HrWatchRow } from "../../../types/hrWatch";

interface Props {
  rows: HrWatchRow[];
}

export default function IntelligenceWorkspaceView({ rows }: Props) {
  const topCandidate = useMemo(() => {
    if (rows.length === 0) return null;

    return [...rows].sort((a, b) => b.hrScore - a.hrScore)[0];
  }, [rows]);

  if (!topCandidate) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/50 p-10 text-center">
        <h2 className="text-2xl font-bold text-white">
          Decision Intelligence
        </h2>

        <p className="mt-3 text-zinc-400">
          No HR intelligence is currently available.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Intelligence Workspace
        </p>

        <h1 className="text-3xl font-black text-white">
          Decision Intelligence
        </h1>

        <p className="max-w-3xl text-sm text-zinc-400">
          Review today's strongest recommendation and understand the evidence
          behind the decision.
        </p>
      </header>

      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-950 p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              Top Recommendation
            </p>

            <h2 className="mt-2 text-4xl font-black text-white">
              {topCandidate.playerName}
            </h2>

            <p className="mt-2 text-zinc-300">
              {topCandidate.team} vs {topCandidate.opponent}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric
              label="HR Score"
              value={String(topCandidate.hrScore)}
            />

            <Metric
              label="Vouch"
              value={
                topCandidate.vouchScore != null
                  ? String(topCandidate.vouchScore)
                  : "—"
              }
            />

            <Metric
              label="Confidence"
              value={
                topCandidate.dataConfidence != null
                  ? `${Math.round(
                      topCandidate.dataConfidence <= 1
                        ? topCandidate.dataConfidence * 100
                        : topCandidate.dataConfidence,
                    )}%`
                  : "—"
              }
            />

            <Metric
              label="Odds"
              value={topCandidate.oddsLabel}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Evidence">
          <ul className="space-y-2">
            {topCandidate.reasons.length === 0 ? (
              <li className="text-zinc-500">No evidence available.</li>
            ) : (
              topCandidate.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
                >
                  ✓ {reason}
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title="Risk Signals">
          <ul className="space-y-2">
            {topCandidate.warnings.length === 0 ? (
              <li className="text-zinc-500">
                No significant risk signals.
              </li>
            ) : (
              topCandidate.warnings.map((warning) => (
                <li
                  key={warning}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
                >
                  ⚠ {warning}
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
      <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black text-white">
        {value}
      </div>
    </div>
  );
}
