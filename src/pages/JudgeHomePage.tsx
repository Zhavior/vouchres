/**
 * Judge Home — mobile-first surface for the 4 AI judges (DS / PH / MR / RA).
 * Uses the public leaderboard API; never invents picks or win rates.
 */
import React, { useMemo, useState } from 'react';
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
  record?: { won?: number; lost?: number; pushed?: number; pending?: number };
};

export default function JudgeHomePage({ navigateSection }: JudgeHomePageProps) {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useAiJudgeLeaderboard();
  const [selectedId, setSelectedId] = useState<string>(LANDING_JUDGES[0].id);

  const byId = useMemo(() => {
    const map = new Map<string, LeaderboardJudge>();
    const rows = (data?.leaderboard ?? []) as LeaderboardJudge[];
    for (const row of rows) {
      if (row?.id) map.set(String(row.id), row);
    }
    return map;
  }, [data?.leaderboard]);

  const selectedMeta = LANDING_JUDGES.find((j) => j.id === selectedId) ?? LANDING_JUDGES[0];
  const selectedLive = byId.get(selectedId);
  const topPicks = Array.isArray(selectedLive?.topPicks) ? selectedLive!.topPicks!.slice(0, 5) : [];
  const asOf = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-3 font-z8 text-white md:max-w-2xl md:px-4">
      <header className="mb-4 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">VouchEdge Judges</p>
        <h1 className="text-2xl font-black tracking-tight">Judge Home</h1>
        <p className="text-sm text-white/60">
          Four AI judges. Graded history when available. Research only — not a sportsbook.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-white/45">
          <span>{data?.date ? `Slate ${data.date}` : 'Slate loading…'}</span>
          {asOf ? <span aria-live="polite">Updated {asOf}</span> : null}
          <button
            type="button"
            onClick={() => void refetch()}
            className="ve-touch-target rounded-md border border-white/15 px-2 py-1 text-white/70 active:scale-95"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LANDING_JUDGES.map((judge) => {
          const live = byId.get(judge.id);
          const active = judge.id === selectedId;
          return (
            <button
              key={judge.id}
              type="button"
              onClick={() => setSelectedId(judge.id)}
              aria-pressed={active}
              className={`ve-touch-target flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                active ? `${JUDGE_COLOR_RING[judge.color]} bg-white/[0.06]` : 'border-white/10 bg-black/30'
              }`}
            >
              <JudgePixelIcon code={judge.code} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{judge.displayName}</div>
                <div className="truncate text-[10px] uppercase tracking-wide text-white/45">{judge.code}</div>
                <div className="mt-1 font-mono text-[11px] text-white/70">
                  {formatWinRate(live?.winRate)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="mb-3 flex items-start gap-3">
          <JudgePixelIcon code={selectedMeta.code} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black">{selectedMeta.displayName}</h2>
            <p className="text-sm text-white/65">{selectedLive?.tagline ?? selectedMeta.tagline}</p>
            <p className="mt-1 text-xs text-white/45">{selectedLive?.specialty ?? selectedMeta.specialty}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Win rate" value={formatWinRate(selectedLive?.winRate)} />
          <Stat label="Trust" value={selectedLive?.trustScore != null ? String(Math.round(Number(selectedLive.trustScore))) : '—'} />
          <Stat
            label="Record"
            value={formatRecord(selectedLive?.record)}
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-white/55">Loading judge board…</p>
        ) : isError ? (
          <p className="text-sm text-amber-200/90">
            Could not load the live judge board. Personas below are still accurate; grades appear when the API recovers.
          </p>
        ) : null}

        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Top reads</h3>
        {topPicks.length === 0 ? (
          <p className="text-sm text-white/55">
            No graded top picks posted for this judge yet. Official lineup confirmation still gates trust-first boards.
          </p>
        ) : (
          <ul className="space-y-2">
            {topPicks.map((pick, index) => {
              const name = String(pick.playerName ?? pick.name ?? pick.player ?? `Pick ${index + 1}`);
              const reason = String(pick.reason ?? pick.explanation ?? pick.summary ?? '').trim();
              return (
                <li key={`${name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-sm font-semibold">{name}</div>
                  {reason ? <p className="mt-0.5 text-xs text-white/55">{reason}</p> : null}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-white/40">
          Probability research for entertainment. Not betting advice. Wins and losses publish when grades land.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigateSection?.('hr_board')}
            className="ve-touch-target rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold active:scale-95"
          >
            Open HR Board
          </button>
          <button
            type="button"
            onClick={() => navigateSection?.('ai_engine')}
            className="ve-touch-target rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold active:scale-95"
          >
            Research Center
          </button>
          <button
            type="button"
            onClick={() => navigateSection?.('leaderboard')}
            className="ve-touch-target rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold active:scale-95"
          >
            Leaderboard
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

function formatWinRate(value: unknown): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
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
