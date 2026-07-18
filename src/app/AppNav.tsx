import { Menu, Flame, LayoutDashboard, Home, BadgeCheck } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export function AppNav({ activeSection, onNavigate }: AppNavProps) {
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const feedActive = activeSection === 'feed';
  const proActive = activeSection === 'pro_command_center';
  const vouchActive = activeSection === 'board';
  const todayActive = activeSection === 'today';

  return (
    <nav
      className="ve-mobile-app-dock ve-safe-bottom fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-ve-obsidian/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile app navigation"
    >
      <div className="mx-auto grid h-14 max-w-md grid-cols-5 items-stretch px-2">
        <DockButton
          label="Home Feed"
          active={feedActive}
          icon={Home}
          onClick={() => onNavigate('feed')}
          onPreload={() => preloadSection('feed')}
        />
        <DockButton
          label="Pro Edges"
          active={proActive}
          icon={Flame}
          onClick={() => onNavigate('pro_command_center')}
          onPreload={() => preloadSection('pro_command_center')}
        />
        <DockButton
          label="Vouch Board"
          active={vouchActive}
          icon={BadgeCheck}
          onClick={() => onNavigate('board')}
          onPreload={() => preloadSection('board')}
          centerAction
        />
        <DockButton
          label="Today"
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
          className="ve-touch-target z8-interactive flex min-w-0 items-center justify-center text-white/55 transition-colors active:scale-95 active:text-white"
        >
          <Menu className="h-6 w-6" strokeWidth={1.9} />
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
      className={`ve-touch-target z8-interactive relative flex min-w-0 items-center justify-center transition active:scale-95 ${active ? 'text-white' : 'text-white/55'}`}
    >
      <span className={centerAction ? 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/60' : undefined}>
        <Icon className="h-6 w-6" strokeWidth={active ? 2.6 : 1.9} />
      </span>
      {active ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" aria-hidden="true" /> : null}
    </button>
  );
}
