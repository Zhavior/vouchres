import React from 'react';
import { BarChart3, Lock } from 'lucide-react';

export interface ProGraphShellProps {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description?: string;
  subtitle?: string;
  accent?: string;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const ProGraphShell: React.FC<ProGraphShellProps> = React.memo(function ProGraphShell({
  icon: Icon = BarChart3,
  title,
  description,
  subtitle,
  accent = '#64748b',
  right,
  footer,
  children,
  className = '',
}) {
  const helperText = subtitle ?? description;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-slate-950/35 p-3 ${className}`}
      style={{ borderColor: accent + '33' }}
    >
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />

      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border"
            style={{ borderColor: accent + '33', background: accent + '12' }}
          >
            <Icon className="h-3 w-3" style={{ color: accent }} />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">{title}</h4>
            {helperText && <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{helperText}</p>}
          </div>
        </div>
        {right}
      </div>

      {children ?? (
        <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800/60 bg-slate-950/50">
          <Lock className="h-4 w-4 text-slate-700" />
          <p className="max-w-xs text-center text-[10px] leading-relaxed text-slate-600">
            Verified data feed required. No fake graph data shown.
          </p>
        </div>
      )}

      {footer && (
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-500">{footer}</p>
      )}
    </section>
  );
});

export default ProGraphShell;
