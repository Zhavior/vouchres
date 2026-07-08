import type {
  AiCreatorCandidate,
  AiCreatorComparator,
  AiCreatorIdentity,
  AiCreatorIdentityResult,
} from './aiCreatorTypes';

function normalizeComparatorKey(comparator: AiCreatorComparator): 'GTE' | 'LTE' | 'EQ' {
  if (comparator === '>=') return 'GTE';
  if (comparator === '<=') return 'LTE';
  return 'EQ';
}

function cleanId(value: unknown): string {
  return String(value ?? '').trim();
}

function buildIdentity(candidate: AiCreatorCandidate): AiCreatorIdentity {
  const gameId = cleanId(candidate.gameId || candidate.gamePk);
  const gamePk = cleanId(candidate.gamePk || candidate.gameId);
  const playerId = cleanId(candidate.playerId);
  const teamId = cleanId(candidate.teamId);
  const marketCode = candidate.marketCode;
  const statTarget = Number(candidate.statTarget);
  const comparator = candidate.comparator;
  const comparatorKey = normalizeComparatorKey(comparator);

  return {
    sport: candidate.sport,
    gameId,
    gamePk,
    playerId,
    teamId,
    marketCode,
    statTarget,
    comparator,
    eventKey: [candidate.sport, gameId, teamId, playerId, marketCode, statTarget, comparatorKey].join('_'),
    popularityKey: [candidate.sport, playerId, marketCode, statTarget, comparatorKey].join('_'),
    externalProvider: candidate.externalProvider,
  };
}

export function attachAiCreatorIdentity(candidate: AiCreatorCandidate): AiCreatorIdentityResult {
  const identity = buildIdentity(candidate);

  if (candidate.sport !== 'MLB') {
    return { ok: false, rejected: { candidate, reason: 'Unsupported sport' } };
  }

  if (!identity.gameId) {
    return { ok: false, rejected: { candidate, reason: 'Missing gameId' } };
  }

  if (!identity.playerId) {
    return { ok: false, rejected: { candidate, reason: 'Missing playerId' } };
  }

  if (!identity.marketCode) {
    return { ok: false, rejected: { candidate, reason: 'Missing marketCode' } };
  }

  if (!Number.isFinite(identity.statTarget) || identity.statTarget <= 0) {
    return { ok: false, rejected: { candidate, reason: 'Invalid statTarget' } };
  }

  if (!identity.eventKey.includes(identity.playerId)) {
    return { ok: false, rejected: { candidate, reason: 'Invalid eventKey identity' } };
  }

  return {
    ok: true,
    candidate,
    identity,
  };
}

export function attachAiCreatorIdentities(candidates: AiCreatorCandidate[]): AiCreatorIdentityResult[] {
  return candidates.map(attachAiCreatorIdentity);
}
