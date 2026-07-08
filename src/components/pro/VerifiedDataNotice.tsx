import React from 'react';
import { CloudOff, Database, Lock, ShieldCheck } from 'lucide-react';
import { ACCENT, withAlpha } from '../../theme/colors';
import { VECard } from '../ui/ve';

export type VerifiedDataNoticeVariant =
  | 'locked'
  | 'feed-required'
  | 'no-data'
  | 'coming-soon';

export interface VerifiedDataNoticeProps {
  variant?: VerifiedDataNoticeVariant;
  title?: string;
  detail?: string;
  message?: string;
  className?: string;
}

const VARIANT_CONFIG: Record<
  VerifiedDataNoticeVariant,
  { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; defaultTitle: string; defaultDetail: string }
> = {
  locked: {
    icon: Lock,
    color: ACCENT.matchup,
    defaultTitle: 'Locked',
    defaultDetail: 'Verified data feed required.',
  },
  'feed-required': {
    icon: CloudOff,
    color: ACCENT.gold,
    defaultTitle: 'Verified data feed required',
    defaultDetail: 'Connect a verified data feed to populate this section.',
  },
  'no-data': {
    icon: Database,
    color: ACCENT.slate,
    defaultTitle: 'No verified data available',
    defaultDetail: 'This field is not present in the current payload.',
  },
  'coming-soon': {
    icon: ShieldCheck,
    color: ACCENT.emerald,
    defaultTitle: 'Coming soon',
    defaultDetail: 'This module is under development. No data is being faked.',
  },
};

export const VerifiedDataNotice: React.FC<VerifiedDataNoticeProps> = React.memo(function VerifiedDataNotice({
  variant = 'feed-required',
  title,
  detail,
  message,
  className = '',
}) {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG['no-data'];
  const Icon = config.icon;

  return (
    <VECard
      tone="soft"
      className={`flex items-start gap-2.5 rounded-xl p-3 ${className}`}
      style={{ borderColor: withAlpha(config.color, 0.22), background: withAlpha(config.color, 0.04) }}
    >
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border"
        style={{ borderColor: withAlpha(config.color, 0.28), background: withAlpha(config.color, 0.08) }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: config.color }}>
          {title ?? config.defaultTitle}
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[hsl(var(--ve-text-muted))]">
          {detail ?? message ?? config.defaultDetail}
        </p>
      </div>
    </VECard>
  );
});

export default VerifiedDataNotice;
