import React, { useState } from 'react';
import type { HrBoardGame, HrBoardRow } from '../../types/hrBoard';
import HrCard, { type OnAddLeg } from './HrCard';
import { TIERS } from './tiers';

interface Props {
  games: HrBoardGame[];
  onSelect: (row: HrBoardRow) => void;
  onAddLeg?: OnAddLeg;
}

export default function HrTierView({ games, onSelect, onAddLeg }: Props) {
  const rows = games.flatMap((g) => g.rows);
  const [visibleByTier, setVisibleByTier] = useState<Record<string, number>>({});

  return (
    <div className="space-y-5">
      {TIERS.map((t) => {
        const list = rows.filter(t.match).sort((a, b) => (b.hrEdge ?? 0) - (a.hrEdge ?? 0));
        if (list.length === 0) return null;

        const visibleCount = visibleByTier[t.key] ?? 18;
        const visibleRows = list.slice(0, visibleCount);
        const remainingCount = Math.max(0, list.length - visibleRows.length);

        return (
          <div key={t.key}>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full" style={{ background: t.color }} />
              <div>
                <h3 className="text-base font-black" style={{ color: t.color }}>
                  {t.title}{' '}
                  <span className="font-mono text-xs text-[hsl(var(--ve-text-muted))]">
                    ({visibleRows.length}/{list.length})
                  </span>
                </h3>
                <p className="text-[11px] text-[hsl(var(--ve-text-muted))]">{t.sub}</p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRows.map((row) => (
                <HrCard key={row.playerId} row={row} onSelect={() => onSelect(row)} onAddLeg={onAddLeg} />
              ))}
            </div>

            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setVisibleByTier((current) => ({
                    ...current,
                    [t.key]: Math.min(list.length, visibleCount + 18),
                  }));
                }}
                className="mt-3 w-full rounded-xl border border-[hsl(var(--ve-border)/0.38)] bg-[hsl(var(--ve-surface-raised)/0.34)] px-3 py-2.5 text-xs font-black uppercase tracking-wide text-[hsl(var(--ve-text-secondary))] transition hover:border-[hsl(var(--ve-accent-cyan)/0.45)] hover:bg-[hsl(var(--ve-accent-cyan)/0.08)] hover:text-[hsl(var(--ve-accent-cyan))]"
              >
                Load 18 more · {remainingCount} hidden
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
