import WelcomePortal from './WelcomePortal';
import TodayDashboard from './TodayDashboard';

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

  return <TodayDashboard onSectionChange={onSectionChange} savedSlips={savedSlips} />;
}
