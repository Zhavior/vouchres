import { useMemo } from "react";
import type { HrBoardResponse, HrBoardRow } from "../../../types/hrBoard";

function firstFiniteNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function formTagFromRecentPowerScore(score: number | null): HrBoardRow["formTag"] {
  if (score == null) return "Average";
  if (score >= 70) return "Hot";
  if (score <= 35) return "Cold";
  return "Average";
}

export function useHrBoardViewModel(board: HrBoardResponse | null, projectedPoolView: 'curated' | 'all') {
  const confirmedCandidates = useMemo(
    () => (Array.isArray((board as any)?.candidates) ? (board as any).candidates : []),
    [board]
  );

  const projectedCandidates = useMemo(
    () => (Array.isArray(board?.projectedCandidates) ? board.projectedCandidates : []),
    [board]
  );

  const allProjectedCandidates = useMemo(
    () => {
      const direct = board?.allProjectedCandidates;
      const bucket = board?.candidateBuckets?.allProjected;
      if (Array.isArray(direct)) return direct;
      if (Array.isArray(bucket)) return bucket;
      return projectedCandidates;
    },
    [board, projectedCandidates]
  );

  const selectedProjectedCandidates =
    projectedPoolView === 'all' ? allProjectedCandidates : projectedCandidates;

  const previewMeta = board?.previewMeta;

  const boardMode = confirmedCandidates.length > 0
    ? 'confirmed'
    : selectedProjectedCandidates.length > 0
      ? 'preview'
      : 'empty';

  const games = useMemo(() => {
    const existingGames = Array.isArray((board as any)?.games) ? (board as any).games : [];
    const gamesHaveHrRows = existingGames.some((game: any) =>
      Array.isArray(game?.rows) ||
      Array.isArray(game?.hitters) ||
      Array.isArray(game?.candidates) ||
      Array.isArray(game?.players)
    );

    // In confirmed mode, use backend game rows when available.
    // In preview mode, use the selected projected pool so Curated Preview / All Projected actually changes the board.
    if (existingGames.length && gamesHaveHrRows && boardMode !== 'preview') {
      return existingGames;
    }

    const candidates =
      confirmedCandidates.length ? confirmedCandidates :
      selectedProjectedCandidates.length ? selectedProjectedCandidates :
      Array.isArray((board as any)?.rows) ? (board as any).rows :
      Array.isArray((board as any)?.players) ? (board as any).players :
      Array.isArray((board as any)?.targets) ? (board as any).targets :
      [];

    if (!candidates.length) return [];

    const grouped = new Map<string, any[]>();

    candidates.forEach((candidate: any, index: number) => {
      const team = candidate.teamAbbr ?? candidate.team ?? candidate.teamName ?? 'UNK';
      const opponent = candidate.opponentAbbr ?? candidate.opponent ?? candidate.vs ?? '';
      const gameKey = candidate.gamePk ?? candidate.gameId ?? `${team}${opponent ? ` vs ${opponent}` : ''}`;
      const recentForm = candidate.recentForm ?? null;
      const scoreBreakdown = candidate.scoreBreakdown ?? null;
      const recentPowerScore =
        firstFiniteNumber(recentForm?.recentPowerScore, scoreBreakdown?.recentForm) ?? null;
      const hrScore = firstFiniteNumber(candidate.hrScore, candidate.hrEdge, candidate.score, candidate.vouchScore) ?? 0;
      const finalScore = firstFiniteNumber(scoreBreakdown?.finalScore, hrScore) ?? 0;
      const pitcherVulnerability = firstFiniteNumber(
        scoreBreakdown?.pitcherVulnerability,
        candidate.pitcherVulnerability,
        candidate.pitcherVuln,
        candidate.pitcherScore,
        ((candidate.reasons ?? []).join(" ").match(/HR\/9 = ([\d.]+)/)?.[1] ?? undefined)
      ) ?? 0;
      const parkFactor = firstFiniteNumber(scoreBreakdown?.parkFactor, candidate.parkFactor, candidate.park);
      const lineupStatus = candidate.lineupStatus ?? (boardMode === 'preview' ? 'projected_unconfirmed' : 'projected');
      const projectionType =
        candidate.projectionType ??
        (lineupStatus === 'projected_unconfirmed'
          ? 'Projection Preview'
          : lineupStatus === 'confirmed'
            ? 'Confirmed'
            : lineupStatus === 'projected'
              ? 'Projected'
              : 'Projected');

      const row = {
        id: candidate.id ?? candidate.playerId ?? `${candidate.playerName ?? candidate.name ?? 'player'}-${index}`,
        playerId: candidate.playerId ?? candidate.id ?? index,
        gamePk: candidate.gamePk ?? candidate.gameId ?? gameKey,
        rank: index + 1,
        playerName: candidate.playerName ?? candidate.name ?? candidate.fullName ?? 'Unknown Player',
        team,
        opponent,
        position: candidate.position ?? candidate.primaryPosition ?? '',
        grade: candidate.grade ?? candidate.tier ?? 'B',
        riskLabel: candidate.riskLabel ?? candidate.riskTier ?? candidate.risk ?? 'Standard',
        formTag: recentPowerScore !== null
          ? formTagFromRecentPowerScore(recentPowerScore)
          : candidate.formTag ?? candidate.form ?? 'Average',
        projectionType:
          projectionType,
        lineupStatus,
        battingOrder: candidate.battingOrder ?? candidate.lineupSpot ?? null,
        hrEdge: hrScore,
        vouchScore: finalScore,
        pitcherVulnerability,
        dataConfidence: firstFiniteNumber(candidate.dataConfidence, candidate.confidence) ?? 50,
        weatherBoost:
          candidate.weatherBoost !== undefined && candidate.weatherBoost !== null
            ? Number(candidate.weatherBoost)
            : candidate.parkWeatherBoost !== undefined && candidate.parkWeatherBoost !== null
              ? Number(candidate.parkWeatherBoost)
              : null,
        weatherSource: candidate.weatherSource ?? "unavailable",
        lineupSpot:
          candidate.battingOrder !== undefined && candidate.battingOrder !== null
            ? Number(candidate.battingOrder)
            : candidate.lineupSpot !== undefined && candidate.lineupSpot !== null
              ? Number(candidate.lineupSpot)
              : candidate.projectedLineupSpot !== undefined && candidate.projectedLineupSpot !== null
                ? Number(candidate.projectedLineupSpot)
                : null,
        bestOdds: String(candidate.bestOdds ?? candidate.odds ?? candidate.hrOdds ?? 'N/A'),
        pitcherName: candidate.opponentPitcherName ?? candidate.pitcherName ?? candidate.opponentPitcher ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opponentPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opponentPitcherName: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        oppPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opposingPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        pitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        pTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        opposingPitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? 'TBD',
        pitcherHand: candidate.pitcherHand ?? candidate.pitcherThrows ?? '',
        venue: candidate.venue ?? candidate.ballpark ?? candidate.parkName ?? 'Unknown venue',
        parkFactor: parkFactor ?? 'N/A',
        hrMultiplier: candidate.hrMultiplier ?? candidate.hrMult ?? candidate.multiplier ?? 'N/A',
        gameStatus: candidate.status ?? candidate.gameStatus ?? candidate.lineupStatus ?? (boardMode === 'preview' ? 'projected_unconfirmed' : 'projected'),
        lineMovement:
          candidate.lineMovement !== undefined && candidate.lineMovement !== null
            ? Number(candidate.lineMovement)
            : candidate.movePct !== undefined && candidate.movePct !== null
              ? Number(candidate.movePct)
              : candidate.movement !== undefined && candidate.movement !== null
                ? Number(candidate.movement)
                : null,
        bats: candidate.bats ?? candidate.batSide ?? '',
        reason: candidate.reason ?? candidate.summary ?? candidate.explanation ?? (Array.isArray(candidate.reasons) ? candidate.reasons.join(' • ') : ''),
        tags: Array.isArray(candidate.tags) ? candidate.tags : [candidate.riskTier, candidate.lineupStatus, candidate.injuryStatus].filter(Boolean),
        reasons: Array.isArray(candidate.reasons) ? candidate.reasons : [],
        warnings: Array.isArray(candidate.warnings) ? candidate.warnings : [],
        recentForm,
        scoreBreakdown,
        injuryStatus: candidate.injuryStatus ?? 'unknown',
        headshot: candidate.headshot ?? candidate.imageUrl ?? candidate.playerImage ?? (candidate.playerId ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_80,q_auto:best/v1/people/${candidate.playerId}/headshot/67/current` : ''),
        raw: candidate,
      } as any;

      if (!grouped.has(String(gameKey))) grouped.set(String(gameKey), []);
      grouped.get(String(gameKey))!.push(row);
    });

    return Array.from(grouped.entries()).map(([gameId, rows]) => {
      const firstRow = rows[0] ?? {};
      const team = firstRow.team ?? '';
      const opponent = firstRow.opponent ?? firstRow.pTeam ?? firstRow.pitcherTeam ?? '';
      const matchupLabel = team && opponent ? `${team} vs ${opponent}` : String(gameId);

      return {
        id: gameId,
        gameId,
        matchup: matchupLabel,
        label: matchupLabel,
        rows,
      };
    }) as any[];
  }, [board, boardMode, confirmedCandidates, projectedCandidates]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      const rows = Array.isArray(g.rows) ? g.rows : [];
      rows.forEach((r) => {
        if (r?.team) set.add(r.team);
      });
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [games]);
  const isVercelSafePartial =
    (board as any)?.dataQuality === 'vercel_safe_partial' ||
    (board as any)?.runtime === 'vercel_standalone_no_server_imports';


  const truthCounts = (board as any)?.counts ?? {};
  const truthSummary = (board as any)?.truthSummary ?? {};
  const candidateBuckets = (board as any)?.candidateBuckets ?? {};

  const confirmedCount =
    Number(truthCounts.confirmedCandidates ?? confirmedCandidates.length ?? 0);

  const projectedCount =
    Number(truthCounts.projectedCandidates ?? projectedCandidates.length ?? 0);

  const allProjectedCount = allProjectedCandidates.length;

  const hiddenProjectedCount =
    Number(
      truthCounts.hiddenProjectedCandidates ??
      Math.max(
        0,
        Number(previewMeta?.eligiblePreviewPoolCount ?? 0) -
          Number(previewMeta?.projectedPreviewCount ?? previewMeta?.scoredPreviewPoolCount ?? 0)
      )
    );

  const blockedCount =
    Number(truthCounts.blockedPlayers ?? candidateBuckets?.blocked?.length ?? 0);

  const totalTruthPool =
    Number(truthCounts.totalTruthPool ?? confirmedCount + projectedCount + hiddenProjectedCount + blockedCount);

  const totalVisiblePool =
    Number(truthCounts.totalVisiblePool ?? confirmedCount + projectedCount);

  const displayedPreviewCount = projectedCount;
  const totalPreviewPool =
    previewMeta?.eligiblePreviewPoolCount ??
    truthCounts.eligiblePreviewPoolCount ??
    previewMeta?.scoredPreviewPoolCount ??
    displayedPreviewCount;

  return {
    previewMeta,
    boardMode,
    confirmedCandidates,
    projectedCandidates,
    allProjectedCandidates,
    selectedProjectedCandidates,
    games,
    teams,
    isVercelSafePartial,
    truthCounts,
    truthSummary,
    candidateBuckets,
    confirmedCount,
    projectedCount,
    allProjectedCount,
    hiddenProjectedCount,
    blockedCount,
    totalTruthPool,
    totalVisiblePool,
    displayedPreviewCount,
    totalPreviewPool,
  };
}
