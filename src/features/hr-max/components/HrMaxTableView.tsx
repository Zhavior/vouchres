import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Star, TrendingUp } from 'lucide-react';
import {
  AuroraMaxFallback,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { estimateTableRowSize } from '../estimateDeskRowSize';

export function HrMaxTableView({
  rows,
  activeId,
  isSaved,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: {
  rows: HrMaxDeskRow[];
  activeId: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateTableRowSize,
    overscan: 10,
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (rows.length === 0) {
    return (
      <AuroraMaxFallback
        compact
        title="No table rows"
        detail="The active filter returned no eligible slate rows."
      />
    );
  }

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0;

  return (
    <div ref={parentRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)] overscroll-contain border border-white/10 bg-black/40">
      <table className="w-full text-left font-mono text-xs">
        <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0a110d] text-[10px] uppercase tracking-wider text-white/45 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <tr>
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Player</th>
            <th className="px-3 py-2.5">Matchup</th>
            <th className="px-3 py-2.5">Time</th>
            <th className="px-3 py-2.5">HRPI</th>
            <th className="px-3 py-2.5">Market & EV</th>
            <th className="px-3 py-2.5">Power / Matchup / Park</th>
            <th className="px-3 py-2.5">Lineup</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {paddingTop > 0 && (
            <tr><td style={{ height: `${paddingTop}px` }} colSpan={9} /></tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const active = row.id === activeId;
            const saved = isSaved(row.id);
            const teamLogo = logoByTeamName(row.team);

            const powerScore = typeof row.raw.hitterPower === 'number' && Number.isFinite(row.raw.hitterPower) ? Math.round(row.raw.hitterPower) : null;
            const pitcherScore = typeof row.raw.pitcherVulnerability === 'number' && Number.isFinite(row.raw.pitcherVulnerability) ? Math.round(row.raw.pitcherVulnerability) : null;
            const parkScore = typeof (row.raw.parkContext ?? row.raw.parkFactor) === 'number' && Number.isFinite(row.raw.parkContext ?? row.raw.parkFactor) ? Math.round((row.raw.parkContext ?? row.raw.parkFactor)!) : null;

            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                onClick={() => onSelect(row.id)}
                className={`cursor-pointer transition hover:bg-white/[0.03] ${active ? 'bg-[var(--aurora-max-emerald)]/[0.08]' : ''}`}
              >
                <td className="px-3 py-2.5 text-white/30 tabular-nums text-[11px]">
                  {String(virtualRow.index + 1).padStart(2, '0')}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      <PlayerHeadshot name={row.playerName} playerId={row.player.id} size={28} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-sans font-bold text-white hover:text-[var(--aurora-max-emerald)] block truncate">
                        {row.playerName}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                        {teamLogo && <img src={teamLogo} alt="" className="h-2.5 w-2.5 object-contain" />}
                        <span>{row.team}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-white/60 text-[11px]">
                  {row.matchupLabel}
                  {row.pitcherName && (
                    <span className="block text-[9px] text-white/40 truncate">vs {row.pitcherName}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-white/40">
                  {row.gameTimeLabel}
                </td>
                <td className="px-3 py-2.5">
                  <AuroraMaxScoreBadge score={row.score} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-white tabular-nums text-xs">
                      {row.bookOddsLabel || '—'}
                    </span>
                    {row.evEdge != null ? (
                      <span className={`text-[10px] font-bold tabular-nums ${row.evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                        {row.evEdge > 0 ? `+${row.evEdge}% EV` : `${row.evEdge}% EV`}
                      </span>
                    ) : (
                      <span className="text-[9px] text-white/30">Odds pending</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 max-w-[140px] text-[9px] font-mono">
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex justify-between text-white/40">
                        <span>P: {powerScore ?? '—'}</span>
                        <span>M: {pitcherScore ?? '—'}</span>
                        <span>K: {parkScore ?? '—'}</span>
                      </div>
                      <div className="h-1.5 flex rounded overflow-hidden bg-white/10">
                        <div style={{ width: `${(powerScore ?? 50) / 3}%` }} className="bg-orange-400" />
                        <div style={{ width: `${(pitcherScore ?? 50) / 3}%` }} className="bg-[var(--aurora-max-emerald)]" />
                        <div style={{ width: `${(parkScore ?? 50) / 3}%` }} className="bg-emerald-400" />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <AuroraMaxTruthBadge state={row.truthState}>
                    {row.confirmed ? 'Confirmed' : row.lineupLabel}
                  </AuroraMaxTruthBadge>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSaved(row.id)}
                      aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
                      className={`grid h-7 w-7 place-items-center border ${saved ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]' : 'border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToSlip(row)}
                      title="Add to Parlay Slip"
                      className="inline-flex h-7 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[10px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/20"
                    >
                      <Plus className="h-3 w-3" /> Slip
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr><td style={{ height: `${paddingBottom}px` }} colSpan={9} /></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
