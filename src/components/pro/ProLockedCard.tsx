import React from 'react';
import { Lock } from 'lucide-react';

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
  accent = '#64748b',
  className = '',
}) {
  const copy = detail ?? description ?? 'Verified data feed required. No fake data shown.';

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-slate-950/40 p-3 ${className}`}
      style={{ borderColor: accent + '33' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-transparent to-slate-950/50 opacity-60" />
      <div className="relative flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md border"
          style={{ borderColor: accent + '40', background: accent + '12' }}
        >
          <Icon className="h-3 w-3" style={{ color: accent }} />
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
          {title}
        </span>
        <span
          className="ml-auto rounded-full border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider"
          style={{ borderColor: accent + '40', color: accent, background: accent + '10' }}
        >
          {badge}
        </span>
      </div>
      <p className="relative mt-1.5 text-[10px] leading-relaxed text-slate-500">{copy}</p>
    </div>
  );
});

export default ProLockedCard;
