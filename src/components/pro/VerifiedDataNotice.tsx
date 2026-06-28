import React from 'react';
import { CloudOff, Database, Lock, ShieldCheck } from 'lucide-react';

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
    color: '#38bdf8',
    defaultTitle: 'Locked',
    defaultDetail: 'Verified data feed required.',
  },
  'feed-required': {
    icon: CloudOff,
    color: '#fbbf24',
    defaultTitle: 'Verified data feed required',
    defaultDetail: 'Connect a verified data feed to populate this section.',
  },
  'no-data': {
    icon: Database,
    color: '#64748b',
    defaultTitle: 'No verified data available',
    defaultDetail: 'This field is not present in the current payload.',
  },
  'coming-soon': {
    icon: ShieldCheck,
    color: '#34d399',
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
    <div
      className={`flex items-start gap-2.5 rounded-xl border p-3 ${className}`}
      style={{ borderColor: config.color + '33', background: config.color + '0a' }}
    >
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border"
        style={{ borderColor: config.color + '40', background: config.color + '12' }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: config.color }}>
          {title ?? config.defaultTitle}
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
          {detail ?? message ?? config.defaultDetail}
        </p>
      </div>
    </div>
  );
});

export default VerifiedDataNotice;
