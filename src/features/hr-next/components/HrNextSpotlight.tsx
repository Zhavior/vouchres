import React from 'react';
import { Zap, Search, Plus } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import { formatGameTime } from '../utils/cardUtils';
import type { SlateAlpha } from '../utils/slateTelemetry';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { assessVerifiedNow } from '../utils/verifiedNow';
import { HrNextCollisionField } from './HrNextCollisionField';

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
      className="relative overflow-hidden border border-white/[0.08] bg-obsidian-950"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ve-emerald" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ve-emerald">
            {isFallback ? 'HRPI LEADER // RESEARCH ONLY' : 'SLATE ALPHA // HIGHEST VALUE DIVERGENCE'}
          </span>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
          {isFallback ? 'HRPI LEADER · BOOK DATA PENDING' : 'MODEL VS BOOK PROBABILITY DELTA'}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="relative h-[68px] w-[68px] shrink-0 overflow-hidden border border-white/10 bg-obsidian-950"
            style={{ aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={68} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-2xl font-bold italic leading-[1.05] tracking-tighter text-white lg:text-3xl">
                {row.playerName}
              </h2>
              <span className="inline-flex items-center gap-1 border border-white/15 bg-obsidian-950 px-2 py-0.5 text-[10px] text-white/70">
                {teamLogo ? (
                  <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
                ) : null}
                {row.team}
              </span>
              <span
                className="px-2 py-0.5 text-[9px] font-semibold uppercase border"
                style={{ color: tier.accent, borderColor: `${tier.accent}60`, backgroundColor: `${tier.accent}15` }}
              >
                {tier.label.toUpperCase()}
              </span>
            </div>
            <p className="mt-1.5 truncate text-xs text-white/55">
              vs <strong className="text-white">{row.pitcherName?.trim() || 'OPPOSING STARTER'}</strong>
              <span className="text-white/30"> · </span>
              {row.team} @ {row.opponent?.trim() || 'TBD'}
              <span className="text-white/30"> · </span>
              {formatGameTime(row.gameTime)}
              <span className="text-white/30"> · </span>
              <span className="text-ve-cyan font-bold uppercase">{lineupLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-stretch gap-2.5">
          <div className="min-w-[96px] border-l border-white/[0.08] px-3 first:border-l-0 first:pl-0">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">HRPI</span>
            <strong className="mt-1 block text-2xl font-bold leading-none tabular-nums font-sans" style={{ color: tier.accent }}>
              {hrpi}
            </strong>
          </div>
          <div className="min-w-[96px] border-l border-white/[0.08] px-3 first:border-l-0 first:pl-0">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">MODEL HR%</span>
            <strong className="mt-1 block text-2xl font-bold leading-none tabular-nums text-white font-sans">
              {modelProbPct != null ? `${modelProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div className="min-w-[96px] border-l border-white/[0.08] px-3 first:border-l-0 first:pl-0">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">BOOK IMP</span>
            <strong className="mt-1 block text-2xl font-bold leading-none tabular-nums text-white/70 font-sans">
              {impliedProbPct != null ? `${impliedProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div className="min-w-[104px] border-2 border-ve-emerald/40 bg-ve-emerald/30 p-2.5">
            <span className="block text-[8.5px] font-semibold uppercase tracking-widest text-ve-emerald">EDGE</span>
            <strong className="mt-1 block text-2xl font-bold leading-none tabular-nums text-ve-emerald font-sans">
              {evEdgePct != null ? `${evEdgePct > 0 ? '+' : ''}${evEdgePct}%` : 'N/A'}
            </strong>
            <span className="mt-1 block text-[9px] text-white/55 font-bold">{oddsLabel ?? 'NO BOOK LINE'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="min-w-0 flex-1 truncate text-xs text-white/55 font-medium">
          {row.reasons[0]?.trim() || 'No model rationale supplied.'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenResearch({ id: row.playerId || row.stableId, name: row.playerName })}
            className="inline-flex h-8 items-center gap-1.5 border border-white/20 bg-obsidian-800 px-3 text-[10px] font-bold uppercase text-white/70 hover:border-white hover:text-white transition-colors cursor-pointer"
          >
            <Search className="h-3 w-3" /> DOSSIER
          </button>
          <button
            type="button"
            onClick={() => sourceComplete && onAddToSlip(row)}
            disabled={!sourceComplete}
            title={sourceComplete ? 'Add verified candidate to slip' : 'Required lineup, weather, bullpen, Statcast, game-time, and market inputs are missing'}
            className={`inline-flex h-8 items-center gap-1 border px-3.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              sourceComplete
                ? 'border-ve-amber bg-ve-amber text-black hover:bg-ve-amber cursor-pointer'
                : 'border-white/15 bg-obsidian-950 text-white/30 cursor-not-allowed'
            }`}
          >
            {sourceComplete ? <><Plus className="h-3.5 w-3.5" /> + SLIP</> : 'INPUTS LOCKED'}
          </button>
        </div>
      </div>
      <HrNextCollisionField row={row} />
    </section>
  );
});
