import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check, CircleDot, Clock3, FileCheck2, Radio, ShieldAlert } from 'lucide-react';

export type AuroraMaxTruthState = 'confirmed' | 'live' | 'projected' | 'warning' | 'missing';

export function AuroraMaxProductMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-8 w-8 place-items-center border border-[#a8d8b6]/35 bg-[#0d2318]">
        <span className="absolute inset-[5px] rotate-45 border border-[#a8d8b6]/65" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#a8d8b6] shadow-[0_0_12px_rgba(168,216,182,0.7)]" />
      </div>
      <div>
        <p className="text-[13px] font-black tracking-[-0.02em] text-[#f2f0e9]">VOUCHEDGE</p>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#a8d8b6]/65">Aurora Max</p>
      </div>
    </div>
  );
}

const TRUTH_ICON = {
  confirmed: Check,
  live: Radio,
  projected: Clock3,
  warning: ShieldAlert,
  missing: CircleDot,
} as const;

type AuroraMaxPanelProps = {
  as?: 'div' | 'section' | 'article' | 'aside';
  children: ReactNode;
  className?: string;
  id?: string;
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
};

export function AuroraMaxPanel({ as: Component = 'div', children, className = '', id, role, ariaLabel, ariaLabelledBy }: AuroraMaxPanelProps) {
  return <Component id={id} role={role} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} className={`aurora-max-panel ${className}`}>{children}</Component>;
}

export function AuroraMaxEyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`aurora-max-eyebrow ${className}`}>{children}</p>;
}

export function AuroraMaxTruthBadge({ state, children, className = '' }: { state: AuroraMaxTruthState; children: ReactNode; className?: string }) {
  const Icon = TRUTH_ICON[state];
  return (
    <span className={`aurora-max-truth-badge aurora-max-truth-badge--${state} ${className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

type AuroraMaxControlProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'neutral' | 'primary' | 'danger';
};

export function AuroraMaxControl({ children, className = '', tone = 'neutral', type = 'button', ...props }: AuroraMaxControlProps) {
  return <button type={type} className={`aurora-max-control aurora-max-control--${tone} ${className}`} {...props}>{children}</button>;
}

export type AuroraMaxMetricItem = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'confirmed' | 'live' | 'neutral' | 'warning';
};

export function AuroraMaxMetricStrip({ items, className = '' }: { items: readonly AuroraMaxMetricItem[]; className?: string }) {
  return (
    <div className={`aurora-max-metric-strip ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={`aurora-max-metric aurora-max-metric--${item.tone ?? 'neutral'}`}>
          {item.icon ? <span className="aurora-max-metric__icon" aria-hidden="true">{item.icon}</span> : null}
          <span><strong>{item.value}</strong><small>{item.label}</small></span>
        </div>
      ))}
    </div>
  );
}

export function AuroraMaxScoreBadge({ score, label = 'HRPI' }: { score: number | string; label?: string }) {
  return (
    <div className="aurora-max-score-badge" aria-label={`${label} score ${score}`}>
      <div><strong>{score}</strong><span>{label}</span></div>
    </div>
  );
}

export type AuroraMaxEvidenceItem = {
  label: string;
  value: ReactNode;
  score?: number | null;
  tone?: 'confirmed' | 'neutral' | 'warning' | 'missing';
  detail?: string;
};

export function AuroraMaxEvidenceLadder({ items, meta }: { items: readonly AuroraMaxEvidenceItem[]; meta?: ReactNode }) {
  return (
    <section className="aurora-max-evidence" aria-label="Evidence ladder">
      <div className="aurora-max-evidence__header">
        <AuroraMaxEyebrow>Evidence ladder</AuroraMaxEyebrow>
        {meta ? <span className="aurora-max-evidence__meta">{meta}</span> : null}
      </div>
      {items.length > 0 ? (
        <div className="aurora-max-evidence__rows">
          {items.map((item, index) => {
            const boundedScore = item.score == null ? null : Math.max(0, Math.min(100, item.score));
            const detail = item.detail?.trim();
            return (
              <div className={`aurora-max-evidence__row${detail ? ' aurora-max-evidence__row--detail' : ''}`} key={`${item.label}-${index}`}>
                <span className="aurora-max-evidence__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="aurora-max-evidence__label">{item.label}</span>
                {boundedScore != null ? (
                  <span className="aurora-max-evidence__meter" aria-hidden="true"><span style={{ width: `${Math.max(4, boundedScore)}%` }} /></span>
                ) : null}
                <span className={`aurora-max-evidence__value aurora-max-evidence__value--${item.tone ?? 'neutral'}`}>{item.value}</span>
                {detail ? <p className="aurora-max-evidence__detail">{detail}</p> : null}
              </div>
            );
          })}
        </div>
      ) : <AuroraMaxFallback compact title="Evidence unavailable" detail="This source has not returned structured evidence inputs." />}
    </section>
  );
}

export function AuroraMaxCommandHeader({ eyebrow, title, description, meta, compact = false }: { eyebrow: ReactNode; title: ReactNode; description?: ReactNode; meta?: ReactNode; compact?: boolean }) {
  return (
    <header className={`aurora-max-command-header ${compact ? 'aurora-max-command-header--compact' : ''}`}>
      <div className="min-w-0">
        <AuroraMaxEyebrow>{eyebrow}</AuroraMaxEyebrow>
        <h1>{title}</h1>
        {description ? <p className="aurora-max-command-header__description">{description}</p> : null}
      </div>
      {meta ? <div className="aurora-max-command-header__meta">{meta}</div> : null}
    </header>
  );
}

export function AuroraMaxRankedWorkspace({ title, subtitle, controls, children, className = '' }: { title: ReactNode; subtitle?: ReactNode; controls?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`aurora-max-ranked-workspace ${className}`} aria-label={typeof title === 'string' ? title : 'Ranked workspace'}>
      <header className="aurora-max-ranked-workspace__header">
        <div><AuroraMaxEyebrow>Ranked workspace</AuroraMaxEyebrow><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
        {controls ? <div className="aurora-max-ranked-workspace__controls">{controls}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function AuroraMaxReceiptAction({ children, onClick, expanded, label }: { children?: ReactNode; onClick: () => void; expanded?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} aria-label={label} className="aurora-max-receipt-action">
      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />{children ?? 'Receipt'}
    </button>
  );
}

export function AuroraMaxFallback({ title, detail, compact = false, action }: { title: string; detail: string; compact?: boolean; action?: ReactNode }) {
  return (
    <div className={`aurora-max-fallback ${compact ? 'aurora-max-fallback--compact' : ''}`} role="status">
      <CircleDot className="h-5 w-5" aria-hidden="true" />
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}
