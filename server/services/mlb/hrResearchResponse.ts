import type {
  HrResearchConfidence,
  HrResearchDirection,
  HrResearchEvidence,
  HrResearchLineupStatus,
  HrResearchQualityStatus,
  HrResearchResponse,
  HrResearchScoreContribution,
  HrResearchVerdict,
} from "../../../src/types/hrResearch";
import {
  getPlayerEdgeResearch,
  type PlayerEdgeResearch,
} from "./playerEdgeResearchService";

type AnyRecord = Record<string, unknown>;

function mlbTeamLogoUrl(value: unknown): string | null {
  const teamId = positiveInteger(value);
  return teamId
    ? `https://www.mlbstatic.com/team-logos/${teamId}.svg`
    : null;
}

export interface BuildHrResearchInput {
  candidate: AnyRecord;
  generatedAt?: string | null;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function finite(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function integer(value: unknown): number | null {
  const parsed = finite(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function positiveInteger(value: unknown): number | null {
  const parsed = integer(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function scalarRecord(value: unknown): Record<string, number | string | null> {
  if (!isRecord(value)) return {};

  const output: Record<string, number | string | null> = {};

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "number" && Number.isFinite(item)) {
      output[key] = item;
      continue;
    }

    if (typeof item === "string") {
      output[key] = item;
      continue;
    }

    if (item === null) {
      output[key] = null;
    }
  }

  return output;
}

function numericRecord(value: unknown): Record<string, number | null> | null {
  if (!isRecord(value)) return null;

  const output: Record<string, number | null> = {};

  for (const [key, item] of Object.entries(value)) {
    const parsed = finite(item);
    output[key] = parsed;
  }

  return Object.keys(output).length > 0 ? output : null;
}

function weatherRecord(
  value: PlayerEdgeResearch["weather"],
): Record<string, number | string | boolean | null> | null {
  if (!value) return null;

  return {
    gamePk: value.gamePk,
    venue: value.venue,
    gameTime: value.gameTime,
    status: value.status,
    tempF: value.tempF,
    windMph: value.windMph,
    windCompass: value.windCompass,
    precipChancePct: value.precipChancePct,
    source: value.source,
    note: value.note,
  };
}

function batterVsPitcherRecord(
  value: PlayerEdgeResearch["batterVsPitcher"],
): Record<string, number | string | null> | null {
  return isRecord(value) ? scalarRecord(value) : null;
}

function americanOddsFromProbability(probability: number | null): number | null {
  if (
    probability === null
    || probability <= 0
    || probability >= 1
  ) {
    return null;
  }

  if (probability >= 0.5) {
    return Math.round((-100 * probability) / (1 - probability));
  }

  return Math.round((100 * (1 - probability)) / probability);
}

function normalizeProbability(value: unknown): number | null {
  const parsed = finite(value);
  if (parsed === null) return null;

  const probability = parsed > 1 ? parsed / 100 : parsed;
  return probability >= 0 && probability <= 1 ? probability : null;
}

function normalizeBats(value: unknown): "L" | "R" | "S" | null {
  const normalized = text(value).toUpperCase();
  return normalized === "L" || normalized === "R" || normalized === "S"
    ? normalized
    : null;
}

function normalizeThrows(value: unknown): "L" | "R" | null {
  const normalized = text(value).toUpperCase();
  return normalized === "L" || normalized === "R"
    ? normalized
    : null;
}

function lineupStatus(candidate: AnyRecord): HrResearchLineupStatus {
  const raw = text(candidate.lineupStatus).toLowerCase();
  const injury = text(candidate.injuryStatus).toLowerCase();

  if (injury === "scratched" || raw === "scratched") return "scratched";
  if (raw === "confirmed") return "confirmed";

  if (
    raw === "projected"
    || raw === "projected_unconfirmed"
    || raw.includes("project")
  ) {
    return "projected";
  }

  return "unknown";
}

function truthStatus(
  candidate: AnyRecord,
): HrResearchResponse["quality"]["truthStatus"] {
  const status = text(candidate.status).toLowerCase();
  const lineup = lineupStatus(candidate);

  if (status === "blocked") return "blocked";
  if (lineup === "confirmed" || status === "confirmed") return "official";
  if (lineup === "projected" || status === "preview" || status === "projected") {
    return "projected";
  }

  return "unknown";
}

function qualityStatus(
  candidate: AnyRecord,
  research: PlayerEdgeResearch,
): HrResearchQualityStatus {
  const quality = text(candidate.dataQuality).toLowerCase();
  const confidence = finite(candidate.dataConfidence);
  const warningCount = research.warnings.length;

  if (quality === "unavailable") return "unavailable";
  if (quality === "limited" || confidence !== null && confidence < 45) {
    return "limited";
  }

  if (
    quality === "partial"
    || quality.includes("projection")
    || warningCount >= 4
  ) {
    return "partial";
  }

  return "complete";
}

function confidenceLevel(candidate: AnyRecord): HrResearchConfidence {
  const confidence = finite(candidate.dataConfidence);

  if (confidence !== null) {
    if (confidence >= 80) return "high";
    if (confidence >= 55) return "moderate";
    return "low";
  }

  const tier = text(candidate.confidenceTier).toLowerCase();
  if (tier === "elite" || tier === "strong") return "high";
  if (tier === "watchlist") return "moderate";
  return "low";
}

function verdictFor(
  score: number,
  modelProbability: number | null,
  marketProbability: number | null,
  candidate: AnyRecord,
): HrResearchVerdict {
  if (text(candidate.status).toLowerCase() === "blocked") return "unavailable";

  const edge =
    modelProbability !== null && marketProbability !== null
      ? modelProbability - marketProbability
      : null;

  if (score >= 90 && (edge === null || edge >= 0)) return "strong";
  if (score >= 82 && (edge === null || edge >= 0)) return "playable";
  if (edge !== null && edge < 0) return "price_sensitive";
  if (score >= 70) return "watch";
  return "pass";
}

function evidenceFromStrings(
  values: string[],
  direction: HrResearchDirection,
  source: string,
): HrResearchEvidence[] {
  return values.map((message, index) => ({
    key: `${direction}-${index + 1}`,
    label:
      direction === "positive"
        ? `Supporting signal ${index + 1}`
        : `Research risk ${index + 1}`,
    explanation: message,
    direction,
    value: null,
    displayValue: null,
    sampleSize: null,
    source,
  }));
}

const SCORE_BREAKDOWN_META: Record<
  string,
  { label: string; weight: number | null }
> = {
  hitterPower: { label: "Hitter power", weight: 25 },
  pitcherVulnerability: { label: "Pitcher vulnerability", weight: 20 },
  parkFactor: { label: "Park factor", weight: 10 },
  parkContext: { label: "Park context", weight: 10 },
  recentForm: { label: "Recent form", weight: 10 },
  lineupConfidence: { label: "Lineup confidence", weight: 5 },
  lineupVolume: { label: "Lineup volume", weight: 5 },
  handednessEdge: { label: "Handedness edge", weight: 5 },
  riskPenalty: { label: "Risk penalty", weight: null },
  penalties: { label: "Risk penalties", weight: null },
  finalScore: { label: "Final HR score", weight: null },
};

function scoreContributions(candidate: AnyRecord): HrResearchScoreContribution[] {
  if (!isRecord(candidate.scoreBreakdown)) return [];

  const rows: HrResearchScoreContribution[] = [];

  for (const [key, rawValue] of Object.entries(candidate.scoreBreakdown)) {
    const score = finite(rawValue);
    if (score === null) continue;

    const meta = SCORE_BREAKDOWN_META[key] ?? {
      label: key.replace(/([A-Z])/g, " $1").trim(),
      weight: null,
    };

    const isPenalty = key.toLowerCase().includes("penalt");

    rows.push({
      key,
      label: meta.label,
      score,
      weight: meta.weight,
      contribution:
        meta.weight !== null
          ? Number(((score * meta.weight) / 100).toFixed(2))
          : isPenalty
            ? -Math.abs(score)
            : null,
      direction: isPenalty
        ? "negative"
        : score >= 55
          ? "positive"
          : score < 45
            ? "negative"
            : "neutral",
      explanation: isPenalty
        ? `${meta.label} reduced the composite HR signal.`
        : `${meta.label} contributed to the validated HR profile.`,
    });
  }

  return rows;
}

function decisionSummary(
  verdict: HrResearchVerdict,
  playerName: string,
  score: number,
  confidence: HrResearchConfidence,
): string {
  if (verdict === "unavailable") {
    return `${playerName}'s research profile is unavailable because the candidate did not pass the current truth gate.`;
  }

  if (verdict === "strong") {
    return `${playerName} has a strong validated HR profile with an HR Score of ${Math.round(score)} and ${confidence} data confidence.`;
  }

  if (verdict === "playable") {
    return `${playerName} has a playable HR profile, but price and the listed risks should still be reviewed.`;
  }

  if (verdict === "price_sensitive") {
    return `${playerName} has supporting baseball signals, but the current market price may not offer enough value.`;
  }

  if (verdict === "watch") {
    return `${playerName} is a watch candidate rather than a clear action until more evidence or lineup certainty arrives.`;
  }

  return `${playerName}'s current evidence does not support a strong HR action.`;
}

function missingFields(
  candidate: AnyRecord,
  research: PlayerEdgeResearch,
): string[] {
  const missing: string[] = [];

  if (!research.statcast) missing.push("statcast");
  if (!research.sprayProfile) missing.push("sprayProfile");
  if (!research.pitchMix.length) missing.push("pitchMix");
  if (!research.gameLog.length) missing.push("gameLog");
  if (!research.batterVsPitcher) missing.push("batterVsPitcher");
  if (!research.weather) missing.push("weather");
  if (!positiveInteger(candidate.opponentPitcherId)) {
    missing.push("opponentPitcherId");
  }

  return [...new Set(missing)];
}

export async function buildHrResearchResponse({
  candidate,
  generatedAt,
}: BuildHrResearchInput): Promise<HrResearchResponse> {
  const playerId = positiveInteger(candidate.playerId);

  if (!playerId) {
    throw new Error("Cannot build HR research without a valid playerId.");
  }

  const gamePk = positiveInteger(candidate.gamePk ?? candidate.gameId);
  const pitcherId = positiveInteger(
    candidate.opponentPitcherId
      ?? candidate.pitcherId
      ?? candidate.probablePitcherId,
  );
  const opponent = text(
    candidate.opponent
      ?? candidate.opponentTeam
      ?? candidate.opponentTeamAbbrev,
    "Unknown",
  );

  const research = await getPlayerEdgeResearch(playerId, {
    pitcherId: pitcherId ?? undefined,
    opponentAbbr: opponent !== "Unknown" ? opponent : undefined,
    gamePk: gamePk ?? undefined,
  });

  const playerName = text(
    candidate.playerName ?? candidate.name,
    `Player ${playerId}`,
  );
  const team = text(
    candidate.team ?? candidate.teamAbbrev,
    "Unknown",
  );

  const scoreBreakdown = isRecord(candidate.scoreBreakdown)
    ? candidate.scoreBreakdown
    : null;

  const score = clamp(
    finite(
      candidate.hrScore
        ?? candidate.hrEdge
        ?? scoreBreakdown?.finalScore,
    ) ?? 0,
    0,
    100,
  );

  const modelProbability = normalizeProbability(
    candidate.estimatedHrProbability
      ?? candidate.hrProbability
      ?? candidate.estimatedHrProb,
  );
  const marketProbability = normalizeProbability(
    candidate.impliedProbability
      ?? candidate.marketProbability,
  );
  const marketOddsAmerican = finite(
    candidate.bookOdds
      ?? candidate.marketOddsAmerican
      ?? candidate.bestOddsAmerican,
  );
  const fairOddsAmerican = americanOddsFromProbability(modelProbability);
  const edgePercentagePoints =
    modelProbability !== null && marketProbability !== null
      ? Number(((modelProbability - marketProbability) * 100).toFixed(2))
      : null;

  const confidence = confidenceLevel(candidate);
  const verdict = verdictFor(
    score,
    modelProbability,
    marketProbability,
    candidate,
  );

  const candidateReasons = stringArray(candidate.reasons);
  const candidateWarnings = stringArray(candidate.warnings);
  const combinedWarnings = [
    ...candidateWarnings,
    ...research.warnings,
  ].filter((warning, index, all) => all.indexOf(warning) === index);

  const statcast = research.statcast;
  const spray = research.sprayProfile;

  const response: HrResearchResponse = {
    player: {
      id: playerId,
      name: playerName,
      team,
      bats: normalizeBats(candidate.batSide ?? candidate.bats),
      headshotUrl: text(candidate.headshotUrl ?? candidate.headshot) || null,
      teamLogoUrl: (
        mlbTeamLogoUrl(
          candidate.playerCurrentTeamId
            ?? candidate.activeRosterTeamId
            ?? candidate.teamId
            ?? candidate.sourceTeamId,
        )
        ?? text(candidate.teamLogoUrl)
      ) || null,
      lineupStatus: lineupStatus(candidate),
      lineupPosition: positiveInteger(
        candidate.battingOrder
          ?? candidate.lineupPosition
          ?? candidate.lineupSpot,
      ),
    },

    matchup: {
      gamePk,
      opponent,
      opponentLogoUrl: (
        mlbTeamLogoUrl(candidate.opponentTeamId)
        ?? text(candidate.opponentLogoUrl)
      ) || null,
      venue: text(candidate.venue) || null,
      gameTime: text(
        candidate.gameTime
          ?? candidate.gameDate
          ?? research.weather?.gameTime,
      ) || null,
      pitcher: {
        id: pitcherId,
        name: text(
          candidate.opponentPitcherName
            ?? candidate.opponentPitcher
            ?? candidate.pitcherName,
        ) || null,
        throws: normalizeThrows(
          candidate.opponentPitcherHand
            ?? candidate.pitcherHand,
        ),
      },
    },

    decision: {
      hrScore: score,
      modelProbability,
      marketProbability,
      fairOddsAmerican,
      marketOddsAmerican,
      playableAtOrAbove: fairOddsAmerican,
      edgePercentagePoints,
      confidence,
      verdict,
      summary: decisionSummary(
        verdict,
        playerName,
        score,
        confidence,
      ),
    },

    reasons: evidenceFromStrings(
      candidateReasons.slice(0, 5),
      "positive",
      "validated_hr_pipeline",
    ),

    risks: evidenceFromStrings(
      combinedWarnings.slice(0, 8),
      "negative",
      "official_mlb_research",
    ),

    charts: {
      signalTimeline: research.gameLog.slice(0, 20).reverse().map((game) => ({
        date: game.date,
        opponent: game.opponentAbbr || game.opponentName || null,
        atBats: game.ab,
        hits: game.hits,
        homeRuns: game.homeRuns,
        totalBases: game.totalBases,
        strikeOuts: game.strikeOuts,
        hrScore: null,
        barrelRate: null,
        hardHitRate: null,
      })),

      contactQuality: [
        {
          label: "Barrel rate",
          value: statcast?.barrelPct ?? null,
          seasonBaseline: null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: statcast?.pa ?? null,
        },
        {
          label: "Hard-hit rate",
          value: statcast?.hardHitPct ?? null,
          seasonBaseline: null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: statcast?.pa ?? null,
        },
        {
          label: "Average exit velocity",
          value: statcast?.avgExitVelo ?? null,
          seasonBaseline: null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: statcast?.pa ?? null,
        },
        {
          label: "Expected slugging",
          value: statcast?.xslg ?? null,
          seasonBaseline: statcast?.slg ?? null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: statcast?.pa ?? null,
        },
        {
          label: "Fly-ball rate",
          value: spray?.fbPct ?? null,
          seasonBaseline: null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: spray?.bbe ?? null,
        },
        {
          label: "Pull-air rate",
          value: spray?.pullAirPct ?? null,
          seasonBaseline: null,
          leagueBaseline: null,
          percentile: null,
          sampleSize: spray?.bbe ?? null,
        },
      ],

      pitchArsenal: research.pitchMix.map((pitch) => ({
        pitchType: pitch.pitchType,
        pitchName: pitch.pitchName,
        pitcherUsage: null,
        batterAverage: null,
        batterSlugging: null,
        batterExpectedSlugging: null,
        batterWhiffRate: pitch.whiffPct,
        runValue: null,
        matchupScore: null,
        sampleSize: pitch.pitches,
      })),

      pitcherVulnerability: [],

      sprayEvents: [],

      scoreContributions: scoreContributions(candidate),

      oddsHistory: marketOddsAmerican === null
        ? []
        : [{
            capturedAt: research.updatedAt,
            sportsbook: text(candidate.sportsbook) || null,
            americanOdds: marketOddsAmerican,
            impliedProbability: marketProbability,
          }],
    },

    context: {
      seasonStats: scalarRecord(research.season),
      rolling14Day: numericRecord(research.rolling14Day),
      batterVsPitcher: batterVsPitcherRecord(
        research.batterVsPitcher,
      ),
      weather: weatherRecord(research.weather),
    },

    quality: {
      status: qualityStatus(candidate, research),
      dataConfidence: finite(candidate.dataConfidence),
      truthStatus: truthStatus(candidate),
      dataSource: research.dataSource,
      modelVersion: text(
        candidate.modelVersion
          ?? candidate.engineVersion,
      ) || null,
      generatedAt:
        text(generatedAt)
        || text(candidate.lastUpdated)
        || research.updatedAt,
      updatedAt: research.updatedAt,
      missingFields: missingFields(candidate, research),
      warnings: combinedWarnings,
    },
  };

  return response;
}
