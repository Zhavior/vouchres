import type { MLBPlayer } from '../../types';
import type {
  PlayerEdgeResearchPayload,
  PlayerGameLogRow,
  StatcastQuality,
} from '../../pages/pro/usePlayerEdgeResearch';

export const UNKNOWN = '—';

export function formatRate(value: number | null | undefined, digits = 3): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN;
  const text = value.toFixed(digits);
  return text.startsWith('0.') ? text.slice(1) : text;
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN;
  return String(Math.round(value));
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN;
  return `${value.toFixed(digits)}%`;
}

export function formatVelo(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN;
  return `${value.toFixed(1)} mph`;
}

function emptySplit() {
  return { avg: UNKNOWN, obp: UNKNOWN, slg: UNKNOWN, ops: UNKNOWN };
}

/** Last-10 AVG/SLG from official game-log rows. OBP/OPS stay UNKNOWN (no walks). */
export function deriveLast10Split(gameLog: PlayerGameLogRow[]) {
  const rows = gameLog.slice(0, 10);
  const ab = rows.reduce((sum, row) => sum + (row.ab || 0), 0);
  const hits = rows.reduce((sum, row) => sum + (row.hits || 0), 0);
  const tb = rows.reduce((sum, row) => sum + (row.totalBases || 0), 0);
  if (!ab) return emptySplit();
  return {
    avg: formatRate(hits / ab),
    obp: UNKNOWN,
    slg: formatRate(tb / ab),
    ops: UNKNOWN,
  };
}

export function applyEdgeResearchToPlayer(
  player: MLBPlayer,
  research: PlayerEdgeResearchPayload | null | undefined,
): MLBPlayer {
  if (!research) return player;
  const season = research.season;
  const last10 = deriveLast10Split(research.gameLog);

  return {
    ...player,
    seasonStats: {
      avg: season ? formatRate(season.avg) : player.seasonStats.avg,
      hr: season ? formatCount(season.homeRuns) : player.seasonStats.hr,
      rbi: UNKNOWN,
      ops: season ? formatRate(season.ops) : player.seasonStats.ops,
      obp: season ? formatRate(season.onBasePercentage) : player.seasonStats.obp,
      slg: season ? formatRate(season.slg) : player.seasonStats.slg,
    },
    gameLogs: research.gameLog.map((row) => ({
      date: row.date,
      opponent: row.opponentAbbr || row.opponentName || UNKNOWN,
      result: UNKNOWN,
      ab: row.ab,
      h: row.hits,
      hr: row.homeRuns,
      rbi: row.rbi,
      r: 0,
      batterScore: 0,
    })),
    splits: {
      ...player.splits,
      vLHP: emptySplit(),
      vRHP: emptySplit(),
      home: emptySplit(),
      away: emptySplit(),
      last10,
    },
    scoutingReport: {
      ...player.scoutingReport,
      powerText: season
        ? `${formatCount(season.homeRuns)} HR in ${formatCount(season.plateAppearances)} PA this season.`
        : 'Season power line unavailable.',
      contactText: season
        ? `${formatRate(season.avg)} AVG · ${formatRate(season.slg)} SLG.`
        : 'Season contact line unavailable.',
      disciplineText: research.plateDiscipline
        ? `Chase ${formatPct(research.plateDiscipline.chasePct)} · Whiff ${formatPct(research.plateDiscipline.whiffPct)}.`
        : 'Plate discipline unavailable.',
      overallScouting: research.warnings.length
        ? research.warnings[0]
        : 'Official MLB Stats API + Statcast evidence loaded.',
      hotZones: ['Strike-zone heatmap unavailable'],
    },
  };
}

export function assembleAiPlayerData(
  player: MLBPlayer,
  research: PlayerEdgeResearchPayload | null | undefined,
) {
  const dossier = applyEdgeResearchToPlayer(player, research);
  const statcast = research?.statcast ?? null;
  const discipline = research?.plateDiscipline ?? null;
  const advanced: Record<string, number> = {};
  if (statcast?.hardHitPct != null) advanced.hardHitPercent = statcast.hardHitPct;
  if (statcast?.avgExitVelo != null) advanced.exitVelocity = statcast.avgExitVelo;
  if (discipline?.chasePct != null) advanced.chasePercent = discipline.chasePct;
  if (statcast?.xwoba != null) advanced.xwoba = statcast.xwoba;
  if (statcast?.barrelPct != null) advanced.barrelPercent = statcast.barrelPct;
  if (statcast?.avgLaunchAngle != null) advanced.launchAngle = statcast.avgLaunchAngle;

  return {
    id: player.id,
    name: player.name,
    team: player.team,
    position: player.position,
    number: player.number,
    injuryStatus: player.injuryStatus,
    injurySeverity: player.injurySeverity,
    seasonStats: dossier.seasonStats,
    advanced,
    splits: dossier.splits,
  };
}

export function statcastTone(value: number | null | undefined): 'confirmed' | 'missing' {
  return value == null ? 'missing' : 'confirmed';
}

export function listStatcast(
  playerId: string,
  map: Record<string, StatcastQuality> | null,
): StatcastQuality | null {
  if (!map) return null;
  return map[playerId] ?? map[String(Number(playerId))] ?? null;
}
