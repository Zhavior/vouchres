/**
 * HrStatsTab — Pro Stats Panel
 *
 * Sections:
 *   1. Player Rank Card      — all 12-layer scores ranked vs league, with horizontal bar chart
 *   2. Batter vs. Pitcher    — career head-to-head history, PA/HR/AVG/SLG with sparkline-style dots
 *   3. vs. Team History      — last 5 games vs opponent team, HR / hits / exit velo
 *   4. Recent Form Strip     — last 10 games personal sparkline (AB/HR/xBA)
 *
 * Design:
 *   - CSS tokens only (--ve-* vars)
 *   - Pure SVG for charts — zero external chart deps
 *   - Pro lock overlay on BvP and vs-Team (easy to strip when entitlements added)
 */

import React, { useMemo } from 'react';
import { Lock, TrendingUp, TrendingDown, Minus, BarChart2, Target, Activity, Users } from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';

// ─── Types ─────────────────────────────────────────────────────────────────

interface HrStatsTabProps {
  player: HrWatchRow;
  isPro?: boolean;
}

interface GameLog {
  date: string;
  opponent: string;
  ab: number;
  hits: number;
  hrs: number;
  rbi: number;
  exitVelo: number | null;
  result: 'HR' | 'Hit' | 'Out';
}

interface BvPLog {
  season: string;
  pa: number;
  hrs: number;
  avg: number;
  slg: number;
  obp: number;
}

// ─── Mock data generators (replace with real Supabase calls) ───────────────

function generateBvPLogs(playerName: string, pitcherName: string): BvPLog[] {
  // Deterministic seed so same player always gets same fake history
  const seed = (playerName + pitcherName).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => ((seed * 9301 + 49297 + n * 6547) % 233280) / 233280;
  const seasons = ['2021', '2022', '2023', '2024', '2025'];
  return seasons.map((season, i) => {
    const pa = Math.round(4 + rng(i * 3) * 18);
    const hrs = Math.round(rng(i * 3 + 1) * Math.min(pa * 0.18, 3));
    const avg = +(0.18 + rng(i * 3 + 2) * 0.22).toFixed(3);
    const slg = +(avg + 0.08 + (hrs / Math.max(pa, 1)) * 3.0 + rng(i * 7) * 0.15).toFixed(3);
    const obp = +(avg + 0.04 + rng(i * 5) * 0.09).toFixed(3);
    return { season, pa, hrs, avg: Math.min(avg, 0.500), slg: Math.min(slg, 0.900), obp: Math.min(obp, 0.600) };
  });
}

function generateVsTeamLogs(playerName: string, opponent: string): GameLog[] {
  const seed = (playerName + opponent).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => ((seed * 7789 + 41491 + n * 8317) % 233280) / 233280;
  const months = ['Apr 2', 'Apr 28', 'May 15', 'Jun 3', 'Jun 28'];
  return months.map((date, i) => {
    const ab = Math.round(3 + rng(i * 4) * 2);
    const hrs = rng(i * 4 + 1) > 0.78 ? 1 : 0;
    const hits = hrs > 0 ? hrs + (rng(i * 4 + 2) > 0.5 ? 1 : 0) : Math.round(rng(i * 4 + 2) * ab * 0.35);
    const exitVelo = 88 + Math.round(rng(i * 4 + 3) * 14);
    const result: GameLog['result'] = hrs > 0 ? 'HR' : hits > 0 ? 'Hit' : 'Out';
    return { date, opponent, ab, hits: Math.min(hits, ab), hrs, rbi: hrs > 0 ? hrs + (rng(i * 5) > 0.6 ? 1 : 0) : 0, exitVelo, result };
  });
}

function generateRecentForm(playerName: string): GameLog[] {
  const seed = playerName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => ((seed * 8231 + 52711 + n * 9887) % 233280) / 233280;
  const opponents = ['NYY', 'BOS', 'TOR', 'BAL', 'TB', 'CLE', 'DET', 'MIN', 'KC', 'CHW'];
  return opponents.map((opp, i) => {
    const ab = Math.round(3 + rng(i * 3) * 2);
    const hrs = rng(i * 3 + 1) > 0.82 ? 1 : 0;
    const hits = hrs > 0 ? 1 + Math.round(rng(i * 3 + 2) * 1) : Math.round(rng(i * 3 + 2) * ab * 0.28);
    const exitVelo = 85 + Math.round(rng(i * 3 + 3) * 16);
    const result: GameLog['result'] = hrs > 0 ? 'HR' : hits > 0 ? 'Hit' : 'Out';
    return { date: `G${10 - i}`, opponent: opp, ab, hits: Math.min(hits, ab), hrs, rbi: hrs, exitVelo, result };
  });
}

// ─── Inline SVG Charts ─────────────────────────────────────────────────────

/** Micro sparkline for a series of 0–1 normalized values */
const Sparkline: React.FC<{ values: number[]; width?: number; height?: number; color?: string }> = ({
  values, width = 120, height = 32, color = 'hsl(var(--ve-accent-cyan))',
}) => {
  if (values.length < 2) return null;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const max = Math.max(...values, 0.01);
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - (v / max) * h;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const lastX = parseFloat(points[points.length - 1].split(',')[0]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
      {/* Area fill */}
      <polygon
        points={`${pad},${pad + h} ${polyline} ${lastX},${pad + h}`}
        fill={color}
        opacity="0.08"
      />
      {/* Last dot */}
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};

/** Horizontal bar rank — value 0–100, optional league avg line */
const RankBar: React.FC<{
  value: number | null | undefined;
  leagueAvg?: number;
  color: string;
  width?: number;
  height?: number;
}> = ({ value, leagueAvg = 50, color, width = 180, height = 10 }) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Track */}
      <rect x={0} y={2} width={width} height={height - 4} rx={3} fill="hsl(var(--ve-border) / 0.3)" />
      {/* Fill */}
      <rect
        x={0} y={2}
        width={(pct / 100) * width}
        height={height - 4}
        rx={3}
        fill={color}
        opacity={0.85}
      />
      {/* League avg tick */}
      <rect
        x={(leagueAvg / 100) * width - 0.5}
        y={0}
        width={1.5}
        height={height}
        fill="hsl(var(--ve-text-muted) / 0.5)"
        rx={0.5}
      />
    </svg>
  );
};

/** Radial arc score gauge */
const ScoreArc: React.FC<{ value: number; size?: number; color: string; label: string }> = ({
  value, size = 64, color, label,
}) => {
  const r = (size / 2) - 5;
  const cx = size / 2;
  const cy = size / 2;
  const arc = 220; // degrees of sweep
  const startAngle = 180 + (360 - arc) / 2;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPoint = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });
  const s = arcPoint(startAngle);
  const e = arcPoint(startAngle + arc);
  const f = arcPoint(startAngle + pct * arc);
  const trackPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  const fillPath = `M ${s.x} ${s.y} A ${r} ${r} 0 ${pct * arc > 180 ? 1 : 0} 1 ${f.x} ${f.y}`;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={trackPath} stroke="hsl(var(--ve-border) / 0.35)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d={fillPath} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{Math.round(value)}</text>
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--ve-text-muted))' }}>
        {label}
      </span>
    </div>
  );
};

// ─── Layer config for ranking display ──────────────────────────────────────

interface LayerRankRow {
  id: string;
  label: string;
  icon: string;
  value: number | null | undefined;
  weight: number;
  leagueAvg: number;
  accentToken: string;
  accentHex: string;
}

function getLayerRows(p: HrWatchRow): LayerRankRow[] {
  return [
    { id: 'power',   label: 'Hitter Power',       icon: '💪', weight: 25, value: p.hitterPower,          leagueAvg: 52, accentToken: 've-accent-gold', accentHex: '#f59e0b' },
    { id: 'pitcher', label: 'Pitcher Vulnerability', icon: '⚾', weight: 20, value: p.pitcherVulnerability, leagueAvg: 48, accentToken: 've-danger',      accentHex: '#ef4444' },
    { id: 'pitch',   label: 'Pitch Mix Advantage', icon: '🎯', weight: 15, value: p.pitchMix,             leagueAvg: 50, accentToken: 've-accent-pink', accentHex: '#818cf8' },
    { id: 'park',    label: 'Park Factor',          icon: '🏟️', weight: 10, value: p.parkFactor,           leagueAvg: 50, accentToken: 've-accent-cyan', accentHex: '#22d3ee' },
    { id: 'form',    label: 'Recent Form',           icon: '🔥', weight: 10, value: p.recentForm,           leagueAvg: 50, accentToken: 've-success',     accentHex: '#10b981' },
    { id: 'weather', label: 'Weather',               icon: '🌬️', weight: 5,  value: p.weather,             leagueAvg: 55, accentToken: 've-accent-cyan', accentHex: '#22d3ee' },
    { id: 'platoon', label: 'Platoon Split',          icon: '🤜', weight: 5,  value: p.platoon,             leagueAvg: 50, accentToken: 've-accent-gold', accentHex: '#f59e0b' },
    { id: 'bullpen', label: 'Bullpen Risk',           icon: '🔄', weight: 3,  value: p.bullpen,             leagueAvg: 48, accentToken: 've-warning',     accentHex: '#f97316' },
    { id: 'lineup',  label: 'Lineup Context',         icon: '📋', weight: 3,  value: p.lineupContext,        leagueAvg: 52, accentToken: 've-accent-pink', accentHex: '#818cf8' },
    { id: 'swing',   label: 'Swing Decisions',        icon: '🎪', weight: 2,  value: p.swingDecisions,      leagueAvg: 50, accentToken: 've-success',     accentHex: '#10b981' },
    { id: 'bvp',     label: 'Batter vs Pitcher',      icon: '📊', weight: 2,  value: p.bvpScore,            leagueAvg: 50, accentToken: 've-accent-cyan', accentHex: '#22d3ee' },
    { id: 'vegas',   label: 'Vegas Alignment',         icon: '💰', weight: 0,  value: p.vegasEdgeScore,      leagueAvg: 50, accentToken: 've-accent-gold', accentHex: '#f59e0b' },
  ];
}

// ─── Section header ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'hsl(var(--ve-surface))' }}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--ve-text-primary))' }}>{title}</p>
      {subtitle && <p className="text-[10px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{subtitle}</p>}
    </div>
  </div>
);

// ─── Pro lock overlay ────────────────────────────────────────────────────────

const ProLock: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="relative overflow-hidden rounded-xl"
    style={{ border: '1px solid hsl(var(--ve-border) / 0.5)' }}
  >
    {/* Blurred content behind */}
    <div className="blur-sm pointer-events-none select-none p-4 opacity-40">
      <div className="h-28 rounded-lg" style={{ background: 'hsl(var(--ve-surface))' }} />
    </div>
    {/* Lock overlay */}
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl"
      style={{ background: 'hsl(var(--ve-bg-deep) / 0.82)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full ring-1"
        style={{ background: 'hsl(var(--ve-accent-gold) / 0.12)', ['--tw-ring-color' as string]: 'hsl(var(--ve-accent-gold) / 0.35)' } as React.CSSProperties}
      >
        <Lock className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-gold))' }} />
      </div>
      <p className="text-xs font-bold" style={{ color: 'hsl(var(--ve-accent-gold))' }}>PRO</p>
      <p className="text-[10px] text-center px-4" style={{ color: 'hsl(var(--ve-text-muted))' }}>{label}</p>
    </div>
  </div>
);

// ─── Result dot ─────────────────────────────────────────────────────────────

const ResultDot: React.FC<{ result: GameLog['result'] }> = ({ result }) => {
  const styles: Record<GameLog['result'], string> = {
    HR: 'bg-amber-400 ring-amber-400/40',
    Hit: 'bg-emerald-400 ring-emerald-400/40',
    Out: 'bg-zinc-600 ring-zinc-600/30',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ring-2 ${styles[result]}`} />;
};

// ─── Main component ──────────────────────────────────────────────────────────

export const HrStatsTab: React.FC<HrStatsTabProps> = ({ player, isPro = true }) => {
  const layers = useMemo(() => getLayerRows(player), [player]);
  const bvpLogs = useMemo(() => generateBvPLogs(player.playerName, player.pitcherName ?? ''), [player.playerName, player.pitcherName]);
  const vsTeamLogs = useMemo(() => generateVsTeamLogs(player.playerName, player.opponent), [player.playerName, player.opponent]);
  const recentLogs = useMemo(() => generateRecentForm(player.playerName), [player.playerName]);

  // Composite weighted score for the arc display
  const compositeScore = useMemo(() => {
    let sum = 0, total = 0;
    for (const l of layers) {
      if (l.value != null && l.weight > 0) { sum += l.value * l.weight; total += l.weight; }
    }
    return total > 0 ? Math.round(sum / total) : player.hrScore;
  }, [layers, player.hrScore]);

  // Sparkline series from recent form logs
  const recentHRSeries = recentLogs.map(g => g.hrs);
  const recentEVSeries = recentLogs.map(g => (g.exitVelo ?? 88) / 105); // normalize to 0–1

  // BvP totals
  const bvpTotals = useMemo(() => {
    const total = bvpLogs.reduce((acc, r) => ({
      pa: acc.pa + r.pa,
      hrs: acc.hrs + r.hrs,
      avgSum: acc.avgSum + r.avg * r.pa,
      slgSum: acc.slgSum + r.slg * r.pa,
    }), { pa: 0, hrs: 0, avgSum: 0, slgSum: 0 });
    return {
      pa: total.pa,
      hrs: total.hrs,
      avg: total.pa > 0 ? (total.avgSum / total.pa).toFixed(3) : '.000',
      slg: total.pa > 0 ? (total.slgSum / total.pa).toFixed(3) : '.000',
      hrPerPA: total.pa > 0 ? (total.hrs / total.pa * 100).toFixed(1) : '0.0',
    };
  }, [bvpLogs]);

  return (
    <div className="flex flex-col gap-6 pb-4">

      {/* ── 1. Score Overview Arc Row ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.4)' }}
      >
        <p
          className="mb-3 text-[10px] font-black uppercase tracking-[0.22em]"
          style={{ color: 'hsl(var(--ve-text-muted))' }}
        >
          Score Breakdown
        </p>
        <div className="flex items-center justify-around gap-2 flex-wrap">
          <ScoreArc value={compositeScore}         color="#f59e0b" label="Composite" size={68} />
          <ScoreArc value={player.hitterPower ?? 0}   color="#22d3ee" label="Power"     size={68} />
          <ScoreArc value={player.pitcherVulnerability ?? 0} color="#ef4444" label="Pitcher"  size={68} />
          <ScoreArc value={player.recentForm ?? 0}   color="#10b981" label="Form"      size={68} />
          <ScoreArc value={player.vouchScore ?? 0}   color="#818cf8" label="Edge"      size={68} />
        </div>
      </div>

      {/* ── 2. 12-Layer Rankings ───────────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<BarChart2 className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-cyan))' }} />}
          title="Layer Rankings"
          subtitle="Score vs estimated league average (dashed line)"
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}
        >
          {layers.map((layer, idx) => {
            const val = layer.value;
            const isNull = val == null;
            const rankLabel = isNull ? '—' : val >= 75 ? 'Elite' : val >= 60 ? 'Above Avg' : val >= 40 ? 'Avg' : 'Below Avg';
            const rankColor = isNull ? 'hsl(var(--ve-text-muted))'
              : val >= 75 ? `hsl(var(--${layer.accentToken}))`
              : val >= 60 ? '#10b981'
              : val >= 40 ? 'hsl(var(--ve-text-muted))'
              : '#ef4444';
            return (
              <div
                key={layer.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                style={{
                  background: idx % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))',
                  borderBottom: idx < layers.length - 1 ? '1px solid hsl(var(--ve-border) / 0.2)' : 'none',
                }}
              >
                {/* Icon + label */}
                <span className="text-sm shrink-0 w-5 text-center">{layer.icon}</span>
                <div className="w-32 shrink-0">
                  <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'hsl(var(--ve-text-primary))' }}>
                    {layer.label}
                  </p>
                  <p className="text-[9px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>
                    {layer.weight > 0 ? `${layer.weight}% weight` : 'Validator'}
                  </p>
                </div>
                {/* Bar */}
                <div className="flex-1">
                  <RankBar value={val} leagueAvg={layer.leagueAvg} color={layer.accentHex} width={160} height={8} />
                </div>
                {/* Value + rank */}
                <div className="w-20 flex flex-col items-end shrink-0">
                  <span className="text-sm font-bold tabular-nums" style={{ color: rankColor }}>
                    {isNull ? '—' : Math.round(val)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{ color: rankColor, opacity: 0.8 }}>
                    {rankLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Recent Form Sparkline ───────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<Activity className="h-4 w-4" style={{ color: 'hsl(var(--ve-success))' }} />}
          title="Recent Form"
          subtitle={`Last ${recentLogs.length} games`}
        />
        <div
          className="rounded-xl p-4"
          style={{ background: 'hsl(var(--ve-surface))', border: '1px solid hsl(var(--ve-border) / 0.35)' }}
        >
          {/* Game result dots */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {recentLogs.map((g, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <ResultDot result={g.result} />
                <span className="text-[8px]" style={{ color: 'hsl(var(--ve-text-muted))' }}>{g.opponent}</span>
              </div>
            ))}
          </div>
          {/* Sparklines row */}
          <div className="flex items-end gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--ve-text-muted))' }}>HR / Game</span>
              <Sparkline values={recentHRSeries} color="#f59e0b" width={140} height={36} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--ve-text-muted))' }}>Exit Velo</span>
              <Sparkline values={recentEVSeries} color="#22d3ee" width={140} height={36} />
            </div>
          </div>
          {/* Summary stats */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'HRs', value: recentLogs.filter(g => g.result === 'HR').length },
              { label: 'Hits', value: recentLogs.reduce((s, g) => s + g.hits, 0) },
              { label: 'Avg EV', value: `${Math.round(recentLogs.reduce((s, g) => s + (g.exitVelo ?? 90), 0) / recentLogs.length)} mph` },
              { label: 'HR Rate', value: `${((recentLogs.filter(g => g.result === 'HR').length / recentLogs.length) * 100).toFixed(0)}%` },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-lg py-2"
                style={{ background: 'hsl(var(--ve-bg-panel))', border: '1px solid hsl(var(--ve-border) / 0.3)' }}
              >
                <span className="text-sm font-extrabold" style={{ color: 'hsl(var(--ve-text-primary))' }}>{stat.value}</span>
                <span className="text-[9px] uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Batter vs. Pitcher ──────────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<Target className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-pink))' }} />}
          title={`vs. ${player.pitcherName ?? 'Pitcher'}`}
          subtitle="Career head-to-head history"
        />
        {isPro ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-6 gap-0 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em]"
              style={{ background: 'hsl(var(--ve-bg-deep))', color: 'hsl(var(--ve-text-muted))' }}
            >
              <span>Season</span>
              <span className="text-right">PA</span>
              <span className="text-right">HR</span>
              <span className="text-right">AVG</span>
              <span className="text-right">SLG</span>
              <span className="text-right">OBP</span>
            </div>
            {/* Rows */}
            {bvpLogs.map((row, i) => (
              <div
                key={row.season}
                className="grid grid-cols-6 gap-0 px-3 py-2.5 transition-colors"
                style={{
                  background: i % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))',
                  borderTop: '1px solid hsl(var(--ve-border) / 0.18)',
                }}
              >
                <span className="text-xs font-bold" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.season}</span>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>{row.pa}</span>
                <span
                  className="text-right text-xs font-bold tabular-nums"
                  style={{ color: row.hrs > 0 ? '#f59e0b' : 'hsl(var(--ve-text-muted))' }}
                >
                  {row.hrs}
                </span>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.avg.toFixed(3)}</span>
                <span
                  className="text-right text-xs font-semibold tabular-nums"
                  style={{ color: row.slg > 0.450 ? '#10b981' : 'hsl(var(--ve-text-primary))' }}
                >
                  {row.slg.toFixed(3)}
                </span>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{row.obp.toFixed(3)}</span>
              </div>
            ))}
            {/* Totals row */}
            <div
              className="grid grid-cols-6 gap-0 px-3 py-2.5"
              style={{ background: 'hsl(var(--ve-bg-deep))', borderTop: '1px solid hsl(var(--ve-border) / 0.4)' }}
            >
              <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'hsl(var(--ve-accent-cyan))' }}>Career</span>
              <span className="text-right text-xs font-bold tabular-nums" style={{ color: 'hsl(var(--ve-accent-cyan))' }}>{bvpTotals.pa}</span>
              <span className="text-right text-xs font-bold tabular-nums" style={{ color: '#f59e0b' }}>{bvpTotals.hrs}</span>
              <span className="text-right text-xs font-bold tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{bvpTotals.avg}</span>
              <span className="text-right text-xs font-bold tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{bvpTotals.slg}</span>
              <span className="text-right text-xs font-bold tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>—</span>
            </div>
            {/* BvP summary chips */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 flex-wrap"
              style={{ background: 'hsl(var(--ve-surface))', borderTop: '1px solid hsl(var(--ve-border) / 0.28)' }}
            >
              <div className="flex items-center gap-1.5">
                {bvpTotals.hrs >= 2 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : bvpTotals.hrs === 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5" style={{ color: 'hsl(var(--ve-text-muted))' }} />
                )}
                <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--ve-text-muted))' }}>
                  {bvpTotals.hrPerPA}% HR/PA career
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1"
                style={{ background: bvpTotals.hrs >= 2 ? 'hsl(var(--ve-success) / 0.12)' : 'hsl(var(--ve-border) / 0.2)', color: bvpTotals.hrs >= 2 ? 'hsl(var(--ve-success))' : 'hsl(var(--ve-text-muted))', ['--tw-ring-color' as string]: bvpTotals.hrs >= 2 ? 'hsl(var(--ve-success) / 0.3)' : 'hsl(var(--ve-border) / 0.3)' } as React.CSSProperties}
              >
                {bvpTotals.hrs >= 2 ? 'Owns Pitcher' : bvpTotals.hrs === 1 ? 'Neutral History' : 'No History'}
              </span>
            </div>
          </div>
        ) : (
          <ProLock label="Unlock career head-to-head stats with Pro" />
        )}
      </div>

      {/* ── 5. vs. Team History ────────────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<Users className="h-4 w-4" style={{ color: 'hsl(var(--ve-accent-gold))' }} />}
          title={`vs. ${player.opponent}`}
          subtitle="Last 5 matchups vs this team"
        />
        {isPro ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid hsl(var(--ve-border) / 0.35)' }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-6 gap-0 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em]"
              style={{ background: 'hsl(var(--ve-bg-deep))', color: 'hsl(var(--ve-text-muted))' }}
            >
              <span>Date</span>
              <span className="text-right">AB</span>
              <span className="text-right">H</span>
              <span className="text-right">HR</span>
              <span className="text-right">RBI</span>
              <span className="text-right">EV</span>
            </div>
            {/* Game rows */}
            {vsTeamLogs.map((game, i) => (
              <div
                key={i}
                className="grid grid-cols-6 items-center gap-0 px-3 py-2.5"
                style={{
                  background: i % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))',
                  borderTop: '1px solid hsl(var(--ve-border) / 0.18)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <ResultDot result={game.result} />
                  <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--ve-text-muted))' }}>{game.date}</span>
                </div>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-muted))' }}>{game.ab}</span>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{game.hits}</span>
                <span
                  className="text-right text-xs font-bold tabular-nums"
                  style={{ color: game.hrs > 0 ? '#f59e0b' : 'hsl(var(--ve-text-muted))' }}
                >
                  {game.hrs > 0 ? game.hrs : '—'}
                </span>
                <span className="text-right text-xs tabular-nums" style={{ color: 'hsl(var(--ve-text-primary))' }}>{game.rbi}</span>
                <span
                  className="text-right text-xs font-semibold tabular-nums"
                  style={{ color: (game.exitVelo ?? 0) >= 98 ? '#f59e0b' : (game.exitVelo ?? 0) >= 93 ? '#10b981' : 'hsl(var(--ve-text-muted))' }}
                >
                  {game.exitVelo ?? '—'}
                </span>
              </div>
            ))}
            {/* Team series summary */}
            <div
              className="flex items-center gap-4 px-3 py-2.5 flex-wrap"
              style={{ background: 'hsl(var(--ve-bg-deep))', borderTop: '1px solid hsl(var(--ve-border) / 0.4)' }}
            >
              {[
                { label: 'HRs', value: vsTeamLogs.reduce((s, g) => s + g.hrs, 0), color: '#f59e0b' },
                { label: 'H', value: vsTeamLogs.reduce((s, g) => s + g.hits, 0), color: 'hsl(var(--ve-text-primary))' },
                { label: 'AB', value: vsTeamLogs.reduce((s, g) => s + g.ab, 0), color: 'hsl(var(--ve-text-muted))' },
                { label: 'Avg EV', value: `${Math.round(vsTeamLogs.reduce((s, g) => s + (g.exitVelo ?? 90), 0) / vsTeamLogs.length)}`, color: '#22d3ee' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-0">
                  <span className="text-sm font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: 'hsl(var(--ve-text-muted))' }}>{s.label}</span>
                </div>
              ))}
              {/* EV sparkline */}
              <div className="ml-auto">
                <Sparkline
                  values={vsTeamLogs.map(g => (g.exitVelo ?? 88) / 105)}
                  color="#22d3ee"
                  width={90}
                  height={28}
                />
              </div>
            </div>
          </div>
        ) : (
          <ProLock label="Unlock vs-team game logs with Pro" />
        )}
      </div>

    </div>
  );
};
