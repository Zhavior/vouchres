import React from 'react';
import type { SafeNumber, SafeString } from '../../adapters/normalized';

export interface ProSignalBarProps {
  label: string;
  value: SafeNumber | string | undefined;
  max?: number;
  color?: string;
  hint?: SafeString;
  showValue?: boolean;
  onClick?: () => void;
}

function numericValue(value: SafeNumber | string | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export const ProSignalBar: React.FC<ProSignalBarProps> = React.memo(function ProSignalBar({
  label,
  value,
  max = 100,
  color = '#22d3ee',
  hint,
  showValue = true,
  onClick,
}) {
  const numeric = numericValue(value);
  const hasValue = numeric !== null;
  const normalized = hasValue && max > 0 ? clampPercent((numeric / max) * 100) : 0;
  const display = !showValue ? null : hasValue ? (max <= 1 ? numeric.toFixed(3) : String(Math.round(numeric))) : 'N/A';
  const tone = hasValue ? color : '#334155';

  return (
    <div className="space-y-1" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {display !== null && (
          <span className="font-mono text-[10px] font-black text-slate-200">{display}</span>
        )}
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full border border-slate-800/70 bg-slate-950/80">
        <div
          className="hr-board-score-bar-fill h-full rounded-full"
          style={{
            width: `${normalized}%`,
            background: `linear-gradient(90deg, ${tone}aa, ${tone})`,
            boxShadow: hasValue ? `0 0 10px ${tone}55` : 'none',
            transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {hint && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase text-slate-600">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
});

export default ProSignalBar;
