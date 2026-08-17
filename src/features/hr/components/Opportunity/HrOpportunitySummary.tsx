import type { HrWatchRow } from '../../types/hrWatch';
import { buildHrLensSignal } from '../../engine/hrLensModel';

const STATE_STYLE = {
  hot: 'border-orange-300/35 bg-orange-400/10 text-orange-200',
  'due-watch': 'border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100',
  building: 'border-emerald-300/30 bg-emerald-400/[0.08] text-emerald-100',
  'insufficient-data': 'border-white/12 bg-white/[0.04] text-white/55',
} as const;

export function HrOpportunitySummary({ player, compact = false }: { player: HrWatchRow; compact?: boolean }) {
  const signal = buildHrLensSignal(player);

  return (
    <div
      className={`border border-white/[0.09] bg-black/25 ${compact ? 'px-2 py-1.5' : 'rounded-lg px-2.5 py-2'}`}
      title={`${signal.stateExplanation} HRPI measures signal alignment, not home-run probability.`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex border px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.08em] ${STATE_STYLE[signal.playerState]}`}>
          {signal.playerStateLabel}
        </span>
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.06em] text-white/70">
          HRPI {signal.score}/100
        </span>
      </div>
      {!compact ? (
        <>
          <p className="mt-1.5 text-[10px] font-semibold leading-4 text-white/68">{signal.stateExplanation}</p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.06em] text-white/35">
            {signal.pressureBand} / signal alignment, not probability
          </p>
        </>
      ) : (
        <p className="mt-1 truncate font-mono text-[8px] uppercase tracking-[0.06em] text-white/38">
          {signal.pressureBand} / not probability
        </p>
      )}
    </div>
  );
}
