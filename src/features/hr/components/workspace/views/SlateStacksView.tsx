import type { HrWatchRow } from "../../../types/hrWatch";

import React from "react";
import { ArrowUpRight, Flame, ShieldCheck, TrendingUp } from "lucide-react";

interface Props {
  rows: HrWatchRow[];
}

function value(...values: unknown[]) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(typeof value === "number" && Number.isNaN(value))
    ) {
      return value;
    }
  }

  return "—";
}

function numberValue(...values: unknown[]) {
  const raw = value(...values);

  if (typeof raw === "number") return raw;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

function percent(v: number | null) {
  return v === null ? "—" : `${Math.round(v)}%`;
}

export default function SlateStacksView({ rows }: Props) {
  const stacks = [...rows]
    .sort((a, b) => {
      const scoreA = numberValue(
        (a as any).hrScore,
        (a as any).score,
        (a as any).edge,
        (a as any).confidence,
      ) ?? 0;

      const scoreB = numberValue(
        (b as any).hrScore,
        (b as any).score,
        (b as any).edge,
        (b as any).confidence,
      ) ?? 0;

      return scoreB - scoreA;
    })
    .slice(0, 8);

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">
            Slate Intelligence
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Premium Slate Stacks
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Highest-quality home run opportunities ranked by today's
            intelligence model.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 lg:block">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            Candidates
          </div>
          <div className="mt-1 text-3xl font-black text-white">
            {stacks.length}
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {stacks.map((row, index) => {
          const player = String(
            value(
              (row as any).playerName,
              (row as any).name,
              (row as any).player,
              "Unknown Player",
            ),
          );

          const team = String(
            value((row as any).team, (row as any).teamAbbreviation, ""),
          );

          const pitcher = String(
            value((row as any).pitcherName, (row as any).pitcher, "TBD"),
          );

          const edge = numberValue((row as any).edge);
          const confidence = numberValue((row as any).confidence);
          const hrScore = numberValue(
            (row as any).hrScore,
            (row as any).score,
          );

          return (
            <article
              key={`${player}-${index}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.12)]"
            >
              <div className="border-b border-white/5 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                        #{index + 1}
                      </span>

                      {team && (
                        <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                          {team}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-2xl font-black text-white">
                      {player}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      vs {pitcher}
                    </p>
                  </div>

                  <ArrowUpRight className="h-5 w-5 text-cyan-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-white/5">
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    HR Score
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">
                    {hrScore ?? "—"}
                  </div>
                </div>

                <div className="border-x border-white/5 p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Edge
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400">
                    {percent(edge)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Confidence
                  </div>
                  <div className="mt-2 text-2xl font-bold text-cyan-300">
                    {percent(confidence)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Power
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Elite
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Trend
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Positive
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Status
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Verified
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
