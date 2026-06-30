import WelcomePortal from './WelcomePortal';
import EdgeIslandCommandCenter from './theEdge/EdgeIslandCommandCenter';

type TheEdgePageProps = {
  isLoggedIn: boolean;
  onSectionChange: (section: string) => void;
  savedSlips: any[];
};

function triggerEdgeIslandTransition() {
  sessionStorage.setItem("vouchedge_entering_edge_island", "true");
}

export default function TheEdgePage({
  isLoggedIn,
  onSectionChange,
  savedSlips,
}: TheEdgePageProps) {
  if (!isLoggedIn) {
    return <WelcomePortal onSectionChange={onSectionChange} />;
  }

  return (
    <EdgeIslandCommandCenter
      onSectionChange={onSectionChange}
      savedSlips={savedSlips}
    />
  );
}
