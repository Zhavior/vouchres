/**
 * StatCategoryGrid — Responsive grid of StatPlayerCards grouped by tier
 */

import React from 'react';
import type { StatPlayerRow, StatTier, StatType } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';
import { StatPlayerCard } from './StatPlayerCard';
import { Z8_PANEL_PREMIUM } from '../../../theme/z8Tokens';

interface Props {
  rows: StatPlayerRow[];
  statType: StatType;
  onSelect: (row: StatPlayerRow) => void;
}

const TIER_ORDER: StatTier[] = ['elite', 'strong', 'watch', 'sleeper', 'fade'];

export const StatCategoryGrid: React.FC<Props> = ({ rows, statType, onSelect }) => {
  const config = STAT_CONFIG[statType];

  if (rows.length === 0) {
    return (
      <div className={`${Z8_PANEL_PREMIUM} flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl`}>
        <span className="text-3xl" aria-hidden="true">{config.icon}</span>
        <p className="text-sm text-white/50">No players match your current filters.</p>
      </div>
    );
  }

  const grouped = TIER_ORDER.reduce<Record<StatTier, StatPlayerRow[]>>(
    (acc, tier) => {
      acc[tier] = rows.filter(r => r.tier === tier);
      return acc;
    },
    { elite: [], strong: [], watch: [], sleeper: [], fade: [] },
  );

  return (
    <div className="flex flex-col gap-6">
      {TIER_ORDER.map(tier => {
        const group = grouped[tier];
        if (group.length === 0) return null;
        const label = config.tierLabels[tier];

        return (
          <section key={tier} aria-label={`${label} tier`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md border border-white/12 bg-white/5 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wide text-white/65">
                {label}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wide text-white/35">{group.length}</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
