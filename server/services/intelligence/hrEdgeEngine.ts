/**
 * HR Edge Engine — deterministic per-hitter scoring for the Daily HR Board.
 * Real inputs: hitter, opposing probable pitcher, venue, game status.
 * Placeholders (seeded, stable): batter power, handedness edge, park, weather,
 * lineup spot, line movement — clearly marked until real feeds are wired.
 */
import { NormalizedGame, NormalizedPitcher, NormalizedPlayer, DataQuality } from "../mlb/mlbTypes";
import { buildPitcherVulnerability } from "./pitcherVulnerabilityEngine";
import { clamp, seed01, seededInt } from "./scoring";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";
export type FormTag = "Hot" | "Average" | "Cold" | "Slump";
export type RiskLabel = "Strong" | "Playable" | "Sneaky" | "Lotto" | "Avoid";
export type ProjectionType = "Projected" | "Confirmed" | "Live";

export interface HrRowJudge {
  approvalStatus: "Approved" | "Playable but risky" | "Needs more data" | "Avoid";
  riskLabel: RiskLabel;
  judgeNote: string;
  whatCouldGoWrong: string[];
  parlayAllowed: boolean;
}

export interface HrBoardRow {
  playerId: number;
  playerName: string;
  team: string;
  teamId: number;
  headshot: string;
  grade: Grade;
  hrEdge: number; // 1-100 edge index, displayed as %
  estimatedHrProb: number; // 0-1
  impliedOdds: string; // American
  bestOdds: string;
  vouchScore: number;
  formTag: FormTag;
  opposingPitcher: string;
  opposingPitcherTeam: string;
  pitcherVulnerability: number;
  parkFactor: number;
  hrMultiplier: number;
  dataConfidence: number;
  weatherBoost: number;
  gameStatus: string;
  projectionType: ProjectionType;
  lineupSpot: number;
  lineMovement: number; // %
  source: string;
  riskLabel: RiskLabel;
  reasons: string[];
  judge: HrRowJudge;
  dataQuality: DataQuality;
}

// ---- Helper calculators -----------------------------------------------------

export function calculatePitcherVulnerability(pitcher: NormalizedPitcher, opponent: string, venue: string): number {
  return buildPitcherVulnerability(pitcher, opponent, venue).vulnerabilityScore;
}

export function calculateFormTag(playerId: number): FormTag {
  const r = seed01(`form:${playerId}`);
  if (r > 0.74) return "Hot";
  if (r > 0.4) return "Average";
  if (r > 0.2) return "Cold";
  return "Slump";
}

/** Park HR factor, 100 = neutral (placeholder until a park-factor source is wired). */
export function calculateParkBoost(venue: string): number {
  return seededInt(`park:${venue}`, 88, 116);
}

/** Weather/wind HR boost as a percent (placeholder until a weather API is wired). */
export function calculateWeatherBoost(gamePk: number): number {
  return seededInt(`wx:${gamePk}`, -8, 16);
}

export function calculateDataConfidence(hasPitcher: boolean, lineupConfirmed: boolean, hasWeather: boolean): number {
  let c = 48;
  if (hasPitcher) c += 14;
  c += lineupConfirmed ? 20 : 6; // projected lineup caps confidence
  c += hasWeather ? 10 : 2; // weather is a placeholder today
  return clamp(c, 20, 95);
}

export function calculateGrade(hrEdge: number): Grade {
  if (hrEdge >= 85) return "A+";
  if (hrEdge >= 75) return "A";
  if (hrEdge >= 62) return "B";
  if (hrEdge >= 48) return "C";
  if (hrEdge >= 35) return "D";
  return "F";
}

export function riskFromGrade(grade: Grade): RiskLabel {
  switch (grade) {
    case "A+":
    case "A":
      return "Strong";
    case "B":
      return "Playable";
    case "C":
      return "Sneaky";
    case "D":
      return "Lotto";
    default:
      return "Avoid";
  }
}

/** American implied odds from a probability. */
export function calculateImpliedOdds(prob: number): string {
  const p = clamp(prob, 0.02, 0.92);
  if (p >= 0.5) return `-${Math.round((p / (1 - p)) * 100)}`;
  return `+${Math.round(((1 - p) / p) * 100)}`;
}

export function calculateLineMovementPlaceholder(playerId: number, gamePk: number): number {
  return seededInt(`line:${playerId}:${gamePk}`, -8, 8);
}

function formAdj(tag: FormTag): number {
  return tag === "Hot" ? 12 : tag === "Average" ? 3 : tag === "Cold" ? -5 : -11;
}

/** Core HR Edge composite (1-100). */
export function calculateHrEdge(args: {
  playerId: number;
  pitcherId: number;
  vulnerability: number;
  formTag: FormTag;
  parkFactor: number;
  weatherBoost: number;
  lineupSpot: number;
}): number {
  const power = seededInt(`power:${args.playerId}`, 30, 90); // batter power placeholder
  const hand = seededInt(`hand:${args.playerId}:${args.pitcherId}`, -6, 10); // handedness placeholder
  const parkC = ((args.parkFactor - 88) / 28) * 100; // normalize park to 0-100
  const weatherC = ((args.weatherBoost + 8) / 24) * 100; // normalize weather to 0-100
  const lineupBonus = args.lineupSpot <= 5 ? 5 : args.lineupSpot <= 7 ? 1 : -3;

  let edge =
    0.3 * args.vulnerability +
    0.28 * power +
    0.16 * parkC +
    0.12 * weatherC +
    formAdj(args.formTag) +
    hand +
    lineupBonus;

  return clamp(Math.round(edge), 1, 100);
}

// ---- Row builder + judge ----------------------------------------------------

export function buildHitterRow(
  hitter: NormalizedPlayer,
  pitcher: NormalizedPitcher,
  game: NormalizedGame,
  lineupSpot: number,
  projectionType: ProjectionType
): HrBoardRow {
  const vulnerability = calculatePitcherVulnerability(pitcher, hitter.team, game.venue);
  const formTag = calculateFormTag(hitter.playerId);
  const parkFactor = calculateParkBoost(game.venue);
  const weatherBoost = calculateWeatherBoost(game.gamePk);
  const hrEdge = calculateHrEdge({
    playerId: hitter.playerId,
    pitcherId: pitcher.pitcherId,
    vulnerability,
    formTag,
    parkFactor,
    weatherBoost,
    lineupSpot,
  });
  const grade = calculateGrade(hrEdge);
  const riskLabel = riskFromGrade(grade);
  const estimatedHrProb = clamp(0.03 + (hrEdge / 100) * 0.17, 0.02, 0.3);
  const impliedOdds = calculateImpliedOdds(estimatedHrProb);
  const dataConfidence = calculateDataConfidence(true, projectionType === "Confirmed", false);
  const vouchScore = clamp(Math.round(0.6 * hrEdge + 0.4 * dataConfidence), 1, 100);

  const reasons: string[] = [
    `Faces ${pitcher.pitcherName} — vulnerability ${vulnerability}/100`,
    `Park factor ${parkFactor} (100 = neutral), weather ${weatherBoost > 0 ? "+" : ""}${weatherBoost}%`,
    `${formTag} form, projected lineup spot ${lineupSpot}`,
  ];

  const row: HrBoardRow = {
    playerId: hitter.playerId,
    playerName: hitter.playerName,
    team: hitter.team,
    teamId: hitter.teamId,
    headshot: hitter.headshot,
    grade,
    hrEdge,
    estimatedHrProb,
    impliedOdds,
    bestOdds: impliedOdds, // best-line placeholder until odds API
    vouchScore,
    formTag,
    opposingPitcher: pitcher.pitcherName,
    opposingPitcherTeam: pitcher.team,
    pitcherVulnerability: vulnerability,
    parkFactor,
    hrMultiplier: Math.round((parkFactor / 100) * 100) / 100,
    dataConfidence,
    weatherBoost,
    gameStatus: game.status,
    projectionType,
    lineupSpot,
    lineMovement: calculateLineMovementPlaceholder(hitter.playerId, game.gamePk),
    source: "Consensus (placeholder)",
    riskLabel,
    reasons,
    judge: { approvalStatus: "Needs more data", riskLabel, judgeNote: "", whatCouldGoWrong: [], parlayAllowed: false },
    dataQuality: "partial",
  };
  row.judge = judgeHrRow(row);
  return row;
}

/** Lightweight 5-check judge: pick logic, risk, data quality, weather/park, market value. */
export function judgeHrRow(row: HrBoardRow): HrRowJudge {
  const whatCouldGoWrong: string[] = [];

  // Pick logic
  const pickLogic = row.hrEdge >= 70 && row.pitcherVulnerability >= 60;
  // Risk
  if (row.formTag === "Slump") whatCouldGoWrong.push("Hitter is in a slump — recent form is cold.");
  if (row.lineupSpot >= 7) whatCouldGoWrong.push(`Projected low in the order (spot ${row.lineupSpot}) — fewer plate appearances.`);
  // Data quality
  if (row.projectionType !== "Confirmed") whatCouldGoWrong.push("Lineup is projected, not confirmed — could be a late scratch or sit.");
  if (row.dataConfidence < 60) whatCouldGoWrong.push("Limited data confidence — weather/park are placeholders.");
  // Weather/park
  if (row.parkFactor < 96) whatCouldGoWrong.push("Park leans pitcher-friendly for HR.");
  // Market value
  if (row.lineMovement < -3) whatCouldGoWrong.push("Line drifting against this spot.");

  if (whatCouldGoWrong.length === 0) whatCouldGoWrong.push("Standard HR variance — single-game power is inherently noisy.");

  let approvalStatus: HrRowJudge["approvalStatus"];
  if (row.dataConfidence < 55 && row.hrEdge < 60) approvalStatus = "Needs more data";
  else if (row.grade === "A+" || row.grade === "A") approvalStatus = pickLogic ? "Approved" : "Playable but risky";
  else if (row.grade === "B" || row.grade === "C") approvalStatus = "Playable but risky";
  else approvalStatus = "Avoid";

  const judgeNote =
    approvalStatus === "Approved"
      ? `Strong HR spot: vulnerable arm (${row.pitcherVulnerability}) + favorable context. Still probability-based, not a lock.`
      : approvalStatus === "Avoid"
      ? "Weak modeled HR equity — better spots exist on the board."
      : "Playable but high-variance — treat as a research lean, not a guarantee.";

  const parlayAllowed = (row.grade === "A+" || row.grade === "A" || row.grade === "B") && row.dataConfidence >= 58;

  return { approvalStatus, riskLabel: row.riskLabel, judgeNote, whatCouldGoWrong: whatCouldGoWrong.slice(0, 4), parlayAllowed };
}
