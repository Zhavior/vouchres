/**
 * StatModeToggle — cards vs spreadsheet
 */

import React from 'react';
import type { StatViewMode } from '../types/statHubTypes';

interface Props {
  value: StatViewMode;
  onChange: (mode: StatViewMode) => void;
}

export const StatModeToggle: React.FC<Props> = ({ value, onChange }) => {
  const btn = (mode: StatViewMode, label: string) => (
    <button
      key={mode}
      type="button"
      onClick={() => onChange(mode)}
      aria-pressed={value === mode}
      className={[
        'rounded-md px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wide transition',
        value === mode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/65',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex rounded-lg border border-white/10 bg-obsidian-700 p-0.5"
    >
      {btn('cards', 'Cards')}
      {btn('spreadsheet', 'Table')}
    </div>
  );
};
