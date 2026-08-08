import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { useParlayOsStore } from '../../../../stores/parlayOsStore';
import type { HrWatchRow } from '../../types/hrWatch';
import { oddsDisplay, selectSpotlight, type SpotlightPick } from '../../engine/signalScore';
import { logoByTeamName } from '../../../../lib/teamLogos';

interface HrSpotlightDeckProps {
  rows: readonly HrWatchRow[];
  onAddToSlip?: (player: HrWatchRow) => void;
  onResearch: (player: HrWatchRow) => void;
}

const ACCENT: Record<SpotlightPick['key'], { ring: string; text: string; glow: string }> = {
  top: { ring: 'border-amber-300/45', text: 'text-amber-200', glow: 'shadow-[0_0_22px_rgba(251,191,36,0.16)]' },
  power: { ring: 'border-orange-400/40', text: 'text-orange-200', glow: 'shadow-[0_0_22px_rgba(251,146,60,0.14)]' },
  matchup: { ring: 'border-vouch-cyan/40', text: 'text-vouch-cyan', glow: 'shadow-[0_0_22px_rgba(0,240,255,0.14)]' },
  value: { ring: 'border-vouch-emerald/40', text: 'text-vouch-emerald', glow: 'shadow-[0_0_22px_rgba(0,255,148,0.14)]' },
};

function SpotlightCard({
  pick,
  onAddToSlip,
  onResearch,
}: {
  pick: SpotlightPick;
  onAddToSlip?: (player: HrWatchRow) => void;
  onResearch: (player: HrWatchRow) => void;
}) {
  const { row } = pick;
  const accent = ACCENT[pick.key];
  const teamLogo = row.teamLogoUrl || logoByTeamName(row.team);
  const price = oddsDisplay(row);
  const blocked = row.truthStatus === 'blocked';

  return (
    <article
      className={`flex min-w-0 flex-col gap-2.5 rounded-2xl border ${accent.ring} bg-gradient-to-b from-white/[0.04] to-black/40 p-3 backdrop-blur-xl ${accent.glow}`}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="text-sm leading-none">{pick.icon}</span>
        <span className={`truncate font-mono text-[9px] font-black uppercase tracking-[0.12em] ${accent.text}`}>
          {pick.title}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onResearch(row)}
        className="flex min-w-0 items-center gap-2.5 text-left"
        aria-label={`Open research for ${row.playerName}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-end justify-center overflow-hidden rounded-xl border border-white/12 bg-black/50">
          <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={44} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-black tracking-tight text-white">{row.playerName}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-white/50">
            {teamLogo ? <img src={teamLogo} alt="" className="h-3 w-3 shrink-0 object-contain" loading="lazy" /> : null}
            <span className="truncate">{row.team} vs {row.opponent}</span>
          </span>
        </span>
      </button>

      <div className="flex items-center gap-1.5">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/12 bg-black/45 px-2 py-1 font-mono text-[10px]">
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">{pick.metricLabel}</span>
          <span className={`font-black tabular-nums ${accent.text}`}>{pick.metricValue}</span>
        </span>
        {price ? (
          <span className="inline-flex shrink-0 items-center rounded-lg border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-white/60">
            {price}
          </span>
        ) : null}
      </div>

      {onAddToSlip ? (
        <button
          type="button"
          onClick={() => onAddToSlip(row)}
          disabled={blocked}
          className="mt-auto flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-vouch-emerald/40 bg-vouch-emerald/12 px-2 font-mono text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:bg-vouch-emerald/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Add to My List
        </button>
      ) : null}
    </article>
  );
}

/**
 * The above-the-fold spotlight: four highlight cards and one master button that
 * walks all four through the ParlayOS picker back to back.
 *
 * The master button queues rather than writing legs directly — every leg still
 * goes through the one canonical picker, so nothing lands on a slip without the
 * market, price and grading identity the picker resolves.
 */
export function HrSpotlightDeck({ rows, onAddToSlip, onResearch }: HrSpotlightDeckProps) {
  const picks = useMemo(() => selectSpotlight(rows), [rows]);
  const pickerOpen = useParlayOsStore((state) => state.pickerOpen);
  const [queue, setQueue] = useState<HrWatchRow[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);

  // Held in a ref so the drain effect keys off the picker and the queue only —
  // the page rebuilds this callback on most renders.
  const addToSlipRef = useRef(onAddToSlip);
  addToSlipRef.current = onAddToSlip;

  const endRun = useCallback(() => {
    setQueue([]);
    setQueueTotal(0);
  }, []);

  useEffect(() => {
    if (pickerOpen) return;
    if (queue.length === 0) {
      // The last player's picker has closed — the run is over.
      if (queueTotal > 0) setQueueTotal(0);
      return;
    }

    const [next, ...rest] = queue;
    setQueue(rest);
    addToSlipRef.current?.(next);

    // The picker lives in the app shell and isn't mounted on every route that
    // can render this board. If asking for it didn't actually open anything,
    // the run has nothing to advance through — end it rather than leaving the
    // button stuck mid-count on a picker that will never close.
    const timer = window.setTimeout(() => {
      if (!useParlayOsStore.getState().pickerOpen) endRun();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pickerOpen, queue, queueTotal, endRun]);

  const addAll = useCallback(() => {
    const players = picks.map((pick) => pick.row).filter((row) => row.truthStatus !== 'blocked');
    if (players.length === 0) return;
    setQueueTotal(players.length);
    setQueue(players);
  }, [picks]);

  if (picks.length === 0) return null;

  const queueActive = queueTotal > 0;
  const queuePosition = queueActive ? queueTotal - queue.length : 0;

  return (
    <section aria-label="Top signals" className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
          <h2 className="truncate font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white sm:text-xs">
            Today&apos;s top {picks.length}
          </h2>
          <span className="hidden truncate text-[11px] text-white/40 sm:inline">
            The highest-signal bats on the slate, one tap from your slip.
          </span>
        </div>

        {onAddToSlip ? (
          <button
            type="button"
            onClick={queueActive ? endRun : addAll}
            title={queueActive ? 'Stop adding the rest' : undefined}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-vouch-emerald/45 bg-gradient-to-r from-vouch-emerald/20 to-vouch-cyan/15 px-3 font-mono text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:brightness-125"
          >
            {queueActive ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {queueActive ? `Adding ${queuePosition} of ${queueTotal} — stop` : `Add all ${picks.length} to My List`}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {picks.map((pick) => (
          <SpotlightCard key={pick.key} pick={pick} onAddToSlip={onAddToSlip} onResearch={onResearch} />
        ))}
      </div>
    </section>
  );
}

export default HrSpotlightDeck;
