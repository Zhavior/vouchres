import React from 'react';
import { Lock } from 'lucide-react';
import { ACCENT, withAlpha } from '../../theme/colors';

export interface ProLockedCardProps {
  title: string;
  detail?: string;
  description?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent?: string;
  className?: string;
}

export const ProLockedCard: React.FC<ProLockedCardProps> = React.memo(function ProLockedCard({
  title,
  detail,
  description,
  badge = 'Pro',
  icon: Icon = Lock,
  accent = ACCENT.slate,
  className = '',
}) {
  const copy = detail ?? description ?? 'Verified data feed required. No fake data shown.';

  return (
    <div
      className={`ve-card-compact group relative overflow-hidden rounded-xl p-3 ${className}`}
      style={{ borderColor: withAlpha(accent, 0.22) }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--ve-surface-raised)/0.20),transparent,hsl(var(--ve-bg-panel)/0.34))] opacity-60" />
      <div className="relative flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md border"
          style={{ borderColor: withAlpha(accent, 0.28), background: withAlpha(accent, 0.08) }}
        >
          <Icon className="h-3 w-3" style={{ color: accent }} />
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--ve-text-secondary))]">
          {title}
        </span>
        <span
          className="ml-auto rounded-full border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider"
          style={{ borderColor: withAlpha(accent, 0.28), color: accent, background: withAlpha(accent, 0.07) }}
        >
          {badge}
        </span>
      </div>
      <p className="relative mt-1.5 text-[10px] leading-relaxed text-[hsl(var(--ve-text-muted))]">{copy}</p>
    </div>
  );
});

export default ProLockedCard;
