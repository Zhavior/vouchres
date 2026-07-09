/**
 * StatCategoryGrid — Responsive grid of StatPlayerCards grouped by tier
 */

import React from 'react';
import type { StatPlayerRow, StatTier, StatType } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';
import { StatPlayerCard } from './StatPlayerCard';
import { Z8_LABEL, Z8_PANEL_PREMIUM } from '../../../theme/z8Tokens';

interface Props {
  rows:     StatPlayerRow[];
  statType: StatType;
  onSelect: (row: StatPlayerRow) => void;
}

const TIER_ORDER: StatTier[] = ['elite', 'strong', 'watch', 'sleeper', 'fade'];

const TIER_META: Record<StatTier, { icon: string; classes: string }> = {
  elite:   { icon: '★', classes: 'border-vouch-amber/35 bg-vouch-amber/10 text-vouch-amber' },
  strong:  { icon: '▲', classes: 'border-vouch-cyan/35 bg-vouch-cyan/10 text-vouch-cyan' },
  watch:   { icon: '◆', classes: 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald' },
  sleeper: { icon: '●', classes: 'border-white/15 bg-white/5 text-white/60' },
  fade:    { icon: '▼', classes: 'border-red-500/30 bg-red-500/10 text-red-300' },
};

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
    <div className="flex flex-col gap-8">
      {TIER_ORDER.map(tier => {
        const group = grouped[tier];
        if (group.length === 0) return null;
        const meta  = TIER_META[tier];
        const label = config.tierLabels[tier];

        return (
          <section key={tier} aria-label={`${label} tier`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.classes}`}>
                <span aria-hidden="true">{meta.icon}</span>
                {label}
              </span>
              <span className={`${Z8_LABEL} text-white/40`}>{group.length} player{group.length !== 1 ? 's' : ''}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

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
