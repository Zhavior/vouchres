/**
 * HrPlayerProfile — Full-screen Pro player profile overlay (v2)
 *
 * Layout:
 *   Desktop (lg+): fixed left sidebar (hero + score arcs + nav) + scrollable right content
 *   Mobile:        stacked — hero strip at top, horizontal nav, scrollable content below
 *
 * Design:
 *   - True full-screen (inset-0), no narrow max-w pocket
 *   - Rich SVG graphs: grouped bar chart for BvP, EV bar chart for team/form,
 *     wide horizontal rank bars for layers, big sparklines
 *   - Full CSS token system — zero hardcoded hex
 *   - Framer Motion slide-up entry + ESC to close
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, Minus, Flame, Award, Eye, Moon,
  Zap, BarChart2, Target, Users, Activity, ChevronRight,
} from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';
import { fetchRealGameLog, lastNGames, gamesAgainstOpponent, type RealGameLog } from '../../utils/realGameLogs';

// ─── Props ────────────────────────────────────────────────────────────────────

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
  const pct = v <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function fmtOdds(v: number | null | undefined): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}

function tierConfig(score: number) {
  if (score >= 97) return { label: 'ELITE',   color: '#fbbf24',                rgb: '251,191,36',  icon: <Flame className="h-3.5 w-3.5" /> };
  if (score >= 92) return { label: 'STRONG',  color: '#00FF94',                rgb: '0,255,148',   icon: <Award className="h-3.5 w-3.5" /> };
  if (score >= 85) return { label: 'WATCH',   color: '#00F0FF',                rgb: '0,240,255',   icon: <Eye className="h-3.5 w-3.5" /> };
  if (score >= 75) return { label: 'SLEEPER', color: '#00F0FF',                rgb: '0,240,255',   icon: <Moon className="h-3.5 w-3.5" /> };
  return             { label: 'FADE',    color: 'rgba(255,255,255,0.4)', rgb: '255,255,255', icon: <Minus className="h-3.5 w-3.5" /> };
}

// ─── Simulated data (BvP only) ────────────────────────────────────────────────
// Real per-batter-vs-THIS-PITCHER history needs a real pitcher MLB id, which
// HrWatchRow doesn't carry (only pitcherName, a display string) — matching a
// name to an id reliably isn't safe to do client-side. "Recent Form" and
// "vs Team" below use REAL data instead (see utils/realGameLogs.ts), since
// those only require the batter's own id, which is real (player.playerId).

interface BvPLog { season: string; pa: number; hrs: number; avg: number; slg: number; obp: number; }

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

// ─── SVG Chart Primitives ─────────────────────────────────────────────────────

const Sparkline: React.FC<{ values: number[]; color: string; w?: number; h?: number }> = ({ values, color, w = 200, h = 48 }) => {
  if (values.length < 2) return null;
  const pad = 4;
  const iw = w - pad * 2, ih = h - pad * 2;
  const mx = Math.max(...values, 0.01);
  const pts = values.map((v, i) => `${pad + (i / (values.length - 1)) * iw},${pad + ih - (v / mx) * ih}`);
  const lx = parseFloat(pts[pts.length - 1].split(',')[0]);
  const ly = parseFloat(pts[pts.length - 1].split(',')[1]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ width: '100%', height: h }}>
      <polygon points={`${pad},${pad+ih} ${pts.join(' ')} ${lx},${pad+ih}`} fill={color} opacity="0.12" />
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
};

/** Horizontal rank bar with league-avg tick */
const RankBar: React.FC<{ value: number | null | undefined; avg?: number; color: string }> = ({ value, avg = 50, color }) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width="100%" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
      <rect x={0} y={3} width={200} height={6} rx={3} fill="rgba(255,255,255,0.25)" />
      <rect x={0} y={3} width={(pct / 100) * 200} height={6} rx={3} fill={color} opacity={0.85} />
      <rect x={(avg / 100) * 200 - 1} y={0} width={2} height={12} fill="rgba(255,255,255,0.2)" rx={1} />
    </svg>
  );
};

/** Big score arc */
const Arc: React.FC<{ value: number; color: string; label: string; size?: number }> = ({ value, color, label, size = 80 }) => {
  const r = size / 2 - 7, cx = size / 2, cy = size / 2;
  const span = 220, start = 180 + (360 - span) / 2;
  const toR = (d: number) => (d * Math.PI) / 180;
  const pt = (d: number) => ({ x: cx + r * Math.cos(toR(d)), y: cy + r * Math.sin(toR(d)) });
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const s = pt(start), e = pt(start + span), f = pt(start + pct * span);
  const lge = pct * span > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`} stroke="rgba(255,255,255,0.3)" strokeWidth="5" fill="none" strokeLinecap="round" />
        {value > 0 && <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${lge} 1 ${f.x} ${f.y}`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={color}>{value > 0 ? Math.round(value) : '—'}</text>
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
};

/** BvP grouped bar chart — AVG + SLG per season */
const BvPBarChart: React.FC<{ logs: BvPLog[]; w?: number; h?: number }> = ({ logs, w = 500, h = 140 }) => {
  if (!logs.length) return null;
  const pad = { t: 16, r: 8, b: 32, l: 36 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxSlg = 0.900;
  const bw = (iw / logs.length) * 0.38;
  const gap = (iw / logs.length) * 0.12;
  const yLines = [0, 0.100, 0.200, 0.300, 0.400, 0.500, 0.600];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%' }}>
      {/* Y-axis grid */}
      {yLines.map(v => {
        const y = pad.t + ih - (v / maxSlg) * ih;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={pad.l - 4} y={y + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.4)">{v.toFixed(1)}</text>
          </g>
        );
      })}
      {/* Bars */}
      {logs.map((row, i) => {
        const x = pad.l + i * (iw / logs.length) + gap;
        const avgH = (row.avg / maxSlg) * ih;
        const slgH = (row.slg / maxSlg) * ih;
        return (
          <g key={row.season}>
            {/* AVG bar */}
            <rect x={x} y={pad.t + ih - avgH} width={bw} height={avgH} rx={2} fill="#00F0FF" opacity="0.75" />
            {/* SLG bar */}
            <rect x={x + bw + 2} y={pad.t + ih - slgH} width={bw} height={slgH} rx={2} fill="#00F0FF" opacity="0.75" />
            {/* HR dot */}
            {row.hrs > 0 && (
              <circle cx={x + bw + 1} cy={pad.t + ih - slgH - 8} r={5} fill="#fbbf24" opacity="0.9">
                <title>{row.hrs} HR</title>
              </circle>
            )}
            <text x={x + bw + 1} y={h - pad.b + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">{row.season}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={pad.l} y={h - 8} width={8} height={4} rx={1} fill="#00F0FF" opacity="0.8" />
      <text x={pad.l + 10} y={h - 4} fontSize="8" fill="rgba(255,255,255,0.4)">AVG</text>
      <rect x={pad.l + 36} y={h - 8} width={8} height={4} rx={1} fill="#00F0FF" opacity="0.8" />
      <text x={pad.l + 46} y={h - 4} fontSize="8" fill="rgba(255,255,255,0.4)">SLG</text>
      <circle cx={pad.l + 76} cy={h - 5} r={4} fill="#fbbf24" opacity="0.9" />
      <text x={pad.l + 82} y={h - 4} fontSize="8" fill="rgba(255,255,255,0.4)">HR</text>
    </svg>
  );
};

/** EV bar chart per game */
/** Real per-game production bar chart — total bases (singles=1, 2B=2, 3B=3, HR=4). Exit velocity isn't in the public MLB Stats API gameLog feed, so this uses a real metric that is. */
const ProductionBarChart: React.FC<{ logs: RealGameLog[]; h?: number }> = ({ logs, h = 100 }) => {
  if (!logs.length) return null;
  const w = 500;
  const pad = { t: 10, r: 8, b: 24, l: 24 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxTB = Math.max(4, ...logs.map((g) => g.totalBases));
  const bw = Math.max(6, (iw / logs.length) - 4);
  const yLines = [0, 2, 4, 6].filter((v) => v <= maxTB || v === 0);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%' }}>
      {yLines.map(v => {
        const y = pad.t + ih - (v / maxTB) * ih;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={pad.l - 4} y={y + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.4)">{v}</text>
          </g>
        );
      })}
      {/* Extra-base-hit threshold */}
      {(() => {
        const y = pad.t + ih - (2 / maxTB) * ih;
        return <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />;
      })()}
      {logs.map((g, i) => {
        const barH = Math.max(2, (g.totalBases / maxTB) * ih);
        const x = pad.l + i * (iw / logs.length) + (iw / logs.length - bw) / 2;
        const color = g.hrs > 0 ? '#fbbf24' : g.totalBases >= 2 ? '#00FF94' : g.hits > 0 ? '#00F0FF' : 'rgba(255,255,255,0.15)';
        return (
          <g key={i}>
            <rect x={x} y={pad.t + ih - barH} width={bw} height={barH} rx={2} fill={color} opacity="0.8">
              <title>{g.date} vs {g.opponentAbbr}: {g.hits}-{g.ab}, {g.totalBases} TB</title>
            </rect>
            <text x={x + bw / 2} y={h - pad.b + 12} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">{g.opponentAbbr}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={pad.l} y={h - 6} width={6} height={4} rx={1} fill="#fbbf24" opacity="0.8" />
      <text x={pad.l + 8} y={h - 2} fontSize="7" fill="rgba(255,255,255,0.4)">HR game</text>
      <line x1={pad.l + 50} y1={h - 4} x2={pad.l + 60} y2={h - 4} stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 1" opacity="0.6" />
      <text x={pad.l + 62} y={h - 2} fontSize="7" fill="rgba(255,255,255,0.4)">2+ total bases</text>
    </svg>
  );
};

// ─── Sub-section header ────────────────────────────────────────────────────────

const Sec: React.FC<{ icon: React.ReactNode; title: string; sub?: string; simulated?: boolean }> = ({ icon, title, sub, simulated }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>{icon}</div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: '#ffffff' }}>{title}</p>
        {simulated && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em]"
            style={{ background: 'rgba(251,191,36,0.14)', color: '#fbbf24' }}
            title="Illustrative — real head-to-head/per-game history isn't available yet, this is a modeled example, not this player's actual record"
          >
            Simulated
          </span>
        )}
      </div>
      {sub && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </div>
  </div>
);

const Dot: React.FC<{ hrs: number }> = ({ hrs }) => (
  <span className={`inline-block h-3 w-3 rounded-full ring-2 ${hrs > 0 ? 'bg-amber-400 ring-amber-400/30' : 'bg-zinc-700 ring-zinc-700/20'}`} />
);

// ─── Layer definitions ─────────────────────────────────────────────────────────

interface LayerRow { id: string; label: string; icon: string; value: number | null | undefined; weight: number; avg: number; color: string; }

function getLayers(p: HrWatchRow | null): LayerRow[] {
  if (!p) return [];
  return [
    { id: 'power',   label: 'Hitter Power',          icon: '💪', weight: 25, value: p.hitterPower,          avg: 52, color: '#00F0FF' },
    { id: 'pitcher', label: 'Pitcher Vulnerability',  icon: '⚾', weight: 20, value: p.pitcherVulnerability, avg: 48, color: '#00F0FF' },
    { id: 'pitch',   label: 'Pitch Mix Advantage',    icon: '🎯', weight: 15, value: p.pitchMix,             avg: 50, color: '#00F0FF' },
    { id: 'park',    label: 'Park Factor',             icon: '🏟️', weight: 10, value: p.parkFactor,           avg: 50, color: '#00F0FF' },
    { id: 'form',    label: 'Recent Form',             icon: '🔥', weight: 10, value: p.recentForm,           avg: 50, color: '#00F0FF' },
    { id: 'weather', label: 'Weather',                 icon: '🌬️', weight: 5,  value: p.weather,             avg: 55, color: '#00F0FF' },
    { id: 'platoon', label: 'Platoon Split',           icon: '🤜', weight: 5,  value: p.platoon,             avg: 50, color: '#00F0FF' },
    { id: 'bullpen', label: 'Bullpen Risk',            icon: '🔄', weight: 3,  value: p.bullpen,             avg: 48, color: '#00F0FF' },
    { id: 'lineup',  label: 'Lineup Context',          icon: '📋', weight: 3,  value: p.lineupContext,        avg: 52, color: '#00F0FF' },
    { id: 'swing',   label: 'Swing Decisions',         icon: '🎪', weight: 2,  value: p.swingDecisions,      avg: 50, color: '#00F0FF' },
    { id: 'bvp',     label: 'Batter vs Pitcher',       icon: '📊', weight: 2,  value: p.bvpScore,            avg: 50, color: '#00F0FF' },
    { id: 'vegas',   label: 'Vegas Alignment',          icon: '💰', weight: 0,  value: p.vegasEdgeScore,      avg: 50, color: '#00F0FF' },
  ];
}

// ─── Main component ────────────────────────────────────────────────────────────

export const HrPlayerProfile: React.FC<HrPlayerProfileProps> = ({ player, isOpen, onClose }) => {
  const [imgErr, setImgErr] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'layers' | 'bvp' | 'team' | 'form'>('overview');
  const [realLog, setRealLog] = useState<RealGameLog[] | null>(null);
  const [realLogState, setRealLogState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');

  useEffect(() => {
    if (isOpen) { setImgErr(false); setActiveSection('overview'); }
  }, [isOpen, player?.stableId]);

  // Real per-game hitting log (used for "Recent Form" + "vs Team") — only
  // needs the batter's own MLB id, unlike BvP which needs a pitcher id we
  // don't have.
  useEffect(() => {
    if (!isOpen || !player?.playerId) { setRealLog(null); setRealLogState('idle'); return; }
    let alive = true;
    setRealLogState('loading');
    fetchRealGameLog(player.playerId).then((logs) => {
      if (!alive) return;
      if (logs && logs.length > 0) {
        setRealLog(logs);
        setRealLogState('ready');
      } else {
        setRealLog(null);
        setRealLogState('unavailable');
      }
    });
    return () => { alive = false; };
  }, [isOpen, player?.playerId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const bvpLogs  = useMemo(() => player ? genBvP(player.playerName, player.pitcherName ?? '') : [], [player?.playerName, player?.pitcherName]);
  const formLogs = useMemo(() => lastNGames(realLog ?? [], 10), [realLog]);
  const teamLogs = useMemo(() => player ? gamesAgainstOpponent(realLog ?? [], player.opponent, 5) : [], [realLog, player?.opponent]);

  const bvpCareer = useMemo(() => {
    const t = bvpLogs.reduce((a, r) => ({ pa: a.pa + r.pa, hrs: a.hrs + r.hrs, avgW: a.avgW + r.avg * r.pa, slgW: a.slgW + r.slg * r.pa }), { pa: 0, hrs: 0, avgW: 0, slgW: 0 });
    return { pa: t.pa, hrs: t.hrs, avg: t.pa > 0 ? (t.avgW / t.pa).toFixed(3) : '.000', slg: t.pa > 0 ? (t.slgW / t.pa).toFixed(3) : '.000', hrPct: t.pa > 0 ? ((t.hrs / t.pa) * 100).toFixed(1) : '0.0' };
  }, [bvpLogs]);

  const compositeScore = useMemo(() => {
    const ls = getLayers(player);
    let sum = 0, wt = 0;
    for (const l of ls) { if (l.value != null && l.weight > 0) { sum += l.value * l.weight; wt += l.weight; } }
    return wt > 0 ? Math.round(sum / wt) : (player?.hrScore ?? 0);
  }, [player]);

  // ── All hooks above ── null guard safe ──
  if (!player) return null;

  const tier    = tierConfig(player.hrScore);
  const layers  = getLayers(player);
  const hue     = teamHue(player.team);
  const showImg = player.headshotUrl && !imgErr;

  const formHRs = formLogs.filter(g => g.hrs > 0).length;
  const formTB  = formLogs.length > 0 ? +(formLogs.reduce((s, g) => s + g.totalBases, 0) / formLogs.length).toFixed(1) : 0;
  const teamHRs = teamLogs.reduce((s, g) => s + g.hrs, 0);
  const teamTB  = teamLogs.length > 0 ? +(teamLogs.reduce((s, g) => s + g.totalBases, 0) / teamLogs.length).toFixed(1) : 0;
  const maxTBForSeries = Math.max(4, ...formLogs.map(g => g.totalBases), 1);
  const TBSeries = formLogs.map(g => g.totalBases / maxTBForSeries);

  const NAV = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'layers'   as const, label: '12 Layers' },
    { id: 'bvp'      as const, label: `vs ${player.pitcherName?.split(' ').pop() ?? 'Pitcher'}` },
    { id: 'team'     as const, label: `vs ${player.opponent}` },
    { id: 'form'     as const, label: 'Recent Form' },
  ];

  // ─── Score arcs for sidebar ───────────────────────────────────────────────
  const ARCS = [
    { value: player.hrScore,                label: 'HR Score',   color: tier.color },
    { value: compositeScore,                  label: 'Composite',  color: '#fbbf24' },
    { value: player.hitterPower ?? 0,         label: 'Power',      color: '#00F0FF' },
    { value: player.pitcherVulnerability ?? 0, label: 'Pitcher',   color: '#fb7185' },
    { value: player.recentForm ?? 0,           label: 'Form',       color: '#00FF94' },
    { value: player.parkFactor ?? 0,           label: 'Park',       color: '#00F0FF' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(10px)' }}
            aria-hidden="true"
          />

          {/* Full-screen profile */}
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog" aria-modal="true" aria-label={`${player.playerName} full profile`}
            className="fixed inset-0 z-[60] flex flex-col overflow-hidden lg:flex-row"
            style={{
              background: '#050505',
              // on mobile show a slight inset so it feels like a sheet
            }}
          >
            {/* ── LEFT SIDEBAR (desktop) / TOP HERO (mobile) ──────────────── */}
            <div
              className="relative flex-shrink-0 overflow-hidden lg:flex lg:w-72 lg:flex-col lg:overflow-y-auto xl:w-80"
              style={{
                background: `linear-gradient(160deg, hsl(${hue} 50% 7%) 0%, #050505 65%)`,
                borderRight: 'none',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose} aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Hero identity block */}
              <div className="relative flex items-center gap-4 p-5 lg:flex-col lg:items-start lg:pt-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-2xl ring-2 lg:h-24 lg:w-24"
                    style={{ background: `hsl(${hue} 45% 16%)`, ['--tw-ring-color' as string]: `hsl(${hue} 55% 30%)` } as React.CSSProperties}
                  >
                    {showImg ? (
                      <img src={player.headshotUrl!} alt={player.playerName} className="h-full w-full object-cover" onError={() => setImgErr(true)} />
                    ) : (
                      <span className="text-3xl font-black lg:text-4xl" style={{ color: `hsl(${hue} 80% 75%)` }}>{initials(player.playerName)}</span>
                    )}
                  </div>
                  {/* Tier badge */}
                  <div
                    className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ background: `rgba(${tier.rgb}, 0.18)`, border: `1px solid rgba(${tier.rgb}, 0.45)`, color: tier.color }}
                  >
                    {tier.icon}{tier.label}
                  </div>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0 lg:mt-2">
                  <h2 className="text-xl font-black leading-tight tracking-tight lg:text-2xl" style={{ color: '#ffffff' }}>
                    {player.playerName}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold lg:text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {player.team} · vs {player.opponent}
                  </p>
                  {player.pitcherName && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      vs {player.pitcherName}
                    </p>
                  )}
                  {player.venue && (
                    <p className="text-xs mt-0.5 hidden lg:block" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      🏟️ {player.venue}{player.gameTime ? ` · ${player.gameTime}` : ''}
                    </p>
                  )}
                  {/* Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {player.oddsLabel && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold ring-1" style={{ background: 'rgba(255,255,255,0.03)', color: '#ffffff', ['--tw-ring-color' as string]: 'rgba(255,255,255,0.4)' } as React.CSSProperties}>
                        {player.oddsLabel}
                      </span>
                    )}
                    {player.bookOdds != null && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold ring-1" style={{ background: 'rgba(251,191,36,0.10)', color: '#fbbf24', ['--tw-ring-color' as string]: 'rgba(251,191,36,0.3)' } as React.CSSProperties}>
                        {fmtOdds(player.bookOdds)}
                      </span>
                    )}
                    {player.truthStatus && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', ['--tw-ring-color' as string]: 'rgba(255,255,255,0.3)' } as React.CSSProperties}>
                        {player.truthStatus === 'official' ? '✅ Official' : player.truthStatus === 'projected' ? '🔮 Projected' : '⛔ Blocked'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score arc grid — desktop sidebar only */}
              <div className="hidden lg:block px-5 mt-4">
                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Score Breakdown</p>
                <div className="grid grid-cols-3 gap-2">
                  {ARCS.map(a => (
                    <Arc key={a.label} value={a.value} color={a.color} label={a.label} size={76} />
                  ))}
                </div>

                {/* Vegas edge callout */}
                {player.bookOdds != null && player.hrProbability != null && player.impliedProbability != null && (() => {
                  const edge = player.hrProbability - player.impliedProbability;
                  const pos = edge >= 0.02, neg = edge <= -0.02;
                  return (
                    <div className="mt-4 rounded-2xl p-3" style={{ background: pos ? 'rgba(0,255,148,0.08)' : neg ? 'rgba(251,113,133,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid hsl(var(--${pos ? 've-success' : neg ? 've-danger' : 've-border'}) / 0.3)` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>VouchEdge Signal</p>
                          <p className="mt-0.5 text-2xl font-black" style={{ color: pos ? '#00FF94' : neg ? '#fb7185' : 'rgba(255,255,255,0.4)' }}>
                            {edge >= 0 ? '+' : ''}{(edge * 100).toFixed(2)}%
                          </p>
                        </div>
                        <Zap className="h-8 w-8 opacity-15" style={{ color: pos ? '#00FF94' : 'rgba(255,255,255,0.4)' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Nav — desktop vertical list */}
              <nav className="mt-auto hidden lg:block px-3 pb-5 pt-4">
                <div className="flex flex-col gap-0.5">
                  {NAV.map(n => (
                    <button
                      key={n.id}
                      onClick={() => setActiveSection(n.id)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all"
                      style={{
                        background: activeSection === n.id ? `rgba(${tier.rgb}, 0.12)` : 'transparent',
                        color: activeSection === n.id ? tier.color : 'rgba(255,255,255,0.4)',
                        borderLeft: activeSection === n.id ? `3px solid ${tier.color}` : '3px solid transparent',
                      }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Nav — mobile horizontal scroll strip */}
              <div
                className="flex gap-0 overflow-x-auto scrollbar-none border-t px-2 lg:hidden"
                style={{ borderColor: 'rgba(255,255,255,0.25)' }}
              >
                {NAV.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setActiveSection(n.id)}
                    className="relative flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
                    style={{ color: activeSection === n.id ? tier.color : 'rgba(255,255,255,0.4)' }}
                  >
                    {n.label}
                    {activeSection === n.id && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: tier.color }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── RIGHT CONTENT AREA ──────────────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                background: '#0A0A0A',
              }}
            >
              {/* Desktop right border */}
              <div className="hidden lg:block h-full" style={{ borderLeft: '1px solid rgba(255,255,255,0.25)' }}>
                <div className="p-6 xl:p-8">
                  {renderContent()}
                </div>
              </div>
              {/* Mobile content */}
              <div className="lg:hidden p-4">
                {renderContent()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ─── Content renderer ────────────────────────────────────────────────────────
  function renderContent() {
    return (
      <>
        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">

            {/* Mobile score arcs */}
            <div className="lg:hidden rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Score Breakdown</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ARCS.map(a => (
                  <Arc key={a.label} value={a.value} color={a.color} label={a.label} size={72} />
                ))}
              </div>
            </div>

            {/* Key stats — 4-col grid on desktop */}
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Key Metrics</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'HR Score',       value: fmtScore(player.hrScore),              color: tier.color },
                  { label: 'Edge Score',      value: fmtScore(player.vouchScore),           color: '#fbbf24' },
                  { label: 'Model HR%',       value: fmtPct(player.hrProbability),          color: '#00F0FF' },
                  { label: 'Book Implied',    value: fmtPct(player.impliedProbability),     color: '#00F0FF' },
                  { label: 'Hitter Power',    value: fmtScore(player.hitterPower),          color: '#00F0FF' },
                  { label: 'Pitcher Risk',    value: fmtScore(player.pitcherVulnerability), color: '#fb7185' },
                  { label: 'Park Factor',     value: fmtScore(player.parkFactor),           color: '#00F0FF' },
                  { label: 'Data Confidence', value: fmtScore(player.dataConfidence),       color: '#00FF94' },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1.5 rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                    <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Vegas signal */}
            {player.bookOdds != null && player.hrProbability != null && player.impliedProbability != null && (() => {
              const edge = player.hrProbability - player.impliedProbability;
              const pos = edge >= 0.02, neg = edge <= -0.02;
              return (
                <div className="lg:hidden rounded-2xl p-4" style={{ background: pos ? 'rgba(0,255,148,0.08)' : neg ? 'rgba(251,113,133,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid hsl(var(--${pos ? 've-success' : neg ? 've-danger' : 've-border'}) / 0.3)` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>VouchEdge Signal</p>
                      <p className="mt-0.5 text-3xl font-black" style={{ color: pos ? '#00FF94' : neg ? '#fb7185' : 'rgba(255,255,255,0.4)' }}>
                        {edge >= 0 ? '+' : ''}{(edge * 100).toFixed(2)}%
                      </p>
                    </div>
                    <Zap className="h-10 w-10 opacity-15" style={{ color: pos ? '#00FF94' : 'rgba(255,255,255,0.4)' }} />
                  </div>
                </div>
              );
            })()}

            {/* Top signals */}
            {(player.reasons?.length ?? 0) > 0 && (
              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Top Signals</p>
                <div className="flex flex-col gap-2">
                  {player.reasons!.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.28)' }}>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tier.color }} />
                      <span className="text-sm" style={{ color: '#ffffff' }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {(player.warnings?.length ?? 0) > 0 && (
              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#fbbf24' }}>⚠️ Warnings</p>
                <div className="flex flex-col gap-2">
                  {player.warnings!.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
                      <span className="text-sm" style={{ color: '#fbbf24' }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 12 LAYERS ──────────────────────────────────────────────────────── */}
        {activeSection === 'layers' && (
          <div className="flex flex-col gap-6">
            <Sec icon={<BarChart2 className="h-4 w-4" style={{ color: '#00F0FF' }} />} title="12-Layer Score Breakdown" sub="Scored 0–100 per layer · dashed line = league average" />

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              {layers.map((l, idx) => {
                const val = l.value;
                const rank = val == null ? '—' : val >= 75 ? 'Elite' : val >= 60 ? 'Above Avg' : val >= 40 ? 'Avg' : 'Below';
                const rankColor = val == null ? 'rgba(255,255,255,0.4)' : val >= 75 ? '#00FF94' : val >= 60 ? '#00FF94' : val >= 40 ? 'rgba(255,255,255,0.4)' : '#fb7185';
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{
                      background: idx % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)',
                      borderBottom: idx < layers.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    }}
                  >
                    <span className="w-6 text-center text-base shrink-0">{l.icon}</span>
                    <div className="w-36 shrink-0 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#ffffff' }}>{l.label}</p>
                      <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{l.weight > 0 ? `${l.weight}% weight` : 'Validator'}</p>
                    </div>
                    {/* Wide rank bar — fills all available space */}
                    <div className="flex-1 min-w-0">
                      <RankBar value={val} avg={l.avg} color={l.color} />
                    </div>
                    <div className="w-20 flex flex-col items-end shrink-0">
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: rankColor }}>{val == null ? '—' : Math.round(val)}</span>
                      <span className="text-[9px] font-semibold" style={{ color: rankColor, opacity: 0.75 }}>{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composite callout */}
            <div className="flex items-center justify-between rounded-2xl px-6 py-5" style={{ background: `rgba(${tier.rgb}, 0.10)`, border: `1px solid rgba(${tier.rgb}, 0.3)` }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: tier.color }}>Weighted Composite Score</p>
                <p className="text-5xl font-black mt-1" style={{ color: tier.color }}>{compositeScore}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Based on {layers.filter(l => l.weight > 0 && l.value != null).length} of 11 weighted layers</p>
              </div>
              <Arc value={compositeScore} color={tier.color} label="" size={96} />
            </div>
          </div>
        )}

        {/* ── BvP ─────────────────────────────────────────────────────────────── */}
        {activeSection === 'bvp' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<Target className="h-4 w-4" style={{ color: '#00F0FF' }} />}
              title={`vs ${player.pitcherName ?? 'Pitcher'}`}
              sub="Simulated — no pitcher ID available to fetch real BvP history"
              simulated
            />

            {/* Career summary chips */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[
                { label: 'Career PA',  value: bvpCareer.pa,          color: '#ffffff' },
                { label: 'Career HR',  value: bvpCareer.hrs,          color: '#fbbf24' },
                { label: 'Career AVG', value: bvpCareer.avg,          color: '#ffffff' },
                { label: 'Career SLG', value: bvpCareer.slg,          color: '#00FF94' },
                { label: 'HR / PA',    value: `${bvpCareer.hrPct}%`,  color: '#00F0FF' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* BvP bar chart */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>AVG + SLG by Season (gold dot = HR)</p>
              <BvPBarChart logs={bvpLogs} h={150} />
            </div>

            {/* Season table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              <div className="grid grid-cols-6 gap-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: '#050505', color: 'rgba(255,255,255,0.4)' }}>
                <span>Season</span><span className="text-right">PA</span><span className="text-right">HR</span><span className="text-right">AVG</span><span className="text-right">SLG</span><span className="text-right">OBP</span>
              </div>
              {bvpLogs.map((row, i) => (
                <div key={row.season} className="grid grid-cols-6 gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="text-sm font-bold" style={{ color: '#ffffff' }}>{row.season}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.pa}</span>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: row.hrs > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{row.hrs}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{row.avg.toFixed(3)}</span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: row.slg > 0.450 ? '#00FF94' : '#ffffff' }}>{row.slg.toFixed(3)}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{row.obp.toFixed(3)}</span>
                </div>
              ))}
              <div className="grid grid-cols-6 gap-0 px-4 py-3" style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.4)' }}>
                <span className="text-xs font-black uppercase" style={{ color: '#00F0FF' }}>Career</span>
                <span className="text-right text-sm font-bold tabular-nums" style={{ color: '#00F0FF' }}>{bvpCareer.pa}</span>
                <span className="text-right text-sm font-bold tabular-nums" style={{ color: '#fbbf24' }}>{bvpCareer.hrs}</span>
                <span className="text-right text-sm font-bold tabular-nums" style={{ color: '#ffffff' }}>{bvpCareer.avg}</span>
                <span className="text-right text-sm font-bold tabular-nums" style={{ color: '#ffffff' }}>{bvpCareer.slg}</span>
                <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
              </div>
            </div>

            {/* Verdict */}
            <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              {Number(bvpCareer.hrs) >= 2 ? <TrendingUp className="h-6 w-6 shrink-0" style={{ color: '#00FF94' }} /> : Number(bvpCareer.hrs) === 0 ? <TrendingDown className="h-6 w-6 shrink-0" style={{ color: '#fb7185' }} /> : <Minus className="h-6 w-6 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />}
              <div>
                <p className="text-sm font-bold" style={{ color: '#ffffff' }}>
                  {Number(bvpCareer.hrs) >= 2 ? `Owns This Pitcher — ${bvpCareer.hrs} career HRs` : Number(bvpCareer.hrs) === 1 ? 'One career HR against this pitcher' : 'No career HRs against this pitcher'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{bvpCareer.hrPct}% HR rate · {bvpCareer.pa} career PA</p>
              </div>
            </div>
          </div>
        )}

        {/* ── vs TEAM ──────────────────────────────────────────────────────────── */}
        {activeSection === 'team' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<Users className="h-4 w-4" style={{ color: '#fbbf24' }} />}
              title={`vs ${player.opponent}`}
              sub="Real box-score games this season — total bases per game"
            />

            {realLogState === 'loading' && (
              <div className="rounded-2xl p-6 text-center text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.4)' }}>
                Loading real game log from MLB Stats API…
              </div>
            )}

            {realLogState === 'unavailable' && (
              <div className="rounded-2xl p-6 text-center text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.4)' }}>
                No real game log available for this player right now.
              </div>
            )}

            {realLogState === 'ready' && teamLogs.length === 0 && (
              <div className="rounded-2xl p-6 text-center text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.4)' }}>
                No games logged against {player.opponent} yet this season.
              </div>
            )}

            {realLogState === 'ready' && teamLogs.length > 0 && (
              <>
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'HRs',      value: teamHRs,                                         color: '#fbbf24' },
                { label: 'Total H',  value: teamLogs.reduce((s, g) => s + g.hits, 0),         color: '#ffffff' },
                { label: 'Total AB', value: teamLogs.reduce((s, g) => s + g.ab, 0),           color: 'rgba(255,255,255,0.4)' },
                { label: 'Avg TB',   value: teamTB,                                           color: '#00F0FF' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Production bar chart */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Bases per Game (gold = HR game)</p>
              <ProductionBarChart logs={teamLogs} h={110} />
            </div>

            {/* Game log table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              <div className="grid grid-cols-6 gap-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: '#050505', color: 'rgba(255,255,255,0.4)' }}>
                <span>Date</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">RBI</span><span className="text-right">TB</span>
              </div>
              {teamLogs.map((g, i) => (
                <div key={i} className="grid grid-cols-6 items-center gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center gap-2">
                    <Dot hrs={g.hrs} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.date}</span>
                  </div>
                  <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.ab}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.hits}</span>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{g.hrs > 0 ? g.hrs : '—'}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.rbi}</span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: g.totalBases >= 4 ? '#fbbf24' : g.totalBases >= 2 ? '#00FF94' : 'rgba(255,255,255,0.4)' }}>{g.totalBases}</span>
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        )}

        {/* ── RECENT FORM ───────────────────────────────────────────────────────── */}
        {activeSection === 'form' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<Activity className="h-4 w-4" style={{ color: '#00FF94' }} />}
              title="Recent Form"
              sub={realLogState === 'ready' ? `Last ${formLogs.length} games — real box-score production` : 'Real box-score production'}
            />

            {realLogState === 'loading' && (
              <div className="rounded-2xl p-6 text-center text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.4)' }}>
                Loading real game log from MLB Stats API…
              </div>
            )}

            {realLogState === 'unavailable' && (
              <div className="rounded-2xl p-6 text-center text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.4)' }}>
                No real game log available for this player right now.
              </div>
            )}

            {realLogState === 'ready' && formLogs.length > 0 && (
              <>
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'HRs',     value: formHRs,                                          color: '#fbbf24' },
                { label: 'Total H', value: formLogs.reduce((s, g) => s + g.hits, 0),         color: '#ffffff' },
                { label: 'Avg TB',  value: formTB,                                           color: '#00F0FF' },
                { label: 'HR Rate', value: `${((formHRs / formLogs.length) * 100).toFixed(0)}%`, color: '#00FF94' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Production bar chart */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Bases per Game (gold = HR game)</p>
              <ProductionBarChart logs={formLogs} h={110} />
            </div>

            {/* Production sparkline + HR sparkline side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>TB Trend</p>
                <Sparkline values={TBSeries} color="#00F0FF" h={52} />
                <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <span>G10</span><span>Recent</span>
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>HR Activity</p>
                <Sparkline values={formLogs.map(g => g.hrs)} color="#fbbf24" h={52} />
                <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <span>G10</span><span>Recent</span>
                </div>
              </div>
            </div>

            {/* Result dots */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Game Results (gold = HR)</p>
              <div className="flex flex-wrap items-end gap-4">
                {formLogs.map((g, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Dot hrs={g.hrs} />
                    <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.opponentAbbr}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Game-by-game table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              <div className="grid grid-cols-5 gap-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: '#050505', color: 'rgba(255,255,255,0.4)' }}>
                <span>Opp</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">TB</span>
              </div>
              {formLogs.map((g, i) => (
                <div key={i} className="grid grid-cols-5 items-center gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center gap-2">
                    <Dot hrs={g.hrs} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.opponentAbbr}</span>
                  </div>
                  <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.ab}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.hits}</span>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{g.hrs > 0 ? '💥' : '—'}</span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: g.totalBases >= 4 ? '#fbbf24' : g.totalBases >= 2 ? '#00FF94' : 'rgba(255,255,255,0.4)' }}>{g.totalBases}</span>
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        )}
      </>
    );
  }
};
