/**
 * HrPlayerDrawer — Pro rebuild
 *
 * Tabs:
 *   Overview  — identity, HR score + probability, top reasons, warnings
 *   Layers    — all 12 named scoring layers with weights + bars + signal labels
 *   Vegas     — Vegas edge, model vs book probability, odds
 *
 * Design rules:
 * - Z8 vouch palette for accent tiers (no rainbow --ve-accent-*)
 * - Every layer bar is labelled with its weight (%) and an emoji signal
 * - Vegas tab shows the edge calculation transparently
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, AlertTriangle, ShieldCheck, ShieldQuestion,
  ShieldAlert, ShieldOff, Award, Clock, Gauge, TrendingUp,
  Zap, BarChart3, Wind, LineChart,
} from 'lucide-react';
import type { HrWatchRow, TruthStatus as HrTruthStatus } from '../../types/hrWatch';
import { HrStatsTab } from '../Stats/HrStatsTab';
import { HrOverviewDossier } from '../Profile/HrOverviewDossier';
import { Z8_AMBER_HEX, Z8_CYAN_HEX, Z8_EMERALD_HEX } from '../../../../theme/z8Tokens';
import { logoByTeamName } from '../../../../lib/teamLogos';
import { useRealGameLog } from '../../hooks/useRealGameLog';
import { lastNGames } from '../../utils/realGameLogs';
import '../../../../styles/hr-profile.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HrPlayerDrawerProps {
  player: HrWatchRow | null;
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab = 'overview' | 'layers' | 'vegas' | 'stats';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTierPalette(score: number): { text: string; bar: string; ring: string; border: string; token: string } {
  if (score >= 97) return { text: 'text-vouch-amber', bar: 'bg-vouch-amber', ring: Z8_AMBER_HEX, border: 'border-vouch-amber/30', token: 'vouch-amber' };
  if (score >= 92) return { text: 'text-[hsl(var(--ve-success))]', bar: 'bg-[hsl(var(--ve-success))]', ring: '#10b981', border: 'border-[hsl(var(--ve-success)/0.28)]', token: 've-success' };
  if (score >= 85) return { text: 'text-vouch-cyan', bar: 'bg-vouch-cyan', ring: Z8_CYAN_HEX, border: 'border-vouch-cyan/30', token: 'vouch-cyan' };
  if (score >= 75) return { text: 'text-vouch-emerald', bar: 'bg-vouch-emerald', ring: Z8_EMERALD_HEX, border: 'border-vouch-emerald/25', token: 'vouch-emerald' };
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
    case 'projected': return { label: 'Projected', icon: <ShieldQuestion className="h-3.5 w-3.5" />, className: 'bg-vouch-amber/10 text-vouch-amber ring-vouch-amber/30' };
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
      ? 'border-vouch-cyan/30 bg-vouch-cyan/5'
      : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.28)]',
  ].join(' ')}>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--ve-text-muted)/0.60)]">{label}</p>
    <p className={`mt-1 text-lg font-extrabold ${highlight ? 'text-vouch-cyan' : 'text-[hsl(var(--ve-text-primary))]'}`}>{value}</p>
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
  const { logs: realLog, state: logState } = useRealGameLog(player?.playerId, isOpen);
  const formPreview = lastNGames(realLog ?? [], 8);

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
  const teamLogo = logoByTeamName(player.team) || player.teamLogoUrl;
  const oppLogo = logoByTeamName(player.opponent) || player.opponentLogoUrl;
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
    { id: 'stats',    label: 'Pro Stats', icon: <LineChart className="h-3 w-3" /> },
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
            className="ve-hr-drawer fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full max-w-md flex-col overflow-hidden border-l border-white/10 bg-[var(--ve-hr-panel)] shadow-2xl sm:h-full"
          >
            {/* ── Header ────────────────────────────────────── */}
            <div className="ve-hr-drawer-header relative shrink-0 border-b border-white/10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5 sm:pt-5">
              <button
                onClick={onClose} aria-label="Close"
                className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center border border-[hsl(var(--ve-border)/0.35)] bg-[hsl(var(--ve-surface)/0.30)] text-[hsl(var(--ve-text-muted))] transition hover:border-vouch-cyan/35 hover:text-vouch-cyan sm:right-4 sm:top-4 sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                {player.headshotUrl && !imgError ? (
                  <img
                    src={player.headshotUrl} alt={player.playerName}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
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
                  <p className="truncate text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      {teamLogo && <img src={teamLogo} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                      {player.team || '—'}
                    </span>
                    <span className="mx-1 text-white/25">vs</span>
                    <span className="inline-flex items-center gap-1">
                      {oppLogo && <img src={oppLogo} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                      {player.opponent || '—'}
                    </span>
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

            {/* ── Metric tape (one line — no duplicate score block) ── */}
            <div className="ve-hr-metric-tape shrink-0">
              <span>HR <strong>{Math.round(player.hrScore)}</strong></span>
              <span className="ve-hr-metric-tape-sep">·</span>
              {player.hrProbability != null && (
                <>
                  <span>Model <strong>{(player.hrProbability * 100).toFixed(1)}%</strong></span>
                  <span className="ve-hr-metric-tape-sep">·</span>
                </>
              )}
              {player.bookOdds != null && (
                <>
                  <span>Book <strong>{fmtOdds(player.bookOdds)}</strong></span>
                  <span className="ve-hr-metric-tape-sep">·</span>
                </>
              )}
              {edgeRaw != null && (
                <span className={edgePositive ? 've-hr-metric-tape-edge--pos' : edgeNegative ? 've-hr-metric-tape-edge--neg' : ''}>
                  Edge <strong>{edgeRaw >= 0 ? '+' : ''}{(edgeRaw * 100).toFixed(1)}%</strong>
                </span>
              )}
              {player.rank != null && (
                <>
                  <span className="ve-hr-metric-tape-sep ml-auto">·</span>
                  <span>Rank <strong>#{player.rank}</strong></span>
                </>
              )}
            </div>

            {/* ── Tabs ─────────────────────────────────────── */}
            <div className="flex shrink-0 overflow-x-auto border-b border-[hsl(var(--ve-border)/0.24)] px-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
              {TABS.map(t => (
                <button
                  key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex min-h-11 shrink-0 items-center gap-1.5 px-3 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:min-h-0 sm:text-xs ${
                    tab === t.id
                      ? 'text-vouch-cyan'
                      : 'text-[hsl(var(--ve-text-muted)/0.55)] hover:text-[hsl(var(--ve-text-muted))]'
                  }`}
                >
                  {t.icon}{t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-vouch-cyan" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab content ──────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <HrOverviewDossier
                  player={player}
                  formLogs={formPreview}
                  logState={logState}
                  variant="drawer"
                />
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
                              ? 'bg-vouch-amber'
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

              {/* STATS TAB */}
              {tab === 'stats' && (
                <HrStatsTab player={player} isPro={true} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default HrPlayerDrawer;
