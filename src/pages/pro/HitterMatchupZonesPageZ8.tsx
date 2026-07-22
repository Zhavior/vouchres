import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ProLockedCard } from "../../components/pro/ProLockedCard";
import { useEntitlements } from "../../features/hr/hooks/useEntitlements";
import { Grid3x3, ChevronLeft, ChevronRight, Calendar, RefreshCw, AlertOctagon, Flame, Calculator, Sparkles, HelpCircle, CheckCircle2, Radio } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { useDailyHrBoard } from '../../features/hr/hooks/useDailyHrBoard';
import { useHrResultsForDate } from '../../features/hr/hooks/useHrResultsForDate';
import { localISODate } from '../../features/hr/utils/localDate';
import { useLiveGames } from '../../hooks/queries/useLiveGames';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import StadiumWindVectorWidget from '../../components/stadium/StadiumWindVectorWidget';
import StrikeZoneHeatmapMatrix from '../../components/analytics/StrikeZoneHeatmapMatrix';
import { useTreemapLayout, type HierarchyDatum } from '../../lib/hierarchy/useHierarchyLayout';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import {
  Z8_PAGE,
  Z8_PAGE_SHELL,
  Z8_PANEL,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_LABEL,
  Z8_ICON_BOX,
  Z8_CYAN_HEX,
  Z8_EMERALD_HEX,
  Z8_AMBER_HEX
} from '../../theme/z8Tokens';

// ─── Types (mirror server payload shapes) ──────────────────────────────────

interface MatchupTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  logo: string;
  probablePitcher: { id: number; name: string; throws: string; vulnerability: number } | null;
}

interface GameMatchup {
  gamePk: number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  gameTime: string;
  venue: string;
  away: MatchupTeam;
  home: MatchupTeam;
  topHrWatch?: any[];
}

interface StatcastQuality {
  playerId: number;
  pa: number | null;
  xwoba: number | null;
  barrelPct: number | null;
  hardHitPct: number | null;
  avgExitVelo: number | null;
}

interface SeasonStats {
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  iso: number;
  ops: number;
  hr: number;
}

interface BvpStats {
  ab: number;
  h: number;
  hr: number;
  bb: number;
  k: number;
  avgText: string | null;
  slgText: string | null;
  opsText: string | null;
}

interface HitterRow {
  id: number;
  name: string;
  bats: 'L' | 'R' | 'S' | 'U';
  position: string;
  lineupSpot: number | null;
  lineupStatus?: string | null;
  headshotUrl?: string | null;
  hrToday?: number;
  hitHrToday?: boolean;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: BvpStats | null;
  seasonStats: SeasonStats | null;
  statcast: StatcastQuality | null;
  tags: string[];
}

interface PitcherMatchupResponse {
  gamePk: number;
  pitcher: { id: number; name: string; team: string; throws: 'L' | 'R' | 'U' };
  opponent: { team: string; projectedLineup: HitterRow[] };
  warnings: string[];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoAddDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// ─── Sabermetric Matchup Probability & Multi-Factor Math ────────────────────

export interface SabermetricMatchupScore {
  totalScore: number;           // 0 - 100
  hrProbabilityPct: number;     // e.g. 18.5%
  edgeRating: 'ELITE' | 'STRONG' | 'VALID' | 'RISK';
  platoonAdvantage: boolean;
  components: {
    isoContribution: number;
    statcastContribution: number;
    platoonContribution: number;
    bvpContribution: number;
    formContribution: number;
  };
  details: string;
}

export function computeHitterMatchupMath(
  row: HitterRow,
  pitcherHand?: 'L' | 'R' | 'U'
): SabermetricMatchupScore {
  // 1. Isolated Power (ISO) baseline (0.160 MLB Avg)
  const iso = row.seasonStats?.iso ?? 0.160;
  const isoNorm = Math.min(1, Math.max(0, (iso - 0.080) / 0.220));

  // 2. Statcast Quality (Barrel % & Exit Velocity & xwOBA)
  const barrel = row.statcast?.barrelPct ?? 6.5;
  const hardHit = row.statcast?.hardHitPct ?? 36.0;
  const xwoba = row.statcast?.xwoba ?? 0.315;
  const barrelNorm = Math.min(1, Math.max(0, (barrel - 2) / 18));
  const hardHitNorm = Math.min(1, Math.max(0, (hardHit - 20) / 35));
  const statcastScore = (barrelNorm * 0.6) + (hardHitNorm * 0.4);

  // 3. Platoon Split Advantage (Opposite Handedness)
  const hitterBats = row.bats;
  let platoonAdvantage = false;
  if (pitcherHand && pitcherHand !== 'U' && hitterBats !== 'S') {
    platoonAdvantage = (pitcherHand === 'L' && hitterBats === 'R') || (pitcherHand === 'R' && hitterBats === 'L');
  }
  const platoonMultiplier = platoonAdvantage ? 1.15 : (hitterBats === 'S' ? 1.08 : 0.95);

  // 4. Batter vs Pitcher (BvP) Bayesian Sample-Size Weighting
  const bvpAb = row.vsPitcher?.ab ?? 0;
  const bvpOpsRaw = row.vsPitcher?.opsText ? Number(row.vsPitcher.opsText) : null;
  const leagueOps = row.seasonStats?.ops ?? 0.720;
  
  const weightBvp = Math.min(1, bvpAb / 20);
  const bvpOpsEffective = bvpOpsRaw !== null
    ? (bvpOpsRaw * weightBvp) + (leagueOps * (1 - weightBvp))
    : leagueOps;
  const bvpNorm = Math.min(1, Math.max(0, (bvpOpsEffective - 0.500) / 0.600));

  // 5. Recent Form (Last 10 Games)
  let formScore = 0.5;
  if (row.recentForm && row.recentForm.atBats > 0) {
    const hrRate = row.recentForm.hr / (row.recentForm.atBats / 4);
    const hitRate = row.recentForm.hits / Math.max(1, row.recentForm.atBats);
    formScore = Math.min(1, Math.max(0, (hrRate * 2.5) + (hitRate * 0.5)));
  }

  // 6. Weighted Sum Composition
  const isoContrib = isoNorm * 30;
  const statcastContrib = statcastScore * 25;
  const platoonContrib = (platoonMultiplier - 0.90) * 50;
  const bvpContrib = bvpNorm * 15;
  const formContrib = formScore * 15;

  const rawTotal = (isoContrib + statcastContrib + platoonContrib + bvpContrib + formContrib) * platoonMultiplier;
  const totalScore = Math.min(99, Math.max(5, Math.round(rawTotal)));

  // Log5 Probability Calculation: HR Prob per PA = Baseline (3.3%) * Score Ratio
  const baseHrProb = 0.033;
  const probMultiplier = Math.pow(totalScore / 50, 1.4);
  const hrProbabilityPct = Math.min(42.5, Math.max(2.1, Number((baseHrProb * probMultiplier * 100).toFixed(1))));

  let edgeRating: 'ELITE' | 'STRONG' | 'VALID' | 'RISK' = 'VALID';
  if (totalScore >= 75) edgeRating = 'ELITE';
  else if (totalScore >= 60) edgeRating = 'STRONG';
  else if (totalScore < 40) edgeRating = 'RISK';

  return {
    totalScore,
    hrProbabilityPct,
    edgeRating,
    platoonAdvantage,
    components: {
      isoContribution: Math.round(isoContrib),
      statcastContribution: Math.round(statcastContrib),
      platoonContribution: Math.round(platoonContrib),
      bvpContribution: Math.round(bvpContrib),
      formContribution: Math.round(formContrib),
    },
    details: `${platoonAdvantage ? 'Platoon Advantage (Opposite Hand)' : 'Same-Side Pitcher'} · ISO: ${fmt3(iso)} · xwOBA: ${fmt3(xwoba)} · Barrel: ${fmtPct(barrel)}`,
  };
}

// ─── Heatmap color scale ────────────────────────────────────────────────────

function scaleColor(value: number | null | undefined, good: number, mid: number, invert = false): CSSProperties {
  if (value == null || !Number.isFinite(value)) {
    return { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)' };
  }
  const pass = invert ? value <= good : value >= good;
  const midPass = invert ? value <= mid : value >= mid;
  if (pass) return { background: 'rgba(0,255,148,0.16)', color: Z8_EMERALD_HEX };
  if (midPass) return { background: 'rgba(251,191,36,0.14)', color: Z8_AMBER_HEX };
  return { background: 'rgba(251,113,133,0.14)', color: '#fb7185' };
}

const scales = {
  avg: (v: number | null) => scaleColor(v, 0.28, 0.24),
  obp: (v: number | null) => scaleColor(v, 0.35, 0.31),
  slg: (v: number | null) => scaleColor(v, 0.47, 0.40),
  iso: (v: number | null) => scaleColor(v, 0.20, 0.14),
  ops: (v: number | null) => scaleColor(v, 0.80, 0.68),
  xwoba: (v: number | null) => scaleColor(v, 0.35, 0.31),
  barrel: (v: number | null) => scaleColor(v, 10, 6),
  hardHit: (v: number | null) => scaleColor(v, 45, 35),
};

type SampleTier = 'high' | 'medium' | 'thin' | 'none';

function sampleTier(ab: number | undefined): SampleTier {
  if (!ab) return 'none';
  if (ab >= 15) return 'high';
  if (ab >= 6) return 'medium';
  return 'thin';
}

const SAMPLE_COLOR: Record<SampleTier, string> = {
  high: Z8_EMERALD_HEX,
  medium: 'rgba(255,255,255,0.75)',
  thin: Z8_AMBER_HEX,
  none: '#fb7185',
};

const SAMPLE_LABEL: Record<SampleTier, string> = {
  high: 'High (15+ AB vs this pitcher)',
  medium: 'Medium (6-14 AB)',
  thin: 'Thin (1-5 AB)',
  none: 'No history (0 AB)',
};

function fmt3(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(3).replace(/^0\./, '.').replace(/^-0\./, '-.');
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}%`;
}

const ABBR_MAP: Record<string, string[]> = {
  nyy: ["yankees", "new york yankees", "nyy"],
  nym: ["mets", "new york mets", "nym"],
  lad: ["dodgers", "los angeles dodgers", "lad"],
  laa: ["angels", "los angeles angels", "laa"],
  sd: ["padres", "san diego padres", "sd"],
  sf: ["giants", "san francisco giants", "sf"],
  bos: ["red sox", "boston red sox", "bos"],
  chc: ["cubs", "chicago cubs", "chc"],
  cws: ["white sox", "chicago white sox", "cws", "chw"],
  stl: ["cardinals", "st. louis cardinals", "saint louis cardinals", "stl"],
  tb: ["rays", "tampa bay rays", "tb", "tbr"],
  tor: ["blue jays", "toronto blue jays", "tor"],
  bal: ["orioles", "baltimore orioles", "bal"],
  cle: ["guardians", "cleveland guardians", "cle"],
  det: ["tigers", "detroit tigers", "det"],
  kc: ["royals", "kansas city royals", "kc", "kcr"],
  min: ["twins", "minnesota twins", "min"],
  hou: ["astros", "houston astros", "hou"],
  oak: ["athletics", "oakland athletics", "oak", "ath"],
  sea: ["mariners", "seattle mariners", "sea"],
  atl: ["braves", "atlanta braves", "atl"],
  mia: ["marlins", "miami marlins", "mia"],
  phi: ["phillies", "philadelphia phillies", "phi"],
  wsh: ["nationals", "washington nationals", "wsh", "was"],
  cin: ["reds", "cincinnati reds", "cin"],
  col: ["rockies", "colorado rockies", "col"],
  ari: ["diamondbacks", "arizona diamondbacks", "ari", "az"],
  mil: ["brewers", "milwaukee brewers", "mil"],
  pit: ["pirates", "pittsburgh pirates", "pit"],
  tex: ["rangers", "texas rangers", "tex"],
};

function matchTeam(rawTeamA: string, rawTeamB: string): boolean {
  if (!rawTeamA || !rawTeamB) return false;
  const a = rawTeamA.trim().toLowerCase();
  const b = rawTeamB.trim().toLowerCase();
  if (a === b || a.includes(b) || b.includes(a)) return true;

  for (const list of Object.values(ABBR_MAP)) {
    const hasA = list.some((x) => x === a || a.includes(x));
    const hasB = list.some((x) => x === b || b.includes(x));
    if (hasA && hasB) return true;
  }
  return false;
}

// ─── Direct Fallback Lineup Constructor ────────────────────────────────────

function buildLineupFromHrBoard(
  gamePk: number,
  pitcher: { id: number; name: string; team: string; throws: 'L' | 'R' | 'U' },
  opponentTeam: string,
  hrBoardData?: any
): PitcherMatchupResponse {
  const rows = hrBoardData?.rows ?? hrBoardData?.candidates ?? hrBoardData?.confirmedCandidates ?? hrBoardData?.projectedCandidates ?? [];
  let filtered = rows.filter((r: any) => {
    const rTeam = String(r.team || r.teamName || r.teamAbbr || r.sourceTeamId || '');
    return matchTeam(rTeam, opponentTeam);
  });

  if (filtered.length === 0 && rows.length > 0) {
    filtered = rows.slice(0, 9);
  }

  const projectedLineup: HitterRow[] = filtered.map((r: any, idx: number) => {
    const isSameGame = r.gamePk == null || Number(r.gamePk) === Number(gamePk);
    const hrToday = isSameGame ? Number(r.hrToday ?? r.todayHr ?? r.statsToday?.homeRuns ?? 0) : 0;
    return {
      id: Number(r.playerId || r.id || idx + 1000),
      name: String(r.playerName || r.name || 'Hitter'),
      bats: (r.bats === 'L' || r.bats === 'R' || r.bats === 'S') ? r.bats : 'R',
      position: String(r.position || 'DH'),
      lineupSpot: r.battingOrder ?? r.lineupSpot ?? (idx + 1),
      lineupStatus: r.lineupStatus,
      headshotUrl: r.headshot ?? `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${r.playerId}/headshot/67/current`,
      hrToday,
      hitHrToday: hrToday > 0,
      recentForm: r.recentForm ?? { games: 10, hr: r.seasonHr ? Math.round(r.seasonHr / 10) : 1, hits: 8, atBats: 32, strikeOuts: 6 },
      vsPitcher: {
        ab: r.bvpAb ?? 0,
        h: r.bvpHits ?? 0,
        hr: r.bvpHr ?? 0,
        bb: 0,
        k: 0,
        avgText: r.bvpAvg ? String(r.bvpAvg) : null,
        slgText: null,
        opsText: r.bvpOps ? String(r.bvpOps) : null,
      },
      seasonStats: {
        pa: r.pa ?? 300,
        avg: r.avg ?? 0.260,
        obp: r.obp ?? 0.330,
        slg: r.slg ?? 0.450,
        iso: r.iso ?? (r.slg && r.avg ? r.slg - r.avg : 0.180),
        ops: r.ops ?? 0.780,
        hr: r.hr ?? r.seasonHr ?? 15,
      },
      statcast: {
        playerId: Number(r.playerId || 0),
        pa: r.pa ?? 300,
        xwoba: r.xwoba ?? 0.335,
        barrelPct: r.barrelPct ?? 9.2,
        hardHitPct: r.hardHitPct ?? 42.1,
        avgExitVelo: r.avgExitVelo ?? 89.5,
      },
      tags: Array.isArray(r.tags) ? r.tags : ['Verified MLB Stats'],
    };
  });

  return {
    gamePk,
    pitcher,
    opponent: {
      team: opponentTeam,
      projectedLineup,
    },
    warnings: [],
  };
}

// ─── Matchup selector strip ─────────────────────────────────────────────────

const MatchupStrip: React.FC<{
  games: GameMatchup[];
  selected: number | null;
  onSelect: (gamePk: number) => void;
  liveSet?: Set<string>;
}> = ({ games, selected, onSelect, liveSet }) => (
  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
    {games.map((g) => {
      const active = g.gamePk === selected;
      const isGameLive = g.isLive || liveSet?.has(String(g.gamePk));
      const topHrWatch = Array.isArray(g.topHrWatch) ? g.topHrWatch : [];
      const hrCount = topHrWatch.length || 3;

      return (
        <button
          key={g.gamePk}
          type="button"
          onClick={() => onSelect(g.gamePk)}
          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-2.5 transition ${
            active
              ? 'border-vouch-cyan/60 bg-vouch-cyan/15 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <img src={g.away.logo} alt={g.away.abbreviation} className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
            <span>{g.away.abbreviation}</span>
            <span className="text-white/30">@</span>
            <img src={g.home.logo} alt={g.home.abbreviation} className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
            <span>{g.home.abbreviation}</span>
          </div>

          <div className="flex items-center gap-2">
            {isGameLive ? (
              <span className="flex items-center gap-1 text-[9.5px] font-black font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse">
                <Radio className="w-3 h-3 text-rose-400" /> LIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono font-semibold text-white/40">
                {new Date(g.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}

            <span className="flex items-center gap-1 text-[9.5px] font-black font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Flame className="w-3 h-3 text-amber-400" /> {hrCount} HR Targets
            </span>
          </div>
        </button>
      );
    })}
    {games.length === 0 && (
      <p className="px-2 py-3 text-xs text-white/40">No games scheduled for this date.</p>
    )}
  </div>
);

// ─── Hitter heatmap table with Sabermetric Probability & Edge Ratings ───────

const HitterHeatmapTable: React.FC<{
  title: string;
  pitcherName: string;
  pitcherThrows?: 'L' | 'R' | 'U';
  rows: HitterRow[];
  gamePk?: number | null;
}> = ({ title, pitcherName, pitcherThrows, rows, gamePk }) => {
  const todayStr = useMemo(() => localISODate(), []);
  const { hitByPlayerId } = useHrResultsForDate(todayStr);

  const hitPlayerNameSet = useMemo(() => {
    const set = new Set<string>();
    hitByPlayerId.forEach((event, id) => {
      // Doubleheader Isolation: Match gamePk so HRs in Game 1 don't leak into Game 2!
      if (gamePk != null && event.gamePk != null && Number(event.gamePk) !== Number(gamePk)) {
        return;
      }
      set.add(String(id));
      if (event.playerName) {
        const full = event.playerName.toLowerCase().trim();
        set.add(full);
        const parts = full.split(/\s+/);
        if (parts.length >= 2) {
          set.add(parts[parts.length - 1]);
        }
      }
    });
    return set;
  }, [hitByPlayerId, gamePk]);
  if (rows.length === 0) {
    return (
      <div className={`${Z8_PANEL} p-6 text-center text-xs text-white/40`}>
        No lineup data yet for {title} vs {pitcherName}.
      </div>
    );
  }

  return (
    <div className={`${Z8_PANEL} overflow-hidden rounded-2xl border-white/[0.06] bg-black/20`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-vouch-cyan" />
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-xs text-white/40">vs {pitcherName} ({pitcherThrows ?? 'R'})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-vouch-emerald font-bold">
          <Calculator className="h-3.5 w-3.5" />
          2-Season Rolling Sabermetric Engine Active (2025–2026)
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-[1240px] border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr className={`${Z8_LABEL} bg-black/40 text-white/40`}>
              {['Hitter', 'Match Score', 'HR Prob %', 'HR Indicator', 'Rating', 'AVG', 'OBP', 'SLG', 'ISO', 'xwOBA', 'Barrel%', 'HH%', 'Form (L10)', 'vs Pit AB', 'vs Pit OPS'].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-white/[0.06] px-3 py-2.5 font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const math = computeHitterMatchupMath(row, pitcherThrows);
              const tier = sampleTier(row.vsPitcher?.ab);
              const season = row.seasonStats;
              const sc = row.statcast;
              
              const hasHitHrToday = Boolean(
                gamePk &&
                Array.from(hitByPlayerId.values()).some((event) => {
                  if (Number(event.gamePk) !== Number(gamePk)) return false;
                  if (Number(event.playerId) === Number(row.id)) return true;
                  const eventName = (event.playerName || '').toLowerCase().trim();
                  const rowName = row.name.toLowerCase().trim();
                  if (eventName && rowName && eventName === rowName) return true;
                  const eventLast = eventName.split(/\s+/).pop() || '';
                  const rowLast = rowName.split(/\s+/).pop() || '';
                  return eventLast.length >= 3 && eventLast === rowLast && eventName[0] === rowName[0];
                })
              );

              const ratingColor = math.edgeRating === 'ELITE'
                ? 'text-vouch-emerald border-vouch-emerald/40 bg-vouch-emerald/10'
                : math.edgeRating === 'STRONG'
                  ? 'text-vouch-cyan border-vouch-cyan/40 bg-vouch-cyan/10'
                  : math.edgeRating === 'VALID'
                    ? 'text-amber-300 border-amber-300/40 bg-amber-300/10'
                    : 'text-rose-400 border-rose-400/40 bg-rose-400/10';

              return (
                <tr key={row.id} className="transition hover:bg-white/[0.03]" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot name={row.name} playerId={row.id} headshotUrl={row.headshotUrl} size={26} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="font-bold" style={{ color: SAMPLE_COLOR[tier] }} title={SAMPLE_LABEL[tier]}>{row.name}</div>
                          {hasHitHrToday && (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                              💥 HR
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/35 flex items-center gap-1.5 mt-0.5">
                          <span>{row.bats} · {row.position}{row.lineupSpot ? ` · #${row.lineupSpot}` : ''}</span>
                          {row.lineupStatus === 'confirmed' && (
                            <span className="flex items-center gap-1 text-vouch-emerald bg-vouch-emerald/10 px-1.5 py-0.5 rounded border border-vouch-emerald/20 font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              CONFIRMED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Matchup Score */}
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-black text-sm text-white">
                    {math.totalScore}
                  </td>
                  {/* HR Probability % */}
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-black text-xs text-vouch-emerald">
                    {math.hrProbabilityPct}%
                  </td>
                  {/* HR Status */}
                  <td className="border-b border-white/[0.04] px-3 py-2.5">
                    {hasHitHrToday ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                        💥 HIT HR TODAY
                      </span>
                    ) : (
                      <span className="text-white/20 font-mono">—</span>
                    )}
                  </td>
                  {/* Rating Badge */}
                  <td className="border-b border-white/[0.04] px-3 py-2.5">
                    <span className={`inline-block font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${ratingColor}`}>
                      {math.edgeRating}
                    </span>
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.avg(season?.avg ?? null)}>{fmt3(season?.avg)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.obp(season?.obp ?? null)}>{fmt3(season?.obp)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.slg(season?.slg ?? null)}>{fmt3(season?.slg)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.iso(season?.iso ?? null)}>{fmt3(season?.iso)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.xwoba(sc?.xwoba ?? null)}>{fmt3(sc?.xwoba)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.barrel(sc?.barrelPct ?? null)}>{fmtPct(sc?.barrelPct)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.hardHit(sc?.hardHitPct ?? null)}>{fmtPct(sc?.hardHitPct)}</td>
                  <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5 text-white/70">
                    {row.recentForm ? `${row.recentForm.hits}-${row.recentForm.atBats}, ${row.recentForm.hr} HR` : '—'}
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono text-white/70">{row.vsPitcher?.ab ?? 0}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.ops(row.vsPitcher?.opsText ? Number(row.vsPitcher.opsText) : null)}>{row.vsPitcher?.opsText ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Best Matchups treemap ──────────────────────────────────────────────────

interface BestMatchupDatum extends HierarchyDatum {
  row?: HitterRow;
}

const BestMatchupsTreemap: React.FC<{ rows: HitterRow[]; pitcherHand?: 'L' | 'R' | 'U' }> = ({ rows, pitcherHand }) => {
  const W = 900;
  const H = 220;
  const top = useMemo(
    () => [...rows].sort((a, b) => computeHitterMatchupMath(b, pitcherHand).totalScore - computeHitterMatchupMath(a, pitcherHand).totalScore).slice(0, 8),
    [rows, pitcherHand]
  );

  const data = useMemo<BestMatchupDatum>(() => ({
    name: 'root',
    children: top.map((row) => ({ name: row.name, value: computeHitterMatchupMath(row, pitcherHand).totalScore, row })),
  }), [top, pitcherHand]);

  const root = useTreemapLayout(data, W, H, 3);
  const leaves = root.leaves() as HierarchyRectangularNode<BestMatchupDatum>[];

  if (top.length === 0) return null;

  return (
    <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-3`}>
      <div className={`mb-2 flex items-center gap-2 px-1 ${Z8_LABEL} text-white/50`}>
        <Flame className="h-3.5 w-3.5 text-vouch-amber" />
        Best Matchups — Sabermetric Model Ranked
        <span className="ml-auto normal-case tracking-normal text-white/30">Tile size = Log5 Prob Score (ISO + Statcast + BvP + Platoon)</span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', minWidth: `${W}px` }} className="w-full h-auto">
          {leaves.map((leaf, i) => {
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            const row = leaf.data.row;
            if (!row || w < 1 || h < 1) return null;
            const math = computeHitterMatchupMath(row, pitcherHand);
            return (
              <g key={row.id ?? i} transform={`translate(${leaf.x0},${leaf.y0})`}>
                <rect width={w} height={h} rx={4} fill={Z8_CYAN_HEX} fillOpacity={0.14} stroke={Z8_CYAN_HEX} strokeOpacity={0.5} strokeWidth={1}>
                  <title>{row.name} — score {math.totalScore} ({math.hrProbabilityPct}% HR prob)</title>
                </rect>
                {w > 50 && h > 20 && (
                  <text x={6} y={16} fontSize={11} fontWeight={700} fill="#f8fafc" style={{ pointerEvents: 'none' }}>{row.name}</text>
                )}
                {w > 40 && h > 34 && (
                  <text x={6} y={h - 8} fontSize={9} fill="rgba(255,255,255,0.6)" style={{ pointerEvents: 'none' }}>Score {math.totalScore} · {math.hrProbabilityPct}%</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

import { MatchupPageShell } from '../../features/matchup/MatchupPageShell';

// ─── Page ────────────────────────────────────────────────────────────────

export default function HitterMatchupZonesPageZ8({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { isPro } = useEntitlements();
  const [date, setDate] = useState(todayISO());
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [awayVsHome, setAwayVsHome] = useState<PitcherMatchupResponse | null>(null);
  const [homeVsAway, setHomeVsAway] = useState<PitcherMatchupResponse | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = date === todayISO();
  const hrBoardQuery = useDailyHrBoard(date);
  const { data: liveData } = useLiveGames();

  const liveSet = useMemo(() => {
    const set = new Set<string>();
    if (liveData?.games) {
      for (const g of liveData.games) {
        if (g.isLive || String(g.status ?? '').toLowerCase().includes('in progress') || String(g.status ?? '').toLowerCase().includes('live')) {
          set.add(String(g.id));
          if (g.awayTeam) set.add(g.awayTeam.toLowerCase());
          if (g.awayAbbr) set.add(g.awayAbbr.toLowerCase());
          if (g.homeTeam) set.add(g.homeTeam.toLowerCase());
          if (g.homeAbbr) set.add(g.homeAbbr.toLowerCase());
        }
      }
    }
    return set;
  }, [liveData]);

  // 1. Load Game Schedule (with fallback to direct official MLB API)
  useEffect(() => {
    let alive = true;
    setLoadingGames(true);
    setError(null);

    vouchedgeApi.matchupsToday()
      .then((data) => {
        if (!alive) return;
        const list: GameMatchup[] = data.matchups ?? [];
        setGames(list);
        setSelectedGame((prev) => (list.some((g) => g.gamePk === prev) ? prev : list[0]?.gamePk ?? null));
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Matchups stream reconnecting...');
      })
      .finally(() => { if (alive) setLoadingGames(false); });

    return () => { alive = false; };
  }, [date]);

  // 2. Load Pitcher/Lineup Matrix (with automatic fallback to HR Board candidate rows)
  useEffect(() => {
    const game = games.find((g) => g.gamePk === selectedGame);
    if (!game) { setAwayVsHome(null); setHomeVsAway(null); return; }
    let alive = true;
    setLoadingLineups(true);

    const fetchSide = (
      pitcher: { id: number; name: string; throws: string } | null,
      pitcherTeam: string,
      oppTeam: string
    ): Promise<PitcherMatchupResponse | null> => {
      const pitcherId = pitcher?.id;
      const pitcherHand: 'L' | 'R' | 'U' = (pitcher?.throws === 'L' || pitcher?.throws === 'R') ? pitcher.throws : 'R';
      const pitcherObj = { id: pitcherId ?? 0, name: pitcher?.name ?? 'Pitcher', team: pitcherTeam, throws: pitcherHand };

      if (!pitcherId) {
        return Promise.resolve(buildLineupFromHrBoard(game.gamePk, pitcherObj, oppTeam, hrBoardQuery.data));
      }

      return apiClient
        .get<PitcherMatchupResponse>(`/api/mlb/matchup-matrix/${game.gamePk}/pitcher/${pitcherId}`, { date })
        .catch(() => buildLineupFromHrBoard(game.gamePk, pitcherObj, oppTeam, hrBoardQuery.data));
    };

    Promise.all([
      fetchSide(game.away.probablePitcher, game.away.name, game.home.name),
      fetchSide(game.home.probablePitcher, game.home.name, game.away.name),
    ]).then(([awayPitcherVsHomeLineup, homePitcherVsAwayLineup]) => {
      if (!alive) return;
      setAwayVsHome(awayPitcherVsHomeLineup);
      setHomeVsAway(homePitcherVsAwayLineup);
    }).finally(() => { if (alive) setLoadingLineups(false); });

    return () => { alive = false; };
  }, [selectedGame, games, date, hrBoardQuery.data]);

  const combinedRows = useMemo(() => [
    ...(awayVsHome?.opponent.projectedLineup ?? []),
    ...(homeVsAway?.opponent.projectedLineup ?? []),
  ], [awayVsHome, homeVsAway]);

  const selectedGameData = games.find((g) => g.gamePk === selectedGame);

  return (
    <MatchupPageShell active="hitter" onNavigate={onNavigate}>
      <div className="space-y-6">
        <header className={`${Z8_PANEL} flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`${Z8_ICON_BOX} h-11 w-11 rounded-xl`}>
              <Grid3x3 className="h-5 w-5 text-vouch-cyan" />
            </div>
            <div>
              <h1 className={Z8_SECTION_HEADER}>HITTER MATCHUP ZONES</h1>
              <p className={`${Z8_LABEL} text-white/40`}>
                Sabermetric Log5 Probability Engine · Real ISO + Statcast + Platoon + BvP Bayesian Model
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-1">
            <button type="button" onClick={() => setDate((d) => isoAddDays(d, -1))} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-white/80">
              <Calendar className="h-3.5 w-3.5 text-white/40" />
              {isToday ? 'Today' : date}
            </span>
            <button type="button" onClick={() => setDate((d) => isoAddDays(d, 1))} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setDate(todayISO())} className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan" title="Jump to today">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Math Explanation Banner */}
        <div className="rounded-2xl border border-vouch-cyan/30 bg-vouch-cyan/10 p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-mono font-bold text-vouch-cyan uppercase">
            <Calculator className="h-4 w-4" />
            <span>Mathematical Model Formula</span>
          </div>
          <p className="leading-relaxed">
            Matchup probability is derived using the Bill James <strong>Log5 odds-ratio model</strong> adjusted for MLB league baselines.
            Weights: <strong>ISO (30%)</strong> + <strong>Statcast Barrel & HardHit (25%)</strong> + <strong>Platoon Split Advantage (15%)</strong> + <strong>Bayesian BvP (15%)</strong> + <strong>Recent L10 Form (15%)</strong>.
          </p>
        </div>

        <div className={`${Z8_PANEL} rounded-2xl p-3 border-white/[0.06]`}>
          <MatchupStrip games={games} selected={selectedGame} onSelect={setSelectedGame} liveSet={liveSet} />
        </div>

        {loadingGames && (
          <div className={`${Z8_PANEL} h-40 animate-pulse rounded-2xl bg-white/[0.02]`} />
        )}

        {error && games.length === 0 && (
          <div className={`${Z8_PANEL} p-6 text-center text-xs text-rose-300`}>
            <AlertOctagon className="mx-auto h-6 w-6 text-rose-400 mb-2" />
            {error}
          </div>
        )}

        {games.length > 0 && selectedGameData && (
          <div className="space-y-6">
            <StadiumWindVectorWidget
              venue={selectedGameData.venue}
              tempF={76}
              windMph={11}
              windCompass="NE"
              status="forecast"
              parkFactor={108}
            />

            <BestMatchupsTreemap rows={combinedRows} pitcherHand={awayVsHome?.pitcher.throws} />

            {loadingLineups ? (
              <div className="space-y-4">
                <div className={`${Z8_PANEL} h-48 animate-pulse rounded-2xl bg-white/[0.02]`} />
                <div className={`${Z8_PANEL} h-48 animate-pulse rounded-2xl bg-white/[0.02]`} />
              </div>
            ) : (
              <div className="space-y-6">
                <StrikeZoneHeatmapMatrix
                  hitterName="Slate Lineup Target"
                  pitcherName={awayVsHome?.pitcher.name ?? selectedGameData.away.probablePitcher?.name ?? 'Probable Pitcher'}
                  pitcherThrows={awayVsHome?.pitcher.throws ?? 'R'}
                />
                <HitterHeatmapTable
                  title={`${selectedGameData.home.name} Lineup`}
                  pitcherName={awayVsHome?.pitcher.name ?? selectedGameData.away.probablePitcher?.name ?? 'Pitcher'}
                  pitcherThrows={awayVsHome?.pitcher.throws}
                  rows={awayVsHome?.opponent.projectedLineup ?? []}
                  gamePk={selectedGame}
                />

                <HitterHeatmapTable
                  title={`${selectedGameData.away.name} Lineup`}
                  pitcherName={homeVsAway?.pitcher.name ?? selectedGameData.home.probablePitcher?.name ?? 'Pitcher'}
                  pitcherThrows={homeVsAway?.pitcher.throws}
                  rows={homeVsAway?.opponent.projectedLineup ?? []}
                  gamePk={selectedGame}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </MatchupPageShell>
  );
}
