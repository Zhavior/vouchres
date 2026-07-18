/**
 * Judge Home — mobile-first surface for the 4 AI judges (DS / PH / MR / RA).
 * Uses the public leaderboard API; never invents picks or win rates.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { LANDING_JUDGES, JUDGE_COLOR_RING } from '../constants/aiJudges';
import JudgePixelIcon from '../components/judges/JudgePixelIcon';
import { useAiJudgeLeaderboard } from '../hooks/queries/useAiJudgeLeaderboard';

type JudgeHomePageProps = {
  navigateSection?: (section: string) => void;
};

type LeaderboardJudge = {
  id?: string;
  displayName?: string;
  handle?: string;
  tagline?: string;
  specialty?: string;
  winRate?: number | null;
  trustScore?: number | null;
  topPicks?: Array<Record<string, unknown>>;
  topPick?: Record<string, unknown> | null;
  record?: { won?: number; lost?: number; pushed?: number; pending?: number };
};

export default function JudgeHomePage({ navigateSection }: JudgeHomePageProps) {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useAiJudgeLeaderboard();
  const [selectedId, setSelectedId] = useState<string>(LANDING_JUDGES[0].id);
  const chipStripRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => {
    const map = new Map<string, LeaderboardJudge>();
    const rows = (data?.leaderboard ?? []) as LeaderboardJudge[];
    for (const row of rows) {
      if (row?.id) map.set(String(row.id), row);
    }
    return map;
  }, [data?.leaderboard]);

  const ranked = useMemo(() => {
    return [...LANDING_JUDGES].sort((a, b) => {
      const aLive = byId.get(a.id);
      const bLive = byId.get(b.id);
      const aw = Number(aLive?.winRate ?? -1);
      const bw = Number(bLive?.winRate ?? -1);
      if (bw !== aw) return bw - aw;
      return Number(bLive?.trustScore ?? 0) - Number(aLive?.trustScore ?? 0);
    });
  }, [byId]);

  const selectedMeta = LANDING_JUDGES.find((j) => j.id === selectedId) ?? LANDING_JUDGES[0];
  const selectedLive = byId.get(selectedId);
  const topPicks = Array.isArray(selectedLive?.topPicks)
    ? selectedLive!.topPicks!.slice(0, 5)
    : selectedLive?.topPick
      ? [selectedLive.topPick]
      : [];
  const asOf = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  useEffect(() => {
    const strip = chipStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-judge-id="${CSS.escape(selectedId)}"]`);
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <div className="mx-auto w-full max-w-lg pb-28 font-z8 text-white md:max-w-2xl md:pb-10">
      {/* Compact sticky header — phone-first */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#05070b]/92 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70">AI Judges</p>
            <h1 className="truncate text-xl font-black tracking-tight">Judge Home</h1>
            <p className="mt-0.5 text-[12px] text-white/50">
              {data?.date ? `Slate ${data.date}` : 'Loading slate…'}
              {asOf ? ` · ${asOf}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            aria-label="Refresh judges"
            className="ve-touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div
          ref={chipStripRef}
          className="mt-3 grid grid-cols-4 gap-1.5"
          role="tablist"
          aria-label="Select judge"
        >
          {LANDING_JUDGES.map((judge) => {
            const live = byId.get(judge.id);
            const active = judge.id === selectedId;
            return (
              <button
                key={judge.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-judge-id={judge.id}
                onClick={() => setSelectedId(judge.id)}
                className={`ve-touch-target flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition active:scale-[0.98] ${
                  active ? `${JUDGE_COLOR_RING[judge.color]} bg-white/[0.07]` : 'border-white/10 bg-black/35'
                }`}
              >
                <JudgePixelIcon code={judge.code} size="sm" />
                <span className="w-full truncate text-[10px] font-bold leading-tight">{judge.code}</span>
                <span className="font-mono text-[10px] text-white/55">{formatWinRate(live?.winRate)}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="space-y-3 px-3 pt-3">
        <p className="text-[12px] leading-relaxed text-white/55">
          Four AI judges. Graded when the ledger has results. Research only — not a sportsbook.
        </p>

        {/* Leader strip — prefer graded win rate, else trust */}
        {!isLoading && byId.size > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/10 via-transparent to-transparent px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              {byId.get(ranked[0].id)?.winRate != null ? 'Board leader' : 'Trust leader'}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{ranked[0].displayName}</p>
                <p className="truncate text-[11px] text-white/50">{ranked[0].tagline}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(ranked[0].id)}
                className="ve-touch-target shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white/80 active:scale-95"
              >
                {byId.get(ranked[0].id)?.winRate != null
                  ? `View ${formatWinRate(byId.get(ranked[0].id)?.winRate)}`
                  : `Trust ${Math.round(Number(byId.get(ranked[0].id)?.trustScore ?? 50))}`}
              </button>
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="mb-3 flex items-start gap-3">
            <JudgePixelIcon code={selectedMeta.code} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black leading-tight">{selectedMeta.displayName}</h2>
              <p className="text-sm text-white/65">{selectedLive?.tagline ?? selectedMeta.tagline}</p>
              <p className="mt-1 text-[11px] text-white/40">{selectedLive?.specialty ?? selectedMeta.specialty}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Win rate" value={formatWinRate(selectedLive?.winRate)} />
            <Stat label="Trust" value={selectedLive?.trustScore != null ? String(Math.round(Number(selectedLive.trustScore))) : '—'} />
            <Stat label="Record" value={formatRecord(selectedLive?.record)} />
          </div>

          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
            </div>
          ) : null}

          {isError ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Live board unavailable. Personas stay accurate; grades appear when the API recovers.</span>
            </div>
          ) : null}

          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Top reads</h3>
          {topPicks.length === 0 && !isLoading ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-3 text-sm text-white/55">
              No graded top picks for this judge yet. Confirmed lineups still gate the trust-first boards.
            </p>
          ) : (
            <ul className="space-y-2">
              {topPicks.map((pick, index) => {
                const name = String(pick.playerName ?? pick.name ?? pick.player ?? `Pick ${index + 1}`);
                const reason = String(pick.reason ?? pick.explanation ?? pick.summary ?? '').trim();
                const team = String(pick.team ?? pick.teamAbbr ?? '').trim();
                return (
                  <li key={`${name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{name}</div>
                        {team ? <div className="text-[11px] font-bold uppercase tracking-wide text-cyan-200/70">{team}</div> : null}
                      </div>
                      <span className="font-mono text-[10px] text-white/35">#{index + 1}</span>
                    </div>
                    {reason ? <p className="mt-1 text-[12px] leading-snug text-white/55">{reason}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ActionButton label="HR Board" detail="Confirmed vs projected" onClick={() => navigateSection?.('hr_board')} />
          <ActionButton label="Research Center" detail="Deep V.A.I workflow" onClick={() => navigateSection?.('ai_engine')} />
          <ActionButton label="Leaderboard" detail="Public graded proof" onClick={() => navigateSection?.('leaderboard')} />
        </div>

        <p className="px-1 pb-2 text-[11px] leading-relaxed text-white/35">
          Probability research for entertainment. Not betting advice. Wins and losses publish when grades land.
        </p>
      </div>
    </div>
  );
}

function ActionButton({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ve-touch-target flex items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-3 text-left active:scale-[0.98]"
    >
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-[11px] text-white/45">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

function formatWinRate(value: unknown): string {
  if (value == null || Number.isNaN(Number(value))) return 'n/a';
  const n = Number(value);
  const pct = n <= 1 ? n * 100 : n;
  return `${pct.toFixed(0)}%`;
}

function formatRecord(record: LeaderboardJudge['record']): string {
  if (!record) return '—';
  const w = Number(record.won ?? 0);
  const l = Number(record.lost ?? 0);
  const p = Number(record.pushed ?? 0);
  return p > 0 ? `${w}-${l}-${p}` : `${w}-${l}`;
}
