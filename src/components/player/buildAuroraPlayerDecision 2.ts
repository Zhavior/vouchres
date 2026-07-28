import type { NormalizedPlayerPayload } from '../../adapters/normalized';
import type {
  AuroraDecisionPresentation,
  AuroraEvidenceMetric,
  AuroraTrustPresentation,
} from '../aurora/decision/types';

export interface PlayerResearchMeta {
  source: string | null;
  updatedAt: string | null;
  warnings: string[];
}

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function clean(values: string[] | null | undefined, limit: number): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function metric(
  id: string,
  label: string,
  value: number | null | undefined,
  detail: string,
  format: (input: number) => string = String,
): AuroraEvidenceMetric {
  const resolved = finite(value);
  return {
    id,
    label,
    value: resolved === null ? null : format(resolved),
    detail,
  };
}

function buildTrust(
  payload: NormalizedPlayerPayload,
  research: PlayerResearchMeta,
): AuroraTrustPresentation {
  const { player } = payload;
  const blocked = player.riskLabel?.trim().toLowerCase().includes('blocked') ?? false;
  const source = player.source?.trim() || research.source?.trim() || null;

  if (blocked) {
    return {
      status: 'blocked',
      label: 'Signal blocked',
      detail: 'The upstream signal is blocked and should not be treated as actionable.',
      source,
      updatedAt: research.updatedAt,
    };
  }

  if (player.lineupStatus === 'confirmed') {
    return {
      status: 'confirmed',
      label: 'Confirmed lineup',
      detail: 'The player is attached to a confirmed lineup in the current board payload.',
      source,
      updatedAt: research.updatedAt,
    };
  }

  if (player.lineupStatus === 'projected' || player.lineupStatus === 'projected_unconfirmed') {
    return {
      status: 'projected',
      label: 'Projection preview',
      detail: 'The official lineup is not confirmed. Treat this research as subject to change.',
      source,
      updatedAt: research.updatedAt,
    };
  }

  if (player.dataQuality === 'limited' || player.dataQuality === 'partial' || player.dataQuality === 'projection_preview') {
    return {
      status: 'limited',
      label: 'Limited evidence',
      detail: 'Some expected inputs are missing or incomplete in the current payload.',
      source,
      updatedAt: research.updatedAt,
    };
  }

  return {
    status: 'unavailable',
    label: 'Lineup status unavailable',
    detail: 'The current payload does not establish a confirmed or projected lineup state.',
    source,
    updatedAt: research.updatedAt,
  };
}

export function buildAuroraPlayerDecision(
  payload: NormalizedPlayerPayload,
  research: PlayerResearchMeta = { source: null, updatedAt: null, warnings: [] },
): AuroraDecisionPresentation {
  const { player, matchup, recentForm, scoreBreakdown } = payload;
  const reasons = clean(player.reasons, 3);
  const risks = clean([...(player.warnings ?? []), ...research.warnings], 3);
  const trust = buildTrust(payload, research);
  const score = finite(scoreBreakdown?.finalScore) ?? finite(player.hrEdge);
  const confidence = finite(player.dataConfidence);

  const title = trust.status === 'blocked'
    ? 'Signal blocked'
    : trust.status === 'projected'
      ? 'Preview — lineup pending'
      : player.grade?.trim()
        ? `${player.grade.trim()} research grade`
        : player.riskLabel?.trim()
          ? `${player.riskLabel.trim()} research tier`
          : score === null
            ? 'Decision unavailable'
            : 'Current research snapshot';

  return {
    player: {
      name: player.playerName?.trim() || 'Unknown player',
      team: player.team?.trim() || null,
      opponent: player.opponent?.trim() || null,
      pitcher: player.opponentPitcherName?.trim() || null,
      headshot: player.headshot?.trim() || null,
    },
    answer: {
      eyebrow: trust.status === 'projected' ? 'Projection preview' : 'Current answer',
      title,
      summary: reasons[0] || 'No model rationale was supplied for this player.',
      score,
      confidence,
      actionLabel: trust.status === 'projected' ? 'Review preview evidence' : 'Review deep research',
    },
    reasons,
    risks,
    evidence: [
      metric('hr-edge', 'HR edge', player.hrEdge, 'Upstream HR Board model output'),
      metric(
        'pitcher-vulnerability',
        'Pitcher vulnerability',
        scoreBreakdown?.pitcherVulnerability ?? matchup?.pitcherVulnerability,
        'Current matchup model input',
      ),
      metric('recent-power', 'Recent power', recentForm?.recentPowerScore, 'Recent-form model input'),
      metric(
        'weather-boost',
        'Weather adjustment',
        matchup?.weatherBoost,
        'Current environment adjustment',
        (value) => `${value > 0 ? '+' : ''}${value}%`,
      ),
    ],
    trust,
  };
}
