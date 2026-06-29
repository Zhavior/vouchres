import type { HrCandidate } from "./hrEngineTypes";

const TOP20_LIMITS = {
  team: 3,
  gamePk: 4,
  pitcher: 4,
  venue: 6,
};

function bumpCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function getCount(map: Map<string, number>, key: string) {
  return map.get(key) ?? 0;
}

function teamKey(candidate: HrCandidate) {
  return candidate.team || "unknown-team";
}

function gameKey(candidate: HrCandidate) {
  return String(candidate.gamePk ?? "unknown-game");
}

function pitcherKey(candidate: HrCandidate) {
  return candidate.opponentPitcherName || "unknown-pitcher";
}

function venueKey(candidate: HrCandidate) {
  return candidate.venue || "unknown-venue";
}

function applySoftDiversityPenalty(candidate: HrCandidate, counts: {
  team: Map<string, number>;
  gamePk: Map<string, number>;
  pitcher: Map<string, number>;
  venue: Map<string, number>;
}) {
  let penalty = 0;

  const teamCount = getCount(counts.team, teamKey(candidate));
  const gameCount = getCount(counts.gamePk, gameKey(candidate));
  const pitcherCount = getCount(counts.pitcher, pitcherKey(candidate));
  const venueCount = getCount(counts.venue, venueKey(candidate));

  if (teamCount >= 5) penalty += 12 + (teamCount - 5) * 4;
  if (gameCount >= 8) penalty += 10 + (gameCount - 8) * 3;
  if (pitcherCount >= 6) penalty += 5 + (pitcherCount - 6) * 2;
  if (venueCount >= 8) penalty += 4 + (venueCount - 8) * 2;

  return penalty;
}

export function rankHrCandidates(candidates: HrCandidate[], previewLimit = 50) {
  const safeLimit = Math.max(10, Math.min(350, previewLimit));

  const ranked = [...candidates].sort((a, b) => {
    if (b.hrScore !== a.hrScore) return b.hrScore - a.hrScore;
    if (b.dataConfidence !== a.dataConfidence) return b.dataConfidence - a.dataConfidence;
    return a.playerName.localeCompare(b.playerName);
  });

  const projectedCandidates: HrCandidate[] = [];
  const usedIndices = new Set<number>();
  const top20Counts = {
    team: new Map<string, number>(),
    gamePk: new Map<string, number>(),
    pitcher: new Map<string, number>(),
    venue: new Map<string, number>(),
  };

  for (let index = 0; index < ranked.length && projectedCandidates.length < Math.min(20, safeLimit); index += 1) {
    const candidate = ranked[index];
    const teamCount = getCount(top20Counts.team, teamKey(candidate));
    const gameCount = getCount(top20Counts.gamePk, gameKey(candidate));
    const pitcherCount = getCount(top20Counts.pitcher, pitcherKey(candidate));
    const venueCount = getCount(top20Counts.venue, venueKey(candidate));

    if (teamCount >= TOP20_LIMITS.team) continue;
    if (gameCount >= TOP20_LIMITS.gamePk) continue;
    if (pitcherCount >= TOP20_LIMITS.pitcher) continue;
    if (venueCount >= TOP20_LIMITS.venue) continue;

    projectedCandidates.push(candidate);
    usedIndices.add(index);
    bumpCount(top20Counts.team, teamKey(candidate));
    bumpCount(top20Counts.gamePk, gameKey(candidate));
    bumpCount(top20Counts.pitcher, pitcherKey(candidate));
    bumpCount(top20Counts.venue, venueKey(candidate));
  }

  for (let index = 0; index < ranked.length && projectedCandidates.length < Math.min(20, safeLimit); index += 1) {
    if (usedIndices.has(index)) continue;
    projectedCandidates.push(ranked[index]);
    usedIndices.add(index);
  }

  const tailCounts = {
    team: new Map<string, number>(top20Counts.team),
    gamePk: new Map<string, number>(top20Counts.gamePk),
    pitcher: new Map<string, number>(top20Counts.pitcher),
    venue: new Map<string, number>(top20Counts.venue),
  };

  while (projectedCandidates.length < safeLimit && usedIndices.size < ranked.length) {
    let bestIndex = -1;
    let bestEffectiveScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < ranked.length; index += 1) {
      if (usedIndices.has(index)) continue;

      const candidate = ranked[index];
      const penalty = applySoftDiversityPenalty(candidate, tailCounts);
      const tieBreaker = (ranked.length - index) / 10000;
      const effectiveScore = candidate.hrScore - penalty + tieBreaker;

      if (effectiveScore > bestEffectiveScore) {
        bestEffectiveScore = effectiveScore;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) break;

    const candidate = ranked[bestIndex];
    projectedCandidates.push(candidate);
    usedIndices.add(bestIndex);
    bumpCount(tailCounts.team, teamKey(candidate));
    bumpCount(tailCounts.gamePk, gameKey(candidate));
    bumpCount(tailCounts.pitcher, pitcherKey(candidate));
    bumpCount(tailCounts.venue, venueKey(candidate));
  }

  return {
    ranked,
    projectedCandidates,
    previewLimit: safeLimit,
  };
}
