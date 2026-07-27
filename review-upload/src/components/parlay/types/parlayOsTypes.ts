/**
 * Shared discriminated unions for ParlayOS surfaces
 *
 * Judge panel synthesis:
 * - Judge 12: status fields must be shared exported types, not inline string literals
 * - Judge 4:  OptimisticSaveState as discriminated union, not independent booleans
 * - Judge 11: LegLifecycleStatus adds IN_PROGRESS intermediate state
 * - Judge 7:  StatusMeta pairs every status with icon + text (not color-only)
 */

// ─── Leg grading status ────────────────────────────────────────────────────────

export type LegGradeStatus =
  | 'pending'
  | 'in_progress'   // Judge 11: live, stat is being tracked
  | 'won'
  | 'lost'
  | 'push'
  | 'void'
  | 'cancelled'
  | 'error';

// ─── Slip (parlay) lifecycle status ───────────────────────────────────────────

export type SlipLifecycleStatus =
  | 'UPCOMING'      // before lock window
  | 'LIVE'          // within LOCK_MINUTES of earliest start, or confirmed started
  | 'FINAL';        // graded (won/lost/void/cancelled)

export type SlipGradeStatus =
  | 'pending'
  | 'live'
  | 'won'
  | 'lost'
  | 'push'
  | 'void'
  | 'cancelled';

// ─── Optimistic save state (discriminated union) ───────────────────────────────

export type OptimisticSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'posting' }
  | { status: 'error'; message: string; failedAt: number }
  | { status: 'saved'; lastSavedAt: number };

// ─── Draft mode (AI/manual mutex) ─────────────────────────────────────────────

export type DraftMode = 'manual' | 'ai_locked';

export type DraftModeResolution = 'manual' | 'ai_locked' | 'blocked';

/** Pure resolver — the single gate for all addLeg calls */
export function resolveDraftMode(
  existingLegs: { source: string }[],
  incoming: { source: string },
): DraftModeResolution {
  const hasAiLegs = existingLegs.some((l) => l.source === 'vai' || l.source === 'ai_pick');
  const incomingIsAi = incoming.source === 'vai' || incoming.source === 'ai_pick';

  if (hasAiLegs && !incomingIsAi) return 'blocked'; // can't mix AI + manual
  if (!hasAiLegs && incomingIsAi && existingLegs.length > 0) return 'blocked'; // can't add AI to a manual slip
  if (incomingIsAi) return 'ai_locked';
  return 'manual';
}

// ─── Status display metadata (Judge 7: icon + text, not color-only) ──────────

export interface StatusMeta {
  icon:  string;
  label: string;
  token: string;   // legacy --ve-* or Z8 status token; resolve with z8StatusColor()
}

export const LEG_STATUS_META: Record<LegGradeStatus, StatusMeta> = {
  pending:     { icon: '…',  label: 'Pending',      token: '--ve-text-muted' },
  in_progress: { icon: '▶',  label: 'Live',          token: '--ve-accent-cyan' },
  won:         { icon: '✓',  label: 'Won',           token: '--ve-success' },
  lost:        { icon: '✕',  label: 'Lost',          token: '--ve-danger' },
  push:        { icon: '–',  label: 'Push',          token: '--ve-text-muted' },
  void:        { icon: '–',  label: 'Void',          token: '--ve-text-muted' },
  cancelled:   { icon: '✕',  label: 'Cancelled',     token: '--ve-text-muted' },
  error:       { icon: '⚠',  label: 'Error',         token: '--ve-warning' },
};

export const SLIP_STATUS_META: Record<SlipGradeStatus, StatusMeta> = {
  pending:   { icon: '…',  label: 'Pending',  token: '--ve-text-muted' },
  live:      { icon: '▶',  label: 'Live',     token: '--ve-accent-cyan' },
  won:       { icon: '✓',  label: 'Won',      token: '--ve-success' },
  lost:      { icon: '✕',  label: 'Lost',     token: '--ve-danger' },
  push:      { icon: '–',  label: 'Push',     token: '--ve-text-muted' },
  void:      { icon: '–',  label: 'Void',     token: '--ve-text-muted' },
  cancelled: { icon: '✕',  label: 'Cancelled', token: '--ve-text-muted' },
};

// ─── Parlay risk mode ──────────────────────────────────────────────────────────

export type ParlayRiskMode = 'focused' | 'balanced' | 'aggressive' | 'moonshot';

export const RISK_MODE_META: Record<ParlayRiskMode, { label: string; sub: string; legs: string; token: string }> = {
  focused:    { label: 'Focused',    sub: '2 legs · disciplined',  legs: '2',  token: '--ve-success' },
  balanced:   { label: 'Balanced',   sub: '3 legs · mixed risk',   legs: '3',  token: '--ve-accent-cyan' },
  aggressive: { label: 'Aggressive', sub: '4 legs · higher risk',  legs: '4',  token: '--ve-accent-gold' },
  moonshot:   { label: 'Moonshot',   sub: '5+ legs · high reward', legs: '5+', token: '--ve-accent-pink' },
};

// ─── DFS context per leg (Judge 8) ────────────────────────────────────────────

export interface DfsLegContext {
  floor:       number;
  projection:  number;
  ceiling:     number;
  salary?:     number;
  salaryTier?: 'value' | 'core' | 'premium';
}

// ─── Correlation flag (Judges 2 + 8) ─────────────────────────────────────────

export type CorrelationFlag =
  | 'same_game_risk'   // accidental — same gameId + related markets
  | 'intentional_stack' // DFS stack — 3+ legs same team+game (positive framing)
  | 'signal_overlap';  // same underlying signal driving 2+ legs

export interface CorrelationWarning {
  flag:    CorrelationFlag;
  legIds:  string[];
  message: string;
}

// ─── Judge verdict ─────────────────────────────────────────────────────────────

export type JudgeTier = 'excellent' | 'solid' | 'caution' | 'risky' | 'reject';

export type DecisionFindingSeverity = 'info' | 'caution' | 'high';

export interface DecisionFinding {
  id: string;
  severity: DecisionFindingSeverity;
  message: string;
  legIds: string[];
}

export interface HighestRiskLeg {
  id: string;
  label: string;
  reasons: string[];
}

export interface SaferConstruction {
  title: string;
  description: string;
  moveToWaitingLegId: string;
}

export interface JudgeVerdict {
  tier:          JudgeTier;
  score:         number;  // 0-100
  headline:      string;
  reasons:       string[];
  weakLegIds:    string[];
  correlations:  CorrelationWarning[];
  findings:      DecisionFinding[];
  highestRiskLeg: HighestRiskLeg | null;
  saferConstruction: SaferConstruction | null;
  reviewLabel: string;
}

/** Review visible slip structure only. This is not a probability or model-confidence score. */
export function computeJudgeVerdict(legs: {
  id: string;
  playerName?: string | null;
  selection?: string | null;
  playerId?: string | number | null;
  confidence?: number | null;
  gameId?: string | number | null;
  gamePk?: string | number | null;
  teamId?: string | number | null;
  marketCode?: string | null;
  odds?: string | number | null;
  dataStatus?: 'official' | 'projected' | 'waiting' | 'unknown' | string | null;
  riskSnapshot?: string | null;
  source: string;
}[]): JudgeVerdict {
  if (legs.length === 0) {
    return {
      tier: 'solid', score: 0,
      headline: 'Add a researched leg to begin the structure review.',
      reasons: ['No slip structure is available to review yet.'],
      weakLegIds: [], correlations: [], findings: [],
      highestRiskLeg: null, saferConstruction: null,
      reviewLabel: 'Not reviewed',
    };
  }

  const findings: DecisionFinding[] = [];
  const legRisk = new Map<string, { score: number; reasons: string[] }>(
    legs.map((leg) => [leg.id, { score: 0, reasons: [] }]),
  );
  const flagLeg = (legId: string, points: number, reason: string) => {
    const risk = legRisk.get(legId);
    if (!risk) return;
    risk.score += points;
    if (!risk.reasons.includes(reason)) risk.reasons.push(reason);
  };

  for (const leg of legs) {
    const missingIdentity = !leg.playerId || !(leg.gamePk ?? leg.gameId) || !leg.marketCode;
    if (missingIdentity) {
      findings.push({ id: `identity-${leg.id}`, severity: 'high', message: `${leg.playerName ?? leg.selection ?? 'A leg'} is missing grading identity.`, legIds: [leg.id] });
      flagLeg(leg.id, 5, 'Missing player, game, or market identity');
    }

    const dataStatus = String(leg.dataStatus ?? 'unknown').toLowerCase();
    if (dataStatus === 'projected') {
      findings.push({ id: `projected-${leg.id}`, severity: 'caution', message: `${leg.playerName ?? leg.selection ?? 'A leg'} still uses projected data.`, legIds: [leg.id] });
      flagLeg(leg.id, 2, 'Lineup or game data is projected');
    } else if (dataStatus === 'waiting' || dataStatus === 'unknown') {
      findings.push({ id: `unconfirmed-${leg.id}`, severity: 'caution', message: `${leg.playerName ?? leg.selection ?? 'A leg'} does not have confirmed data status.`, legIds: [leg.id] });
      flagLeg(leg.id, 3, 'Confirmation status is unavailable');
    }

    if (leg.odds == null || String(leg.odds).trim() === '') {
      findings.push({ id: `odds-${leg.id}`, severity: 'caution', message: `${leg.playerName ?? leg.selection ?? 'A leg'} has no current odds.`, legIds: [leg.id] });
      flagLeg(leg.id, 2, 'Current odds are unavailable');
    }

    if (leg.riskSnapshot?.trim()) flagLeg(leg.id, 1, leg.riskSnapshot.trim());
    if (typeof leg.confidence === 'number' && Number.isFinite(leg.confidence) && leg.confidence < 55) {
      findings.push({ id: `confidence-${leg.id}`, severity: 'caution', message: `${leg.playerName ?? leg.selection ?? 'A leg'} has a recorded confidence below 55%.`, legIds: [leg.id] });
      flagLeg(leg.id, 2, 'Recorded confidence is below 55%');
    }
  }

  // Correlation detection
  const correlations: CorrelationWarning[] = [];
  const byGame: Record<string, string[]> = {};
  for (const l of legs) {
    const gk = String(l.gameId ?? l.gamePk ?? '');
    if (gk) { byGame[gk] = [...(byGame[gk] ?? []), l.id]; }
  }
  for (const [, ids] of Object.entries(byGame)) {
    if (ids.length >= 2) {
      // Check if it's an intentional stack (3+ same team)
      const stackLegs = legs.filter((l) => ids.includes(l.id));
      const byTeam: Record<string, string[]> = {};
      for (const l of stackLegs) {
        const tk = String(l.teamId ?? '');
        if (tk) { byTeam[tk] = [...(byTeam[tk] ?? []), l.id]; }
      }
      const stackTeam = Object.values(byTeam).find((arr) => arr.length >= 3);
      if (stackTeam) {
        correlations.push({
          flag: 'intentional_stack',
          legIds: stackTeam,
          message: `${stackTeam.length}-man stack — correlated upside AND downside on one team.`,
        });
        stackTeam.forEach((id) => flagLeg(id, 1, 'Repeated same-team and same-game exposure'));
      } else {
        correlations.push({
          flag: 'same_game_risk',
          legIds: ids,
          message: `${ids.length} legs share the same game — outcomes are correlated. Real diversification is lower than it looks.`,
        });
        ids.forEach((id) => flagLeg(id, 1, 'Shares a game environment with another leg'));
      }
    }
  }

  correlations.forEach((correlation, index) => findings.push({
    id: `correlation-${index}`,
    severity: 'caution',
    message: correlation.message,
    legIds: correlation.legIds,
  }));

  const byPlayer = new Map<string, string[]>();
  const byTeam = new Map<string, string[]>();
  for (const leg of legs) {
    if (leg.playerId != null) {
      const key = String(leg.playerId);
      byPlayer.set(key, [...(byPlayer.get(key) ?? []), leg.id]);
    }
    if (leg.teamId != null) {
      const key = String(leg.teamId);
      byTeam.set(key, [...(byTeam.get(key) ?? []), leg.id]);
    }
  }
  for (const ids of byPlayer.values()) {
    if (ids.length < 2) continue;
    findings.push({ id: `duplicate-player-${ids.join('-')}`, severity: 'high', message: 'The same player appears more than once, creating duplicate exposure.', legIds: ids });
    ids.forEach((id) => flagLeg(id, 4, 'Duplicate player exposure'));
  }
  for (const ids of byTeam.values()) {
    if (ids.length < 3) continue;
    findings.push({ id: `team-exposure-${ids.join('-')}`, severity: 'caution', message: `${ids.length} legs depend on the same team environment.`, legIds: ids });
    ids.forEach((id) => flagLeg(id, 1, 'Heavy same-team exposure'));
  }

  const hrLegIds = legs.filter((leg) => String(leg.marketCode ?? '').toUpperCase() === 'ANYTIME_HR').map((leg) => leg.id);
  if (hrLegIds.length >= 3) {
    findings.push({ id: 'hr-concentration', severity: 'caution', message: `${hrLegIds.length} home-run legs create concentrated high-variance exposure.`, legIds: hrLegIds });
    hrLegIds.forEach((id) => flagLeg(id, 1, 'Slip is concentrated in home-run outcomes'));
  }
  if (legs.length > 4) {
    findings.push({ id: 'leg-count', severity: 'high', message: `${legs.length} legs materially increase variance; more legs do not create more edge.`, legIds: legs.map((leg) => leg.id) });
    legs.forEach((leg) => flagLeg(leg.id, 1, 'Five-plus-leg construction'));
  }

  const penalty = findings.reduce((total, finding) => total + (finding.severity === 'high' ? 14 : finding.severity === 'caution' ? 7 : 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  const highFindingCount = findings.filter((finding) => finding.severity === 'high').length;
  const tier: JudgeTier =
    findings.length === 0 ? 'excellent' :
    highFindingCount === 0 && score >= 82 ? 'solid' :
    score >= 60 ? 'caution' :
    score >= 38 ? 'risky' : 'reject';

  const headlines: Record<JudgeTier, string> = {
    excellent: 'No structural warnings detected from the available slip data.',
    solid:     'The structure is workable, with a small number of checks remaining.',
    caution:   'Resolve the highlighted confirmations or concentration before saving.',
    risky:     'This construction has multiple compounding risk flags.',
    reject:    'The current structure is not decision-ready without major review.',
  };

  const rankedLegs = legs
    .map((leg) => ({ leg, ...(legRisk.get(leg.id) ?? { score: 0, reasons: [] }) }))
    .sort((a, b) => b.score - a.score);
  const highest = rankedLegs[0];
  const highestRiskLeg = highest && highest.score > 0 ? {
    id: highest.leg.id,
    label: highest.leg.playerName ?? highest.leg.selection ?? 'Flagged leg',
    reasons: highest.reasons,
  } : null;
  const weakLegIds = rankedLegs.filter((item) => item.score >= 3).map((item) => item.leg.id);
  const reasons = findings.length > 0
    ? findings.map((finding) => finding.message)
    : ['No duplicate, concentration, confirmation, identity, or odds warnings were detected.'];
  const saferConstruction = highestRiskLeg && legs.length >= 2 ? {
    title: `Move ${highestRiskLeg.label} to Waiting`,
    description: `Removes the most evidence-flagged leg from active odds and risk calculations until its checks are resolved.`,
    moveToWaitingLegId: highestRiskLeg.id,
  } : null;

  return {
    tier,
    score,
    headline: headlines[tier],
    reasons,
    weakLegIds,
    correlations,
    findings,
    highestRiskLeg,
    saferConstruction,
    reviewLabel: 'Structure score',
  };
}

// ─── Combined odds utility (Judge 2) ──────────────────────────────────────────

export function computeCombinedOdds(legs: { odds?: number | string | null }[]): {
  decimal: number;
  american: string;
} | null {
  const decimalOdds = legs.map((l) => {
    const raw = Number(l.odds);
    if (!Number.isFinite(raw) || raw === 0) return null;
    // If it looks like American odds (|value| >= 100 or negative)
    if (Math.abs(raw) >= 100 || raw < 0) {
      return raw >= 0 ? (raw / 100) + 1 : (100 / Math.abs(raw)) + 1;
    }
    return raw; // already decimal
  });

  if (decimalOdds.some((d) => d === null)) return null;

  const combined = (decimalOdds as number[]).reduce((p, d) => p * d, 1);
  const american = combined >= 2
    ? `+${Math.round((combined - 1) * 100)}`
    : `-${Math.round(100 / (combined - 1))}`;

  return { decimal: Math.round(combined * 100) / 100, american };
}
