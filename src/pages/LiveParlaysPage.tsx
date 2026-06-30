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
  Cloud,
  CloudOff,
  AlertTriangle,
  Loader2,
  Layers,
} from 'lucide-react';
import type { Parlay } from '../types';
import { earliestStart, isLive } from '../lib/parlayLifecycle';
import { americanLabel, decimalLabel } from '../lib/odds';
import PlayerHeadshot from '../components/parlays/PlayerHeadshot';
import {
  normalizeParlayStatus,
  statusLabel,
  statusChipClass,
  getSyncStatus,
  syncStatusLabel,
  type NormalizedParlayStatus,
} from '../lib/parlayStatus';

interface Props {
  parlays: Parlay[];
  onGenerate?: () => void;
  onBuildParlay?: () => void;
  onUpdateParlay?: (updatedParlay: Parlay) => void;
  onRetrySync?: (parlayId: string) => void;
  generating?: boolean;
  onRefreshGrades?: () => void;
  isGrading?: boolean;
  lastGraded?: Date | null;
}

function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

type GroupKey = 'today' | 'upcoming' | 'live' | 'completed';
type FilterKey = 'all' | 'pending' | 'live' | 'won' | 'lost' | 'void';

const GROUP_ORDER: GroupKey[] = ['today', 'upcoming', 'live', 'completed'];
const GROUP_META: Record<GroupKey, { label: string; icon: React.ComponentType<any> }> = {
  today: { label: 'Today', icon: CalendarDays },
  upcoming: { label: 'Upcoming', icon: Clock },
  live: { label: 'Live', icon: Radio },
  completed: { label: 'Completed', icon: CheckCircle2 },
};

const LEG_ICON: Record<string, React.ReactNode> = {
  WON: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  LOST: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
  VOID: <CircleDot className="h-3.5 w-3.5 text-slate-500" />,
  PENDING: <CircleDot className="h-3.5 w-3.5 text-slate-600" />,
};

function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Assign a parlay to exactly one group. Priority: completed > live > today > upcoming. */
function groupKeyFor(p: Parlay, now: Date): GroupKey {
  const norm = normalizeParlayStatus(p, now);
  if (norm === 'won' || norm === 'lost' || norm === 'void' || norm === 'partially_void') {
    return 'completed';
  }
  if (isLive(p, now)) return 'live';
  if (isToday(earliestStart(p))) return 'today';
  return 'upcoming';
}

function matchesFilter(norm: NormalizedParlayStatus, filter: FilterKey): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return norm === 'pending';
    case 'live':
      return norm === 'live';
    case 'won':
      return norm === 'won';
    case 'lost':
      return norm === 'lost';
    case 'void':
      return norm === 'void' || norm === 'partially_void';
  }
}

function formatGameDate(date: Date | null): string {
  if (!date) return 'Date TBD';
  if (isToday(date)) {
    return `Today · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function decimalOdds(p: Parlay): number {
  if (typeof p.oddsValue === 'number' && p.oddsValue > 1.01) return p.oddsValue;
  // Fallback: derive from American-style totalOdds string (skip "Odds TBD")
  const raw = String(p.totalOdds || '').replace(/[^0-9+\-.]/g, '');
  const num = Number(raw);
  if (raw && Number.isFinite(num)) {
    if (num >= 100) return 1 + num / 100;
    if (num <= -100) return 1 + 100 / Math.abs(num);
    if (num > 1.01) return num;
  }
  return 0;
}

function formatPayout(p: Parlay): string {
  const stake = typeof p.wagerAmount === 'number' && p.wagerAmount > 0 ? p.wagerAmount : null;
  const dec = decimalOdds(p);
  if (!stake || dec <= 1) return '—';
  return (stake * dec).toFixed(2);
}

function SyncChip({ p, onRetry }: { p: Parlay; onRetry?: (id: string) => void }) {
  const sync = getSyncStatus(p);

  const chip = (() => {
    switch (sync) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            <Cloud className="h-3 w-3" /> {syncStatusLabel(sync)}
          </span>
        );
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
            <Loader2 className="h-3 w-3 animate-spin" /> {syncStatusLabel(sync)}
          </span>
        );
      case 'local_only':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">
            <CloudOff className="h-3 w-3" /> {syncStatusLabel(sync)}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
            <AlertTriangle className="h-3 w-3" /> {syncStatusLabel(sync)}
          </span>
        );
    }
  })();

  const showRetry = (sync === 'failed' || sync === 'local_only') && onRetry;
  const lastSynced = sync === 'synced' ? relativeTime(p.backendSyncedAt) : null;

  return (
    <div className="flex items-center gap-2">
      {chip}
      {lastSynced && <span className="text-[10px] text-slate-500">Last synced {lastSynced}</span>}
      {showRetry && (
        <button
          onClick={() => onRetry!(p.id)}
          className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-200 transition-colors hover:bg-sky-400/20"
        >
          <RefreshCw className="h-3 w-3" /> Retry Sync
        </button>
      )}
    </div>
  );
}

function ParlayCard({ p, onRetry }: { p: Parlay; onRetry?: (id: string) => void }) {
  const start = earliestStart(p);
  const norm = normalizeParlayStatus(p);
  const live = norm === 'live';
  const sync = getSyncStatus(p);
  const payout = formatPayout(p);

  return (
    <div
  className={`group relative overflow-hidden rounded-3xl border bg-slate-950/85 shadow-xl shadow-black/30 transition duration-200 hover:-translate-y-0.5 ${
    live
      ? 'border-emerald-300/30 shadow-emerald-950/20'
      : 'border-white/10 hover:border-cyan-300/30 hover:shadow-cyan-950/25'
  }`}
>
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/50 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {p.aiGenerated && <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />}
            <span className="truncate text-sm font-black text-slate-100">{p.title || 'Saved Parlay'}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusChipClass(norm)}`}>
              {live && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />}
              {statusLabel(norm)}
            </span>
            <SyncChip p={p} onRetry={onRetry} />
          </div>
        </div>
      </div>

      {/* Legs */}
      <div className="divide-y divide-slate-800/30">
        {(p.legs || []).length === 0 ? (
          <div className="px-4 py-3 text-[11px] text-slate-500">No leg detail saved.</div>
        ) : (
          (p.legs || []).map((leg) => {
            const legStatus = String((leg as any).status || 'PENDING').toUpperCase();
            const oddsKnown = typeof (leg as any).odds === 'number' && (leg as any).odds !== 0;
            const oddsLabel = americanLabel((leg as any).odds);
            const name = (leg as any).selection || (leg as any).market || '—';
            const playerId = (leg as any).playerId ?? (leg as any).mlbPlayerId ?? null;
            return (
              <div key={(leg as any).id || `${(leg as any).selection}-${(leg as any).odds}`} className="flex items-center gap-3 px-4 py-2.5">
                <PlayerHeadshot name={name} playerId={playerId} headshotUrl={(leg as any).headshotUrl} size={40} />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {LEG_ICON[legStatus] ?? LEG_ICON.PENDING}
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{name}</span>
                </div>
                {(leg as any).actual != null && (
                  <span className="font-mono text-[10px] text-slate-500">actual {(leg as any).actual}</span>
                )}
                <span className={`font-mono text-xs ${oddsKnown ? 'text-sky-400' : 'text-slate-500'}`}>{oddsLabel}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: odds / stake / payout / game date */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/50 p-4 text-[11px] sm:grid-cols-4">
        <div>
          <div className="font-black uppercase tracking-wider text-slate-600">Odds</div>
          <div className="mt-0.5 font-mono text-sky-300">{decimalLabel(decimalOdds(p) || null)}</div>
        </div>
        <div>
          <div className="font-black uppercase tracking-wider text-slate-600">Stake</div>
          <div className="mt-0.5 font-mono text-slate-200">
            {typeof p.wagerAmount === 'number' && p.wagerAmount > 0 ? `${p.wagerAmount}u` : '—'}
          </div>
        </div>
        <div>
          <div className="font-black uppercase tracking-wider text-slate-600">Potential</div>
          <div className="mt-0.5 font-mono text-emerald-300">{payout}{payout !== '—' ? 'u' : ''}</div>
        </div>
        <div>
          <div className="font-black uppercase tracking-wider text-slate-600">Game</div>
          <div className="mt-0.5 text-slate-300">{formatGameDate(start)}</div>
        </div>
      </div>

      {/* Sync warning */}
      {(sync === 'failed' || sync === 'local_only') && (
        <div className="flex items-center gap-2 border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-[11px] text-amber-200/90">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1">
            {sync === 'failed'
              ? p.backendSyncError || 'This parlay is saved locally but failed to sync to your account.'
              : 'Saved on this device only — sign in or retry to back it up to your account.'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function LiveParlaysPage({
  parlays,
  onGenerate,
  onBuildParlay,
  onRetrySync,
  generating,
  onRefreshGrades,
  isGrading,
  lastGraded,
}: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const all = parlays || [];

  // Apply filter, then group.
  const filtered = useMemo(
    () => all.filter((p) => matchesFilter(normalizeParlayStatus(p), filter)),
    [all, filter],
  );

  const grouped = useMemo(() => {
    const now = new Date();
    const groups: Record<GroupKey, Parlay[]> = { today: [], upcoming: [], live: [], completed: [] };
    for (const p of filtered) {
      groups[groupKeyFor(p, now)].push(p);
    }
    for (const key of GROUP_ORDER) {
      groups[key].sort((a, b) => {
        const sa = earliestStart(a)?.getTime() ?? 0;
        const sb = earliestStart(b)?.getTime() ?? 0;
        return key === 'completed' ? sb - sa : sa - sb;
      });
    }
    return groups;
  }, [filtered]);

  // Stat counts over the full set.
  const counts = useMemo(() => {
    const c = { total: all.length, pending: 0, live: 0, won: 0, lost: 0, void: 0 };
    for (const p of all) {
      const n = normalizeParlayStatus(p);
      if (n === 'pending') c.pending++;
      else if (n === 'live') c.live++;
      else if (n === 'won') c.won++;
      else if (n === 'lost') c.lost++;
      else if (n === 'void' || n === 'partially_void') c.void++;
    }
    return c;
  }, [all]);

  const decided = counts.won + counts.lost;
  const winRateLabel = decided > 0 ? `${Math.round((counts.won / decided) * 100)}%` : '—';

  const filterTabs: { id: FilterKey; label: string }[] = [
    { id: 'all', label: `All (${counts.total})` },
    { id: 'pending', label: `Pending (${counts.pending})` },
    { id: 'live', label: `Live (${counts.live})` },
    { id: 'won', label: `Won (${counts.won})` },
    { id: 'lost', label: `Lost (${counts.lost})` },
    { id: 'void', label: `Void (${counts.void})` },
  ];

  const visibleCount = filtered.length;

  return (
    <main className="ve-page ve-grid-bg min-h-screen px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              My Parlays
            </span>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                <Layers className="h-4 w-4 text-emerald-300" />
              </span>
              My Parlay Board
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Every parlay you save is backed up to your account and grouped by when it goes live.
              Grades update automatically — results are never invented.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {onRefreshGrades && (
              <button
                onClick={onRefreshGrades}
                disabled={isGrading}
                className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-black text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGrading ? 'animate-spin' : ''}`} />
                {isGrading ? 'Checking results…' : 'Refresh Results'}
              </button>
            )}
            {lastGraded && (
              <span className="text-[10px] text-slate-500">
                Last checked {lastGraded.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {onGenerate && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Today's Parlays
              </button>
            )}
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Saved</div>
            <div className="mt-1 text-2xl font-black text-white">{counts.total}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Live / Pending</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">
              {counts.live}
              <span className="text-slate-600"> / </span>
              <span className="text-amber-300">{counts.pending}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Record</div>
            <div className="mt-1 text-2xl font-black text-sky-300">{counts.won}-{counts.lost}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Win Rate</div>
            <div className="mt-1 text-2xl font-black text-white">{winRateLabel}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                filter === tab.id
                  ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sync legend */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 px-3 py-2 text-[10px] text-slate-500">
          <span className="font-black uppercase tracking-wider text-slate-600">Sync</span>
          <span className="inline-flex items-center gap-1"><Cloud className="h-3 w-3 text-emerald-400" /> Synced — saved to your account</span>
          <span className="inline-flex items-center gap-1"><CloudOff className="h-3 w-3 text-slate-400" /> Local only — on this device</span>
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-rose-400" /> Failed — tap Retry Sync</span>
        </div>

        {/* Empty / no-match / list */}
        {counts.total === 0 ? (
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-slate-700" />
            <p className="mt-4 text-base font-black text-slate-300">No parlays saved yet.</p>
            <p className="mt-1 text-sm text-slate-500">Build your first parlay.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {onBuildParlay && (
                <button
                  onClick={onBuildParlay}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-2.5 text-xs font-black text-white shadow-lg"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Go to Parlay Dock
                </button>
              )}
              {onGenerate && (
                <button
                  onClick={onGenerate}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-xs font-black text-slate-200 shadow-lg"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Today's Parlays
                </button>
              )}
            </div>
          </div>
        ) : visibleCount === 0 ? (
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-10 text-center">
            <Archive className="mx-auto h-8 w-8 text-slate-700" />
            <p className="mt-3 text-sm text-slate-500">No parlays match this filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {GROUP_ORDER.map((key) => {
              const items = grouped[key];
              if (items.length === 0) return null;
              const Icon = GROUP_META[key].icon;
              return (
                <section key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald-300" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">{GROUP_META[key].label}</h2>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {items.map((p) => (
                      <ParlayCard key={p.id} p={p} onRetry={onRetrySync} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
