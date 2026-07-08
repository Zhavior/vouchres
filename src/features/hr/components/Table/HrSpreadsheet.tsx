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
  { key: 'hrScore', label: 'HR Score' },
  { key: 'vouchScore', label: 'Edge' },
  { key: 'pitcherName', label: 'Pitcher' },
  { key: 'hitterPower', label: 'Barrel' },
  { key: 'parkFactor', label: 'Park' },
  { key: 'oddsLabel', label: 'Odds' },
  { key: 'recentForm', label: 'Form' },
  { key: 'ai', label: 'Signals' },
  { key: 'riskTier', label: 'Tier' },
];

const TIER_STYLES: Record<string, string> = {
  Elite: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Core: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Watch: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  Deep: 'bg-purple-500/15 text-purple-300 ring-purple-500/30',
  Blocked: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

const SIGNAL_STYLES: Record<string, string> = {
  High: 'text-emerald-400',
  Medium: 'text-amber-400',
  Low: 'text-zinc-500',
};

const sortValue = (row: HrWatchRow, key: SortKey) => {
  if (key === 'ai') {
    return row.reasons?.length ?? 0;
  }
  const value = row[key as keyof HrWatchRow];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  return '';
};

function renderCell(row: HrWatchRow, key: SortKey): React.ReactNode {
  switch (key) {
    case 'playerName':
      return (
        <span className="font-semibold text-slate-100">{row.playerName}</span>
      );
    case 'team':
      return <span className="text-zinc-300">{row.team}</span>;
    case 'opponent':
      return (
        <span className="text-zinc-400">
          {row.team} <span className="text-zinc-600">@</span> {row.opponent}
        </span>
      );
    case 'hrScore':
      return (
        <span
          className="tabular-nums font-bold"
          style={{ color: `hsl(var(--ve-accent-cyan))` }}
        >
          {row.hrScore}
        </span>
      );
    case 'vouchScore':
      return (
        <span className="tabular-nums font-semibold text-slate-200">
          {row.vouchScore != null ? `${row.vouchScore}%` : '—'}
        </span>
      );
    case 'pitcherName':
      return <span className="text-zinc-400">{row.pitcherName || '—'}</span>;
    case 'hitterPower':
      return (
        <span className="tabular-nums text-zinc-300">
          {row.hitterPower != null ? row.hitterPower : '—'}
        </span>
      );
    case 'parkFactor':
      return (
        <span className="tabular-nums text-zinc-300">
          {row.parkFactor != null ? row.parkFactor : '—'}
        </span>
      );
    case 'oddsLabel':
      return <span className="text-zinc-400">{row.oddsLabel || '—'}</span>;
    case 'recentForm':
      return (
        <span className="tabular-nums text-zinc-300">
          {row.recentForm != null ? `${row.recentForm}%` : '—'}
        </span>
      );
    case 'ai': {
      const count = row.reasons?.length ?? 0;
      const label = count >= 3 ? 'High' : count === 0 ? 'Low' : 'Medium';
      return (
        <span className={`text-xs font-bold ${SIGNAL_STYLES[label] ?? ''}`}>
          {label} <span className="font-normal opacity-60">({count})</span>
        </span>
      );
    }
    case 'riskTier': {
      const style = TIER_STYLES[row.riskTier] ?? 'bg-white/5 text-zinc-400 ring-white/10';
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${style}`}
        >
          {row.riskTier}
        </span>
      );
    }
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

  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border py-16 text-sm text-zinc-500"
        style={{ borderColor: 'hsl(var(--ve-border))', background: 'hsl(var(--ve-bg-panel))' }}
      >
        No players match the current filters.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      style={{
        borderColor: 'hsl(var(--ve-border))',
        background: 'hsl(var(--ve-bg-panel) / 0.8)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead
            className="sticky top-0 text-[10px] uppercase tracking-[0.26em] shadow-[0_1px_0_rgba(255,255,255,0.05)]"
            style={{
              background: 'hsl(var(--ve-bg-deep) / 0.95)',
              color: 'hsl(var(--ve-text-muted))',
            }}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap border-b border-white/[0.06] px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => handleHeaderClick(column.key)}
                    className="flex items-center gap-1.5 text-left transition-colors duration-150 hover:text-slate-300"
                    style={{ color: 'hsl(var(--ve-text-muted))' }}
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      <span className="text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => (
              <tr
                key={row.stableId}
                onClick={() => onSelectPlayer(row)}
                className="cursor-pointer transition-colors duration-150"
                style={{
                  background:
                    idx % 2 === 0
                      ? 'hsl(var(--ve-bg-panel))'
                      : 'hsl(var(--ve-surface))',
                  borderBottom: '1px solid hsl(var(--ve-border) / 0.5)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    'hsl(var(--ve-surface-raised))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    idx % 2 === 0
                      ? 'hsl(var(--ve-bg-panel))'
                      : 'hsl(var(--ve-surface))';
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap border-b border-white/[0.04] px-4 py-3 font-medium"
                  >
                    {renderCell(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center justify-between border-t px-4 py-2.5 text-xs"
        style={{
          borderColor: 'hsl(var(--ve-border))',
          color: 'hsl(var(--ve-text-muted))',
        }}
      >
        <span>{sortedRows.length} player{sortedRows.length !== 1 ? 's' : ''}</span>
        <span className="opacity-50">Click any row to open details</span>
      </div>
    </div>
  );
}
