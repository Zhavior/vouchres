/**
 * ui/primitives.tsx — Shared UI helpers.
 *
 * Single source of truth for:
 *   - StatChip (was duplicated in HrSignalGraphs, HrTierView, HrBoardTable)
 *   - fmtInt, fmtDecimal, fmtPercent (were duplicated across files)
 *
 * Import from here everywhere. No more copies.
 */

import React from 'react';
import { getFounderPointsLabel } from "../../lib/founderAccess";
import { ACCENT, withAlpha } from '../../theme/colors';

/* ============================================================================
   Format helpers — never throw, always return fallback on bad data
   ============================================================================ */

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function fmtInt(value: unknown, fallback = 'N/A') {
  return isFiniteNumber(value) ? String(Math.round(value)) : fallback;
}

export function fmtDecimal(value: unknown, digits = 3, fallback = 'N/A') {
  return isFiniteNumber(value) ? (value as number).toFixed(digits) : fallback;
}

export function fmtPercent(value: unknown, fallback = 'N/A') {
  return isFiniteNumber(value) ? `${Math.round(value as number)}%` : fallback;
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

/* ============================================================================
   StatChip — small count chip (was duplicated 3x)
   ============================================================================ */

export const StatChip: React.FC<{
  label: string;
  value: string | number;
  color?: string;
}> = React.memo(function StatChip({ label, value, color = 'hsl(var(--ve-text-primary))' }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.30)] px-2 py-1.5 text-center">
      <div className="font-mono text-[8px] uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">{label}</div>
      <div className="font-mono text-xs font-black" style={{ color }}>
        {value}
      </div>
    </div>
  );
});

/* ============================================================================
   generateId — uses crypto.randomUUID when available
   ============================================================================ */

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================================================================
   Legacy components — preserved for backwards compat with existing imports
   ============================================================================ */

export const Card: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = ({ className = '', onClick, children }) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`ve-card text-left rounded-2xl p-4 transition-all ${onClick ? 'hover:border-[hsl(var(--ve-accent-cyan)/0.36)] hover:-translate-y-0.5 w-full' : ''} ${className}`}>
      {children}
    </Tag>
  );
};

export function Button({ variant = 'primary', size = 'md', onClick, children, className = '' }: { variant?: 'primary' | 'ghost'; size?: 'sm' | 'md'; onClick?: () => void; children: React.ReactNode; className?: string }) {
  const base = size === 'sm' ? 'text-xs px-2.5 py-1.5' : 'text-sm px-4 py-2.5';
  const style = variant === 'primary'
    ? 've-button-primary'
    : 've-button-secondary';
  return <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 font-black rounded-xl transition-all ${base} ${style} ${className}`}>{children}</button>;
}

const STATUS: Record<string, string> = {
  Live: ACCENT.danger, Projected: ACCENT.matchup, Demo: 'hsl(var(--ve-text-muted))', Verified: ACCENT.emerald,
  Pending: ACCENT.gold, Settled: ACCENT.form, Won: ACCENT.emerald, Lost: ACCENT.danger, Pushed: 'hsl(var(--ve-text-muted))', Void: ACCENT.slate,
};

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS[status] ?? 'hsl(var(--ve-text-muted))';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border" style={{ color: c, borderColor: withAlpha(c, 0.34), background: withAlpha(c, 0.08) }}>
      {status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {status}
    </span>
  );
}

const RISK: Record<string, string> = {
  Strong: ACCENT.emerald, Safe: ACCENT.emerald, Playable: ACCENT.matchup, Balanced: ACCENT.matchup,
  Sneaky: ACCENT.form, Risky: ACCENT.gold, Lotto: ACCENT.gold, Avoid: ACCENT.risk, Trap: ACCENT.risk,
};

export function RiskBadge({ risk }: { risk: string }) {
  const c = RISK[risk] ?? 'hsl(var(--ve-text-muted))';
  return <span className="text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded border" style={{ color: c, borderColor: withAlpha(c, 0.34), background: withAlpha(c, 0.08) }}>{risk}</span>;
}

export const ScorePill: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = ACCENT.matchup }) => {
  return (
    <div className="text-center px-2.5 py-1.5 rounded-xl bg-[hsl(var(--ve-surface-raised)/0.30)] border border-[hsl(var(--ve-border)/0.28)]">
      <p className="text-[8px] text-[hsl(var(--ve-text-muted))] font-mono uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono font-black" style={{ color }}>{value}</p>
    </div>
  );
};

export function Section({ title, subtitle, action, children }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-[hsl(var(--ve-text-primary))]">{title}</h2>}
            {subtitle && <p className="text-xs text-[hsl(var(--ve-text-secondary))] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
