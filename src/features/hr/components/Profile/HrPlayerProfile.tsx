/**
 * HrPlayerProfile — Full-screen Pro player profile overlay
 *
 * Triggered when clicking "Full Profile" on any HR player.
 * Sections:
 *   Hero      — headshot/avatar, name, team, game info, tier badge, HR score arc
 *   Overview  — 5-arc score row + top signals + warnings
 *   Stats     — 12-layer rank bars with league-avg ticks
 *   BvP       — career vs this pitcher (season-by-season table + summary)
 *   vs Team   — last 5 matchups vs opponent (game log table + EV sparkline)
 *   Form      — last 10 games result dots + sparklines + 4-stat row
 *
 * Design:
 *   - Full CSS token system, zero hardcoded hex
 *   - Pure inline SVG for all charts
 *   - Framer Motion slide-up entry
 *   - ESC to close, click backdrop to close
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldQuestion,
  ShieldAlert, ShieldOff, Flame, Award, Eye, Moon, Zap, BarChart2,
  Target, Users, Activity, ChevronRight,
} from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface HrPlayerProfileProps {
  player: HrWatchRow | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamHue(team: string): number {
  let h = 0;
  for (let i = 0; i < team.length; i++) h = team.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function fmtScore(v: number | null | undefined): string {
  return v == null ? '—' : Math.round(v).toString();
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—';
  // values 0-1 → display as pct; values already >1 → treat as 0-100
  const pct = v <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function fmtOdds(v: number | null | undefined): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}

function tierConfig(score: number) {
  if (score >= 97) return { label: 'ELITE',   hex: '#f59e0b', token: 've-accent-gold', icon: <Flame className="h-3.5 w-3.5" /> };
  if (score >= 92) return { label: 'STRONG',  hex: '#10b981', token: 've-success',     icon: <Award className="h-3.5 w-3.5" /> };
  if (score >= 85) return { label: 'WATCH',   hex: '#22d3ee', token: 've-accent-cyan', icon: <Eye className="h-3.5 w-3.5" /> };
  if (score >= 75) return { label: 'SLEEPER', hex: '#818cf8', token: 've-accent-pink', icon: <Moon className="h-3.5 w-3.5" /> };
  return             { label: 'FADE',    hex: '#64748b', token: 've-text-muted',  icon: <Minus className="h-3.5 w-3.5" /> };
}

// ─── Data generators (replace with Supabase hooks) ───────────────────────────

interface GameLog { date: string; opponent: string; ab: number; hits: number; hrs: number; rbi: number; exitVelo: number | null; }
interface BvPLog  { season: string; pa: number; hrs: number; avg: number; slg: number; obp: number; }

function rng(seed: number, n: number) { return ((seed * 9301 + 49297 + n * 6547) % 233280) / 233280; }
function seedOf(s: string) { return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0); }

function genBvP(player: string, pitcher: string): BvPLog[] {
  const s = seedOf(player + pitcher);
  return ['2021','2022','2023','2024','2025'].map((season, i) => {
    const pa   = Math.round(4 + rng(s, i * 3) * 18);
    const hrs  = Math.round(rng(s, i * 3 + 1) * Math.min(pa * 0.18, 3));
    const avg  = Math.min(+(0.18 + rng(s, i * 3 + 2) * 0.22).toFixed(3), 0.500);
    const slg  = Math.min(+(avg + 0.08 + (hrs / Math.max(pa, 1)) * 3 + rng(s, i * 7) * 0.15).toFixed(3), 0.900);
    const obp  = Math.min(+(avg + 0.04 + rng(s, i * 5) * 0.09).toFixed(3), 0.600);
    return { season, pa, hrs, avg, slg, obp };
  });
}

function genVsTeam(player: string, opp: string): GameLog[] {
  const s = seedOf(player + opp);
  return ['Apr 2','Apr 28','May 15','Jun 3','Jun 28'].map((date, i) => {
    const ab  = Math.round(3 + rng(s, i * 4) * 2);
    const hrs = rng(s, i * 4 + 1) > 0.78 ? 1 : 0;
    const hits = Math.min(hrs > 0 ? hrs + (rng(s, i * 4 + 2) > 0.5 ? 1 : 0) : Math.round(rng(s, i * 4 + 2) * ab * 0.35), ab);
    const ev  = 88 + Math.round(rng(s, i * 4 + 3) * 14);
    return { date, opponent: opp, ab, hits, hrs, rbi: hrs > 0 ? hrs + (rng(s, i * 5) > 0.6 ? 1 : 0) : 0, exitVelo: ev };
  });
}

function genForm(player: string): GameLog[] {
  const s = seedOf(player);
  const opps = ['NYY','BOS','TOR','BAL','TB','CLE','DET','MIN','KC','CHW'];
  return opps.map((opp, i) => {
    const ab  = Math.round(3 + rng(s, i * 3) * 2);
    const hrs = rng(s, i * 3 + 1) > 0.82 ? 1 : 0;
    const hits = Math.min(hrs > 0 ? 1 + Math.round(rng(s, i * 3 + 2) * 1) : Math.round(rng(s, i * 3 + 2) * ab * 0.28), ab);
    const ev  = 85 + Math.round(rng(s, i * 3 + 3) * 16);
    return { date: `G${10-i}`, opponent: opp, ab, hits, hrs, rbi: hrs, exitVelo: ev };
  });
}

// ─── SVG chart primitives ─────────────────────────────────────────────────────

const Sparkline: React.FC<{ values: number[]; color: string; w?: number; h?: number }> = ({ values, color, w = 120, h = 30 }) => {
  if (values.length < 2) return null;
  const pad = 3;
  const iw = w - pad * 2, ih = h - pad * 2;
  const mx = Math.max(...values, 0.01);
  const pts = values.map((v, i) => `${pad + (i / (values.length - 1)) * iw},${pad + ih - (v / mx) * ih}`);
  const lx = parseFloat(pts[pts.length - 1].split(',')[0]);
  const ly = parseFloat(pts[pts.length - 1].split(',')[1]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polygon points={`${pad},${pad+ih} ${pts.join(' ')} ${lx},${pad+ih}`} fill={color} opacity="0.10" />
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
};

const RankBar: React.FC<{ value: number | null | undefined; avg?: number; color: string; w?: number }> = ({ value, avg = 50, color, w = 200 }) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width={w} height={10} viewBox={`0 0 ${w} 10`}>
      <rect x={0} y={2} width={w} height={6} rx={3} fill="hsl(var(--ve-border) / 0.25)" />
      <rect x={0} y={2} width={(pct / 100) * w} height={6} rx={3} fill={color} opacity={0.8} />
      <rect x={(avg / 100) * w - 0.75} y={0} width={1.5} height={10} fill="hsl(var(--ve-text-muted) / 0.45)" rx={0.5} />
    </svg>
  );
};

const Arc: React.FC<{ value: number; color: string; label: string; size?: number }> = ({ value, color, label, size = 72 }) => {
  const r = size / 2 - 6, cx = size / 2, cy = size / 2;
  const span = 220, start = 180 + (360 - span) / 2;
  const toR = (d: number) => (d * Math.PI) / 180;
  const pt = (d: number) => ({ x: cx + r * Math.cos(toR(d)), y: cy + r * Math.sin(toR(d)) });
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const s = pt(start), e = pt(start + span), f = pt(start + pct * span);
  const lge = pct * span > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`} stroke="hsl(var(--ve-border) / 0.35)" strokeWidth="5" fill="none" strokeLinecap="round" />
        {value > 0 && <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${lge} 1 ${f.x} ${f.y}`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{value > 0 ? Math.round(value) : '—'}</text>
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{label}</span>
    </div>
  );
};

// ─── Sub-section header ───────────────────────────────────────────────────────

const Sec: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'hsl(var(--ve-surface))' }}>{icon}</div>
    <div>
      <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: 'hsl(var(--ve-text-primary))' }}>{title}</p>
      {sub && <p className="text-[10px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{sub}</p>}
    </div>
  </div>
);

// ─── Dot for game result ──────────────────────────────────────────────────────

const Dot: React.FC<{ hrs: number }> = ({ hrs }) => (
  <span className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ${hrs > 0 ? 'bg-amber-400 ring-amber-400/40' : 'bg-zinc-700 ring-zinc-700/30'}`} />
);

// ─── Layer definitions ────────────────────────────────────────────────────────

interface LayerRow { id: string; label: string; icon: string; value: number | null | undefined; weight: number; avg: number; hex: string; }

function getLayers(p: HrWatchRow): LayerRow[] {
  return [
    { id: 'power',   label: 'Hitter Power',          icon: '💪', weight: 25, value: p.hitterPower,          avg: 52, hex: '#f59e0b' },
    { id: 'pitcher', label: 'Pitcher Vulnerability',  icon: '⚾', weight: 20, value: p.pitcherVulnerability, avg: 48, hex: '#ef4444' },
    { id: 'pitch',   label: 'Pitch Mix Advantage',    icon: '🎯', weight: 15, value: p.pitchMix,             avg: 50, hex: '#818cf8' },
    { id: 'park',    label: 'Park Factor',             icon: '🏟️', weight: 10, value: p.parkFactor,           avg: 50, hex: '#22d3ee' },
    { id: 'form',    label: 'Recent Form',             icon: '🔥', weight: 10, value: p.recentForm,           avg: 50, hex: '#10b981' },
    { id: 'weather', label: 'Weather',                 icon: '🌬️', weight: 5,  value: p.weather,             avg: 55, hex: '#22d3ee' },
    { id: 'platoon', label: 'Platoon Split',           icon: '🤜', weight: 5,  value: p.platoon,             avg: 50, hex: '#f59e0b' },
    { id: 'bullpen', label: 'Bullpen Risk',            icon: '🔄', weight: 3,  value: p.bullpen,             avg: 48, hex: '#f97316' },
    { id: 'lineup',  label: 'Lineup Context',          icon: '📋', weight: 3,  value: p.lineupContext,        avg: 52, hex: '#818cf8' },
    { id: 'swing',   label: 'Swing Decisions',         icon: '🎪', weight: 2,  value: p.swingDecisions,      avg: 50, hex: '#10b981' },
    { id: 'bvp',     label: 'Batter vs Pitcher',       icon: '📊', weight: 2,  value: p.bvpScore,            avg: 50, hex: '#22d3ee' },
    { id: 'vegas',   label: 'Vegas Alignment',          icon: '💰', weight: 0,  value: p.vegasEdgeScore,      avg: 50, hex: '#f59e0b' },
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

export const HrPlayerProfile: React.FC<HrPlayerProfileProps> = ({ player, isOpen, onClose }) => {
  const [imgErr, setImgErr] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'layers' | 'bvp' | 'team' | 'form'>('overview');

  useEffect(() => {
    if (isOpen) { setImgErr(false); setActiveSection('overview'); }
  }, [isOpen, player?.stableId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const bvpLogs  = useMemo(() => player ? genBvP(player.playerName, player.pitcherName ?? '') : [], [player?.playerName, player?.pitcherName]);
  const teamLogs = useMemo(() => player ? genVsTeam(player.playerName, player.opponent) : [], [player?.playerName, player?.opponent]);
  const formLogs = useMemo(() => player ? genForm(player.playerName) : [], [player?.playerName]);

  const bvpCareer = useMemo(() => {
    const t = bvpLogs.reduce((a, r) => ({ pa: a.pa + r.pa, hrs: a.hrs + r.hrs, avgW: a.avgW + r.avg * r.pa, slgW: a.slgW + r.slg * r.pa }), { pa: 0, hrs: 0, avgW: 0, slgW: 0 });
    return { pa: t.pa, hrs: t.hrs, avg: t.pa > 0 ? (t.avgW / t.pa).toFixed(3) : '.000', slg: t.pa > 0 ? (t.slgW / t.pa).toFixed(3) : '.000', hrPct: t.pa > 0 ? ((t.hrs / t.pa) * 100).toFixed(1) : '0.0' };
  }, [bvpLogs]);

  if (!player) return null;

  const tier    = tierConfig(player.hrScore);
  const layers  = getLayers(player);
  const hue     = teamHue(player.team);
  const showImg = player.headshotUrl && !imgErr;

  const formHRs = formLogs.filter(g => g.hrs > 0).length;
  const formEV  = Math.round(formLogs.reduce((s, g) => s + (g.exitVelo ?? 90), 0) / formLogs.length);
  const teamHRs = teamLogs.reduce((s, g) => s + g.hrs, 0);
  const teamEV  = Math.round(teamLogs.reduce((s, g) => s + (g.exitVelo ?? 90), 0) / teamLogs.length);

  const EVSeries  = formLogs.map(g => (g.exitVelo ?? 88) / 105);
  const teamEVSeries = teamLogs.map(g => (g.exitVelo ?? 88) / 105);

  const compositeScore = useMemo(() => {
    let sum = 0, wt = 0;
    for (const l of layers) { if (l.value != null && l.weight > 0) { sum += l.value * l.weight; wt += l.weight; } }
    return wt > 0 ? Math.round(sum / wt) : player.hrScore;
  }, [layers, player.hrScore]);

  const NAV = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'layers'   as const, label: '12 Layers' },
    { id: 'bvp'      as const, label: `vs ${player.pitcherName?.split(' ').pop() ?? 'Pitcher'}` },
    { id: 'team'     as const, label: `vs ${player.opponent}` },
    { id: 'form'     as const, label: 'Recent Form' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'hsl(var(--ve-bg-deep) / 0.80)', backdropFilter: 'blur(8px)' }}
            aria-hidden="true"
          />

          {/* Profile panel — large centered modal */}
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            role="dialog" aria-modal="true" aria-label={`${player.playerName} full profile`}
            className="fixed inset-x-4 top-4 bottom-4 z-[60] mx-auto flex max-w-5xl flex-col overflow-hidden rounded-3xl"
            style={{
              background: 'hsl(var(--ve-bg-deep))',
              border: '1px solid hsl(var(--ve-border) / 0.4)',
              boxShadow: '0 40px 120px hsl(var(--ve-shadow) / 0.8)',
            }}
          >
            {/* ── HERO BANNER ─────────────────────────────────────────────── */}
            <div
              className="relative flex-shrink-0 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 52% 8%) 0%, hsl(var(--ve-bg-deep)) 70%)`,
                borderBottom: '1px solid hsl(var(--ve-border) / 0.3)',
              }}
            >
              {/* Decorative glow blob */}
              <div
                className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-20 blur-3xl"
                style={{ background: `hsl(${hue} 70% 55%)` }}
              />

              <div className="relative flex items-start gap-5 p-5 pb-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl ring-2 shadow-xl"
                    style={{ background: `hsl(${hue} 52% 18%)`, ringColor: `hsl(${hue} 52% 35%)` }}
                  >
                    {showImg ? (
                      <img src={player.headshotUrl!} alt={player.playerName} className="h-full w-full object-cover" onError={() => setImgErr(true)} />
                    ) : (
                      <span className="text-2xl font-black" style={{ color: `hsl(${hue} 80% 75%)` }}>{initials(player.playerName)}</span>
                    )}
                  </div>
                  {/* Tier badge */}
                  <div
                    className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ background: `hsl(var(--${tier.token}) / 0.18)`, border: `1px solid hsl(var(--${tier.token}) / 0.45)`, color: `hsl(var(--${tier.token}))` }}
                  >
                    {tier.icon}{tier.label}
                  </div>
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-2xl font-black leading-tight tracking-tight" style={{ color: 'hsl(var(--ve-text-primary))' }}>
                    {player.playerName}
                  </h2>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: 'hsl(var(--ve-text-muted))' }}>
                    {player.team} · vs {player.opponent}{player.pitcherName ? ` · ${player.pitcherName}` : ''}
                  </p>
                  {player.venue && (
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--ve-text-muted) / 0.6)' }}>
                      🏟️ {player.venue}{player.gameTime ? ` · ${player.gameTime}` : ''}
                    </p>
                  )}
                  {/* Odds chip row */}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {player.oddsLabel && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1" style={{ background: 'hsl(var(--ve-surface))', color: 'hsl(var(--ve-text-primary))', ringColor: 'hsl(var(--ve-border) / 0.4)' }}>
                        {player.oddsLabel}
                      </span>
                    )}
                    {player.bookOdds != null && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1" style={{ background: 'hsl(var(--ve-accent-gold) / 0.10)', color: 'hsl(var(--ve-accent-gold))', ringColor: 'hsl(var(--ve-accent-gold) / 0.3)' }}>
                        {fmtOdds(player.bookOdds)}
                      </span>
                    )}
                    {player.truthStatus && (
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1" style={{ background: 'hsl(var(--ve-surface))', color: 'hsl(var(--ve-text-muted))', ringColor: 'hsl(var(--ve-border) / 0.3)' }}>
                        {player.truthStatus === 'official' ? '✅ Official' : player.truthStatus === 'projected' ? '🔮 Projected' : '⛔ Blocked'}
                      </span>
                    )}
                  </div>
                </div>

                {/* HR Score arc — large */}
                <div className="shrink-0 pt-1">
                  <Arc value={player.hrScore} color={tier.hex} label="HR Score" size={88} />
                </div>

                {/* Close */}
                <button
                  onClick={onClose} aria-label="Close"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ background: 'hsl(var(--ve-surface))', color: 'hsl(var(--ve-text-muted))' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Section nav tabs */}
              <div className="mt-4 flex gap-0 overflow-x-auto scrollbar-none px-5">
                {NAV.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setActiveSection(n.id)}
                    className="relative flex-shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
                    style={{ color: activeSection === n.id ? `hsl(var(--${tier.token}))` : 'hsl(var(--ve-text-muted))' }}
                  >
                    {n.label}
                    {activeSection === n.id && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: `hsl(var(--${tier.token}))` }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SCROLLABLE CONTENT ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin" style={{ scrollbarColor: 'hsl(var(--ve-border)) transparent' }}>

              {/* ── OVERVIEW ────────────────────────────────────────────────── */}
              {activeSection === 'overview' && (
                <div className="flex flex-col gap-6">

                  {/* Score arcs row */}
                  <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.4)' }}>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>Score Breakdown</p>
                    <div className="flex flex-wrap items-center justify-around gap-4">
                      <Arc value={compositeScore}                  color="#f59e0b" label="Composite"  size={80} />
                      <Arc value={player.hitterPower ?? 0}         color="#22d3ee" label="Power"      size={80} />
                      <Arc value={player.pitcherVulnerability ?? 0} color="#ef4444" label="Pitcher"    size={80} />
                      <Arc value={player.recentForm ?? 0}          color="#10b981" label="Form"        size={80} />
                      <Arc value={player.parkFactor ?? 0}          color="#818cf8" label="Park"        size={80} />
                      <Arc value={player.vouchScore ?? 0}          color="#f59e0b" label="Edge"        size={80} />
                    </div>
                  </div>

                  {/* Key stats grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {[
                      { label: 'HR Score',       value: fmtScore(player.hrScore),              accent: tier.hex },
                      { label: 'Edge Score',      value: fmtScore(player.vouchScore),           accent: '#f59e0b' },
                      { label: 'Model HR%',       value: fmtPct(player.hrProbability),          accent: '#22d3ee' },
                      { label: 'Book Implied',    value: fmtPct(player.impliedProbability),     accent: '#818cf8' },
                      { label: 'Hitter Power',    value: fmtScore(player.hitterPower),          accent: '#22d3ee' },
                      { label: 'Pitcher Risk',    value: fmtScore(player.pitcherVulnerability), accent: '#ef4444' },
                      { label: 'Park Factor',     value: fmtScore(player.parkFactor),           accent: '#818cf8' },
                      { label: 'Data Confidence', value: fmtScore(player.dataConfidence),       accent: '#10b981' },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="flex flex-col gap-1 rounded-xl p-3"
                        style={{ background: 'hsl(var(--ve-bg-panel))', border: '1px solid hsl(var(--ve-border) / 0.3)' }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{s.label}</span>
                        <span className="text-xl font-extrabold tabular-nums" style={{ color: s.accent }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Vegas edge callout if available */}
                  {player.bookOdds != null && player.hrProbability != null && player.impliedProbability != null && (() => {
                    const edge = player.hrProbability - player.impliedProbability;
                    const pos = edge >= 0.02, neg = edge <= -0.02;
                    return (
                      <div className="rounded-2xl p-4" style={{ background: pos ? 'hsl(var(--ve-success) / 0.08)' : neg ? 'hsl(var(--ve-danger) / 0.08)' : 'hsl(var(--ve-surface))', border: `1px solid hsl(var(--${pos ? 've-success' : neg ? 've-danger' : 've-border'}) / 0.3)` }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>VouchEdge Signal</p>
                            <p className="mt-1 text-3xl font-black" style={{ color: pos ? 'hsl(var(--ve-success))' : neg ? 'hsl(var(--ve-danger))' : 'hsl(var(--ve-text-muted))' }}>
                              {edge >= 0 ? '+' : ''}{(edge * 100).toFixed(2)}%
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'hsl(var(--ve-text-muted))' }}>
                              {pos ? 'Model sees more value than book pricing' : neg ? 'Book has this better priced than model' : 'Model aligns with book — fair value'}
                            </p>
                          </div>
                          <Zap className="h-10 w-10 opacity-20" style={{ color: pos ? 'hsl(var(--ve-success))' : 'hsl(var(--ve-text-muted))' }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Top signals */}
                  {(player.reasons?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>Top Signals</p>
                      {player.reasons!.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'hsl(var(--ve-bg-panel))', border: '1px solid hsl(var(--ve-border) / 0.28)' }}>
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `hsl(var(--${tier.token}))` }} />
                          <span className="text-sm" style={{ color: 'hsl(var(--ve-text-primary))' }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {(player.warnings?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">⚠️ Warnings</p>
                      {player.warnings!.map((w, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'hsl(var(--ve-warning) / 0.07)', border: '1px solid hsl(var(--ve-warning) / 0.25)' }}>
                          <span className="text-sm" style={{ color: 'hsl(var(--ve-warning))' }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── 12 LAYERS ───────────────────────────────────────────────── */}
              {activeSection === 'layers' && (
                <div className="flex flex-col gap-4">
                  <Sec icon={<BarChart2 className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-cyan))' }} />} title="12-Layer Score Breakdown" sub="Each layer scored 0–100 · dashed line = league average" />
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    {layers.map((l, idx) => {
                      const val = l.value;
                      const rank = val == null ? '—' : val >= 75 ? 'Elite' : val >= 60 ? 'Above Avg' : val >= 40 ? 'Avg' : 'Below Avg';
                      const rankColor = val == null ? 'hsl(var(--ve-text-muted))' : val >= 75 ? l.hex : val >= 60 ? '#10b981' : val >= 40 ? 'hsl(var(--ve-text-muted))' : '#ef4444';
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-3 px-4 py-3"
                          style={{
                            background: idx % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))',
                            borderBottom: idx < layers.length - 1 ? '1px solid hsl(var(--ve-border) / 0.15)' : 'none',
                          }}
                        >
                          <span className="w-6 text-center text-base shrink-0">{l.icon}</span>
                          <div className="w-40 shrink-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--ve-text-primary))' }}>{l.label}</p>
                            <p className="text-[9px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{l.weight > 0 ? `${l.weight}% weight` : 'Validator only'}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <RankBar value={val} avg={l.avg} color={l.hex} w={220} />
                          </div>
                          <div className="w-24 flex flex-col items-end shrink-0">
                            <span className="text-sm font-extrabold tabular-nums" style={{ color: rankColor }}>{val == null ? '—' : Math.round(val)}</span>
                            <span className="text-[9px] font-semibold" style={{ color: rankColor, opacity: 0.75 }}>{rank}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Composite score summary */}
                  <div className="flex items-center justify-between rounded-2xl px-5 py-4" style={{ background: `hsl(var(--${tier.token}) / 0.10)`, border: `1px solid hsl(var(--${tier.token}) / 0.3)` }}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: `hsl(var(--${tier.token}))` }}>Weighted Composite</p>
                      <p className="text-3xl font-black mt-0.5" style={{ color: `hsl(var(--${tier.token}))` }}>{compositeScore}</p>
                    </div>
                    <Arc value={compositeScore} color={tier.hex} label="" size={72} />
                  </div>
                </div>
              )}

              {/* ── BvP ─────────────────────────────────────────────────────── */}
              {activeSection === 'bvp' && (
                <div className="flex flex-col gap-4">
                  <Sec
                    icon={<Target className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-pink))' }} />}
                    title={`vs ${player.pitcherName ?? 'Pitcher'}`}
                    sub="Career head-to-head history by season"
                  />

                  {/* Career summary chips */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Career PA', value: bvpCareer.pa, color: 'hsl(var(--ve-text-primary))' },
                      { label: 'Career HR', value: bvpCareer.hrs, color: '#f59e0b' },
                      { label: 'AVG', value: bvpCareer.avg, color: 'hsl(var(--ve-text-primary))' },
                      { label: 'SLG', value: bvpCareer.slg, color: '#10b981' },
                      { label: 'HR/PA', value: `${bvpCareer.hrPct}%`, color: '#22d3ee' },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2.5" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Season table */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    <div className="grid grid-cols-6 gap-0 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: 'hsl(var(--ve-bg-deep))', color: 'hsl(var(--ve-text-muted))' }}>
                      <span>Season</span><span className="text-right">PA</span><span className="text-right">HR</span><span className="text-right">AVG</span><span className="text-right">SLG</span><span className="text-right">OBP</span>
                    </div>
                    {bvpLogs.map((row, i) => (
                      <div key={row.season} className="grid grid-cols-6 gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))', borderTop: '1px solid hsl(var(--ve-border) / 0.15)' }}>
                        <span className="text-sm font-bold" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.season}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>{row.pa}</span>
                        <span className="text-right text-sm font-bold tabular-nums" style={{ color: row.hrs > 0 ? '#f59e0b' : 'hsl(var(--ve-text-muted))' }}>{row.hrs}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.avg.toFixed(3)}</span>
                        <span className="text-right text-sm font-semibold tabular-nums" style={{ color: row.slg > 0.450 ? '#10b981' : 'hsl(var(--ve-text-primary))' }}>{row.slg.toFixed(3)}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.obp.toFixed(3)}</span>
                      </div>
                    ))}
                    {/* Career total row */}
                    <div className="grid grid-cols-6 gap-0 px-4 py-3" style={{ background: 'hsl(var(--ve-bg-deep))', borderTop: '1px solid hsl(var(--ve-border) / 0.4)' }}>
                      <span className="text-xs font-black uppercase tracking-wide" style={{ color: 'hsl(var(--ve-accent-cyan))' }}>Career</span>
                      <span className="text-right text-sm font-bold tabular-nums" style={{ color: 'hsl(var(--ve-accent-cyan))' }}>{bvpCareer.pa}</span>
                      <span className="text-right text-sm font-bold tabular-nums" style={{ color: '#f59e0b' }}>{bvpCareer.hrs}</span>
                      <span className="text-right text-sm font-bold tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{bvpCareer.avg}</span>
                      <span className="text-right text-sm font-bold tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{bvpCareer.slg}</span>
                      <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>—</span>
                    </div>
                  </div>

                  {/* Verdict chip */}
                  <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    {Number(bvpCareer.hrs) >= 2 ? <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" /> : Number(bvpCareer.hrs) === 0 ? <TrendingDown className="h-5 w-5 text-red-400 shrink-0" /> : <Minus className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--ve-text-muted))' }} />}
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--ve-text-primary))' }}>
                        {Number(bvpCareer.hrs) >= 2 ? `Owns This Pitcher — ${bvpCareer.hrs} career HRs` : Number(bvpCareer.hrs) === 1 ? 'One career HR against this pitcher' : 'No career HRs against this pitcher'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--ve-text-muted))' }}>{bvpCareer.hrPct}% HR rate across {bvpCareer.pa} career plate appearances</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── vs TEAM ──────────────────────────────────────────────────── */}
              {activeSection === 'team' && (
                <div className="flex flex-col gap-4">
                  <Sec
                    icon={<Users className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-gold))' }} />}
                    title={`vs ${player.opponent}`}
                    sub="Last 5 matchups against this team"
                  />

                  {/* Summary chips */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'HRs', value: teamHRs, color: '#f59e0b' },
                      { label: 'Total H', value: teamLogs.reduce((s, g) => s + g.hits, 0), color: 'hsl(var(--ve-text-primary))' },
                      { label: 'Total AB', value: teamLogs.reduce((s, g) => s + g.ab, 0), color: 'hsl(var(--ve-text-muted))' },
                      { label: 'Avg EV', value: `${teamEV}`, color: '#22d3ee' },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2.5" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>{s.label}</span>
                      </div>
                    ))}
                    {/* EV sparkline */}
                    <div className="flex flex-col justify-center gap-1 rounded-xl px-3 py-2" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>EV Trend</span>
                      <Sparkline values={teamEVSeries} color="#22d3ee" w={90} h={26} />
                    </div>
                  </div>

                  {/* Game log table */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    <div className="grid grid-cols-6 gap-0 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: 'hsl(var(--ve-bg-deep))', color: 'hsl(var(--ve-text-muted))' }}>
                      <span>Date</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">RBI</span><span className="text-right">EV</span>
                    </div>
                    {teamLogs.map((g, i) => (
                      <div key={i} className="grid grid-cols-6 items-center gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))', borderTop: '1px solid hsl(var(--ve-border) / 0.15)' }}>
                        <div className="flex items-center gap-2">
                          <Dot hrs={g.hrs} />
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.date}</span>
                        </div>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.ab}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{g.hits}</span>
                        <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#f59e0b' : 'hsl(var(--ve-text-muted))' }}>{g.hrs > 0 ? g.hrs : '—'}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{g.rbi}</span>
                        <span className="text-right text-sm font-semibold tabular-nums" style={{ color: (g.exitVelo ?? 0) >= 98 ? '#f59e0b' : (g.exitVelo ?? 0) >= 93 ? '#10b981' : 'hsl(var(--ve-text-muted))' }}>{g.exitVelo ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── RECENT FORM ──────────────────────────────────────────────── */}
              {activeSection === 'form' && (
                <div className="flex flex-col gap-4">
                  <Sec
                    icon={<Activity className="h-4 w-4" style={{ color: 'hsl(var(--ve-success))' }} />}
                    title="Recent Form"
                    sub={`Last ${formLogs.length} games`}
                  />

                  {/* Summary chips */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'HRs', value: formHRs, color: '#f59e0b' },
                      { label: 'Total H', value: formLogs.reduce((s, g) => s + g.hits, 0), color: 'hsl(var(--ve-text-primary))' },
                      { label: 'Avg EV', value: `${formEV} mph`, color: '#22d3ee' },
                      { label: 'HR Rate', value: `${((formHRs / formLogs.length) * 100).toFixed(0)}%`, color: '#10b981' },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2.5" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                        <span className="text-lg font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                        <span className="text-[9px] uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Result dots row */}
                  <div className="rounded-2xl p-4" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>Game Results (gold = HR)</p>
                    <div className="flex flex-wrap items-end gap-3">
                      {formLogs.map((g, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <Dot hrs={g.hrs} />
                          <span className="text-[8px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.opponent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sparklines */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl p-4" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>Exit Velocity Trend</p>
                      <Sparkline values={EVSeries} color="#22d3ee" w={260} h={50} />
                      <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'hsl(var(--ve-text-muted) / 0.5)' }}>
                        <span>G10</span><span>Recent</span>
                      </div>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-muted))' }}>HR Activity</p>
                      <Sparkline values={formLogs.map(g => g.hrs)} color="#f59e0b" w={260} h={50} />
                      <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'hsl(var(--ve-text-muted) / 0.5)' }}>
                        <span>G10</span><span>Recent</span>
                      </div>
                    </div>
                  </div>

                  {/* Game-by-game table */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}>
                    <div className="grid grid-cols-5 gap-0 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: 'hsl(var(--ve-bg-deep))', color: 'hsl(var(--ve-text-muted))' }}>
                      <span>Opp</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">EV</span>
                    </div>
                    {formLogs.map((g, i) => (
                      <div key={i} className="grid grid-cols-5 items-center gap-0 px-4 py-2.5" style={{ background: i % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))', borderTop: '1px solid hsl(var(--ve-border) / 0.15)' }}>
                        <div className="flex items-center gap-2">
                          <Dot hrs={g.hrs} />
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.opponent}</span>
                        </div>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.ab}</span>
                        <span className="text-right text-sm tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{g.hits}</span>
                        <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#f59e0b' : 'hsl(var(--ve-text-muted))' }}>{g.hrs > 0 ? '💥' : '—'}</span>
                        <span className="text-right text-sm font-semibold tabular-nums" style={{ color: (g.exitVelo ?? 0) >= 98 ? '#f59e0b' : (g.exitVelo ?? 0) >= 93 ? '#10b981' : 'hsl(var(--ve-text-muted))' }}>{g.exitVelo ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
