import type { NormalizedPlayerPayload } from '../../adapters/normalized';
import { AuroraDecisionSurface } from '../aurora/decision/AuroraDecisionSurface';
import { buildAuroraPlayerDecision, type PlayerResearchMeta } from './buildAuroraPlayerDecision';

interface PlayerResearchDecisionCardProps {
  payload: NormalizedPlayerPayload;
  research?: PlayerResearchMeta;
  deepResearchId?: string;
}

export function PlayerResearchDecisionCard({
  payload,
  research,
  deepResearchId = 'aurora-deep-research',
}: PlayerResearchDecisionCardProps) {
  const decision = buildAuroraPlayerDecision(payload, research);

  return <AuroraDecisionSurface decision={decision} deepResearchId={deepResearchId} />;
}

export default PlayerResearchDecisionCard;
