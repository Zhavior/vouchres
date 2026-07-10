import { UnifiedPlayerCard } from '../player/UnifiedPlayerCard';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';

/** Landing spotlight — same pro card shell as Home Run Intelligence board. */
export default function LandingHrSpotlightCard({ player }: { player: HrWatchRow }) {
  return (
    <UnifiedPlayerCard
      player={player}
      className="ve-landing-hr-card"
      showVouchExplainer={false}
    />
  );
}
