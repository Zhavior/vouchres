import React from 'react';
import type { SafeNumber, SafeString } from '../../adapters/normalized';
import { ACCENT, withAlpha } from '../../theme/colors';

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
  color = ACCENT.matchup,
  hint,
  showValue = true,
  onClick,
}) {
  const numeric = numericValue(value);
  const hasValue = numeric !== null;
  const normalized = hasValue && max > 0 ? clampPercent((numeric / max) * 100) : 0;
  const display = !showValue ? null : hasValue ? (max <= 1 ? numeric.toFixed(3) : String(Math.round(numeric))) : 'N/A';
  const tone = hasValue ? color : ACCENT.slate;

  return (
    <div className="space-y-1" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">
          {label}
        </span>
        {display !== null && (
          <span className="font-mono text-[10px] font-black text-[hsl(var(--ve-text-secondary))]">{display}</span>
        )}
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.72)]">
        <div
          className="hr-board-score-bar-fill h-full rounded-full"
          style={{
            width: `${normalized}%`,
            background: `linear-gradient(90deg, ${withAlpha(tone, 0.72)}, ${tone})`,
            boxShadow: hasValue ? `0 0 10px ${withAlpha(tone, 0.34)}` : 'none',
            transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {hint && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase text-[hsl(var(--ve-text-muted))]">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
});

export default ProSignalBar;
