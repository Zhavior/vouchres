import React from 'react';
import { Zap, Search, Plus } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import { formatGameTime } from '../utils/cardUtils';
import type { SlateAlpha } from '../utils/slateTelemetry';
import type { HrWatchRow } from '../../hr/types/hrWatch';

/**
 * "Slate Alpha" spotlight — the single largest model-vs-book divergence on the
 * slate. Falls back to the HRPI leader, clearly labelled, when no row on the
 * board carries both a model and an implied probability.
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
  const lineupLabel = row.truthStatus === 'official'
    ? 'Confirmed'
    : row.truthStatus === 'projected'
      ? 'Projected'
      : 'Lineup unknown';

  return (
    <section
      aria-label="Slate Alpha spotlight"
      className="relative overflow-hidden rounded-2xl border bg-[#0a1010] px-4 py-4 sm:px-5"
      style={{ borderColor: `${tier.accent}40` }}
    >
      {/* Flat accent wash — a static gradient, not a blur, so it never repaints on scroll. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: tier.accent }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.16em]"
          style={{ color: tier.accent, borderColor: `${tier.accent}59`, backgroundColor: `${tier.accent}1f` }}
        >
          <Zap className="h-3 w-3" /> Slate Alpha
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
          {isFallback ? 'HRPI leader · no book divergence available' : 'Highest model vs book divergence'}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-2xl border-2 bg-black/60"
            style={{ borderColor: `${tier.accent}59`, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={64} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-mono text-base font-black leading-tight tracking-tight text-white sm:text-lg">
                {row.playerName}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#060a0a] px-2 py-0.5 font-mono text-[10px] text-white/55">
                {teamLogo ? (
                  <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
                ) : null}
                {row.team}
              </span>
              <span
                className="rounded border px-2 py-0.5 font-mono text-[9px] font-black uppercase"
                style={{ color: tier.accent, borderColor: `${tier.accent}59`, backgroundColor: `${tier.accent}1f` }}
              >
                {tier.label}
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-[11px] text-white/55">
              vs <strong className="font-bold text-white/85">{row.pitcherName?.trim() || 'Opposing starter'}</strong>
              <span className="text-white/25"> · </span>
              {row.team} @ {row.opponent?.trim() || 'Opponent unavailable'}
              <span className="text-white/25"> · </span>
              {formatGameTime(row.gameTime)}
              <span className="text-white/25"> · </span>
              <span className="font-bold uppercase tracking-[0.08em] text-white/40">{lineupLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-stretch gap-2">
          <div className="min-w-[92px] rounded-xl border border-white/[0.07] bg-[#060a0a] px-3 py-2">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">HRPI</span>
            <strong className="mt-1 block font-mono text-xl font-black leading-none tabular-nums" style={{ color: tier.accent }}>
              {hrpi}
            </strong>
          </div>
          <div className="min-w-[92px] rounded-xl border border-white/[0.07] bg-[#060a0a] px-3 py-2">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">Model HR%</span>
            <strong className="mt-1 block font-mono text-xl font-black leading-none tabular-nums text-white">
              {modelProbPct != null ? `${modelProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div className="min-w-[92px] rounded-xl border border-white/[0.07] bg-[#060a0a] px-3 py-2">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">Book Implied</span>
            <strong className="mt-1 block font-mono text-xl font-black leading-none tabular-nums text-white/70">
              {impliedProbPct != null ? `${impliedProbPct}%` : 'N/A'}
            </strong>
          </div>
          <div
            className="min-w-[104px] rounded-xl border px-3 py-2"
            style={{
              borderColor: evEdgePct != null && evEdgePct > 0 ? '#10B98159' : 'rgba(255,255,255,0.07)',
              backgroundColor: evEdgePct != null && evEdgePct > 0 ? 'rgba(16,185,129,0.10)' : '#060a0a',
            }}
          >
            <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/40">Divergence</span>
            <strong
              className="mt-1 block font-mono text-xl font-black leading-none tabular-nums"
              style={{ color: evEdgePct != null && evEdgePct > 0 ? '#10B981' : 'rgba(255,255,255,0.55)' }}
            >
              {evEdgePct != null ? `${evEdgePct > 0 ? '+' : ''}${evEdgePct}%` : 'N/A'}
            </strong>
            <span className="mt-0.5 block font-mono text-[9px] text-white/35">{oddsLabel ?? 'No book line'}</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/55">
          {row.reasons[0]?.trim() || 'No model rationale was supplied for this signal.'}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenResearch({ id: row.playerId || row.stableId, name: row.playerName })}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#060a0a] px-3 font-mono text-[10px] font-bold uppercase text-white/65 transition-colors hover:border-white/25 hover:text-white"
          >
            <Search className="h-3 w-3" /> Deep Intel
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 font-mono text-[10px] font-black uppercase transition-opacity hover:opacity-80"
            style={{ color: tier.accent, borderColor: `${tier.accent}59`, backgroundColor: `${tier.accent}26` }}
          >
            <Plus className="h-3.5 w-3.5" /> Slip
          </button>
        </div>
      </div>
    </section>
  );
});
