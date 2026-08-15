import { Plus, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import {
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import { selectSpotlight, type SpotlightPick } from '../../hr/engine/signalScore';
import type { HrWatchRow } from '../../hr/types/hrWatch';

const HIGHLIGHT_STYLES: Record<SpotlightPick['key'], { border: string; bg: string; text: string }> = {
  top: { border: 'border-amber-400/40', bg: 'bg-amber-400/10', text: 'text-amber-300' },
  power: { border: 'border-orange-400/40', bg: 'bg-orange-400/10', text: 'text-orange-300' },
  matchup: { border: 'border-[var(--aurora-max-emerald)]/40', bg: 'bg-[var(--aurora-max-emerald)]/10', text: 'text-[var(--aurora-max-emerald)]' },
  value: { border: 'border-sky-400/40', bg: 'bg-sky-400/10', text: 'text-sky-300' },
};

export function HrMaxSpotlightDeck({
  rows,
  onSelect,
  onAddToSlip,
}: {
  rows: readonly HrWatchRow[];
  onSelect: (row: HrWatchRow) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}) {
  const spotlights = selectSpotlight(rows);
  if (spotlights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {spotlights.map((pick) => {
        const style = HIGHLIGHT_STYLES[pick.key];
        const { row } = pick;
        return (
          <AuroraMaxPanel
            key={pick.key}
            className={`group cursor-pointer border ${style.border} transition hover:bg-white/[0.025]`}
          >
            <div className="p-3" onClick={() => onSelect(row)}>
              {/* Category Header */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                <span className={`flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${style.text}`}>
                  <span>{pick.icon}</span>
                  <span>{pick.title}</span>
                </span>
                <span className="font-mono text-[9px] font-bold uppercase text-white/40">
                  {pick.metricLabel}: {pick.metricValue}
                </span>
              </div>

              {/* Player Identity */}
              <div className="mt-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <AuroraMaxTruthBadge state={row.truthStatus === 'official' ? 'confirmed' : 'projected'}>
                    {row.truthStatus === 'official' ? 'Confirmed' : 'Projected'}
                  </AuroraMaxTruthBadge>
                  <h4 className="mt-1 truncate text-xs font-bold text-white group-hover:text-[var(--aurora-max-emerald)]">
                    {row.playerName}
                  </h4>
                  <p className="mt-0.5 font-mono text-[9px] text-white/40">
                    {row.team} vs {row.opponent} · {row.gameTime || 'TBD'}
                  </p>
                </div>
                <AuroraMaxScoreBadge score={row.hrScore} />
              </div>

              {/* Reasons Snapshot */}
              <p className="mt-2 line-clamp-1 text-[10px] text-white/60">
                {row.reasons[0] || 'High signal alignment'}
              </p>

              {/* Action Button */}
              <div className="mt-2.5 flex items-center justify-end border-t border-white/[0.06] pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToSlip(row);
                  }}
                  title="Add to Parlay Slip"
                  className="inline-flex h-6 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/20"
                >
                  <Plus className="h-2.5 w-2.5" /> Add Slip
                </button>
              </div>
            </div>
          </AuroraMaxPanel>
        );
      })}
    </div>
  );
}
