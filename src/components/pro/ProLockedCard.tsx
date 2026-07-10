import React from 'react';
import { Lock } from 'lucide-react';
import { ACCENT, withAlpha } from '../../theme/colors';
import { VECard, VEBadge } from '../ui/ve';

export interface ProLockedCardProps {
  title: string;
  detail?: string;
  description?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent?: string;
  className?: string;
  onUpgrade?: () => void;
}

export const ProLockedCard: React.FC<ProLockedCardProps> = React.memo(function ProLockedCard({
  title,
  detail,
  description,
  badge = 'Pro',
  icon: Icon = Lock,
  accent = ACCENT.slate,
  className = '',
  onUpgrade,
}) {
  const copy = detail ?? description ?? 'Verified data feed required. No fake data shown.';

  return (
    <VECard
      tone="soft"
      className={`group relative overflow-hidden rounded-xl p-3 ${className}`}
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
        <VEBadge
          tone="neutral"
          className="ml-auto font-mono text-[8px]"
          style={{ borderColor: withAlpha(accent, 0.28), color: accent, background: withAlpha(accent, 0.07) }}
        >
          {badge}
        </VEBadge>
      </div>
      <p className="relative mt-1.5 text-[10px] leading-relaxed text-[hsl(var(--ve-text-muted))]">
        {copy}
      </p>

      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="relative mt-3 rounded-lg bg-vouch-cyan px-3 py-1.5 text-[10px] font-black text-black transition hover:brightness-110"
        >
          Upgrade to Pro
        </button>
      )}
    </VECard>
  );
});

export default ProLockedCard;
