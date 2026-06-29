import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Radio,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CircleDot,
  Archive,
} from 'lucide-react';
import type { Parlay } from '../types';
import {
  bucketParlays,
  displayStatusLabel,
  earliestStart,
  getDisplayStatus,
} from '../lib/parlayLifecycle';

interface Props {
  parlays: Parlay[];
  onGenerate?: () => void;
  onUpdateParlay?: (updatedParlay: Parlay) => void;
  generating?: boolean;
}

const LEG_ICON: Record<string, React.ReactNode> = {
  WON: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  LOST: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
  VOID: <CircleDot className="h-3.5 w-3.5 text-slate-500" />,
  PENDING: <CircleDot className="h-3.5 w-3.5 text-slate-600" />,
};

function formatDateLabel(date: Date | null) {
  if (!date) return 'Date TBD';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getParlayStatus(p: Parlay) {
  return displayStatusLabel(getDisplayStatus(p));
}

function groupParlaysByDate(parlays: Parlay[]) {
  const groups: Record<string, Parlay[]> = {};

  parlays.forEach((parlay) => {
    const start = earliestStart(parlay);
    const label = formatDateLabel(start);
    if (!groups[label]) groups[label] = [];
    groups[label].push(parlay);
  });

  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    if (a === 'Date TBD') return 1;
    if (b === 'Date TBD') return -1;
    return a.localeCompare(b);
  });
}

function ParlayCard({ p, live }: { p: Parlay; live: boolean }) {
  const start = earliestStart(p);
  const startLabel = start
    ? start.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBD';

  const displayStatus = getDisplayStatus(p);
  const statusLabel = getParlayStatus(p);

  const autoGradeLabel =
    displayStatus === 'not_started'
      ? 'Auto-grade: Waiting for game to start'
      : displayStatus === 'locked'
        ? 'Auto-grade: Locked — game starting soon'
        : displayStatus === 'live'
          ? 'Auto-grade: Live tracking'
          : displayStatus === 'ready_to_grade'
            ? 'Auto-grade: Waiting for final box score'
            : ['won', 'lost', 'void'].includes(displayStatus)
              ? 'Auto-grade: Completed'
              : 'Auto-grade: Waiting for start time';

  return (
    <div className={`overflow-hidden rounded-2xl border bg-slate-950/50 ${live ? 'border-emerald-500/30' : 'border-slate-800/70'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/50 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {p.aiGenerated && <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />}
            <span className="truncate text-sm font-black text-slate-100">{p.title || 'Saved Parlay'}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span
              className={`rounded px-1.5 py-0.5 font-bold ${
                p.riskTier === 'LOW'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : p.riskTier === 'HIGH'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {p.riskTier || 'MEDIUM'}
            </span>
            <span>{p.legs?.length || 0} legs</span>
            {p.totalOdds && <span className="font-mono text-sky-400">{p.totalOdds}</span>}
            <span>· live date {startLabel}</span>
          </div>

          <div className="mt-2 rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2 text-[11px] font-bold text-slate-400">
            {autoGradeLabel}
          </div>
        </div>

        <div className="text-right">
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300">
              <Clock className="h-3.5 w-3.5" />
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-800/30">
        {(p.legs || []).map((leg) => {
          const legStatus = String((leg as any).status || 'PENDING').toUpperCase();
          const odds = typeof (leg as any).odds === 'number' ? (leg as any).odds.toFixed(2) : (leg as any).odds;

          return (
            <div key={(leg as any).id || `${(leg as any).selection}-${odds}`} className="flex items-center gap-3 px-4 py-2.5">
              {LEG_ICON[legStatus] ?? LEG_ICON.PENDING}
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{(leg as any).selection}</span>
              {(leg as any).actual != null && <span className="text-[10px] font-mono text-slate-500">actual {(leg as any).actual}</span>}
              {odds && <span className="text-xs font-mono text-sky-400">+{odds}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LiveParlaysPage({ parlays, onGenerate, generating }: Props) {
  const [tab, setTab] = useState<'my' | 'practice' | 'real' | 'upcoming' | 'live' | 'results'>('my');

  const buckets = useMemo(() => bucketParlays(parlays || []), [parlays]);
  const groupedAll = useMemo(() => groupParlaysByDate(parlays || []), [parlays]);

  const practiceParlays = (parlays || []).filter((p) => String((p as any).mode || 'PRACTICE').toUpperCase() === 'PRACTICE');
  const realParlays = (parlays || []).filter((p) => String((p as any).mode || 'PRACTICE').toUpperCase() === 'REAL');

  const resultsParlays = (parlays || []).filter((p) =>
    ['WON', 'LOST', 'VOID'].includes(String((p as any).status || '').toUpperCase()) ||
    getDisplayStatus(p) === 'ready_to_grade'
  );

  const list =
    tab === 'live'
      ? buckets.live
      : tab === 'upcoming'
        ? buckets.upcoming
        : tab === 'practice'
          ? practiceParlays
          : tab === 'real'
            ? realParlays
            : tab === 'results'
              ? resultsParlays
              : parlays || [];

  const wonCount = (parlays || []).filter((p) => String((p as any).status || '').toUpperCase() === 'WON').length;
  const lostCount = (parlays || []).filter((p) => String((p as any).status || '').toUpperCase() === 'LOST').length;
  const gradedCount = wonCount + lostCount;
  const readyToGradeCount = (parlays || []).filter((p) => getDisplayStatus(p) === 'ready_to_grade').length;
  const winRateLabel = gradedCount > 0 ? `${Math.round((wonCount / gradedCount) * 100)}%` : '—';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              My Parlays
            </span>

            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
              </span>
              My Parlay Board
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Every saved parlay stays here, grouped by the date it goes live. Upcoming and Live are filters only — they no longer hide your full saved history.
            </p>
          </div>

          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              Generate Today's Parlays
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Saved Parlays</div>
            <div className="mt-1 text-2xl font-black text-white">{parlays?.length || 0}</div>
            <div className="mt-1 text-[11px] text-slate-500">Your full parlay history</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Live / Upcoming</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">{buckets.live.length}<span className="text-slate-600"> / </span><span className="text-amber-300">{buckets.upcoming.length}</span></div>
            <div className="mt-1 text-[11px] text-slate-500">Tracking now and later</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Record</div>
            <div className="mt-1 text-2xl font-black text-sky-300">{wonCount}-{lostCount}</div>
            <div className="mt-1 text-[11px] text-slate-500">Win rate {winRateLabel}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Needs Grade</div>
            <div className="mt-1 text-2xl font-black text-rose-300">{readyToGradeCount}</div>
            <div className="mt-1 text-[11px] text-slate-500">Waiting for final box scores</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { id: 'my', label: `All Parlays (${parlays?.length || 0})`, icon: Archive },
            { id: 'practice', label: `Practice (${practiceParlays.length})`, icon: Sparkles },
            { id: 'real', label: `Real-Time Bets (${realParlays.length})`, icon: Radio },
            { id: 'upcoming', label: `Upcoming (${buckets.upcoming.length})`, icon: Clock },
            { id: 'live', label: `Live (${buckets.live.length})`, icon: Radio },
            { id: 'results', label: `Results (${resultsParlays.length})`, icon: CheckCircle2 },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                tab === item.id
                  ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'results' && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-950/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-sky-300">Results Center</div>
                <div className="mt-1 text-sm text-slate-400">
                  Graded parlays and parlays waiting for final box scores show here.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2">
                  <div className="text-[10px] font-black uppercase text-slate-500">Won</div>
                  <div className="text-lg font-black text-emerald-300">{wonCount}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2">
                  <div className="text-[10px] font-black uppercase text-slate-500">Lost</div>
                  <div className="text-lg font-black text-rose-300">{lostCount}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2">
                  <div className="text-[10px] font-black uppercase text-slate-500">Rate</div>
                  <div className="text-lg font-black text-sky-300">{winRateLabel}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-10 text-center">
            <Archive className="mx-auto h-8 w-8 text-slate-700" />
            <p className="mt-3 text-sm text-slate-500">
              No parlays found here yet. Save one from Parlay Studio or generate today's AI parlays.
            </p>
          </div>
        ) : tab === 'my' ? (
          <div className="space-y-6">
            {groupedAll.map(([dateLabel, items]) => (
              <section key={dateLabel} className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">{dateLabel}</h2>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {items.map((p) => (
                    <ParlayCard key={p.id} p={p} live={buckets.live.some((liveParlay) => liveParlay.id === p.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((p) => (
              <ParlayCard key={p.id} p={p} live={tab === 'live'} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
