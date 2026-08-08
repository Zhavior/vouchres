import type { LiveProgressLegResult } from '../../hooks/useParlaySlipLiveProgress';
import { deriveSlipProgress } from '../../lib/parlayLegProgress';
import type { SmartParlayLeg, SmartParlaySlip, SmartParlayStatus } from './smartParlayTypes';

export function mergeLiveProgressIntoSlips(
  slips: SmartParlaySlip[],
  progressByLegId: Map<string, LiveProgressLegResult>,
): SmartParlaySlip[] {
  return slips.map((slip) => {
    let updated = false;
    let hasLiveGame = false;
    let allGamesFinal = slip.legs.length > 0;

    const legs: SmartParlayLeg[] = slip.legs.map((leg) => {
      const progress = progressByLegId.get(leg.id);
      if (!progress) {
        allGamesFinal = false;
        return leg;
      }

      updated = true;
      const gameStatus = String(progress.gameStatus ?? '').toUpperCase();
      const isLive = gameStatus === 'LIVE' || gameStatus === 'IN PROGRESS';
      const isFinal = gameStatus === 'FINAL' || gameStatus === 'GAME OVER';
      hasLiveGame ||= isLive;
      allGamesFinal &&= isFinal;

      return {
        ...leg,
        actual: progress.current ?? leg.actual,
        status: leg.status === 'pending' && isLive ? 'live' : leg.status,
        progress: {
          label: progress.label,
          current: progress.current ?? leg.actual ?? 0,
          target: progress.target,
        },
      };
    });

    if (!updated) return slip;

    let status: SmartParlayStatus = slip.status;
    if (slip.status === 'pending' || slip.status === 'upcoming') {
      if (allGamesFinal) status = 'ready_to_grade';
      else if (hasLiveGame) status = 'live';
    }

    return {
      ...slip,
      legs,
      status,
      slipProgress: deriveSlipProgress(legs.map((leg) => ({ ...leg }))),
    };
  });
}
