import { AlertTriangle, CircleHelp, Clock3, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AuroraTrustPresentation, AuroraTrustStatus } from './types';

interface AuroraTrustStateProps {
  trust: AuroraTrustPresentation;
}

const STATUS_STYLE: Record<AuroraTrustStatus, string> = {
  confirmed: 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald',
  projected: 'border-vouch-amber/30 bg-vouch-amber/10 text-vouch-amber',
  limited: 'border-vouch-amber/30 bg-vouch-amber/10 text-vouch-amber',
  blocked: 'border-red-400/30 bg-red-400/10 text-red-200',
  unavailable: 'border-white/15 bg-white/[0.035] text-white/60',
};

const STATUS_ICON = {
  confirmed: ShieldCheck,
  projected: Clock3,
  limited: AlertTriangle,
  blocked: ShieldAlert,
  unavailable: CircleHelp,
} as const;

function formatUpdatedAt(value: string | null): string {
  if (!value) return 'Update time unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Update time unavailable';
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)}`;
}

export function AuroraTrustState({ trust }: AuroraTrustStateProps) {
  const Icon = STATUS_ICON[trust.status];

  return (
    <section aria-label="Data trust state" className={`border px-3 py-3 ${STATUS_STYLE[trust.status]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-current">{trust.label}</div>
          <p className="mt-1 text-xs leading-5 text-white/60">{trust.detail}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-white/45">
            <span>{trust.source ? `Source: ${trust.source}` : 'Source unavailable'}</span>
            <span>{formatUpdatedAt(trust.updatedAt)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
