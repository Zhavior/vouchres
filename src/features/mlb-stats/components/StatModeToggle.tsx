/**
 * StatModeToggle — Switches between 'cards' and 'spreadsheet' view modes
 * Uses CSS design tokens exclusively (no hardcoded hex).
 */

import React from 'react';
import type { StatViewMode } from '../types/statHubTypes';

interface Props {
  value: StatViewMode;
  onChange: (mode: StatViewMode) => void;
}

export const StatModeToggle: React.FC<Props> = ({ value, onChange }) => {
  const btn = (mode: StatViewMode, label: string, icon: string) => (
    <button
      key={mode}
      onClick={() => onChange(mode)}
      aria-pressed={value === mode}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
        'focus-visible:outline focus-visible:outline-2',
        value === mode
          ? 'bg-[hsl(var(--ve-accent-cyan)/0.18)] text-[hsl(var(--ve-accent-cyan))] border border-[hsl(var(--ve-accent-cyan)/0.4)]'
          : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] hover:bg-[hsl(var(--ve-surface-raised)/0.6)]',
      ].join(' ')}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex gap-1 p-1 rounded-lg bg-[hsl(var(--ve-bg-deep)/0.8)] border border-[hsl(var(--ve-border)/0.5)]"
    >
      {btn('cards',       'Cards',       '⊞')}
      {btn('spreadsheet', 'Spreadsheet', '☰')}
    </div>
  );
};
