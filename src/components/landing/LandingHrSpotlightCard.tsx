import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import UnifiedPlayerCard from '../player/UnifiedPlayerCard';

/** @deprecated Import UnifiedPlayerCard directly */
export default function LandingHrSpotlightCard({ player }: { player: HrWatchRow }) {
  return <UnifiedPlayerCard player={player} showVouchExplainer />;
}
