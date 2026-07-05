import { useMemo, useState } from 'react';
import type { HrWatchRow } from '../../types/hrWatch';

interface HrSpreadsheetProps {
  rows: HrWatchRow[];
  onSelectPlayer: (row: HrWatchRow) => void;
}

type SortKey = keyof HrWatchRow | 'ai';

type SortDirection = 'asc' | 'desc';

const columns: Array<{ key: SortKey; label: string }> = [
  { key: 'playerName', label: 'Player' },
  { key: 'team', label: 'Team' },
  { key: 'opponent', label: 'Game' },
  { key: 'hrScore', label: 'HR' },
  { key: 'vouchScore', label: 'Edge' },
  { key: 'pitcherName', label: 'Pitcher' },
  { key: 'hitterPower', label: 'Barrel' },
  { key: 'parkFactor', label: 'Park' },
  { key: 'oddsLabel', label: 'Wind' },
  { key: 'recentForm', label: 'Confidence' },
  { key: 'ai', label: 'AI' },
  { key: 'riskTier', label: 'Tier' },
];

const sortValue = (row: HrWatchRow, key: SortKey) => {
  if (key === 'ai') {
    return row.reasons.length;
  }
  const value = row[key as keyof HrWatchRow];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  return '';
};

function renderCell(row: HrWatchRow, key: SortKey) {
  switch (key) {
    case 'playerName':
      return row.playerName;
    case 'team':
      return row.team;
    case 'opponent':
      return `${row.team} @ ${row.opponent}`;
    case 'hrScore':
      return row.hrScore;
    case 'vouchScore':
      return row.vouchScore != null ? `${row.vouchScore}%` : '—';
    case 'pitcherName':
      return row.pitcherName;
    case 'hitterPower':
      return row.hitterPower != null ? row.hitterPower : '—';
    case 'parkFactor':
      return row.parkFactor != null ? row.parkFactor : '—';
    case 'oddsLabel':
      return row.oddsLabel;
    case 'recentForm':
      return row.recentForm != null ? `${row.recentForm}%` : '—';
    case 'ai':
      return row.reasons.length >= 3 ? 'High' : row.reasons.length === 0 ? 'Low' : 'Medium';
    case 'riskTier':
      return row.riskTier;
    default:
      return '—';
  }
}

export function HrSpreadsheet({ rows, onSelectPlayer }: HrSpreadsheetProps) {
  const [sortKey, setSortKey] = useState<SortKey>('hrScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left;
      }
      return sortDirection === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
  }, [rows, sortKey, sortDirection]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#081124]/80 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
          <thead className="sticky top-0 bg-[#02060F]/95 text-[10px] uppercase tracking-[0.26em] text-slate-500 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap border-b border-white/10 px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => handleHeaderClick(column.key)}
                    className="flex items-center gap-2 text-left text-slate-300"
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      <span className="text-slate-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.stableId}
                onClick={() => onSelectPlayer(row)}
                className="cursor-pointer border-b border-white/5 bg-[#0B1020] transition hover:bg-white/5"
              >
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 font-medium text-slate-200">
                    {renderCell(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
