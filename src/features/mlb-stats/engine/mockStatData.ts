/**
 * mockStatData — Seeded mock data generator for all 8 stat types
 *
 * Produces deterministic StatPlayerRow arrays for UI development.
 * Replace with real API layer in production.
 *
 * Source mode is always 'mock' — components should show a subtle badge.
 */

import type { StatPlayerRow, StatType, StatTier, LineupStatus, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

// ─── Seeded pseudo-random (deterministic) ─────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0x100000000);
  };
}

function rng(seed: number, min: number, max: number): number {
  const r = seededRand(seed);
  return Math.round(min + r() * (max - min));
}

// ─── Player pool ───────────────────────────────────────────────────────────────

interface MockPlayer {
  name: string;
  team: string;
  lineupSpot: number;
  lineupStatus: LineupStatus;
}

const HITTER_POOL: MockPlayer[] = [
  { name: 'Aaron Judge',      team: 'NYY', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Shohei Ohtani',    team: 'LAD', lineupSpot: 2, lineupStatus: 'confirmed' },
  { name: 'Mookie Betts',     team: 'LAD', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Freddie Freeman',  team: 'LAD', lineupSpot: 4, lineupStatus: 'confirmed' },
  { name: 'Bryce Harper',     team: 'PHI', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Ronald Acuña Jr.', team: 'ATL', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Fernando Tatis Jr.',team: 'SD',  lineupSpot: 2, lineupStatus: 'projected' },
  { name: 'Kyle Tucker',      team: 'CHC', lineupSpot: 4, lineupStatus: 'confirmed' },
  { name: 'Yordan Alvarez',   team: 'HOU', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Corey Seager',     team: 'TEX', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Pete Alonso',      team: 'NYM', lineupSpot: 4, lineupStatus: 'confirmed' },
  { name: 'Julio Rodriguez',  team: 'SEA', lineupSpot: 2, lineupStatus: 'projected' },
  { name: 'Gunnar Henderson', team: 'BAL', lineupSpot: 2, lineupStatus: 'confirmed' },
  { name: 'Elly De La Cruz',  team: 'CIN', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'CJ Abrams',        team: 'WSH', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Bo Bichette',      team: 'TOR', lineupSpot: 2, lineupStatus: 'questionable' },
  { name: 'Trea Turner',      team: 'PHI', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Jose Ramirez',     team: 'CLE', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Nolan Arenado',    team: 'STL', lineupSpot: 3, lineupStatus: 'confirmed' },
  { name: 'Willy Adames',     team: 'SF',  lineupSpot: 5, lineupStatus: 'confirmed' },
];

const PITCHER_POOL: MockPlayer[] = [
  { name: 'Gerrit Cole',      team: 'NYY', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Spencer Strider',  team: 'ATL', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Zack Wheeler',     team: 'PHI', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Logan Webb',       team: 'SF',  lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Dylan Cease',      team: 'SD',  lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Corbin Burnes',    team: 'BAL', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'Framber Valdez',   team: 'HOU', lineupSpot: 1, lineupStatus: 'confirmed' },
  { name: 'MacKenzie Gore',   team: 'WSH', lineupSpot: 1, lineupStatus: 'projected' },
];

const OPPONENTS: Record<string, string> = {
  NYY: 'BOS', LAD: 'SF', PHI: 'NYM', ATL: 'MIA', SD: 'COL',
  CHC: 'MIL', HOU: 'OAK', TEX: 'LAA', NYM: 'PHI', SEA: 'MIN',
  BAL: 'TB',  CIN: 'PIT', WSH: 'ATL', TOR: 'NYY', CLE: 'DET',
  STL: 'CIN', SF: 'LAD',
};

const VENUES: Record<string, string> = {
  NYY: 'Yankee Stadium', LAD: 'Dodger Stadium', PHI: 'Citizens Bank Park',
  ATL: 'Truist Park', SD: 'Petco Park', CHC: 'Wrigley Field', HOU: 'Minute Maid Park',
  TEX: 'Globe Life Field', NYM: 'Citi Field', SEA: 'T-Mobile Park',
  BAL: 'Camden Yards', CIN: 'Great American Ball Park', WSH: 'Nationals Park',
  TOR: 'Rogers Centre', CLE: 'Progressive Field', STL: 'Busch Stadium', SF: 'Oracle Park',
};

// ─── Season value ranges per stat type ────────────────────────────────────────

const SEASON_RANGES: Record<StatType, [number, number]> = {
  hr:          [4, 32],
  rbi:         [18, 78],
  runs:        [22, 80],
  sb:          [2, 28],
  hits:        [30, 110],
  total_bases: [40, 160],
  doubles:     [4, 24],
  pitcher_k:   [18, 110],
};

// ─── Driver factory per stat type ─────────────────────────────────────────────

function makeDrivers(statType: StatType, baseSeed: number): WeightedFactor[] {
  const r = seededRand(baseSeed);
  const rand = (min: number, max: number) => Math.round(min + r() * (max - min));

  switch (statType) {
    case 'hr': return [
      { id: 'power',   label: 'Hitter Power',        icon: '💪', value: rand(40, 100), weight: 30 },
      { id: 'pitcher', label: 'Pitcher Vulnerability',icon: '⚾', value: rand(30, 100), weight: 25 },
      { id: 'park',    label: 'Park Factor',          icon: '🏟️', value: rand(40, 100), weight: 15 },
      { id: 'form',    label: 'Recent Form',          icon: '🔥', value: rand(35, 100), weight: 20 },
      { id: 'edge',    label: 'Vegas Edge',           icon: '📊', value: rand(30, 90),  weight: 10 },
    ];
    case 'rbi': return [
      { id: 'lineup',   label: 'Lineup Spot',         icon: '📋', value: rand(50, 100), weight: 25 },
      { id: 'team_run', label: 'Team Run Projection', icon: '📈', value: rand(40, 100), weight: 20 },
      { id: 'pitcher',  label: 'Pitcher Weakness',    icon: '⚾', value: rand(30, 100), weight: 15 },
      { id: 'runners',  label: 'Runners-on-Base Opp', icon: '🏃', value: rand(30, 100), weight: 15 },
      { id: 'contact',  label: 'Contact Rate',        icon: '🎯', value: rand(45, 100), weight: 10 },
      { id: 'bullpen',  label: 'Bullpen Weakness',    icon: '🔄', value: rand(30, 90),  weight: 10 },
      { id: 'park',     label: 'Park / Weather',      icon: '🌤️', value: rand(40, 90),  weight:  5 },
    ];
    case 'runs': return [
      { id: 'obp',     label: 'OBP Trend',           icon: '📊', value: rand(40, 100), weight: 30 },
      { id: 'lineup',  label: 'Lineup Spot',          icon: '📋', value: rand(50, 100), weight: 22 },
      { id: 'offense', label: 'Team Offense',         icon: '⚡', value: rand(40, 100), weight: 20 },
      { id: 'pitcher', label: 'Pitcher Weakness',     icon: '⚾', value: rand(30, 100), weight: 15 },
      { id: 'speed',   label: 'Speed / Baserunning',  icon: '🏃', value: rand(30, 100), weight:  8 },
      { id: 'park',    label: 'Park / Weather',       icon: '🌤️', value: rand(40, 90),  weight:  5 },
    ];
    case 'sb': return [
      { id: 'sprint',  label: 'Sprint Speed',        icon: '⚡', value: rand(40, 100), weight: 30 },
      { id: 'steal',   label: 'Steal Rate',          icon: '🏃', value: rand(30, 100), weight: 25 },
      { id: 'defense', label: 'Def Response Time',   icon: '🧤', value: rand(30, 100), weight: 20 },
      { id: 'aggro',   label: 'Team Aggression',     icon: '📋', value: rand(40, 100), weight: 15 },
      { id: 'script',  label: 'Game Script',         icon: '🎮', value: rand(35, 100), weight: 10 },
    ];
    case 'hits': return [
      { id: 'contact', label: 'Contact Rate',         icon: '🎯', value: rand(45, 100), weight: 28 },
      { id: 'babip',   label: 'BABIP Trend',          icon: '📊', value: rand(35, 100), weight: 24 },
      { id: 'pitcher', label: 'Pitcher Hard Contact', icon: '⚾', value: rand(30, 100), weight: 22 },
      { id: 'platoon', label: 'Platoon Advantage',    icon: '🔄', value: rand(30, 90),  weight: 14 },
      { id: 'form',    label: 'Recent Form',          icon: '🔥', value: rand(35, 100), weight: 12 },
    ];
    case 'total_bases': return [
      { id: 'iso',        label: 'ISO (Isolated Power)',   icon: '💪', value: rand(40, 100), weight: 30 },
      { id: 'slug',       label: 'Slugging %',            icon: '📊', value: rand(40, 100), weight: 25 },
      { id: 'park',       label: 'Extra-Base Park Factor',icon: '🏟️', value: rand(35, 100), weight: 20 },
      { id: 'pitcher',    label: 'Pitcher Hard Contact',  icon: '⚾', value: rand(30, 100), weight: 15 },
      { id: 'protection', label: 'Lineup Protection',     icon: '📋', value: rand(35, 100), weight: 10 },
    ];
    case 'doubles': return [
      { id: 'gap',     label: 'Gap Power',         icon: '✌️', value: rand(40, 100), weight: 28 },
      { id: 'park',    label: 'Park Gap Factor',   icon: '🏟️', value: rand(35, 100), weight: 24 },
      { id: 'of_arm',  label: 'OF Arm Weakness',   icon: '🧤', value: rand(30, 100), weight: 22 },
      { id: 'pitcher', label: 'Pitcher FB/LD Rate',icon: '⚾', value: rand(30, 100), weight: 15 },
      { id: 'platoon', label: 'Platoon Advantage', icon: '🔄', value: rand(30, 90),  weight: 11 },
    ];
    case 'pitcher_k': return [
      { id: 'trailing_k', label: 'Trailing K Avg',       icon: '🔥', value: rand(45, 100), weight: 30 },
      { id: 'lineup_k',   label: 'Opposing Lineup K%',   icon: '📊', value: rand(35, 100), weight: 28 },
      { id: 'swstr',      label: 'Swinging Strike Rate', icon: '⚾', value: rand(40, 100), weight: 22 },
      { id: 'pitch_mix',  label: 'Pitch Mix Depth',      icon: '🎭', value: rand(35, 100), weight: 12 },
      { id: 'park_temp',  label: 'Park / Temperature',   icon: '🌡️', value: rand(30, 90),  weight:  8 },
    ];
  }
}

// ─── Row builder ──────────────────────────────────────────────────────────────

function buildRow(
  statType: StatType,
  player: MockPlayer,
  idx: number,
  date: string,
): StatPlayerRow {
  const seed = statType.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31 + idx * 17 + date.replace(/-/g, '').length;
  const r = seededRand(seed);
  const rand = (min: number, max: number) => Math.round(min + r() * (max - min));

  const drivers = makeDrivers(statType, seed);

  // Weighted composite score from drivers
  let sumScore = 0, sumWeight = 0;
  for (const d of drivers) {
    if (d.value != null) {
      sumScore  += d.value * d.weight;
      sumWeight += d.weight;
    }
  }
  const statScore = sumWeight > 0 ? Math.round(sumScore / sumWeight) : 50;
  const config = STAT_CONFIG[statType];
  const tier = assignTier(statScore, config.thresholds);

  const [sMin, sMax] = SEASON_RANGES[statType];
  const seasonValue = rand(sMin, sMax);

  const modelProb = Math.round(statScore * 0.65 + rand(5, 20)) / 100;
  const impliedProb = Math.min(0.95, modelProb + (r() * 0.12 - 0.06));
  const edgePct = Math.round((modelProb - impliedProb) * 100 * 10) / 10;

  const opponent = OPPONENTS[player.team] ?? 'OPP';
  const venue = VENUES[player.team] ?? 'Stadium';

  return {
    stableId:          `${statType}_${player.name.toLowerCase().replace(/\s+/g, '_')}_${date}`,
    playerName:        player.name,
    playerId:          null,
    team:              player.team,
    opponent,
    pitcherName:       statType !== 'pitcher_k' ? 'TBD' : null,
    venue,
    gameTime:          `${rand(1, 3) + 6}:${rand(0, 5) * 10 === 0 ? '05' : rand(0, 5) * 10}PM ET`,
    headshotUrl:       null,
    teamLogoUrl:       null,
    lineupSpot:        player.lineupSpot,
    lineupStatus:      player.lineupStatus,

    statScore,
    tier,
    confidence:        Math.max(40, rand(55, 95)),
    drivers,
    isHeuristic:       true,

    seasonValue,
    seasonRank:        rand(1, 60),

    bookLine:          Math.round((statScore * 0.1 + 0.5) * 2) / 2,
    bookOdds:          statScore > 70 ? rand(-180, -105) : rand(-105, 180),
    modelProbability:  Math.round(modelProb * 1000) / 1000,
    impliedProbability: Math.round(impliedProb * 1000) / 1000,
    edgePct,

    dfsProjection:     Math.round(statScore * 0.12 * 10) / 10,
    dfsFloor:          Math.round(statScore * 0.08 * 10) / 10,
    dfsCeiling:        Math.round(statScore * 0.18 * 10) / 10,

    reasons:           tier === 'elite' || tier === 'strong'
      ? [`Strong ${config.primaryDriver} matchup`, 'Favorable conditions today']
      : undefined,
    warnings:          player.lineupStatus === 'questionable'
      ? ['Lineup status questionable — confirm before lock']
      : undefined,
    sourceMode: 'mock',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMockRows(statType: StatType, date: string): StatPlayerRow[] {
  const pool = statType === 'pitcher_k' ? PITCHER_POOL : HITTER_POOL;
  return pool
    .map((p, i) => buildRow(statType, p, i, date))
    .sort((a, b) => b.statScore - a.statScore);
}

export function getMockBoard(statType: StatType, date: string) {
  const rows = getMockRows(statType, date);
  const config = STAT_CONFIG[statType];

  const elite   = rows.filter(r => r.tier === 'elite');
  const strong  = rows.filter(r => r.tier === 'strong');
  const watch   = rows.filter(r => r.tier === 'watch');
  const sleeper = rows.filter(r => r.tier === 'sleeper');

  return {
    elite, strong, watch, sleeper,
    tierLabels: config.tierLabels,
    counts: {
      elite:   elite.length,
      strong:  strong.length,
      watch:   watch.length,
      sleeper: sleeper.length,
      total:   rows.length,
    },
  };
}
