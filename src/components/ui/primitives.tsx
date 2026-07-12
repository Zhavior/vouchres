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
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PANEL, Z8_SURFACE } from '../../theme/z8Tokens';

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
    <div className={`${Z8_SURFACE} px-2 py-1.5 text-center font-z8`}>
      <div className={`${Z8_LABEL} text-white/55`}>{label}</div>
      <div className="font-mono text-sm font-black" style={{ color }}>
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
    <Tag
      onClick={onClick}
      className={`ve-card ${Z8_PANEL} text-left p-4 transition-all font-z8 ${onClick ? 'hover:border-vouch-cyan/40 hover:bg-vouch-cyan/5 w-full cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
};

export function Button({ variant = 'primary', size = 'md', onClick, children, className = '' }: { variant?: 'primary' | 'ghost'; size?: 'sm' | 'md'; onClick?: () => void; children: React.ReactNode; className?: string }) {
  const base = size === 'sm' ? 'text-[11px] px-3 py-2' : 'text-xs px-4 py-2.5';
  const style = variant === 'primary' ? Z8_ACTIVE : Z8_IDLE;
  return (
    <button
      onClick={onClick}
      className={`z8-control inline-flex items-center justify-center gap-1.5 border font-mono font-bold uppercase tracking-[0.08em] ${base} ${style} ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS: Record<string, string> = {
  Live: ACCENT.danger, Projected: ACCENT.matchup, Demo: 'hsl(var(--ve-text-muted))', Verified: ACCENT.emerald,
  Pending: ACCENT.gold, Settled: ACCENT.form, Won: ACCENT.emerald, Lost: ACCENT.danger, Pushed: 'hsl(var(--ve-text-muted))', Void: ACCENT.slate,
};

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS[status] ?? 'hsl(var(--ve-text-muted))';
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 ${Z8_LABEL}`} style={{ color: c, borderColor: withAlpha(c, 0.34), background: withAlpha(c, 0.08) }}>
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
  return <span className={`border px-2 py-0.5 ${Z8_LABEL}`} style={{ color: c, borderColor: withAlpha(c, 0.34), background: withAlpha(c, 0.08) }}>{risk}</span>;
}

export const ScorePill: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = ACCENT.matchup }) => {
  return (
    <div className={`${Z8_SURFACE} px-2.5 py-1.5 text-center font-z8`}>
      <p className={`${Z8_LABEL} text-white/55`}>{label}</p>
      <p className="font-mono text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
};

export function Section({ title, subtitle, action, children }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-7 font-z8">
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-white font-mono uppercase">{title}</h2>}
            {subtitle && <p className="text-xs text-white/55 mt-0.5 font-mono">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
