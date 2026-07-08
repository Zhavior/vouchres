import type { LineupStatus, StatPlayerRow, StatScope, StatType, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';
import { calculateWeightedScore, rankByScore, calculateConfidence, generatePrediction, createSportsIntelligenceResult } from '../../../kernel';


const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

type TeamSide = 'away' | 'home';

interface ScheduleTeam {
  id: number;
  name: string;
  abbreviation: string;
}

interface ScheduleGame {
  gamePk: number;
  gameDate: string;
  venue: string;
  status: string;
  away: ScheduleTeam;
  home: ScheduleTeam;
  awayPitcher: string | null;
  homePitcher: string | null;
}

interface RosterPerson {
  id: number;
  fullName: string;
  primaryNumber?: string;
  primaryPosition?: { abbreviation?: string };
  batSide?: { code?: string };
  pitchHand?: { code?: string };
  stats?: Array<{ splits?: Array<{ stat?: Record<string, unknown> }> }>;
}

interface RosterEntry {
  person?: RosterPerson;
  position?: { abbreviation?: string };
  status?: { code?: string; description?: string };
}

interface PlayerContext {
  gamePk: number;
  person: RosterPerson;
  position: string;
  team: ScheduleTeam;
  opponent: ScheduleTeam;
  pitcherName: string | null;
  venue: string;
  gameTime: string;
  lineupStatus: LineupStatus;
  side: TeamSide;
  stat: Record<string, unknown>;
}

const scheduleCache = new Map<string, Promise<ScheduleGame[]>>();
const rosterCache = new Map<string, Promise<RosterEntry[]>>();

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    if (value === '.---' || value === '-.--') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function seasonFromDate(date: string): string {
  return /^\d{4}/.test(date) ? date.slice(0, 4) : String(new Date().getFullYear());
}

function readSeasonStat(person: RosterPerson | undefined): Record<string, unknown> {
  return person?.stats?.[0]?.splits?.[0]?.stat ?? {};
}

function headshotUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB Stats API ${res.status}`);
  return (await res.json()) as T;
}

async function fetchSchedule(date: string): Promise<ScheduleGame[]> {
  const cached = scheduleCache.get(date);
  if (cached) return cached;

  const promise = fetchJson<any>(
    `${MLB_API_BASE}/schedule?sportId=1&date=${date}&hydrate=team,probablePitcher,venue`
  ).then((payload) => {
    const games = payload?.dates?.[0]?.games;
    if (!Array.isArray(games)) return [];

    return games.map((game: any): ScheduleGame => ({
      gamePk: Number(game.gamePk) || 0,
      gameDate: String(game.gameDate || ''),
      venue: String(game.venue?.name || 'Venue TBD'),
      status: String(game.status?.detailedState || game.status?.abstractGameState || 'Scheduled'),
      away: {
        id: Number(game.teams?.away?.team?.id) || 0,
        name: String(game.teams?.away?.team?.name || 'Away'),
        abbreviation: String(game.teams?.away?.team?.abbreviation || game.teams?.away?.team?.teamName || 'AWY'),
      },
      home: {
        id: Number(game.teams?.home?.team?.id) || 0,
        name: String(game.teams?.home?.team?.name || 'Home'),
        abbreviation: String(game.teams?.home?.team?.abbreviation || game.teams?.home?.team?.teamName || 'HME'),
      },
      awayPitcher: game.teams?.away?.probablePitcher?.fullName ?? null,
      homePitcher: game.teams?.home?.probablePitcher?.fullName ?? null,
    }));
  });

  scheduleCache.set(date, promise);
  return promise;
}

async function fetchRoster(teamId: number, group: 'hitting' | 'pitching', season: string, statScope: StatScope): Promise<RosterEntry[]> {
  const key = `${teamId}:${group}:${season}:${statScope}`;
  const cached = rosterCache.get(key);
  if (cached) return cached;

  const hydrate = statScope === 'overall'
    ? `person(stats(type=career,group=${group}))`
    : `person(stats(type=season,group=${group},season=${season}))`;
  const promise = fetchJson<any>(
    `${MLB_API_BASE}/teams/${teamId}/roster?rosterType=active&hydrate=${encodeURIComponent(hydrate)}`
  ).then((payload) => (Array.isArray(payload?.roster) ? payload.roster : []));

  rosterCache.set(key, promise);
  return promise;
}

function lineupStatusFor(entry: RosterEntry): LineupStatus {
  const code = String(entry.status?.code ?? '').toUpperCase();
  const description = String(entry.status?.description ?? '').toLowerCase();
  if (code.includes('IL') || description.includes('injured')) return 'out';
  return 'projected';
}

function roundedDrivers(drivers: WeightedFactor[]): WeightedFactor[] {
  return drivers.map((driver) => ({
    ...driver,
    value: driver.value == null ? null : Math.round(driver.value),
  }));
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function battingDrivers(statType: StatType, stat: Record<string, unknown>, lineupIndex: number, statScope: StatScope): WeightedFactor[] {
  const games = parseNumber(stat.gamesPlayed);
  const pa = parseNumber(stat.plateAppearances);
  const hits = parseNumber(stat.hits);
  const doubles = parseNumber(stat.doubles);
  const hr = parseNumber(stat.homeRuns);
  const rbi = parseNumber(stat.rbi);
  const runs = parseNumber(stat.runs);
  const sb = parseNumber(stat.stolenBases);
  const tb = parseNumber(stat.totalBases);
  const avg = parseNumber(stat.avg);
  const obp = parseNumber(stat.obp);
  const slg = parseNumber(stat.slg);
  const ops = parseNumber(stat.ops);
  const babip = parseNumber(stat.babip);
  const lineupScore = clamp(100 - lineupIndex * 6, 42, 100);
  const sampleScore = clamp(pa / 4.5, 10, 100);
  const rangeLabel = statScope === 'season' ? 'Season' : 'Career';

  switch (statType) {
    case 'hr':
      return [
        { id: 'hr_rate', label: 'HR / PA', icon: '💣', value: clamp(rate(hr, pa) / 0.075 * 100, 0, 100), weight: 30 },
        { id: 'slug', label: 'Slugging', icon: '🔋', value: clamp((slg - 0.300) / 0.340 * 100, 0, 100), weight: 28 },
        { id: 'total_hr', label: `${rangeLabel} HR`, icon: '📈', value: clamp(hr / 36 * 100, 0, 100), weight: 22 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 20 },
      ];
    case 'rbi':
      return [
        { id: 'rbi_game', label: 'RBI / G', icon: '🏠', value: clamp(rate(rbi, games) / 0.9 * 100, 0, 100), weight: 30 },
        { id: 'power', label: 'Power Context', icon: '🔋', value: clamp(ops / 0.950 * 100, 0, 100), weight: 24 },
        { id: 'lineup', label: 'Lineup Position', icon: '📋', value: lineupScore, weight: 24 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 22 },
      ];
    case 'runs':
      return [
        { id: 'run_game', label: 'Runs / G', icon: '🏃', value: clamp(rate(runs, games) / 0.9 * 100, 0, 100), weight: 30 },
        { id: 'obp', label: 'On-base', icon: '🎯', value: clamp((obp - 0.260) / 0.170 * 100, 0, 100), weight: 28 },
        { id: 'lineup', label: 'Lineup Position', icon: '📋', value: lineupScore, weight: 22 },
        { id: 'speed', label: 'Speed Help', icon: '⚡', value: clamp(sb / 30 * 100, 0, 100), weight: 20 },
      ];
    case 'sb':
      return [
        { id: 'sb_game', label: 'SB / G', icon: '⚡', value: clamp(rate(sb, games) / 0.45 * 100, 0, 100), weight: 38 },
        { id: 'total_sb', label: `${rangeLabel} SB`, icon: '🏃', value: clamp(sb / 35 * 100, 0, 100), weight: 30 },
        { id: 'obp', label: 'Times on Base', icon: '🎯', value: clamp((obp - 0.260) / 0.170 * 100, 0, 100), weight: 20 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 12 },
      ];
    case 'hits':
      return [
        { id: 'avg', label: 'Average', icon: '🎯', value: clamp((avg - 0.190) / 0.160 * 100, 0, 100), weight: 34 },
        { id: 'hits_game', label: 'Hits / G', icon: '📈', value: clamp(rate(hits, games) / 1.45 * 100, 0, 100), weight: 28 },
        { id: 'babip', label: 'BABIP', icon: '🧮', value: clamp((babip - 0.240) / 0.150 * 100, 0, 100), weight: 18 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 20 },
      ];
    case 'total_bases':
      return [
        { id: 'tb_game', label: 'TB / G', icon: '🔋', value: clamp(rate(tb, games) / 2.6 * 100, 0, 100), weight: 34 },
        { id: 'slug', label: 'Slugging', icon: '💪', value: clamp((slg - 0.300) / 0.340 * 100, 0, 100), weight: 30 },
        { id: 'xbh', label: 'Extra-base Hits', icon: '📈', value: clamp((doubles + hr) / 55 * 100, 0, 100), weight: 20 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 16 },
      ];
    case 'doubles':
      return [
        { id: 'double_game', label: '2B / G', icon: '✌️', value: clamp(rate(doubles, games) / 0.38 * 100, 0, 100), weight: 36 },
        { id: 'season_2b', label: `${rangeLabel} 2B`, icon: '📈', value: clamp(doubles / 32 * 100, 0, 100), weight: 28 },
        { id: 'gap', label: 'Gap Power', icon: '🔋', value: clamp((slg - 0.300) / 0.280 * 100, 0, 100), weight: 20 },
        { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 16 },
      ];
    default:
      return [];
  }
}

function pitchingDrivers(stat: Record<string, unknown>): WeightedFactor[] {
  const starts = parseNumber(stat.gamesStarted);
  const games = parseNumber(stat.gamesPlayed || stat.gamesPitched);
  const strikeouts = parseNumber(stat.strikeOuts);
  const inningsRaw = parseNumber(stat.inningsPitched);
  const innings = inningsRaw > 0 ? inningsRaw : parseNumber(stat.outs) / 3;
  const kPer9 = parseNumber(stat.strikeoutsPer9Inn) || (innings > 0 ? (strikeouts / innings) * 9 : 0);
  const kPerStart = starts > 0 ? strikeouts / starts : games > 0 ? strikeouts / games : 0;
  const sampleScore = clamp((starts || games) / 18 * 100, 10, 100);

  return [
    { id: 'k_per_9', label: 'K / 9', icon: '🔥', value: clamp(kPer9 / 13.5 * 100, 0, 100), weight: 38 },
    { id: 'k_volume', label: 'Strikeout Volume', icon: '📈', value: clamp(strikeouts / 145 * 100, 0, 100), weight: 28 },
    { id: 'k_start', label: 'K / Start', icon: '⚾', value: clamp(kPerStart / 8 * 100, 0, 100), weight: 22 },
    { id: 'sample', label: 'Sample Size', icon: '🧾', value: sampleScore, weight: 12 },
  ];
}

function seasonValueFor(statType: StatType, stat: Record<string, unknown>): number {
  switch (statType) {
    case 'hr': return parseNumber(stat.homeRuns);
    case 'rbi': return parseNumber(stat.rbi);
    case 'runs': return parseNumber(stat.runs);
    case 'sb': return parseNumber(stat.stolenBases);
    case 'hits': return parseNumber(stat.hits);
    case 'total_bases': return parseNumber(stat.totalBases);
    case 'doubles': return parseNumber(stat.doubles);
    case 'pitcher_k': return parseNumber(stat.strikeOuts);
  }
}

function defaultBookLine(statType: StatType, score: number): number {
  switch (statType) {
    case 'hr': return 0.5;
    case 'rbi': return 0.5;
    case 'runs': return 0.5;
    case 'sb': return 0.5;
    case 'hits': return 0.5;
    case 'total_bases': return score >= 72 ? 1.5 : 0.5;
    case 'doubles': return 0.5;
    case 'pitcher_k': return score >= 78 ? 5.5 : score >= 62 ? 4.5 : 3.5;
  }
}

function modelProbability(statType: StatType, score: number): number {
  const base = statType === 'hr' || statType === 'sb' || statType === 'doubles' ? 0.12 : 0.36;
  return generatePrediction({ baseline: base, adjustment: score / 180, min: 0.05, max: 0.86 });
}

function makeRow(statType: StatType, context: PlayerContext, lineupIndex: number, statScope: StatScope, season: string): StatPlayerRow | null {
  const position = context.position;
  const isPitcher = position === 'P';
  if (statType === 'pitcher_k' && !isPitcher) return null;
  if (statType !== 'pitcher_k' && isPitcher) return null;

  const drivers = roundedDrivers(statType === 'pitcher_k'
    ? pitchingDrivers(context.stat)
    : battingDrivers(statType, context.stat, lineupIndex, statScope));
  const rawScore = calculateWeightedScore(drivers);
  const config = STAT_CONFIG[statType];
  const statScore = clamp(rawScore, 0, 100);
  const confidence = calculateConfidence(parseNumber(context.stat.gamesPlayed || context.stat.gamesPitched));
  const seasonValue = seasonValueFor(statType, context.stat);
  const probability = modelProbability(statType, statScore);
  const impliedProbability = Math.round(clamp(probability - 0.035, 0.04, 0.82) * 1000) / 1000;
  const edgePct = Math.round((probability - impliedProbability) * 1000) / 10;
  const intelligence: SportsIntelligenceResult = {
    playerId: String(context.person.id),
    score: statScore,
    rank: null,
    confidence,
    prediction: probability,
    metadata: {
      statType,
      seasonValue,
    },
  };


  return {
    stableId: `${statScope}:${season}:${statType}:${context.gamePk}:${context.person.id}:${context.team.id}`,
    playerName: context.person.fullName,
    playerId: context.person.id,
    team: context.team.abbreviation,
    opponent: context.opponent.abbreviation,
    pitcherName: statType === 'pitcher_k' ? null : context.pitcherName,
    venue: context.venue,
    gameTime: context.gameTime,
    headshotUrl: headshotUrl(context.person.id),
    lineupSpot: statType === 'pitcher_k' ? null : lineupIndex + 1,
    lineupStatus: context.lineupStatus,
    statScore,
    intelligence,
    tier: assignTier(statScore, config.thresholds),
    confidence,
    drivers,
    isHeuristic: true,
    seasonValue,
    bookLine: defaultBookLine(statType, statScore),
    bookOdds: null,
    modelProbability: probability,
    impliedProbability,
    edgePct,
    dfsProjection: Math.round((statScore / 10) * 10) / 10,
    dfsFloor: Math.round((statScore / 15) * 10) / 10,
    dfsCeiling: Math.round((statScore / 6) * 10) / 10,
    reasons: [
      `MLB Stats API ${statScope === 'season' ? `${season} season` : 'overall career'} ${config.shortLabel}: ${seasonValue}`,
      `${context.team.abbreviation} vs ${context.opponent.abbreviation} at ${context.venue}`,
      statType === 'pitcher_k'
        ? `Pitching ${statScope === 'season' ? 'season' : 'career'} stats hydrated from active roster.`
        : `Hitting ${statScope === 'season' ? 'season' : 'career'} stats hydrated from active roster.`,
    ],
    warnings: context.lineupStatus === 'projected'
      ? ['Official lineup not posted yet. Stat Hub rows are roster-based MLB API projections.']
      : undefined,
    sourceMode: context.lineupStatus === 'confirmed' ? 'confirmed' : 'projected',
  };
}

function compareByStat(statType: StatType, a: PlayerContext, b: PlayerContext): number {
  return seasonValueFor(statType, b.stat) - seasonValueFor(statType, a.stat);
}

export async function fetchMlbStatHubRows(statType: StatType, date: string, statScope: StatScope = 'season'): Promise<StatPlayerRow[]> {
  const season = seasonFromDate(date);
  const games = await fetchSchedule(date);
  if (games.length === 0) return [];

  const contexts: PlayerContext[] = [];

  await Promise.all(games.map(async (game) => {
    const sides: Array<{ side: TeamSide; team: ScheduleTeam; opponent: ScheduleTeam; pitcherName: string | null }> = [
      { side: 'away', team: game.away, opponent: game.home, pitcherName: game.homePitcher },
      { side: 'home', team: game.home, opponent: game.away, pitcherName: game.awayPitcher },
    ];

    await Promise.all(sides.map(async ({ side, team, opponent, pitcherName }) => {
      const group = statType === 'pitcher_k' ? 'pitching' : 'hitting';
      const roster = await fetchRoster(team.id, group, season, statScope);
      const playerContexts = roster
        .map((entry): PlayerContext | null => {
          if (!entry.person?.id || !entry.person.fullName) return null;
          const position = entry.position?.abbreviation || entry.person.primaryPosition?.abbreviation || '';
          const stat = readSeasonStat(entry.person);
          if (Object.keys(stat).length === 0) return null;

          return {
            gamePk: game.gamePk,
            person: entry.person,
            position,
            team,
            opponent,
            pitcherName,
            venue: game.venue,
            gameTime: game.gameDate,
            lineupStatus: lineupStatusFor(entry),
            side,
            stat,
          };
        })
        .filter((context): context is PlayerContext => context != null)
        .sort((a, b) => compareByStat(statType, a, b))
        .slice(0, statType === 'pitcher_k' ? 9 : 12);

      contexts.push(...playerContexts);
    }));
  }));

  const rows = contexts
    .map((context, index) => makeRow(statType, context, index % 12, statScope, season))
    .filter((row): row is StatPlayerRow => row != null)
    

  const bySeason = [...rows].sort((a, b) => (b.seasonValue ?? 0) - (a.seasonValue ?? 0));
  const rank = new Map(bySeason.map((row, index) => [row.stableId, index + 1]));

  return rankByScore(rows.map((row) => ({
    ...row,
    seasonRank: rank.get(row.stableId) ?? null,
    intelligence: {
      ...row.intelligence,
      rank: rank.get(row.stableId) ?? 0,
    },
  })));
}
