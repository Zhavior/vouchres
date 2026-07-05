/**
 * HrPlayerDrawer — Pro rebuild
 *
 * Tabs:
 *   Overview  — identity, HR score + probability, top reasons, warnings
 *   Layers    — all 12 named scoring layers with weights + bars + signal labels
 *   Vegas     — Vegas edge, model vs book probability, odds
 *
 * Design rules:
 * - CSS tokens only — no hardcoded hex
 * - Every layer bar is labelled with its weight (%) and an emoji signal
 * - Vegas tab shows the edge calculation transparently
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, AlertTriangle, ShieldCheck, ShieldQuestion,
  ShieldAlert, ShieldOff, Award, Clock, Gauge, TrendingUp,
  Zap, BarChart3, Wind,
} from 'lucide-react';
import type { HrWatchRow, HrTruthStatus } from './HrPlayerCard';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HrPlayerDrawerProps {
  player: HrWatchRow | null;
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab = 'overview' | 'layers' | 'vegas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTierPalette(score: number): { text: string; bar: string; ring: string; border: string; token: string } {
  if (score >= 97) return { text: 'text-[hsl(var(--ve-accent-gold))]', bar: 'bg-[hsl(var(--ve-accent-gold))]', ring: '#f59e0b', border: 'border-[hsl(var(--ve-accent-gold)/0.32)]', token: 've-accent-gold' };
  if (score >= 92) return { text: 'text-[hsl(var(--ve-success))]',     bar: 'bg-[hsl(var(--ve-success))]',     ring: '#10b981', border: 'border-[hsl(var(--ve-success)/0.28)]',     token: 've-success' };
  if (score >= 85) return { text: 'text-[hsl(var(--ve-accent-cyan))]', bar: 'bg-[hsl(var(--ve-accent-cyan))]', ring: '#22d3ee', border: 'border-[hsl(var(--ve-accent-cyan)/0.28)]', token: 've-accent-cyan' };
  if (score >= 75) return { text: 'text-[hsl(var(--ve-accent-pink))]', bar: 'bg-[hsl(var(--ve-accent-pink))]', ring: '#818cf8', border: 'border-[hsl(var(--ve-accent-pink)/0.26)]', token: 've-accent-pink' };
  return               { text: 'text-[hsl(var(--ve-text-muted))]',     bar: 'bg-[hsl(var(--ve-border))]',      ring: '#64748b', border: 'border-[hsl(var(--ve-border)/0.35)]',      token: 've-text-muted' };
}

function tierLabel(score: number): string {
  if (score >= 97) return 'ELITE';
  if (score >= 92) return 'STRONG';
  if (score >= 85) return 'WATCH';
  if (score >= 75) return 'SLEEPER';
  return 'FADE';
}

function truthBadge(status: HrTruthStatus): { label: string; icon: React.ReactNode; className: string } {
  switch (status) {
    case 'official':  return { label: 'Official',  icon: <ShieldCheck  className="h-3.5 w-3.5" />, className: 'bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))] ring-[hsl(var(--ve-success)/0.28)]' };
    case 'projected': return { label: 'Projected', icon: <ShieldQuestion className="h-3.5 w-3.5" />, className: 'bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))] ring-[hsl(var(--ve-accent-cyan)/0.24)]' };
    case 'blocked':   return { label: 'Blocked',   icon: <ShieldAlert  className="h-3.5 w-3.5" />, className: 'bg-[hsl(var(--ve-danger)/0.10)] text-[hsl(var(--ve-danger))] ring-[hsl(var(--ve-danger)/0.25)]' };
    default:          return { label: '—',          icon: <ShieldOff    className="h-3.5 w-3.5" />, className: 'bg-[hsl(var(--ve-surface)/0.40)] text-[hsl(var(--ve-text-muted))] ring-[hsl(var(--ve-border)/0.20)]' };
  }
}

function fmt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return Math.round(v).toString();
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtOdds(v: number | null | undefined): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamColor(team: string): string {
  let hash = 0;
  for (let i = 0; i < team.length; i++) hash = team.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 52%, 38%)`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MiniBar: React.FC<{
  label: string;
  value: number | null | undefined;
  weight: number; // percentage weight e.g. 25
  icon: string;
  barClass: string;
  note?: string;
}> = ({ label, value, weight, icon, barClass, note }) => {
  const pct = value == null || Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
  const isNull = value == null || Number.isNaN(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-[11px] font-semibold text-[hsl(var(--ve-text-muted))] truncate">{label}</span>
          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[hsl(var(--ve-text-muted)/0.45)] shrink-0">
            {weight}%
          </span>
        </div>
        <span className="text-sm font-bold text-[hsl(var(--ve-text-primary))] shrink-0">
          {isNull ? <span className="text-[hsl(var(--ve-text-muted)/0.40)]">—</span> : fmt(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.25)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass} ${isNull ? 'opacity-20' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && (
        <p className="text-[10px] text-[hsl(var(--ve-text-muted)/0.50)] leading-tight">{note}</p>
      )}
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={[
    'rounded-xl border p-3',
    highlight
      ? 'border-[hsl(var(--ve-accent-cyan)/0.30)] bg-[hsl(var(--ve-accent-cyan)/0.06)]'
      : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)]',
  ].join(' ')}>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.60)]">{label}</p>
    <p className={`mt-1 text-lg font-extrabold ${highlight ? 'text-[hsl(var(--ve-accent-cyan))]' : 'text-[hsl(var(--ve-text-primary))]'}`}>{value}</p>
  </div>
);

// ─── 12-layer config ──────────────────────────────────────────────────────────

function getLayers(p: HrWatchRow): Array<{
  id: string; label: string; icon: string; weight: number;
  value: number | null | undefined; note?: string;
}> {
  return [
    {
      id: 'power',     label: 'Hitter Power',           icon: '💪', weight: 25,
      value: p.hitterPower,
      note: 'Barrel%, HardHit%, FB%, PullAir%, ISO, xSLG',
    },
    {
      id: 'pitcher',   label: 'Pitcher Risk',            icon: '⚾', weight: 20,
      value: p.pitcherVulnerability,
      note: 'HR/9, Barrel% Allowed, HardHit% Allowed, FB% Allowed, xSLG Allowed',
    },
    {
      id: 'pitchmix',  label: 'Pitch Mix Advantage',     icon: '🎯', weight: 15,
      value: p.pitchMix,
      note: 'Σ(Pitch Usage% × Hitter Run Value vs Pitch Type)',
    },
    {
      id: 'park',      label: 'Park Factor',             icon: '🏟️', weight: 10,
      value: p.parkFactor,
      note: 'HR Park Factor × Handedness Modifier',
    },
    {
      id: 'form',      label: 'Recent Form',             icon: '🔥', weight: 10,
      value: p.recentForm,
      note: 'Last 7/15/30 — Barrels, HardHit%, Exit Velo, xwOBA',
    },
    {
      id: 'weather',   label: 'Weather',                 icon: '🌬️', weight: 5,
      value: p.weather,
      note: 'Wind direction/speed, Temperature, Humidity, Air density',
    },
    {
      id: 'platoon',   label: 'Platoon Split',           icon: '🤜', weight: 5,
      value: p.platoon,
      note: 'Career ISO vs LHP / RHP',
    },
    {
      id: 'bullpen',   label: 'Bullpen Risk',            icon: '🔄', weight: 3,
      value: p.bullpen,
      note: 'Bullpen HR%, xFIP, Barrel% if starter exits early',
    },
    {
      id: 'lineup',    label: 'Lineup Context',          icon: '📋', weight: 3,
      value: p.lineupContext,
      note: 'Batting order, protection, projected PAs',
    },
    {
      id: 'swing',     label: 'Swing Decisions',         icon: '🎪', weight: 2,
      value: p.swingDecisions,
      note: 'Chase%, Whiff%, Contact%, ZoneContact%',
    },
    {
      id: 'bvp',       label: 'Batter vs. Pitcher',      icon: '📊', weight: 2,
      value: p.bvpScore,
      note: 'Career HR/PA, SLG, OBP vs this pitcher (small sample — 2–3% weight)',
    },
    {
      id: 'vegas',     label: 'Vegas Alignment',         icon: '💰', weight: 0,
      value: p.vegasEdgeScore,
      note: 'Validation only — not factored into composite score',
    },
  ];
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

export const HrPlayerDrawer: React.FC<HrPlayerDrawerProps> = ({ player, isOpen, onClose }) => {
  const [tab, setTab] = useState<DrawerTab>('overview');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isOpen) { setTab('overview'); setImgError(false); }
  }, [isOpen, player?.stableId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!player) return null;

  const palette = getTierPalette(player.hrScore);
  const badge = truthBadge(player.truthStatus);
  const avatarBg = teamColor(player.team);
  const hasWarnings = Boolean(player.warnings?.length);
  const reasons = player.reasons ?? [];
  const layers = getLayers(player);

  // Vegas edge calculation
  const hasLine = player.bookOdds != null && player.hrProbability != null;
  const edgeRaw = hasLine ? (player.hrProbability! - (player.impliedProbability ?? 0)) : null;
  const edgePositive = edgeRaw != null && edgeRaw >= 0.02;
  const edgeNegative = edgeRaw != null && edgeRaw <= -0.02;

  const TABS: Array<{ id: DrawerTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview',  icon: <Gauge className="h-3 w-3" /> },
    { id: 'layers',   label: 'Layers',    icon: <BarChart3 className="h-3 w-3" /> },
    { id: 'vegas',    label: 'VE Edge',   icon: <Zap className="h-3 w-3" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[hsl(var(--ve-bg-deep)/0.72)] backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog" aria-modal="true" aria-label={`${player.playerName} HR analysis`}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg-deep)/0.97)] shadow-2xl scrollbar-none"
          >
            {/* ── Header ────────────────────────────────────── */}
            <div className="relative border-b border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.40)] p-5">
              <button
                onClick={onClose} aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(var(--ve-border)/0.35)] bg-[hsl(var(--ve-surface)/0.30)] text-[hsl(var(--ve-text-muted))] transition hover:text-[hsl(var(--ve-accent-cyan))] hover:border-[hsl(var(--ve-accent-cyan)/0.35)]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                {player.headshotUrl && !imgError ? (
                  <img
                    src={player.headshotUrl} alt={player.playerName}
                    onError={() => setImgError(true)}
                    className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-[hsl(var(--ve-border)/0.40)]"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-[hsl(var(--ve-border)/0.40)]"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials(player.playerName)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-extrabold text-[hsl(var(--ve-text-primary))]">{player.playerName}</h2>
                    {/* Tier badge */}
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${palette.border} ${palette.text}`}>
                      {tierLabel(player.hrScore)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[hsl(var(--ve-text-muted))]">
                    {player.team || '—'} <span className="text-[hsl(var(--ve-text-muted)/0.40)]">vs</span> {player.opponent || '—'}
                  </p>
                  {player.pitcherName && (
                    <p className="truncate text-xs text-[hsl(var(--ve-text-muted)/0.55)]">⚾ {player.pitcherName}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}>
                      {badge.icon}{badge.label}
                    </span>
                    {player.gameTime && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--ve-text-muted)/0.50)]">
                        <Clock className="h-3 w-3" />{player.gameTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Score bar ────────────────────────────────── */}
            <div className="border-b border-[hsl(var(--ve-border)/0.24)] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.60)]">HR Score</p>
                  <p className={`text-4xl font-black ${palette.text}`}>{Math.round(player.hrScore)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {player.hrProbability != null && (
                    <p className="text-sm font-bold text-[hsl(var(--ve-text-primary))]">
                      {(player.hrProbability * 100).toFixed(1)}%
                      <span className="ml-1 text-[10px] font-normal text-[hsl(var(--ve-text-muted)/0.55)]">HR prob</span>
                    </p>
                  )}
                  {player.rank != null && (
                    <div className="flex items-center gap-1 text-[hsl(var(--ve-text-muted)/0.55)]">
                      <Award className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">Rank #{player.rank}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Probability progress bar */}
              {player.hrProbability != null && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.25)]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${palette.bar}`}
                      style={{ width: `${Math.min(100, player.hrProbability * 700)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-[hsl(var(--ve-text-muted)/0.40)]">
                    <span>0%</span><span>7%</span><span>14%+</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Tabs ─────────────────────────────────────── */}
            <div className="flex border-b border-[hsl(var(--ve-border)/0.24)] px-4">
              {TABS.map(t => (
                <button
                  key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    tab === t.id
                      ? 'text-[hsl(var(--ve-accent-cyan))]'
                      : 'text-[hsl(var(--ve-text-muted)/0.55)] hover:text-[hsl(var(--ve-text-muted))]'
                  }`}
                >
                  {t.icon}{t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[hsl(var(--ve-accent-cyan))]" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab content ──────────────────────────────── */}
            <div className="flex-1 p-5">

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div className="flex flex-col gap-4">
                  {/* Quick stats grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatBox label="Power" value={fmt(player.hitterPower)} />
                    <StatBox label="Pitcher Risk" value={fmt(player.pitcherVulnerability)} />
                    <StatBox label="Park" value={fmt(player.parkFactor)} />
                    <StatBox label="Recent Form" value={fmt(player.recentForm)} />
                  </div>

                  {/* Confidence */}
                  {player.dataConfidence != null && (
                    <div className="rounded-xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)] p-3.5">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.55)]">
                        Signal Confidence
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.25)]">
                          <div
                            className={`h-full rounded-full ${palette.bar}`}
                            style={{ width: `${Math.max(0, Math.min(100, player.dataConfidence))}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${palette.text}`}>{fmt(player.dataConfidence)}</span>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {hasWarnings && (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-warning)/0.80)]">
                        <AlertTriangle className="h-3.5 w-3.5" />Warnings
                      </p>
                      {player.warnings?.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl border border-[hsl(var(--ve-warning)/0.22)] bg-[hsl(var(--ve-warning)/0.06)] p-3 text-sm text-[hsl(var(--ve-warning))]">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Reasons */}
                  {reasons.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.55)]">
                        <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--ve-accent-cyan))]" />Top Signals
                      </p>
                      {reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-bg-panel)/0.28)] p-3 text-sm text-[hsl(var(--ve-text-primary))]">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ve-accent-cyan))]" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LAYERS TAB */}
              {tab === 'layers' && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-bg-panel)/0.28)] p-4">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.55)]">
                      <BarChart3 className="h-3.5 w-3.5" />12-Layer Model
                    </p>
                    <p className="text-[11px] text-[hsl(var(--ve-text-muted)/0.50)] mb-4">
                      Each layer's weight reflects its predictive contribution. Bars show 0–100 layer score. Vegas (Layer 12) is for validation only.
                    </p>
                    <div className="flex flex-col gap-4">
                      {layers.map((layer, i) => (
                        <div key={layer.id}>
                          {/* Divider before Vegas */}
                          {i === 11 && (
                            <div className="mb-4 flex items-center gap-2">
                              <div className="flex-1 h-px bg-[hsl(var(--ve-border)/0.28)]" />
                              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.40)]">Validation Only</span>
                              <div className="flex-1 h-px bg-[hsl(var(--ve-border)/0.28)]" />
                            </div>
                          )}
                          <MiniBar
                            label={`L${i + 1} — ${layer.label}`}
                            icon={layer.icon}
                            weight={layer.weight}
                            value={layer.value}
                            barClass={i === 11
                              ? 'bg-[hsl(var(--ve-accent-gold))]'
                              : palette.bar}
                            note={layer.note}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence model note */}
                  <div className="rounded-xl border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-bg-panel)/0.20)] p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[hsl(var(--ve-text-muted)/0.50)] mb-1.5">
                      Confidence
                    </p>
                    <p className="text-[11px] text-[hsl(var(--ve-text-muted)/0.60)] leading-relaxed">
                      Confidence = agreement between Power, Pitcher Risk, Park, Weather, Pitch Mix, Recent Form, Platoon, and AI consensus. It is not the HR probability — it measures how much signals align.
                    </p>
                    {player.dataConfidence != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.25)]">
                          <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${Math.min(100, player.dataConfidence)}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${palette.text}`}>{fmt(player.dataConfidence)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VEGAS TAB */}
              {tab === 'vegas' && (
                <div className="flex flex-col gap-4">
                  {/* Edge callout */}
                  {hasLine && edgeRaw != null ? (
                    <div className={[
                      'rounded-xl border p-4',
                      edgePositive
                        ? 'border-[hsl(var(--ve-success)/0.30)] bg-[hsl(var(--ve-success)/0.07)]'
                        : edgeNegative
                          ? 'border-[hsl(var(--ve-danger)/0.30)] bg-[hsl(var(--ve-danger)/0.07)]'
                          : 'border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-bg-panel)/0.30)]',
                    ].join(' ')}>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted)/0.55)] mb-1">
                        VouchEdge Edge
                      </p>
                      <p className={`text-3xl font-black ${
                        edgePositive ? 'text-[hsl(var(--ve-success))]' :
                        edgeNegative ? 'text-[hsl(var(--ve-danger))]' :
                        'text-[hsl(var(--ve-text-muted))]'
                      }`}>
                        {edgeRaw >= 0 ? '+' : ''}{(edgeRaw * 100).toFixed(2)}%
                      </p>
                      <p className="text-[11px] text-[hsl(var(--ve-text-muted)/0.55)] mt-1">
                        {edgePositive ? 'Model sees more value than the book implies' :
                         edgeNegative ? 'Book has priced this better than the model' :
                         'Model aligns with book — fair value'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)] p-4">
                      <p className="text-sm text-[hsl(var(--ve-text-muted)/0.50)]">
                        No Vegas line available for this player today.
                      </p>
                    </div>
                  )}

                  {/* Probability comparison */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatBox
                      label="Model Probability"
                      value={fmtPct(player.hrProbability)}
                      highlight
                    />
                    <StatBox
                      label="Book Implied"
                      value={fmtPct(player.impliedProbability)}
                    />
                    <StatBox
                      label="Book Odds"
                      value={fmtOdds(player.bookOdds)}
                    />
                    <StatBox
                      label="VE Edge Score"
                      value={fmt(player.vegasEdgeScore)}
                    />
                  </div>

                  {/* Edge bar */}
                  {hasLine && edgeRaw != null && (
                    <div className="rounded-xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-bg-panel)/0.28)] p-3.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[hsl(var(--ve-text-muted)/0.50)] mb-2">
                        Model vs. Book
                      </p>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--ve-border)/0.25)]">
                        {/* Center tick */}
                        <div className="absolute left-1/2 top-0 h-full w-px bg-[hsl(var(--ve-border)/0.60)]" />
                        {/* Edge fill */}
                        <div
                          className={`absolute top-0 h-full rounded-full transition-all duration-700 ${
                            edgePositive ? 'bg-[hsl(var(--ve-success))]' :
                            edgeNegative ? 'bg-[hsl(var(--ve-danger))]' :
                            'bg-[hsl(var(--ve-text-muted)/0.40)]'
                          }`}
                          style={{
                            left: edgeRaw >= 0 ? '50%' : `${50 + edgeRaw * 500}%`,
                            width: `${Math.min(50, Math.abs(edgeRaw) * 500)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[9px] text-[hsl(var(--ve-text-muted)/0.40)]">
                        <span>Fade ←</span><span>Fair</span><span>→ Value</span>
                      </div>
                    </div>
                  )}

                  {/* Explainer */}
                  <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-bg-panel)/0.18)] p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[hsl(var(--ve-text-muted)/0.45)] mb-1.5">
                      How VE Edge Works
                    </p>
                    <p className="text-[11px] leading-relaxed text-[hsl(var(--ve-text-muted)/0.55)]">
                      Edge = Model HR% − Book Implied HR%. The sportsbook's vig is removed before comparison. A positive edge means the model estimates a higher probability than the book prices in — potential value. This is validation only, not a recommendation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default HrPlayerDrawer;
