/**
 * StatResearchDrawer — Slide-in drawer with full player detail
 * Shows: score breakdown bars, all drivers, market data, DFS floor/ceiling, warnings
 * Triggered by clicking any card or table row.
 */

import React, { useEffect, useRef } from 'react';
import type { StatPlayerRow, StatType, StatTier } from '../types/statHubTypes';
import { STAT_CONFIG } from '../engine/statHubConfig';

interface Props {
  player:   StatPlayerRow | null;
  statType: StatType;
  open:     boolean;
  onClose:  () => void;
}

const TIER_META: Record<StatTier, { icon: string; token: string }> = {
  elite:   { icon: '★', token: '--ve-accent-gold' },
  strong:  { icon: '▲', token: '--ve-accent-cyan' },
  watch:   { icon: '◆', token: '--ve-accent-pink' },
  sleeper: { icon: '●', token: '--ve-text-muted' },
  fade:    { icon: '▼', token: '--ve-danger' },
};

export const StatResearchDrawer: React.FC<Props> = ({ player, statType, open, onClose }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const config    = STAT_CONFIG[statType];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap: move focus into drawer when open
  useEffect(() => {
    if (open && drawerRef.current) {
      const focusable = drawerRef.current.querySelector<HTMLElement>('button, [tabindex="0"]');
      focusable?.focus();
    }
  }, [open]);

  if (!player) return null;

  const meta      = TIER_META[player.tier];
  const tierLabel = config.tierLabels[player.tier];
  const token     = `--${config.token}`;
  const edgePos   = (player.edgePct ?? 0) > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-40 bg-[hsl(var(--ve-bg-deep)/0.7)] backdrop-blur-sm transition-opacity duration-[var(--ve-duration-normal)]',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${player.playerName} research`}
        className={[
          'fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col',
          'bg-[hsl(var(--ve-bg-panel))] border-l border-[hsl(var(--ve-border)/0.6)]',
          'shadow-[inset_1px_0_0_hsl(var(--ve-surface-raised)/0.5)]',
          'transition-transform duration-[var(--ve-duration-normal)] ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[hsl(var(--ve-border)/0.5)]">
          <div className="flex items-center gap-3">
            {/* Score badge */}
            <div
              className="flex-none w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl border-2"
              style={{
                borderColor: `hsl(var(${token}))`,
                background:  `hsl(var(${token})/0.12)`,
                color:       `hsl(var(${token}))`,
              }}
              aria-label={`Score: ${player.statScore}`}
            >
              {player.statScore}
            </div>
            <div>
              <h2 className="text-base font-bold text-[hsl(var(--ve-text-primary))] leading-tight">
                {player.playerName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-[hsl(var(--ve-text-muted))]">
                  {player.team} vs {player.opponent}
                </span>
                {player.lineupSpot && (
                  <span className="text-xs text-[hsl(var(--ve-text-muted))]">· #{player.lineupSpot}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5"
                  style={{
                    color:      `hsl(var(${meta.token}))`,
                    background: `hsl(var(${meta.token})/0.15)`,
                    border:     `1px solid hsl(var(${meta.token})/0.3)`,
                  }}
                >
                  <span aria-hidden="true">{meta.icon}</span> {tierLabel}
                </span>
                <span className="text-[10px] text-[hsl(var(--ve-text-muted))]">
                  {player.confidence}% confidence
                </span>
                {player.isHeuristic && (
                  <span className="text-[9px] text-[hsl(var(--ve-warning))] bg-[hsl(var(--ve-warning)/0.1)] px-1.5 py-0.5 rounded border border-[hsl(var(--ve-warning)/0.3)]">
                    v1 Heuristic
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="flex-none p-1.5 rounded-lg text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] hover:bg-[hsl(var(--ve-surface-raised)/0.5)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

          {/* Warnings */}
          {player.warnings && player.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[hsl(var(--ve-warning)/0.08)] border border-[hsl(var(--ve-warning)/0.3)]">
              <span aria-hidden="true" className="text-[hsl(var(--ve-warning))]">⚠</span>
              <div className="text-xs text-[hsl(var(--ve-warning))]">
                {player.warnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            </div>
          )}

          {/* Score drivers */}
          <section aria-label="Score drivers">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3">
              Score Drivers
            </h3>
            <div className="flex flex-col gap-3">
              {player.drivers.map(d => (
                <div key={d.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[hsl(var(--ve-text-primary)/0.85)] flex items-center gap-1">
                      <span aria-hidden="true">{d.icon}</span>
                      {d.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[hsl(var(--ve-text-muted))]">{d.weight}% wt</span>
                      <span className="font-bold text-[hsl(var(--ve-text-primary))]">
                        {d.value ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full h-2 rounded-full bg-[hsl(var(--ve-border)/0.3)]"
                    role="meter"
                    aria-label={`${d.label}: ${d.value ?? 'N/A'}`}
                    aria-valuenow={d.value ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-[var(--ve-duration-slow)]"
                      style={{
                        width:      `${d.value ?? 0}%`,
                        background: d.value != null && d.value >= 80
                          ? `hsl(var(${token}))`
                          : d.value != null && d.value >= 55
                            ? `hsl(var(--ve-accent-cyan)/0.7)`
                            : `hsl(var(--ve-text-muted)/0.5)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Market data */}
          <section aria-label="Market data">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3">
              Market Edge
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Model Prob', value: player.modelProbability != null ? `${Math.round(player.modelProbability * 100)}%` : '–' },
                { label: 'Book Implied', value: player.impliedProbability != null ? `${Math.round(player.impliedProbability * 100)}%` : '–' },
                { label: 'Edge', value: player.edgePct != null ? `${edgePos ? '+' : ''}${player.edgePct}%` : '–', highlight: edgePos ? '--ve-success' : '--ve-danger' },
                { label: 'Book Line', value: player.bookLine != null ? String(player.bookLine) : '–' },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-[hsl(var(--ve-surface)/0.6)] border border-[hsl(var(--ve-border)/0.4)]">
                  <span className="text-[10px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">{item.label}</span>
                  <span
                    className="text-lg font-extrabold leading-tight"
                    style={{ color: item.highlight ? `hsl(var(${item.highlight}))` : `hsl(var(--ve-text-primary))` }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* DFS */}
          {player.dfsProjection != null && (
            <section aria-label="DFS projections">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3">
                DFS Projections
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Floor',      value: player.dfsFloor,      token: '--ve-text-muted' },
                  { label: 'Projection', value: player.dfsProjection, token: '--ve-accent-gold' },
                  { label: 'Ceiling',    value: player.dfsCeiling,    token: '--ve-success' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-[hsl(var(--ve-surface)/0.6)] border border-[hsl(var(--ve-border)/0.4)] text-center">
                    <span className="text-[10px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">{item.label}</span>
                    <span className="text-base font-extrabold" style={{ color: `hsl(var(${item.token}))` }}>
                      {item.value ?? '–'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Season stats */}
          <section aria-label="Season stats">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3">
              Season Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-[hsl(var(--ve-surface)/0.6)] border border-[hsl(var(--ve-border)/0.4)]">
                <span className="text-[10px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">
                  Season {config.shortLabel}
                </span>
                <span className="text-xl font-extrabold text-[hsl(var(--ve-text-primary))]">
                  {player.seasonValue ?? '–'}
                </span>
              </div>
              {player.seasonRank != null && (
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-[hsl(var(--ve-surface)/0.6)] border border-[hsl(var(--ve-border)/0.4)]">
                  <span className="text-[10px] text-[hsl(var(--ve-text-muted))] uppercase tracking-wide">League Rank</span>
                  <span className="text-xl font-extrabold text-[hsl(var(--ve-text-primary))]">
                    #{player.seasonRank}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Reasons */}
          {player.reasons && player.reasons.length > 0 && (
            <section aria-label="Key reasons">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--ve-text-muted))] mb-3">
                Key Signals
              </h3>
              <ul className="flex flex-col gap-2">
                {player.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[hsl(var(--ve-text-primary)/0.85)]">
                    <span aria-hidden="true" className="text-[hsl(var(--ve-accent-cyan))] mt-0.5">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Source badge */}
          {player.sourceMode === 'mock' && (
            <div className="mt-auto pt-4 border-t border-[hsl(var(--ve-border)/0.3)]">
              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] text-center">
                Mock data — deterministic seeded values for development.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
