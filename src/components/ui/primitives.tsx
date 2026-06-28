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
}> = React.memo(function StatChip({ label, value, color = '#e2e8f0' }) {
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-950/50 px-2 py-1.5 text-center">
      <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{label}</div>
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
    <Tag onClick={onClick} className={`text-left rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-4 transition-all ${onClick ? 'hover:border-sky-500/40 hover:-translate-y-0.5 w-full' : ''} ${className}`}>
      {children}
    </Tag>
  );
};

export function Button({ variant = 'primary', size = 'md', onClick, children, className = '' }: { variant?: 'primary' | 'ghost'; size?: 'sm' | 'md'; onClick?: () => void; children: React.ReactNode; className?: string }) {
  const base = size === 'sm' ? 'text-xs px-2.5 py-1.5' : 'text-sm px-4 py-2.5';
  const style = variant === 'primary'
    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 hover:from-sky-400 hover:to-blue-500'
    : 'border border-white/15 text-slate-200 hover:bg-white/5';
  return <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 font-black rounded-xl transition-all ${base} ${style} ${className}`}>{children}</button>;
}

const STATUS: Record<string, string> = {
  Live: '#f87171', Projected: '#60a5fa', Demo: '#94a3b8', Verified: '#34d399',
  Pending: '#fbbf24', Settled: '#a78bfa', Won: '#34d399', Lost: '#f87171', Pushed: '#94a3b8', Void: '#64748b',
};

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS[status] ?? '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border" style={{ color: c, borderColor: c + '55', background: c + '15' }}>
      {status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {status}
    </span>
  );
}

const RISK: Record<string, string> = {
  Strong: '#34d399', Safe: '#34d399', Playable: '#22d3ee', Balanced: '#22d3ee',
  Sneaky: '#a78bfa', Risky: '#fb923c', Lotto: '#fb923c', Avoid: '#f87171', Trap: '#f87171',
};

export function RiskBadge({ risk }: { risk: string }) {
  const c = RISK[risk] ?? '#94a3b8';
  return <span className="text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded border" style={{ color: c, borderColor: c + '55', background: c + '14' }}>{risk}</span>;
}

export const ScorePill: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = '#38bdf8' }) => {
  return (
    <div className="text-center px-2.5 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800">
      <p className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">{label}</p>
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
            {title && <h2 className="text-lg font-black tracking-tight text-slate-100">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
