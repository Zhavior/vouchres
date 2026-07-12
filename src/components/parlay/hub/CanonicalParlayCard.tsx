import React from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, GitBranch, Radio, ShieldCheck } from 'lucide-react';
import type { Parlay } from '../../../types';
import type { CanonicalParlayState } from '../../../domain/parlayState';
import { normalizePublicSlip } from '../../../lib/parlayDisplay';
import { ParlayHubStatusBadge } from './parlayHubUi';
import type { LegGradeStatus } from '../types/parlayHubTypes';

const LIFECYCLE_LABEL: Record<CanonicalParlayState['lifecycle'], string> = {
  upcoming: 'Upcoming',
  locked: 'Locked',
  live: 'Live',
  awaiting_result: 'Awaiting result',
  settled: 'Settled',
  time_tbd: 'Time TBD',
};

const ATTENTION_LABEL: Record<CanonicalParlayState['attentionReasons'][number], string> = {
  sync_failed: 'Save failed',
  identity_repair: 'Identity repair required',
  start_time_missing: 'Game time missing',
  awaiting_result: 'Waiting for official result',
};

function readableDate(value?: string | null): string {
  if (!value) return 'Game date TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Game date TBD';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function CanonicalParlayCard({
  parlay,
  state,
  onViewStructure,
}: {
  parlay: Parlay;
  state: CanonicalParlayState;
  onViewStructure?: () => void;
}) {
  const display = normalizePublicSlip(parlay);
  const gameDate = parlay.legs.find((leg) => leg.gameDate)?.gameDate;
  const pickId = parlay.backendPickId ?? parlay.id;
  const hasAttention = state.attentionReasons.length > 0;
  const openStructureFromCard = (event: React.MouseEvent<HTMLElement>) => {
    if (!onViewStructure) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) return;
    onViewStructure();
  };
  const openStructureFromKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onViewStructure || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onViewStructure();
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(7,20,27,.96),rgba(3,9,14,.98))] shadow-[0_18px_55px_rgba(0,0,0,.28)] ${onViewStructure ? 'cursor-pointer transition hover:border-cyan-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70' : ''}`}
      onClick={openStructureFromCard}
      onKeyDown={openStructureFromKeyboard}
      tabIndex={onViewStructure ? 0 : undefined}
      role={onViewStructure ? 'group' : undefined}
      aria-label={onViewStructure ? `Open ${parlay.title || 'parlay'} structure` : undefined}
    >
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${hasAttention ? 'bg-amber-400' : state.lifecycle === 'settled' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
      <div className="p-4 sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              <span>{display.publicId}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{state.sync === 'synced' ? 'Cloud synced' : state.sync === 'practice' ? 'Practice' : 'Local outbox'}</span>
            </div>
            <h3 className="mt-2 truncate text-sm font-extrabold text-white sm:text-base">{parlay.title || 'VouchEdge Parlay'}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{readableDate(gameDate ?? parlay.createdAt)}</span>
              <span>{parlay.legs.length} leg{parlay.legs.length === 1 ? '' : 's'}</span>
              <span>{display.oddsLabel}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-200">
              {LIFECYCLE_LABEL[state.lifecycle]}
            </span>
            <ParlayHubStatusBadge status={state.settlement as LegGradeStatus} size="xs" />
          </div>
        </header>

        <div className="mt-4 grid gap-2">
          {parlay.legs.slice(0, 4).map((leg, index) => (
            <div key={leg.id || index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/85">{leg.selection || 'Player prop'}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/40">
                  {leg.marketCode || leg.market} · {leg.gameDate ? readableDate(leg.gameDate) : leg.game || 'Game TBD'}
                  {leg.gameStatus ? ` · ${leg.gameStatus}` : ''}
                </p>
              </div>
              <ParlayHubStatusBadge status={String(leg.status || 'pending').toLowerCase() as LegGradeStatus} size="xs" />
            </div>
          ))}
        </div>

        {parlay.legs.length > 4 ? <p className="mt-2 text-center text-[10px] font-semibold text-white/35">+{parlay.legs.length - 4} more legs</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${state.identity === 'complete' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            {state.identity === 'complete' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {state.identity === 'complete' ? `${parlay.legs.length}/${parlay.legs.length} identity ready` : 'Identity repair'}
          </span>
          {parlay.feedLockedAt ? <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase text-white/55"><ShieldCheck className="h-3 w-3" />Trust locked</span> : null}
          {state.lifecycle === 'live' ? <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-bold uppercase text-cyan-200"><Radio className="h-3 w-3" />Live tracking</span> : null}
        </div>

        {hasAttention ? (
          <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/70">Needs attention</p>
            <p className="mt-1 text-[11px] text-amber-100/75">{state.attentionReasons.map((reason) => ATTENTION_LABEL[reason]).join(' · ')}</p>
          </div>
        ) : null}

        <footer className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
          {onViewStructure ? <button type="button" onClick={onViewStructure} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-bold uppercase tracking-wide text-white/55 transition hover:border-cyan-400/30 hover:text-cyan-200"><GitBranch className="h-3.5 w-3.5" />Structure</button> : null}
          {parlay.backendPickId ? <a href={`/p/${encodeURIComponent(pickId)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-3 text-[10px] font-bold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/10">Proof page</a> : null}
        </footer>
      </div>
    </article>
  );
}
