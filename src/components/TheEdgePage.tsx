import WelcomePortal from './WelcomePortal';
import EdgeIslandCommandCenter from './theEdge/EdgeIslandCommandCenter';

type TheEdgePageProps = {
  isLoggedIn: boolean;
  onSectionChange: (section: string) => void;
  savedSlips: any[];
};
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
      open={false}
      onClose={() => undefined}
      onSectionChange={onSectionChange}
      savedSlips={savedSlips}
    />
  );
}
