import { Clock3, Radio, Star, TrendingUp } from 'lucide-react';
import {
  AuroraMaxEvidenceLadder,
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';

export function HrMaxSpotlight({
  row,
  saved,
  onToggleSaved,
}: {
  row: HrMaxDeskRow;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  return (
    <AuroraMaxPanel className="hr-max-spotlight" ariaLabel="Primary research signal">
      <div className="hr-max-spotlight__grid" aria-hidden="true" />
      <div className="hr-max-spotlight__bar">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ed4ae]">
          <Radio className="h-3 w-3" aria-hidden="true" /> Primary research signal
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white/35">
          <Clock3 className="h-3 w-3" aria-hidden="true" /> {row.receipt.updated}
        </span>
      </div>
      <div className="hr-max-spotlight__body">
        <div className="hr-max-spotlight__player">
          <div className="hr-max-spotlight__identity">
            <div className="min-w-0">
              <AuroraMaxTruthBadge state={row.truthState}>{row.lineupLabel}</AuroraMaxTruthBadge>
              <h2>{row.playerName}</h2>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--aurora-max-emerald)]">
                {row.team} · {row.matchupLabel} · {row.gameTimeLabel}
              </p>
            </div>
            <AuroraMaxScoreBadge score={row.score} />
          </div>
          <p className="hr-max-spotlight__read">{row.read}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#e0e5dd]">
                <TrendingUp className="h-3 w-3 text-[var(--aurora-max-emerald)]" aria-hidden="true" /> {row.signal}
              </p>
              <p className="mt-1 text-[11px] text-white/30">{row.evidenceConfidence} · research signal, not a guarantee.</p>
            </div>
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${row.playerName} from My List` : `Add ${row.playerName} to My List`}
              title={saved ? 'Remove from My List' : 'Add to My List'}
              className={`grid h-9 w-9 shrink-0 place-items-center border ${saved ? 'hr-max-queue__icon is-on' : 'hr-max-queue__icon'}`}
            >
              <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        <div className="hr-max-spotlight__evidence">
          <AuroraMaxEvidenceLadder
            meta={<AuroraMaxTruthBadge state={row.truthState}>{row.evidenceConfidence}</AuroraMaxTruthBadge>}
            items={row.evidence}
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/25">
            <span>Source receipt available in queue</span>
            <span className="font-mono uppercase tracking-[0.12em]">{row.evidence.length} layers read</span>
          </div>
        </div>
      </div>
    </AuroraMaxPanel>
  );
}
