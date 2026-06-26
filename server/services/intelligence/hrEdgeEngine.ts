/**
 * HR Edge Engine — real stat-based scoring for the Daily HR Board.
 *
 * REAL inputs (sourced from MLB Stats API):
 *   - hitter season HR/PA, SLG, OPS
 *   - hitter recent form (last 7 game logs)
 *   - pitcher HR/9, ERA, BB/K (season)
 *   - lineup spot from boxscore battingOrder (when confirmed)
 *   - park factor from static sourced table (parkFactors.ts)
 *
 * UNAVAILABLE (explicitly labeled, not invented):
 *   - weather/wind boost → 0, source noted
 *   - sportsbook line movement → 0, source noted
 *   - bestOdds → same as implied (no odds feed)
 */
import { NormalizedGame, NormalizedPitcher, NormalizedPlayer, DataQuality } from "../mlb/mlbTypes";
import { buildPitcherVulnerability } from "./pitcherVulnerabilityEngine";
import { HitterStats, PitcherSeasonStats } from "../mlb/statsClient";
import { getParkFactor } from "../mlb/parkFactors";
import { clamp } from "./scoring";

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
  hrEdge: number;           // 1-100 composite edge index
  estimatedHrProb: number;  // 0-1, single-game HR probability estimate
  impliedOdds: string;      // American odds derived from estimatedHrProb (not sportsbook)
  bestOdds: string;         // same as impliedOdds — no odds feed connected
  vouchScore: number;
  formTag: FormTag;
  opposingPitcher: string;
  opposingPitcherTeam: string;
  pitcherVulnerability: number;
  parkFactor: number;
  hrMultiplier: number;
  dataConfidence: number;
  weatherBoost: number;     // always 0 — weather API not connected
  gameStatus: string;
  projectionType: ProjectionType;
  lineupSpot: number;
  lineMovement: number;     // always 0 — odds feed not connected
  source: string;
  riskLabel: RiskLabel;
  reasons: string[];
  judge: HrRowJudge;
  dataQuality: DataQuality;
  // diagnostic fields
  seasonHR: number | null;
  seasonPA: number | null;
  hrPerPA: number | null;
  recentHR7: number | null; // HRs in last 7 games
  pitcherHrPer9: number | null;
}

// ---- Form from recent game logs -------------------------------------------------

export function formTagFromGameLog(
  recentGames: HitterStats["recentGames"]
): { tag: FormTag; recentHR7: number } {
  if (recentGames.length === 0) return { tag: "Average", recentHR7: 0 };

  const totalHR = recentGames.reduce((s, g) => s + g.homeRuns, 0);
  const totalH  = recentGames.reduce((s, g) => s + g.hits, 0);
  const totalAB = recentGames.reduce((s, g) => s + g.atBats, 0);
  const avg7 = totalAB > 0 ? totalH / totalAB : 0;

  let tag: FormTag;
  if (totalHR >= 2 || (totalHR >= 1 && avg7 >= 0.300)) tag = "Hot";
  else if (totalHR >= 1 || avg7 >= 0.260)               tag = "Average";
  else if (avg7 >= 0.180)                               tag = "Cold";
  else                                                   tag = "Slump";

  return { tag, recentHR7: totalHR };
}

// ---- Hitter power score from season stats (0-100) --------------------------------

function hitterPowerScore(hrPerPA: number, slg: number): number {
  // League avg HR/PA ≈ 0.030; top ~0.070. Normalize 0-100.
  const hrScore = clamp((hrPerPA / 0.070) * 100, 0, 100);
  // SLG: league avg ~0.410; elite ~0.600+. Normalize 0-100.
  const slgScore = clamp(((slg - 0.300) / 0.350) * 100, 0, 100);
  return clamp(Math.round(0.65 * hrScore + 0.35 * slgScore), 0, 100);
}

// ---- Form adjustment (additive to edge) -----------------------------------------

function formAdj(tag: FormTag): number {
  return tag === "Hot" ? 10 : tag === "Average" ? 2 : tag === "Cold" ? -6 : -12;
}

// ---- Grade + risk ---------------------------------------------------------------

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
    case "A+": case "A": return "Strong";
    case "B":            return "Playable";
    case "C":            return "Sneaky";
    case "D":            return "Lotto";
    default:             return "Avoid";
  }
}

// ---- Implied odds ---------------------------------------------------------------

export function calculateImpliedOdds(prob: number): string {
  const p = clamp(prob, 0.02, 0.92);
  if (p >= 0.5) return `-${Math.round((p / (1 - p)) * 100)}`;
  return `+${Math.round(((1 - p) / p) * 100)}`;
}

// ---- Data confidence ------------------------------------------------------------

function dataConfidence(args: {
  hasSeasonStats: boolean;
  hasGameLog: boolean;
  hasPitcherStats: boolean;
  lineupConfirmed: boolean;
  parkFromTable: boolean;
}): number {
  let c = 30; // base
  if (args.hasSeasonStats)   c += 20;
  if (args.hasGameLog)       c += 10;
  if (args.hasPitcherStats)  c += 18;
  if (args.lineupConfirmed)  c += 12;
  if (args.parkFromTable)    c +=  8;
  // weather always missing: -0 (already not counted)
  return clamp(c, 20, 95);
}

// ---- Lineup spot from boxscore battingOrder -------------------------------------

export function lineupSpotFromBattingOrder(battingOrder: number | null | undefined): number {
  if (!battingOrder || battingOrder === 0) return 9; // unknown → assume deep
  return Math.round(battingOrder / 100);
}

// ---- Core edge composite --------------------------------------------------------

function calculateHrEdge(args: {
  powerScore: number;      // 0-100 from season stats
  vulnerability: number;  // 0-100 pitcher
  parkFactor: number;     // 88-121
  formTag: FormTag;
  lineupSpot: number;
}): number {
  // Park: normalize 88-121 → 0-100
  const parkC = clamp(((args.parkFactor - 88) / 33) * 100, 0, 100);
  // Lineup bonus: top of order gets more PA
  const lineupBonus = args.lineupSpot <= 4 ? 6 : args.lineupSpot <= 6 ? 2 : -3;

  const edge =
    0.35 * args.vulnerability +
    0.30 * args.powerScore +
    0.20 * parkC +
    formAdj(args.formTag) +
    lineupBonus;

  return clamp(Math.round(edge), 1, 100);
}

// ---- Row builder ----------------------------------------------------------------

export function buildHitterRow(
  hitter: NormalizedPlayer,
  pitcher: NormalizedPitcher,
  game: NormalizedGame,
  lineupSpot: number,
  projectionType: ProjectionType,
  hitterStats?: HitterStats,
  pitcherSeasonStats?: PitcherSeasonStats | null,
  battingOrder?: number | null
): HrBoardRow {
  // --- Pitcher vulnerability (real stats when available) ---
  const pitcherProfile = buildPitcherVulnerability(pitcher, hitter.team, game.venue, pitcherSeasonStats ?? null);
  const vulnerability = pitcherProfile.vulnerabilityScore;

  // --- Hitter season stats ---
  const season = hitterStats?.season ?? null;
  const hrPerPA = season?.hrPerPA ?? 0;
  const slg = season?.slg ?? 0;
  const powerScore = season ? hitterPowerScore(hrPerPA, slg) : 50; // 50 = neutral if unavailable

  // --- Form from game log ---
  const { tag: formTag, recentHR7 } = hitterStats?.recentGames?.length
    ? formTagFromGameLog(hitterStats.recentGames)
    : { tag: "Average" as FormTag, recentHR7: 0 };

  // --- Park factor (static table) ---
  const { factor: parkFactor, source: parkSource } = getParkFactor(game.venue);

  // --- Lineup spot ---
  const confirmedSpot = battingOrder !== null && battingOrder !== undefined
    ? lineupSpotFromBattingOrder(battingOrder)
    : null;
  const effectiveLineupSpot = confirmedSpot ?? lineupSpot;
  const lineupConfirmed = confirmedSpot !== null;

  // --- Edge composite ---
  const hrEdge = calculateHrEdge({ powerScore, vulnerability, parkFactor, formTag, lineupSpot: effectiveLineupSpot });
  const grade = calculateGrade(hrEdge);
  const riskLabel = riskFromGrade(grade);

  // --- Single-game HR probability ---
  // Base: season HR/PA rate (probability per plate appearance)
  // Adjust for pitcher and park, then convert to per-game (≈4 PA)
  const baseRatePerPA = season ? hrPerPA : 0.033; // 0.033 = approx league avg
  const pitcherAdj = pitcherSeasonStats ? pitcherSeasonStats.homeRunsPer9 / 1.25 : 1.0;
  const parkAdj = parkFactor / 100;
  const adjRatePerPA = baseRatePerPA * pitcherAdj * parkAdj;
  const avgPA = 4;
  const estimatedHrProb = clamp(1 - Math.pow(1 - adjRatePerPA, avgPA), 0.02, 0.45);

  const impliedOdds = calculateImpliedOdds(estimatedHrProb);

  // --- Data confidence ---
  const confidence = dataConfidence({
    hasSeasonStats: !!season,
    hasGameLog: (hitterStats?.recentGames?.length ?? 0) > 0,
    hasPitcherStats: !!pitcherSeasonStats,
    lineupConfirmed,
    parkFromTable: parkSource === "table",
  });

  const vouchScore = clamp(Math.round(0.6 * hrEdge + 0.4 * confidence), 1, 100);

  // --- Source label ---
  const sourceFields: string[] = [];
  if (season) sourceFields.push(`season stats (${season.homeRuns} HR/${season.plateAppearances} PA)`);
  if ((hitterStats?.recentGames?.length ?? 0) > 0) sourceFields.push("last-7 game log");
  if (pitcherSeasonStats) sourceFields.push(`pitcher HR/9=${pitcherSeasonStats.homeRunsPer9.toFixed(2)}`);
  sourceFields.push(`park=${parkSource}`);
  if (!lineupConfirmed) sourceFields.push("lineup=projected");
  sourceFields.push("weather=unavailable");
  sourceFields.push("odds=unavailable");
  const source = sourceFields.length ? `MLB Stats API 2026: ${sourceFields.join(", ")}` : "MLB Stats API 2026 (limited)";

  // --- Reasons ---
  const reasons: string[] = [];
  if (season) {
    reasons.push(`Season: ${season.homeRuns} HR in ${season.plateAppearances} PA (.${Math.round(season.avg * 1000).toString().padStart(3, "0")} avg, ${season.slg.toFixed(3)} SLG)`);
  } else {
    reasons.push("Season hitting stats unavailable for this player.");
  }
  if (recentHR7 > 0) {
    reasons.push(`Recent form: ${recentHR7} HR in last 7 games (${formTag})`);
  } else {
    reasons.push(`Recent form: 0 HR in last 7 games (${formTag})`);
  }
  reasons.push(
    pitcherSeasonStats
      ? `Faces ${pitcher.pitcherName}: HR/9=${pitcherSeasonStats.homeRunsPer9.toFixed(2)}, ERA=${pitcherSeasonStats.era.toFixed(2)} — vulnerability ${vulnerability}/100`
      : `Faces ${pitcher.pitcherName} — vulnerability ${vulnerability}/100 (no stat data)`
  );
  reasons.push(
    `${game.venue} park factor ${parkFactor} (${parkSource === "table" ? "sourced" : "neutral — venue not in table"})`
  );

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
    bestOdds: impliedOdds, // no odds feed — same as implied
    vouchScore,
    formTag,
    opposingPitcher: pitcher.pitcherName,
    opposingPitcherTeam: pitcher.team,
    pitcherVulnerability: vulnerability,
    parkFactor,
    hrMultiplier: Math.round(parkFactor) / 100,
    dataConfidence: confidence,
    weatherBoost: 0,       // weather API not connected
    gameStatus: game.status,
    projectionType: lineupConfirmed ? "Confirmed" : projectionType,
    lineupSpot: effectiveLineupSpot,
    lineMovement: 0,       // odds feed not connected
    source,
    riskLabel,
    reasons,
    judge: { approvalStatus: "Needs more data", riskLabel, judgeNote: "", whatCouldGoWrong: [], parlayAllowed: false },
    dataQuality: confidence >= 70 ? "partial" : "limited",
    // diagnostic
    seasonHR: season?.homeRuns ?? null,
    seasonPA: season?.plateAppearances ?? null,
    hrPerPA: season?.hrPerPA ?? null,
    recentHR7,
    pitcherHrPer9: pitcherSeasonStats?.homeRunsPer9 ?? null,
  };

  row.judge = judgeHrRow(row);
  return row;
}

// ---- Judge ----------------------------------------------------------------------

export function judgeHrRow(row: HrBoardRow): HrRowJudge {
  const whatCouldGoWrong: string[] = [];

  if (row.formTag === "Slump") whatCouldGoWrong.push("Hitter in a slump — 0 HR and low average in last 7 games.");
  if (row.lineupSpot >= 7 && !row.source.includes("lineup=projected"))
    whatCouldGoWrong.push(`Batting ${row.lineupSpot}th — fewer plate appearances per game.`);
  if (row.projectionType !== "Confirmed")
    whatCouldGoWrong.push("Lineup projected — could be a late scratch or day off.");
  if (row.dataConfidence < 60)
    whatCouldGoWrong.push("Limited data — season stats or pitcher data unavailable.");
  if (row.parkFactor < 96)
    whatCouldGoWrong.push("Pitcher-friendly park for HR (factor < 96).");
  if (whatCouldGoWrong.length === 0)
    whatCouldGoWrong.push("Standard HR variance — single-game power is inherently noisy.");

  const pickLogic = row.hrEdge >= 68 && row.pitcherVulnerability >= 58;
  let approvalStatus: HrRowJudge["approvalStatus"];
  if (row.dataConfidence < 50)                              approvalStatus = "Needs more data";
  else if (row.grade === "A+" || row.grade === "A")         approvalStatus = pickLogic ? "Approved" : "Playable but risky";
  else if (row.grade === "B" || row.grade === "C")          approvalStatus = "Playable but risky";
  else                                                      approvalStatus = "Avoid";

  const judgeNote =
    approvalStatus === "Approved"
      ? `Strong spot: vulnerable arm (HR/9=${row.pitcherHrPer9?.toFixed(2) ?? "?"}) + favorable park + positive form. Still probability-based.`
      : approvalStatus === "Avoid"
      ? "Weak HR equity today — better spots exist on the board."
      : "Playable but high-variance — treat as a research lean.";

  const parlayAllowed = (row.grade === "A+" || row.grade === "A" || row.grade === "B") && row.dataConfidence >= 58;

  return { approvalStatus, riskLabel: row.riskLabel, judgeNote, whatCouldGoWrong: whatCouldGoWrong.slice(0, 4), parlayAllowed };
}

// Legacy stubs for any callers not yet updated
export { buildPitcherVulnerability as calculatePitcherVulnerability } from "./pitcherVulnerabilityEngine";
export function calculateFormTag(): FormTag { return "Average"; }
export function calculateParkBoost(venue: string): number { return getParkFactor(venue).factor; }
export function calculateWeatherBoost(): number { return 0; }
export function calculateDataConfidence(): number { return 50; }
export function calculateLineMovementPlaceholder(): number { return 0; }
