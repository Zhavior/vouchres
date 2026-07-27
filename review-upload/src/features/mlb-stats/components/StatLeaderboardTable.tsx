/**
 * StatLeaderboardTable — Spreadsheet / table view
 * Uses dynamic columns from STAT_CONFIG[statType].spreadsheetCols
 * aria-sort on sortable headers (Judge 15 accessibility requirement)
 */

import React from 'react';
import type { StatPlayerRow, StatType, StatTier, StatSortField, StatSortDir } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';

interface Props {
  rows:      StatPlayerRow[];
  statType:  StatType;
  sortField: StatSortField;
  sortDir:   StatSortDir;
  onSort:    (field: StatSortField, dir: StatSortDir) => void;
  onSelect:  (row: StatPlayerRow) => void;
}

const TIER_META: Record<StatTier, { icon: string; token: string }> = {
  elite:   { icon: '★', token: '--ve-accent-gold' },
  strong:  { icon: '▲', token: '--ve-accent-cyan' },
  watch:   { icon: '◆', token: '--ve-accent-pink' },
  sleeper: { icon: '●', token: '--ve-text-muted' },
  fade:    { icon: '▼', token: '--ve-danger' },
};

const SORTABLE: Record<string, StatSortField> = {
  statScore:   'score',
  seasonValue: 'season',
  edgePct:     'edge',
  playerName:  'name',
};

function formatCell(key: string, row: StatPlayerRow, statType: StatType): React.ReactNode {
  const intelligenceScore = row.intelligence?.score ?? row.statScore;
  const config   = STAT_CONFIG[statType];
  const meta     = TIER_META[row.tier];
  const tierLabel = config.tierLabels[row.tier];

  switch (key) {
    case 'playerName':
      return (
        <div className="flex items-center gap-2">
          <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={34} />
          <span className="font-semibold text-[hsl(var(--ve-text-primary))]">{row.playerName}</span>
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded hidden sm:inline-flex items-center gap-0.5"
            style={{
              color:      `hsl(var(${meta.token}))`,
              background: `hsl(var(${meta.token})/0.15)`,
            }}
          >
            <span aria-hidden="true">{meta.icon}</span> {tierLabel}
          </span>
        </div>
      );
    case 'statScore':
      return (
        <span
          className="font-extrabold text-sm"
          style={{ color: `hsl(var(--${config.token}))` }}
          aria-label={`Score: ${intelligenceScore}`}
        >
          {intelligenceScore}
        </span>
      );
    case 'edgePct': {
      const pos = (row.edgePct ?? 0) > 0;
      return (
        <span
          className="font-bold text-xs"
          style={{ color: `hsl(var(${pos ? '--ve-success' : '--ve-danger'}))` }}
        >
          {row.edgePct != null ? `${pos ? '+' : ''}${row.edgePct}%` : '–'}
        </span>
      );
    }
    case 'bookLine':
      return <span className="text-xs text-[hsl(var(--ve-text-muted))]">{row.bookLine ?? '–'}</span>;
    case 'bookOdds':
      return <span className="text-xs text-[hsl(var(--ve-text-muted))]">{row.bookOdds ?? '–'}</span>;
    case 'lineupSpot':
      return <span className="text-xs text-[hsl(var(--ve-text-muted))]">#{row.lineupSpot ?? '–'}</span>;
    default: {
      const val = (row as unknown as Record<string, unknown>)[key];
      return <span className="text-xs text-[hsl(var(--ve-text-muted))]">{val != null ? String(val) : '–'}</span>;
    }
  }
}

export const StatLeaderboardTable: React.FC<Props> = ({
  rows, statType, sortField, sortDir, onSort, onSelect,
}) => {
  const config = STAT_CONFIG[statType];
  const cols   = config.spreadsheetCols;

  function handleHeaderClick(key: string) {
    const sf = SORTABLE[key];
    if (!sf) return;
    if (sortField === sf) {
      onSort(sf, sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      onSort(sf, 'desc');
    }
  }

  function ariaSortAttr(key: string): React.AriaAttributes['aria-sort'] {
    const sf = SORTABLE[key];
    if (!sf || sortField !== sf) return 'none';
    return sortDir === 'desc' ? 'descending' : 'ascending';
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[hsl(var(--ve-text-muted))]">No players match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="ve-stat-table-wrap ve-stat-surface overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="ve-stat-surface-raised border-b border-white/10">
            <th className="w-8 px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/35">#</th>
            {cols.map(col => {
              const sortable = col.key in SORTABLE;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSortAttr(col.key)}
                  style={{ minWidth: col.width ?? 80 }}
                  className={[
                    'px-3 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/35',
                    sortable ? 'cursor-pointer select-none hover:text-white/70' : '',
                  ].join(' ')}
                  onClick={() => handleHeaderClick(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortable && sortField === SORTABLE[col.key] && (
                      <span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.stableId}
              onClick={() => onSelect(row)}
              className={[
                'cursor-pointer border-b border-white/6 transition-colors hover:bg-white/[0.03]',
                i % 2 === 1 ? 'bg-black/15' : '',
              ].join(' ')}
            >
              <td className="px-3 py-2.5 text-xs text-white/35">{i + 1}</td>
              {cols.map(col => (
                <td key={col.key} className="px-3 py-2.5">
                  {formatCell(col.key, row, statType)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
