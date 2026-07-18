import { Menu, Scale, LayoutDashboard, Home, BadgeCheck } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export function AppNav({ activeSection, onNavigate }: AppNavProps) {
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const feedActive = activeSection === 'feed';
  const judgesActive = activeSection === 'judge_home';
  const vouchActive = activeSection === 'board';
  const todayActive = activeSection === 'today';

  return (
    <nav
      className="ve-mobile-app-dock ve-safe-bottom fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#05070b]/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile app navigation"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch px-1">
        <DockButton
          label="Home Feed"
          shortLabel="Home"
          active={feedActive}
          icon={Home}
          onClick={() => onNavigate('feed')}
          onPreload={() => preloadSection('feed')}
        />
        <DockButton
          label="Judges"
          shortLabel="Judges"
          active={judgesActive}
          icon={Scale}
          onClick={() => onNavigate('judge_home')}
          onPreload={() => preloadSection('judge_home')}
        />
        <DockButton
          label="Vouch Board"
          shortLabel="Board"
          active={vouchActive}
          icon={BadgeCheck}
          onClick={() => onNavigate('board')}
          onPreload={() => preloadSection('board')}
          centerAction
        />
        <DockButton
          label="Today"
          shortLabel="Today"
          active={todayActive}
          icon={LayoutDashboard}
          onClick={() => onNavigate('today')}
          onPreload={() => preloadSection('today')}
        />
        <button
          type="button"
          onClick={openMobileDrawer}
          aria-label="Open navigation menu"
          title="Menu"
          className="ve-touch-target z8-interactive flex min-w-0 flex-col items-center justify-center gap-0.5 text-white/55 transition-colors active:scale-95 active:text-white"
        >
          <Menu className="h-5 w-5" strokeWidth={1.9} />
          <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}

function DockButton({
  label,
  shortLabel,
  active,
  icon: Icon,
  onClick,
  onPreload,
  centerAction = false,
}: {
  label: string;
  shortLabel: string;
  active: boolean;
  icon: typeof Home;
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
      className={`ve-touch-target z8-interactive relative flex min-w-0 flex-col items-center justify-center gap-0.5 transition active:scale-95 ${active ? 'text-white' : 'text-white/55'}`}
    >
      <span className={centerAction ? 'flex h-7 w-7 items-center justify-center rounded-lg border border-white/60' : undefined}>
        <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 1.9} />
      </span>
      <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-none">{shortLabel}</span>
      {active ? <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-white" aria-hidden="true" /> : null}
    </button>
  );
}
