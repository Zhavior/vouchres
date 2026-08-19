/**
 * My HR List — the curation surface.
 *
 * Reorderable because order is the user's editorial call and it is the order
 * the share card renders in. Reordering is keyboard-operable (the move buttons)
 * rather than pointer-drag-only, so the feature works without a mouse.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ListPlus, Loader2, Lock, Plus, Share2, Trash2,
} from 'lucide-react';
import { logoByTeamId } from '../../../lib/teamLogos';
import {
  selectActiveHrList,
  useHrListStore,
} from '../hrListStore';
import { HR_LIST_MAX_ENTRIES, type HrListEntry } from '../hrListTypes';
import HrListShareSheet from './HrListShareSheet';

function headshotUrl(playerId: number | string): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function formatProb(prob: number | null | undefined): string | null {
  if (prob == null || !Number.isFinite(Number(prob))) return null;
  const pct = Number(prob) * 100;
  if (pct <= 0) return null;
  return `${Math.round(pct)}%`;
}

function gradeTone(grade: string | null | undefined): string {
  const g = String(grade ?? '').toUpperCase();
  if (g.startsWith('A')) return 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10';
  if (g.startsWith('B')) return 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10';
  if (g.startsWith('C')) return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
  if (g.startsWith('D') || g.startsWith('F')) return 'text-rose-400 border-rose-400/40 bg-rose-400/10';
  return 'text-white/50 border-white/15 bg-white/5';
}

function EntryRow({
  entry,
  index,
  total,
  onMove,
  onRemove,
  disabled,
}: {
  entry: HrListEntry;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: (playerId: number | string) => void;
  disabled: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const logo = entry.teamId != null ? logoByTeamId(Number(entry.teamId)) : null;
  const prob = formatProb(entry.estimatedHrProb);

  const matchup = [
    entry.team ? String(entry.team).toUpperCase() : null,
    entry.opponent ? `vs ${String(entry.opponent).toUpperCase()}` : null,
    entry.opposingPitcher,
  ].filter(Boolean).join(' · ');

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5">
      <span className="w-4 shrink-0 text-center text-[11px] font-bold text-white/35">
        {index + 1}
      </span>

      {imageFailed ? (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white/50"
        >
          {entry.playerName.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <img
          src={headshotUrl(entry.playerId)}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-10 w-10 shrink-0 rounded-full bg-slate-800 object-cover"
        />
      )}

      {logo && (
        <img
          src={logo}
          alt=""
          width={22}
          height={22}
          loading="lazy"
          aria-hidden="true"
          className="h-[22px] w-[22px] shrink-0 rounded-full bg-slate-200 p-0.5"
        />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{entry.playerName}</span>
        <span className="block truncate text-[11px] text-white/45">{matchup || '—'}</span>
      </span>

      {entry.bestOdds && (
        <span className="hidden shrink-0 text-sm font-bold text-cyan-300 sm:block">
          {entry.bestOdds}
        </span>
      )}

      {prob && (
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold text-white">{prob}</span>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-white/35">
            HR prob
          </span>
        </span>
      )}

      {entry.grade && (
        <span className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-bold ${gradeTone(entry.grade)}`}>
          {entry.grade}
        </span>
      )}

      <span className="flex shrink-0 items-center">
        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
          aria-label={`Move ${entry.playerName} up`}
          className="flex h-11 w-8 items-center justify-center text-white/40 transition-colors hover:text-white disabled:opacity-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label={`Move ${entry.playerName} down`}
          className="flex h-11 w-8 items-center justify-center text-white/40 transition-colors hover:text-white disabled:opacity-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(entry.playerId)}
          aria-label={`Remove ${entry.playerName} from list`}
          className="flex h-11 w-9 items-center justify-center text-white/40 transition-colors hover:text-rose-400 disabled:opacity-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export function MyHrListPanel({ className = '' }: { className?: string }) {
  const lists = useHrListStore((s) => s.lists);
  const activeList = useHrListStore(selectActiveHrList);
  const activeListId = useHrListStore((s) => s.activeListId);
  const pending = useHrListStore((s) => s.pending);
  const sharing = useHrListStore((s) => s.sharing);
  const share = useHrListStore((s) => s.share);
  const lastError = useHrListStore((s) => s.lastError);

  const setActiveList = useHrListStore((s) => s.setActiveList);
  const createList = useHrListStore((s) => s.createList);
  const removePlayer = useHrListStore((s) => s.removePlayer);
  const reorder = useHrListStore((s) => s.reorder);
  const shareList = useHrListStore((s) => s.shareList);
  const closeShare = useHrListStore((s) => s.closeShare);
  const clearError = useHrListStore((s) => s.clearError);

  const [creating, setCreating] = useState(false);

  const busy = activeListId ? Boolean(pending[activeListId]) : false;
  const isLocalOnly = Boolean(activeListId?.startsWith('local:'));

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      await createList('My HR List');
    } finally {
      setCreating(false);
    }
  }, [createList]);

  const handleMove = useCallback((from: number, to: number) => {
    if (activeListId) void reorder(activeListId, from, to);
  }, [activeListId, reorder]);

  const handleRemove = useCallback((playerId: number | string) => {
    if (activeListId) void removePlayer(activeListId, playerId);
  }, [activeListId, removePlayer]);

  const handleShare = useCallback(() => {
    if (activeListId) void shareList(activeListId);
  }, [activeListId, shareList]);

  const summary = useMemo(() => {
    if (!activeList) return null;
    const count = activeList.entries.length;
    const graded = activeList.entries.filter((e) => e.grade?.startsWith('A')).length;
    return { count, graded };
  }, [activeList]);

  return (
    <section className={`space-y-3 ${className}`} aria-labelledby="my-hr-list-heading">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            My HR List
          </p>
          <h2 id="my-hr-list-heading" className="mt-0.5 text-lg font-bold text-white">
            {activeList?.title ?? 'No list yet'}
          </h2>
          {summary && (
            <p className="mt-0.5 text-[11px] text-white/45">
              {summary.count}/{HR_LIST_MAX_ENTRIES} players
              {summary.graded > 0 ? ` · ${summary.graded} A-grade` : ''}
              {activeList?.visibility === 'public' ? ' · public' : ' · private'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/40 hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {creating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            New list
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={sharing || busy || !activeList || activeList.entries.length === 0 || isLocalOnly}
            title={isLocalOnly ? 'Sign in to publish and share this list' : undefined}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-cyan-400 px-4 text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {sharing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              : isLocalOnly
                ? <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                : <Share2 className="h-3.5 w-3.5" aria-hidden="true" />}
            Share
          </button>
        </div>
      </header>

      {lists.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Your HR lists">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              role="tab"
              aria-selected={list.id === activeListId}
              onClick={() => setActiveList(list.id)}
              className={`min-h-11 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                list.id === activeListId
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                  : 'border-white/10 text-white/55 hover:text-white'
              }`}
            >
              {list.title}
              <span className="ml-1.5 text-white/35">{list.entries.length}</span>
            </button>
          ))}
        </div>
      )}

      {lastError && (
        <p
          role="status"
          className="flex items-start justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200"
        >
          <span>{lastError}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 font-bold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Dismiss
          </button>
        </p>
      )}

      {!activeList ? (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
          <ListPlus className="mx-auto h-7 w-7 text-white/25" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white/70">Start your HR list</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/40">
            Add players from the HR board. Your list becomes a shareable card with
            headshots, matchups, and your link.
          </p>
        </div>
      ) : activeList.entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-white/70">No players yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/40">
            Tap <strong className="text-white/70">Add to my HR list</strong> on any player
            on the HR board.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {activeList.entries.map((entry, index) => (
            <EntryRow
              key={String(entry.playerId)}
              entry={entry}
              index={index}
              total={activeList.entries.length}
              onMove={handleMove}
              onRemove={handleRemove}
              disabled={busy}
            />
          ))}
        </ul>
      )}

      {share && activeList && (
        <HrListShareSheet
          bundle={share.bundle}
          listTitle={activeList.title}
          onClose={closeShare}
        />
      )}
    </section>
  );
}

export default MyHrListPanel;
