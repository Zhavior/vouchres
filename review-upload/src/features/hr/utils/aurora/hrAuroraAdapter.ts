import { analyzeAurora } from '../../../../lib/aurora/analyze';
import { createEvidence } from '../../../../lib/aurora/evidence';
import { createRisk } from '../../../../lib/aurora/risks';

import type { HrWatchRow } from '../../types/hrWatch';

export function analyzeHrPlayer(player: HrWatchRow) {
  const evidence = player.reasons.map((reason, index) =>
    createEvidence(
      `Reason ${index + 1}`,
      reason,
      20,
    ),
  );

  const risks = player.warnings.map((warning) =>
    createRisk(
      'Risk',
      warning,
      'medium',
    ),
  );

  return analyzeAurora({
    sport: 'MLB',
    market: 'Home Run',

    playerId:
      player.playerId == null
        ? undefined
        : String(player.playerId),

    playerName: player.playerName,

    evidence,
    risks,
  });
}
