import type { VaiPersona } from './vaiPersonas';
import {
  buildSmartAiMarket,
  decimalToAmericanOdds,
  type RealCandidate,
} from '../../components/smart-ai/smartAiEngine.logic';
import {
  buildJudgePickReason,
  rankCandidatesForJudge,
  type JudgeAgentId,
} from './judgeClientScoring';

export interface VaiHrLeg {
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  gamePk: string;
  marketName: string;
  customSpec: string;
  odds: number | null;
  score: number;
  estimatedHrProbability: number | null;
  reason: string;
}

export interface VaiHrSinglePick extends VaiHrLeg {
  id: string;
}

export interface VaiHrParlayPick {
  id: string;
  legCount: 2 | 3 | 4;
  label: string;
  legs: VaiHrLeg[];
  combinedOdds: string;
  oddsValue: number | null;
  confidence: number;
}

export interface VaiPersonaPickBundle {
  personaId: VaiPersona['id'];
  judgeId: JudgeAgentId;
  date: string;
  singles: VaiHrSinglePick[];
  doubles: VaiHrParlayPick[];
  triples: VaiHrParlayPick[];
  lottery: VaiHrParlayPick | null;
  warnings: string[];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toLeg(candidate: RealCandidate, judgeId: JudgeAgentId): VaiHrLeg {
  const market = buildSmartAiMarket(candidate, 'HR', 1);
  return {
    playerId: candidate.playerId,
    playerName: candidate.playerName,
    team: candidate.team,
    opponent: candidate.opponent,
    gamePk: candidate.gamePk,
    marketName: market.marketName,
    customSpec: market.customSpec,
    odds: market.odds,
    score: candidate.score,
    estimatedHrProbability: candidate.estimatedHrProbability ?? null,
    reason: buildJudgePickReason(judgeId, candidate),
  };
}

/** Pick hitters from ranked pool, one per game when possible. */
function pickLegsFromPool(pool: RealCandidate[], startOffset: number, count: number): RealCandidate[] {
  const picked: RealCandidate[] = [];
  const usedGames = new Set<string>();
  let idx = startOffset;

  for (let attempts = 0; picked.length < count && attempts < pool.length * 3; attempts += 1) {
    const candidate = pool[idx % pool.length];
    idx += 1;
    if (!candidate) break;
    if (usedGames.has(candidate.gamePk)) continue;
    usedGames.add(candidate.gamePk);
    picked.push(candidate);
  }

  return picked;
}

function buildParlay(
  pool: RealCandidate[],
  startOffset: number,
  legCount: 2 | 3 | 4,
  label: string,
  personaId: VaiPersona['id'],
  judgeId: JudgeAgentId,
  index: number,
  date: string,
): VaiHrParlayPick | null {
  const selected = pickLegsFromPool(pool, startOffset, legCount);
  if (selected.length < legCount) return null;

  const legs = selected.map((c) => toLeg(c, judgeId));
  const allPriced = legs.every((l) => typeof l.odds === 'number');
  const oddsValue = allPriced
    ? Math.round(legs.reduce((acc, l) => acc * (l.odds as number), 1) * 100) / 100
    : null;
  const confidence = Math.round(
    legs.reduce((sum, l) => sum + Math.min(92, Math.max(40, l.score)), 0) / legs.length,
  );

  return {
    id: `vai-${personaId}-${date}-${legCount}leg-${index}`,
    legCount,
    label,
    legs,
    combinedOdds: oddsValue != null ? decimalToAmericanOdds(oddsValue) : 'Odds TBD',
    oddsValue,
    confidence,
  };
}

export function buildVaiPersonaPickBundle(
  candidates: RealCandidate[],
  persona: VaiPersona,
  date = todayISO(),
): VaiPersonaPickBundle {
  const warnings: string[] = [];
  const ranked = rankCandidatesForJudge(persona.judgeId, candidates, 12);

  if (ranked.length === 0) {
    warnings.push('No validated HR candidates available for this commander yet.');
    return {
      personaId: persona.id,
      judgeId: persona.judgeId,
      date,
      singles: [],
      doubles: [],
      triples: [],
      lottery: null,
      warnings,
    };
  }

  const projectedOnly = ranked.every(
    (c) => String(c.lineupStatus ?? '').toLowerCase() !== 'confirmed',
  );
  if (projectedOnly) {
    warnings.push('Official lineups not posted yet — picks use preview candidates only.');
  }

  const singles: VaiHrSinglePick[] = ranked.slice(0, 5).map((c, i) => {
    const leg = toLeg(c, persona.judgeId);
    return { ...leg, id: `vai-${persona.id}-${date}-hr-${i}` };
  });

  const doubles = [0, 1, 2, 3]
    .map((offset, i) => buildParlay(ranked, offset, 2, `Double ${i + 1}`, persona.id, persona.judgeId, i, date))
    .filter((p): p is VaiHrParlayPick => p != null);

  const triples = [0, 2]
    .map((offset, i) => buildParlay(ranked, offset, 3, `Triple ${i + 1}`, persona.id, persona.judgeId, i, date))
    .filter((p): p is VaiHrParlayPick => p != null);

  const lottery = buildParlay(ranked, 4, 4, 'Lottery 4', persona.id, persona.judgeId, 0, date);

  if (ranked.length < 5) warnings.push(`Only ${ranked.length} candidates — fewer than 5 HR picks available.`);
  if (doubles.length < 4) warnings.push('Not enough unique-game candidates for 4 doubles.');
  if (triples.length < 2) warnings.push('Not enough unique-game candidates for 2 triples.');
  if (!lottery) warnings.push('Not enough unique-game candidates for the lottery 4-leg parlay.');

  return {
    personaId: persona.id,
    judgeId: persona.judgeId,
    date,
    singles,
    doubles,
    triples,
    lottery,
    warnings,
  };
}

export type VaiPickOutcome = 'WON' | 'LOST' | 'PENDING';

export function gradeHrLeg(playerId: string, hrHitIds: Set<number>, isToday: boolean): VaiPickOutcome {
  const id = Number(playerId);
  if (!Number.isFinite(id)) return 'PENDING';
  if (hrHitIds.has(id)) return 'WON';
  return isToday ? 'PENDING' : 'LOST';
}

export function gradeHrParlay(legs: VaiHrLeg[], hrHitIds: Set<number>, isToday: boolean): VaiPickOutcome {
  if (legs.length === 0) return 'PENDING';
  const outcomes = legs.map((l) => gradeHrLeg(l.playerId, hrHitIds, isToday));
  if (outcomes.every((o) => o === 'WON')) return 'WON';
  if (outcomes.some((o) => o === 'LOST')) return 'LOST';
  return 'PENDING';
}

export function gradePickBundleDay(
  bundle: VaiPersonaPickBundle,
  hrHitIds: Set<number>,
  isToday: boolean,
): { wins: number; losses: number; pending: number; total: number; winRate: number | null } {
  let wins = 0;
  let losses = 0;
  let pending = 0;

  for (const single of bundle.singles) {
    const o = gradeHrLeg(single.playerId, hrHitIds, isToday);
    if (o === 'WON') wins += 1;
    else if (o === 'LOST') losses += 1;
    else pending += 1;
  }

  for (const parlay of [...bundle.doubles, ...bundle.triples, ...(bundle.lottery ? [bundle.lottery] : [])]) {
    const o = gradeHrParlay(parlay.legs, hrHitIds, isToday);
    if (o === 'WON') wins += 1;
    else if (o === 'LOST') losses += 1;
    else pending += 1;
  }

  const settled = wins + losses;
  return {
    wins,
    losses,
    pending,
    total: bundle.singles.length + bundle.doubles.length + bundle.triples.length + (bundle.lottery ? 1 : 0),
    winRate: settled > 0 ? Math.round((wins / settled) * 1000) / 10 : null,
  };
}
