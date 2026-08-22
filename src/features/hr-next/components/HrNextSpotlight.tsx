import React from 'react';
import { Zap, Search, Plus } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import { formatGameTime } from '../utils/cardUtils';
import type { SlateAlpha } from '../utils/slateTelemetry';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { assessVerifiedNow } from '../utils/verifiedNow';

/**
 * "Slate Alpha" spotlight — sharp brutalist dossier card for the largest model-vs-book divergence.
 */
export const HrNextSpotlight = React.memo(function HrNextSpotlight({
  alpha,
  onOpenResearch,
  onAddToSlip,
}: {
  alpha: SlateAlpha;
  onOpenResearch: (player: { id: string | number; name: string }) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}) {
  const { row, hrpi, tier, evEdgePct, modelProbPct, impliedProbPct, oddsLabel, isFallback } = alpha;
  const teamLogo = logoByTeamName(row.team);
  const sourceComplete = assessVerifiedNow(row).verified;
  const lineupLabel = row.truthStatus === 'official'
    ? 'CONFIRMED'
    : row.truthStatus === 'projected'
      ? 'PROJECTED'
      : 'LINEUP UNKNOWN';

  return (
    <section
      aria-label="Slate Alpha spotlight"
      className="relative overflow-hidden border-2 border-amber-400 bg-black p-4 sm:p-5 font-mono shadow-[0_0_25px_rgba(251,191,36,0.15)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-amber-400 animate-pulse" />
          <span className="px-2 py-0.5 border border-amber-400/50 bg-amber-950/50 text-[9px] font-black uppercase tracking-widest text-amber-300">
            {isFallback ? 'HRPI LEADER // RESEARCH ONLY' : 'SLATE ALPHA // HIGHEST VALUE DIVERGENCE'}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          {isFallback ? 'HRPI LEADER · BOOK DATA PENDING' : 'MODEL VS BOOK PROBABILITY DELTA'}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="relative h-[68px] w-[68px] shrink-0 overflow-hidden border-2 border-amber-400/60 bg-zinc-950"
            style={{ aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={68} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate font-mono text-lg font-black leading-tight tracking-tight text-white uppercase">
                {row.playerName}
              </h2>
              <span className="inline-flex items-center gap-1 border border-white/15 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-300">
                {teamLogo ? (
                  <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
                ) : null}
                {row.team}
              </span>
              <span
                className="px-2 py-0.5 text-[9px] font-black uppercase border"
                style={{ color: tier.accent, borderColor: `${tier.accent}60`, backgroundColor: `${tier.accent}15` }}
              >
                {tier.label.toUpperCase()}
              </span>
            </div>
            <p className="mt-1.5 truncate text-xs text-zinc-400">
              vs <strong className="text-white">{row.pitcherName?.trim() || 'OPPOSING STARTER'}</strong>
              <span className="text-zinc-600"> · </span>
              {row.team} @ {row.opponent?.trim() || 'TBD'}
              <span className="text-zinc-600"> · </span>
              {formatGameTime(row.gameTime)}
              <span className="text-zinc-600"> · </span>
              <span className="text-cyan-300 font-bold uppercase">{lineupLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-stretch gap-2.5">
          <div className="min-w-[96px] border-2 border-white/15 bg-zinc-950 p-2.5">
            <span className="block text-[8.5px] font-black uppercase tracking-widest text-zinc-500">HRPI</span>
            <strong className="mt-1 block text-2xl font-black leading-none tabular-nums font-sans" style={{ color: tier.accent }}>
              {hrpi}
            </strong>
          </div>
          <div className="min-w-[96px] border-2 border-white/15 bg-zinc-950 p-2.5">
            <span className="block text-[8.5px] font-black uppercase tracking-widest text-zinc-500">MODEL HR%</span>
            <strong className="mt-1 block text-2xl font-black leading-none tabular-nums text-white font-sans">
              {modelProbPct != null ? `${modelProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div className="min-w-[96px] border-2 border-white/15 bg-zinc-950 p-2.5">
            <span className="block text-[8.5px] font-black uppercase tracking-widest text-zinc-500">BOOK IMP</span>
            <strong className="mt-1 block text-2xl font-black leading-none tabular-nums text-zinc-300 font-sans">
              {impliedProbPct != null ? `${impliedProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div className="min-w-[104px] border-2 border-emerald-400/40 bg-emerald-950/30 p-2.5">
            <span className="block text-[8.5px] font-black uppercase tracking-widest text-emerald-400">EDGE</span>
            <strong className="mt-1 block text-2xl font-black leading-none tabular-nums text-emerald-300 font-sans">
              {evEdgePct != null ? `${evEdgePct > 0 ? '+' : ''}${evEdgePct}%` : 'N/A'}
            </strong>
            <span className="mt-1 block text-[9px] text-zinc-400 font-bold">{oddsLabel ?? 'NO BOOK LINE'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="min-w-0 flex-1 truncate text-xs text-zinc-400 font-medium">
          {row.reasons[0]?.trim() || 'No model rationale supplied.'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenResearch({ id: row.playerId || row.stableId, name: row.playerName })}
            className="inline-flex h-8 items-center gap-1.5 border border-white/20 bg-zinc-900 px-3 text-[10px] font-bold uppercase text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
          >
            <Search className="h-3 w-3" /> DOSSIER
          </button>
          <button
            type="button"
            onClick={() => sourceComplete && onAddToSlip(row)}
            disabled={!sourceComplete}
            title={sourceComplete ? 'Add verified candidate to slip' : 'Required lineup, weather, bullpen, Statcast, game-time, and market inputs are missing'}
            className={`inline-flex h-8 items-center gap-1 border px-3.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
              sourceComplete
                ? 'border-amber-400 bg-amber-400 text-black hover:bg-amber-300 cursor-pointer'
                : 'border-white/15 bg-zinc-950 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {sourceComplete ? <><Plus className="h-3.5 w-3.5" /> + SLIP</> : 'INPUTS LOCKED'}
          </button>
        </div>
      </div>
    </section>
  );
});
