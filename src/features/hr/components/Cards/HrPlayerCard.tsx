/**
 * HrPlayerCard — universal player card for HR board and all HrWatchRow surfaces.
 * Renders UnifiedPlayerCard with board interaction hooks.
 */

import React from 'react';
import { UnifiedPlayerCard, type HrCardResult } from '../../../../components/player/UnifiedPlayerCard';
import type { HrWatchRow } from '../../types/hrWatch';

export type { HrWatchRow } from '../../types/hrWatch';
export type { HrCardResult } from '../../../../components/player/UnifiedPlayerCard';

/** @deprecated use TruthStatus from hrWatch */
export type HrTruthStatus = 'official' | 'projected' | 'blocked' | string;
/** @deprecated use RiskTier from hrWatch */
export type HrRiskTier = 'elite' | 'strong' | 'watch' | 'sleeper' | 'fade' | string;

export interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick?: (player: HrWatchRow) => void;
  onViewProfile?: (player: HrWatchRow) => void;
  hrResult?: HrCardResult;
}

export const HrPlayerCard: React.FC<HrPlayerCardProps> = ({ player, onClick, onViewProfile, hrResult = null }) => (
  <UnifiedPlayerCard
    player={player}
    onClick={onClick}
    onViewProfile={onViewProfile}
    hrResult={hrResult}
    showVouchExplainer
  />
);

export default React.memo(HrPlayerCard);
