/**
 * StatCategoryGrid — Responsive grid of StatPlayerCards grouped by tier
 * Respects tierFilter; shows grouped sections with tier headings.
 */

import React from 'react';
import type { StatPlayerRow, StatTier, StatType } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';
import { StatPlayerCard } from './StatPlayerCard';

interface Props {
  rows:     StatPlayerRow[];
  statType: StatType;
  onSelect: (row: StatPlayerRow) => void;
}

const TIER_ORDER: StatTier[] = ['elite', 'strong', 'watch', 'sleeper', 'fade'];

const TIER_META: Record<StatTier, { icon: string; token: string }> = {
  elite:   { icon: '★', token: '--ve-accent-gold' },
  strong:  { icon: '▲', token: '--ve-accent-cyan' },
  watch:   { icon: '◆', token: '--ve-accent-pink' },
  sleeper: { icon: '●', token: '--ve-text-muted' },
  fade:    { icon: '▼', token: '--ve-danger' },
};

export const StatCategoryGrid: React.FC<Props> = ({ rows, statType, onSelect }) => {
  const config = STAT_CONFIG[statType];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <span className="text-3xl" aria-hidden="true">{config.icon}</span>
        <p className="text-sm text-[hsl(var(--ve-text-muted))]">No players match your current filters.</p>
      </div>
    );
  }

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<StatTier, StatPlayerRow[]>>(
    (acc, tier) => {
      acc[tier] = rows.filter(r => r.tier === tier);
      return acc;
    },
    { elite: [], strong: [], watch: [], sleeper: [], fade: [] },
  );

  return (
    <div className="flex flex-col gap-8">
      {TIER_ORDER.map(tier => {
        const group = grouped[tier];
        if (group.length === 0) return null;
        const meta  = TIER_META[tier];
        const label = config.tierLabels[tier];

        return (
          <section key={tier} aria-label={`${label} tier`}>
            {/* Tier heading */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{
                  color:       `hsl(var(${meta.token}))`,
                  background:  `hsl(var(${meta.token})/0.12)`,
                  borderColor: `hsl(var(${meta.token})/0.35)`,
                }}
              >
                <span aria-hidden="true">{meta.icon}</span>
                {label}
              </span>
              <span className="text-xs text-[hsl(var(--ve-text-muted))]">{group.length} player{group.length !== 1 ? 's' : ''}</span>
              <div className="flex-1 h-px bg-[hsl(var(--ve-border)/0.3)]" />
            </div>

            {/* Card grid */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.map(row => (
                <StatPlayerCard
                  key={row.stableId}
                  row={row}
                  statType={statType}
                  onClick={onSelect}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
