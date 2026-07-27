import { History, LayoutDashboard, Search, UserCircle } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';
import { useAppProfile } from '../context/AppShellContext';
import { useParlayOsStore } from '../stores/parlayOsStore';
import { isBetaDestinationActive } from './betaNavigation';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export function AppNav({ activeSection, onNavigate }: AppNavProps) {
  const profile = useAppProfile();
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const parlayDockOpen = useParlayOsStore((state) => state.sheetOpen);
  const todayActive = isBetaDestinationActive(activeSection, 'today');
  const researchActive = isBetaDestinationActive(activeSection, 'research');
  const trackRecordActive = isBetaDestinationActive(activeSection, 'track_record');
  const accountActive = isBetaDestinationActive(activeSection, 'account');

  return (
    <nav
      className={`ve-mobile-app-dock ve-safe-bottom fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#05070b]/95 backdrop-blur-xl transition-transform duration-200 md:hidden ${
        parlayDockOpen ? 'translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
      aria-label="Mobile app navigation"
    >
      <div className="mx-auto grid h-14 max-w-md grid-cols-4 items-stretch px-2">
        <DockButton
          label="Today"
          active={todayActive}
          icon={LayoutDashboard}
          onClick={() => onNavigate('today')}
          onPreload={() => preloadSection('today')}
        />
        <DockButton
          label="Research"
          active={researchActive}
          icon={Search}
          onClick={() => onNavigate('hr_board')}
          onPreload={() => preloadSection('hr_board')}
        />
        <DockButton
          label="Track Record"
          active={trackRecordActive}
          icon={History}
          onClick={() => onNavigate('results')}
          onPreload={() => preloadSection('results')}
        />
        <button
          type="button"
          onClick={openMobileDrawer}
          aria-label="Open navigation menu and account"
          aria-current={accountActive ? 'page' : undefined}
          title="Account"
          className="ve-touch-target z8-interactive flex min-w-0 items-center justify-center transition-colors active:scale-95"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Account" className={`h-7 w-7 rounded-full border object-cover bg-black ${accountActive ? 'border-vouch-cyan' : 'border-white/20'}`} />
          ) : (
            <UserCircle className="h-6 w-6 text-white/55 transition-colors active:text-white" strokeWidth={1.9} />
          )}
        </button>
      </div>
    </nav>
  );
}

function DockButton({
  label,
  active,
  icon: Icon,
  onClick,
  onPreload,
  centerAction = false,
}: {
  label: string;
  active: boolean;
  icon: typeof LayoutDashboard;
  onClick: () => void;
  onPreload: () => void;
  centerAction?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPreload}
      onMouseEnter={onPreload}
      onFocus={onPreload}
      aria-label={`Go to ${label}`}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={`ve-touch-target z8-interactive relative flex min-w-0 items-center justify-center transition active:scale-95 ${active ? 'text-white' : 'text-white/55'}`}
    >
      <span className={centerAction ? 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/60' : undefined}>
        <Icon className="h-6 w-6" strokeWidth={active ? 2.6 : 1.9} />
      </span>
      {active ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" aria-hidden="true" /> : null}
    </button>
  );
}
