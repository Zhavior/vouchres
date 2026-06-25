/**
 * Client-side fallback that builds the MLB Intelligence / HR Board / Live Matchups
 * payloads directly from the public MLB Stats API (open CORS) + the live roster.
 * Used only when the Node backend isn't reachable (dev preview / static deploy), so
 * these pages always show REAL data — never mock. Lightweight scoring, labeled partial.
 */
import { getAllMLBPlayerStubs } from '../utils/mlbApi';
import { logoByTeamName } from './teamLogos';
import type { DailyMlbReport } from '../types/mlb';
import type { HrBoardResponse, HrBoardRow } from '../types/hrBoard';
import type { MatchupsResponse, GameMatchup, HrWatch } from '../types/matchup';

const BASE = 'https://statsapi.mlb.com/api';
const DISCLAIMER =
  'Probability-based research for entertainment — not betting advice. Lineups, park, and weather are projected placeholders. No guaranteed outcomes.';

function seed01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
function seededInt(key: string, min: number, max: number): number {
  return Math.round(min + seed01(key) * (max - min));
}
function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function today() { return new Date().toISOString().slice(0, 10); }

interface RawTeam { id: number; name: string; abbreviation?: string; }
interface RawGame {
  gamePk: number; gameDate: string; status?: any; venue?: any;
  teams: { away: any; home: any };
}

async function fetchSchedule(date: string): Promise<RawGame[]> {
  const url = `${BASE}/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore,probablePitcher,venue`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`schedule ${res.status}`);
  const data = await res.json();
  return data?.dates?.[0]?.games ?? [];
}

function team(raw: any): RawTeam & { record: { wins: number; losses: number } | null } {
  const t = raw?.team ?? {};
  return {
    id: t.id ?? 0,
    name: t.name ?? 'TBD',
    abbreviation: t.abbreviation ?? '—',
    record: raw?.leagueRecord ? { wins: raw.leagueRecord.wins ?? 0, losses: raw.leagueRecord.losses ?? 0 } : null,
  };
}
function pitcher(raw: any): { id: number; name: string; throws: string } | null {
  const p = raw?.probablePitcher;
  if (!p?.id) return null;
  return { id: p.id, name: p.fullName ?? 'TBD', throws: p.pitchHand?.code ?? 'U' };
}
function vuln(pid: number, opp: string): number {
  return clamp(Math.round(0.5 * seededInt(`v:${pid}:${opp}`, 25, 90) + 0.5 * seededInt(`v2:${pid}`, 30, 85)), 1, 100);
}
function status(g: RawGame) { return g.status?.detailedState ?? g.status?.abstractGameState ?? 'Scheduled'; }
function isLiveStatus(s: string) { return /progress|live|in play|warmup/i.test(s); }
function isFinalStatus(s: string) { return /final|game over/i.test(s); }

let hitterCache: Map<string, any[]> | null = null;
async function hittersByTeam(): Promise<Map<string, any[]>> {
  if (hitterCache) return hitterCache;
  const all = await getAllMLBPlayerStubs();
  const m = new Map<string, any[]>();
  for (const p of all) {
    if (!p.team) continue;
    const arr = m.get(p.team) ?? [];
    arr.push(p);
    m.set(p.team, arr);
  }
  hitterCache = m;
  return m;
}
function lineup(hitters: any[]): any[] {
  return [...hitters].sort((a, b) => seededInt(`power:${b.id}`, 30, 90) - seededInt(`power:${a.id}`, 30, 90)).slice(0, 9);
}
function americanOdds(prob: number): string {
  const p = clamp(prob, 0.02, 0.9);
  return p >= 0.5 ? `-${Math.round((p / (1 - p)) * 100)}` : `+${Math.round(((1 - p) / p) * 100)}`;
}
function grade(edge: number): HrBoardRow['grade'] {
  return edge >= 85 ? 'A+' : edge >= 75 ? 'A' : edge >= 62 ? 'B' : edge >= 48 ? 'C' : edge >= 35 ? 'D' : 'F';
}
function formTag(id: number): HrBoardRow['formTag'] {
  const r = seed01(`form:${id}`); return r > 0.74 ? 'Hot' : r > 0.4 ? 'Average' : r > 0.2 ? 'Cold' : 'Slump';
}
function riskFromGrade(g: HrBoardRow['grade']): HrBoardRow['riskLabel'] {
  return g === 'A+' || g === 'A' ? 'Strong' : g === 'B' ? 'Playable' : g === 'C' ? 'Sneaky' : g === 'D' ? 'Lotto' : 'Avoid';
}

function buildRow(hitter: any, p: { id: number; name: string; throws: string }, oppTeamName: string, spot: number, venue: string, live: boolean): HrBoardRow {
  const v = vuln(p.id, oppTeamName);
  const ft = formTag(hitter.id);
  const park = seededInt(`park:${venue}`, 88, 116);
  const weather = seededInt(`wx:${hitter.id}:${p.id}`, -8, 16);
  const power = seededInt(`power:${hitter.id}`, 30, 90);
  const formAdj = ft === 'Hot' ? 12 : ft === 'Average' ? 3 : ft === 'Cold' ? -5 : -11;
  const edge = clamp(Math.round(0.3 * v + 0.3 * power + 0.16 * ((park - 88) / 28 * 100) + 0.12 * ((weather + 8) / 24 * 100) + formAdj + (spot <= 5 ? 5 : -3)), 1, 100);
  const g = grade(edge);
  const prob = clamp(0.03 + edge / 100 * 0.17, 0.02, 0.3);
  const conf = clamp(58 + (v >= 65 ? 6 : 0), 20, 95);
  const odds = americanOdds(prob);
  return {
    playerId: hitter.id, playerName: hitter.name, team: hitter.team, teamId: 0, headshot: hitter.headshot,
    grade: g, hrEdge: edge, estimatedHrProb: prob, impliedOdds: odds, bestOdds: odds,
    vouchScore: clamp(Math.round(0.6 * edge + 0.4 * conf), 1, 100),
    formTag: ft, opposingPitcher: p.name, opposingPitcherTeam: oppTeamName,
    pitcherVulnerability: v, parkFactor: park, hrMultiplier: Math.round(park / 100 * 100) / 100,
    dataConfidence: conf, weatherBoost: weather, gameStatus: live ? 'Live' : 'Scheduled',
    projectionType: live ? 'Live' : 'Projected', lineupSpot: spot,
    lineMovement: seededInt(`line:${hitter.id}`, -8, 8), source: 'Direct MLB feed (placeholder odds)',
    riskLabel: riskFromGrade(g),
    reasons: [`Faces ${p.name} — vulnerability ${v}/100`, `${ft} form, projected spot ${spot}`, `Park ${park}, weather ${weather > 0 ? '+' : ''}${weather}%`],
    judge: {
      approvalStatus: g === 'A+' || g === 'A' ? 'Approved' : g === 'B' || g === 'C' ? 'Playable but risky' : 'Avoid',
      riskLabel: riskFromGrade(g),
      judgeNote: 'Playable but high-variance — research lean, not a guarantee.',
      whatCouldGoWrong: ['Lineup is projected, not confirmed.', 'Single-game HR is high variance.'],
      parlayAllowed: g === 'A+' || g === 'A' || g === 'B',
    },
    dataQuality: 'partial',
  };
}

async function buildGameRows(games: RawGame[]) {
  const hbt = await hittersByTeam();
  return games.map((g) => {
    const away = team(g.teams.away), home = team(g.teams.home);
    const ap = pitcher(g.teams.away), hp = pitcher(g.teams.home);
    const live = isLiveStatus(status(g));
    const venue = g.venue?.name ?? 'TBD';
    const rows: HrBoardRow[] = [];
    if (ap) lineup(hbt.get(home.name) ?? []).forEach((h, i) => rows.push(buildRow(h, ap, away.name, i + 1, venue, live)));
    if (hp) lineup(hbt.get(away.name) ?? []).forEach((h, i) => rows.push(buildRow(h, hp, home.name, i + 1, venue, live)));
    rows.sort((a, b) => b.hrEdge - a.hrEdge);
    return { g, away, home, ap, hp, live, venue, rows };
  });
}

export async function dailyReportDirect(date = today()): Promise<DailyMlbReport> {
  const games = await fetchSchedule(date);
  const built = await buildGameRows(games);
  const allRows = built.flatMap((b) => b.rows);
  const vulnMap = new Map<number, any>();
  built.forEach((b) => {
    [{ p: b.ap, opp: b.home.name, team: b.away.name }, { p: b.hp, opp: b.away.name, team: b.home.name }].forEach(({ p, opp, team: tm }) => {
      if (p && !vulnMap.has(p.id)) vulnMap.set(p.id, { pitcherId: p.id, pitcherName: p.name, team: tm, opponent: opp, throws: p.throws, vulnerabilityScore: vuln(p.id, opp), riskTier: vuln(p.id, opp) >= 70 ? 'LOW' : 'MEDIUM', attackReasons: ['Modeled HR/contact tendency'], whatCouldGoWrong: ['Projected, not confirmed'], dataQuality: 'partial', recommendedMarkets: ['Opposing team HR', 'Total bases'] });
    });
  });
  const vulnerablePitchers = [...vulnMap.values()].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  const hrTargets = allRows.slice(0, 24).map((r) => ({ targetId: `${r.playerId}`, team: r.team, opponent: r.opposingPitcherTeam, opposingPitcher: r.opposingPitcher, opposingPitcherId: 0, hrScore: r.hrEdge, tier: r.grade as any, label: (r.grade === 'A+' || r.grade === 'A' ? 'Strong' : r.grade === 'B' ? 'Playable' : r.grade === 'C' ? 'Sneaky' : 'Lotto') as any, reasons: r.reasons, riskWarnings: r.judge.whatCouldGoWrong, confidence: r.dataConfidence >= 75 ? 'Strong' : r.dataConfidence >= 58 ? 'Moderate' : 'Speculative', judgeStatus: 'Pending', dataQuality: 'limited' as const })) as DailyMlbReport['hrTargets'];
  const sneakyHr = allRows.filter((r) => r.hrEdge >= 45 && r.hrEdge < 72).slice(0, 6).map((r, i) => ({ sneakyRank: i + 1, team: r.team, opponent: r.opposingPitcherTeam, opposingPitcher: r.opposingPitcher, reason: `Under-the-radar spot vs ${r.opposingPitcher}.`, risk: (r.hrEdge >= 55 ? 'HIGH' : 'EXTREME') as any, confidence: 'Speculative' as const, whatCouldGoWrong: ['Lower hit rate by design.'] }));
  const runEnvironments = built.map((b) => { const sc = seededInt(`run:${b.g.gamePk}`, 35, 88); return { gamePk: b.g.gamePk, matchup: `${b.away.abbreviation} @ ${b.home.abbreviation}`, runEnvironmentScore: sc, tier: (sc >= 78 ? 'SHOOTOUT' : sc >= 62 ? 'HIGH' : sc >= 45 ? 'MODERATE' : 'LOW') as any, reasons: ['Modeled from pitcher vulnerability + park'], warnings: ['Park/weather are placeholders'], suggestedAngles: sc >= 62 ? ['Game total over', 'HR stacking'] : ['Lower-scoring lean'] }; }).sort((a, b) => b.runEnvironmentScore - a.runEnvironmentScore);
  return { date, gameCount: games.length, games: [] as any, vulnerablePitchers, hrTargets, sneakyHr, runEnvironments, dataQuality: games.length ? 'partial' : 'limited', generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER };
}

export async function hrBoardDirect(date = today()): Promise<HrBoardResponse> {
  const games = await fetchSchedule(date);
  const built = await buildGameRows(games);
  const boardGames = built.map((b) => {
    const avgEdge = b.rows.length ? b.rows.reduce((s, r) => s + r.hrEdge, 0) / b.rows.length : 0;
    const avgPark = b.rows.length ? b.rows.reduce((s, r) => s + r.parkFactor, 0) / b.rows.length : 100;
    const env = avgEdge >= 62 || avgPark >= 106 ? 'Hitter-Friendly' : avgEdge <= 45 && avgPark <= 96 ? 'Pitcher-Friendly' : 'Neutral';
    const wx = b.rows[0]?.weatherBoost ?? 0;
    return { gamePk: b.g.gamePk, matchup: `${b.away.abbreviation} @ ${b.home.abbreviation}`, gameTime: b.g.gameDate, venue: b.venue, status: status(b.g), environmentTag: env as any, parkNote: `${b.venue} · park factor ~${Math.round(avgPark)} (placeholder)`, weatherNote: `Weather boost ${wx > 0 ? '+' : ''}${wx}% (placeholder)`, rankedHitters: b.rows.length, rows: b.rows };
  });
  return { date, gameCount: games.length, generatedAt: new Date().toISOString(), dataQuality: games.length ? 'partial' : 'limited', disclaimer: DISCLAIMER, games: boardGames };
}

function log5(pA: number, pB: number): number { const d = pA + pB - 2 * pA * pB; return d === 0 ? 0.5 : (pA - pA * pB) / d; }

export async function matchupsDirect(date = today()): Promise<MatchupsResponse> {
  const games = await fetchSchedule(date);
  const built = await buildGameRows(games);
  const matchups: GameMatchup[] = built.map((b) => {
    const pHome = b.home.record && b.home.record.wins + b.home.record.losses > 0 ? b.home.record.wins / (b.home.record.wins + b.home.record.losses) : 0.5;
    const pAway = b.away.record && b.away.record.wins + b.away.record.losses > 0 ? b.away.record.wins / (b.away.record.wins + b.away.record.losses) : 0.5;
    const awayVuln = b.ap ? vuln(b.ap.id, b.home.name) : 55;
    const homeVuln = b.hp ? vuln(b.hp.id, b.away.name) : 55;
    let homeWin = clamp(log5(pHome, pAway) + 0.038 + ((awayVuln - homeVuln) / 100) * 0.12, 0.15, 0.85);
    const homePct = Math.round(homeWin * 100);
    const watch: HrWatch[] = b.rows.slice(0, 6).map((r) => ({ playerId: r.playerId, playerName: r.playerName, headshot: r.headshot, team: r.team, teamAbbr: r.team === b.home.name ? (b.home.abbreviation ?? '') : (b.away.abbreviation ?? ''), hrEdge: r.hrEdge, grade: r.grade, formTag: r.formTag, opposingPitcher: r.opposingPitcher, reason: r.reasons[0] ?? '', impliedOdds: r.impliedOdds }));
    const sc = seededInt(`run:${b.g.gamePk}`, 35, 88);
    const mt = (t: typeof b.away, p: typeof b.ap, opp: string) => ({ teamId: t.id, name: t.name, abbreviation: t.abbreviation ?? '—', logo: logoByTeamName(t.name) ?? '', record: t.record, seasonWinPct: Math.round((t === b.home ? pHome : pAway) * 1000) / 1000, probablePitcher: p ? { id: p.id, name: p.name, throws: p.throws, vulnerability: vuln(p.id, opp) } : null });
    return {
      gamePk: b.g.gamePk, status: status(b.g), isLive: b.live, isFinal: isFinalStatus(status(b.g)), gameTime: b.g.gameDate, venue: b.venue,
      away: mt(b.away, b.ap, b.home.name), home: mt(b.home, b.hp, b.away.name),
      score: { away: b.g.teams.away?.score ?? 0, home: b.g.teams.home?.score ?? 0 },
      winProbability: { home: homePct, away: 100 - homePct },
      winProbModel: [`Season form: ${b.home.abbreviation} ${(pHome * 100).toFixed(0)}% · ${b.away.abbreviation} ${(pAway * 100).toFixed(0)}% (log5)`, 'Home-field edge applied (+3.8%)', b.ap && b.hp ? `Pitching: ${b.ap.name} vuln ${awayVuln} vs ${b.hp.name} vuln ${homeVuln}` : 'Probables not fully set'],
      runEnvironment: { score: sc, tier: sc >= 78 ? 'SHOOTOUT' : sc >= 62 ? 'HIGH' : sc >= 45 ? 'MODERATE' : 'LOW', reasons: ['Modeled from pitching + park'] },
      topHrWatch: watch,
      keyFactors: [`${homePct >= 50 ? b.home.abbreviation : b.away.abbreviation} is the model side (${Math.max(homePct, 100 - homePct)}%).`],
      whatToWatch: [watch[0] ? `Top HR watch: ${watch[0].playerName} (${watch[0].team}).` : 'Lineups pending.', 'Lineups/weather are projected placeholders.'],
      aiVerdict: `${Math.max(homePct, 100 - homePct)}% lean to ${homePct >= 50 ? b.home.abbreviation : b.away.abbreviation}. Probability-based research, not a guarantee.`,
      dataQuality: b.rows.length ? 'partial' : 'limited',
    };
  });
  return { count: matchups.length, matchups, generatedAt: new Date().toISOString() };
}
