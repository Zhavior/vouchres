import React from 'react';
import { Plus, Check, Bookmark } from 'lucide-react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrNextItem } from '../../hr-next/hooks/useHrNextData';
import { tierForScore } from '../../hr-next/utils/tierPartition';

/**
 * Ranked opportunity register.
 *
 * Rank is continuous across group headers, so 01 is the slate leader rather
 * than the leader of its band. Values are published board fields; an absent
 * layer prints an em dash rather than a zero.
 */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;

export interface HrLabRegisterProps {
  items: HrNextItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

export function HrLabRegister({
  items,
  activeId,
  onSelect,
  savedMap,
  onToggleSaved,
  onAddToSlip,
}: HrLabRegisterProps) {
  let rank = 0;

  return (
    <section aria-label="Ranked opportunities" className="min-w-0">
      <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
          Ranked opportunities
        </h2>
        <span className="font-mono text-[9px] tabular-nums uppercase tracking-[0.18em] text-white/25">
          {items.filter((i) => i.type === 'row').length} candidates
        </span>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th scope="col" className="w-9 py-2 pr-2 text-left font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">#</th>
            <th scope="col" className="py-2 pr-3 text-left font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Player</th>
            <th scope="col" className="hidden py-2 pr-3 text-left font-mono text-[9px] uppercase tracking-[0.18em] text-white/25 md:table-cell">Matchup</th>
            <th scope="col" className="w-14 py-2 pr-3 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">HRPI</th>
            <th scope="col" className="hidden w-12 py-2 pr-3 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white/25 lg:table-cell">Pwr</th>
            <th scope="col" className="hidden w-12 py-2 pr-3 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white/25 lg:table-cell">Vul</th>
            <th scope="col" className="hidden w-12 py-2 pr-3 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white/25 xl:table-cell">Prk</th>
            <th scope="col" className="w-20 py-2 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">Act</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            if (item.type === 'header') {
              return (
                <tr key={item.id}>
                  <td colSpan={8} className="pb-2 pt-7">
                    {/* Group headers carry no emoji; the label alone bands the set. */}
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
                      {item.tier.replace(/^[^\w]+\s*/, '')}
                    </span>
                  </td>
                </tr>
              );
            }

            rank += 1;
            const row = item.row;
            const hrpi = num(row.hrScore);
            const tier = tierForScore(hrpi ?? 0);
            const active = activeId === row.stableId;
            const saved = Boolean(savedMap[row.stableId]);

            return (
              <tr
                key={item.id}
                id={`player-card-${row.stableId}`}
                onClick={() => onSelect(row.stableId)}
                aria-selected={active}
                className={`group cursor-pointer transition-colors ${
                  active ? 'bg-ve-cyan/[0.06]' : 'hover:bg-white/[0.02]'
                }`}
              >
                <td className="relative py-2 pr-2 align-middle">
                  {active && (
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[2px] bg-ve-cyan" />
                  )}
                  <span className="pl-2 font-mono text-[10px] tabular-nums text-white/25">
                    {String(rank).padStart(2, '0')}
                  </span>
                </td>

                <td className="min-w-0 py-2 pr-3 align-middle">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className={`truncate font-sans text-sm ${active ? 'text-white' : 'text-white/85'}`}>
                      {row.playerName}
                    </span>
                    {row.truthStatus === 'official' && (
                      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-ve-emerald">
                        Conf
                      </span>
                    )}
                  </span>
                </td>

                <td className="hidden py-2 pr-3 align-middle md:table-cell">
                  <span className="truncate font-mono text-[10px] uppercase tracking-wider text-white/35">
                    {row.team} @ {row.opponent?.trim() || 'TBD'}
                  </span>
                </td>

                <td className="py-2 pr-3 text-right align-middle">
                  <span
                    className="font-mono text-sm font-bold tabular-nums"
                    style={{ color: tier.accent }}
                  >
                    {hrpi == null ? '—' : hrpi}
                  </span>
                </td>

                <td className="hidden py-2 pr-3 text-right align-middle lg:table-cell">
                  <span className="font-mono text-[11px] tabular-nums text-ve-emerald/80">
                    {num(row.hitterPower) ?? '—'}
                  </span>
                </td>
                <td className="hidden py-2 pr-3 text-right align-middle lg:table-cell">
                  <span className="font-mono text-[11px] tabular-nums text-ve-cyan/80">
                    {num(row.pitcherVulnerability) ?? '—'}
                  </span>
                </td>
                <td className="hidden py-2 pr-3 text-right align-middle xl:table-cell">
                  <span className="font-mono text-[11px] tabular-nums text-white/45">
                    {num(row.parkContext) ?? num(row.parkFactor) ?? '—'}
                  </span>
                </td>

                <td className="py-2 text-right align-middle">
                  <span className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSaved(row.stableId);
                      }}
                      aria-label={saved ? `Remove ${row.playerName}` : `Save ${row.playerName}`}
                      aria-pressed={saved}
                      className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
                        saved ? 'text-ve-emerald' : 'text-white/20 hover:text-white'
                      }`}
                    >
                      {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToSlip(row);
                      }}
                      aria-label={`Add ${row.playerName} to slip`}
                      className="inline-flex h-8 w-8 items-center justify-center text-white/20 transition-colors hover:text-ve-cyan"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default HrLabRegister;
