import { useEffect, useRef, useState } from 'react';
import { Flame, LayoutDashboard, Home, BadgeCheck, UserCircle } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';
import { useParlayOsStore } from '../stores/parlayOsStore';
import { useAppProfile } from '../context/AppShellContext';
import { Z8_INTERACTIVE } from '../theme/z8Tokens';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

/** Scroll-direction pill collapse: shrinks to icon-only while reading down,
 * expands to the full labeled pill on scroll-up, near the top, or at rest. */
function useScrollCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    const pane = document.getElementById('inner-view-slot');
    if (!pane) return;
    lastScrollY.current = pane.scrollTop;

    const handleScroll = () => {
      const y = pane.scrollTop;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y < 40 || delta < -8) setCollapsed(false);
      else if (delta > 8) setCollapsed(true);

      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setCollapsed(false), 900);
    };

    pane.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      pane.removeEventListener('scroll', handleScroll);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  return collapsed;
}

export function AppNavZ8({ activeSection, onNavigate }: AppNavProps) {
  const profile = useAppProfile();
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);
  const worldChatOpen = useNavUiStore((s) => s.worldChatOpen);
  const parlayDockOpen = useParlayOsStore((s) => s.sheetOpen);
  const collapsed = useScrollCollapse();
  // The bottom nav pill, ParlayOS dock, and World Chat panel all fight over
  // the same mobile screen real estate — only one can be up at a time.
  const hideDock = parlayDockOpen || worldChatOpen;

  const feedActive = activeSection === 'feed';
  const proActive = activeSection === 'pro_command_center';
  const vouchActive = activeSection === 'board';
  const todayActive = activeSection === 'today';

  return (
    <nav
      className={`fixed left-1/2 bottom-[calc(0.9rem+env(safe-area-inset-bottom))] z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-black/35 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 ease-out md:hidden ${
        hideDock ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'opacity-100'
      } ${collapsed ? 'w-auto px-2.5' : 'w-[92vw] max-w-md px-2'}`}
      aria-label="Mobile app navigation"
    >
      <div className={`grid grid-cols-5 items-center transition-all duration-300 ${collapsed ? 'h-11 gap-0.5' : 'h-[64px]'}`}>
        <DockButton
          label="Home Feed"
          active={feedActive}
          icon={Home}
          collapsed={collapsed}
          onClick={() => onNavigate('feed')}
          onPreload={() => preloadSection('feed')}
        />
        <DockButton
          label="Pro Edges"
          active={proActive}
          icon={Flame}
          collapsed={collapsed}
          onClick={() => onNavigate('pro_command_center')}
          onPreload={() => preloadSection('pro_command_center')}
        />
        <DockButton
          label="Vouch Board"
          active={vouchActive}
          icon={BadgeCheck}
          collapsed={collapsed}
          onClick={() => onNavigate('board')}
          onPreload={() => preloadSection('board')}
          centerAction
        />
        <DockButton
          label="Today"
          active={todayActive}
          icon={LayoutDashboard}
          collapsed={collapsed}
          onClick={() => onNavigate('today')}
          onPreload={() => preloadSection('today')}
        />
        <button
          type="button"
          onClick={openMobileDrawer}
          aria-label="Open navigation menu and account"
          title="Account"
          className={`ve-touch-target flex min-w-0 flex-col items-center justify-center gap-1 transition-all active:scale-[0.92] ${Z8_INTERACTIVE} ${collapsed ? 'h-11' : 'h-12'}`}
        >
          <div
            className={`relative flex items-center justify-center rounded-full border-2 border-white/10 shadow-lg transition-all hover:border-vouch-cyan/50 ${
              collapsed ? 'h-7 w-7' : 'h-[34px] w-[34px]'
            }`}
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Account" className="h-full w-full rounded-full object-cover bg-black" />
            ) : (
              <UserCircle className={collapsed ? 'h-4 w-4 text-white/55' : 'h-[22px] w-[22px] text-white/55'} strokeWidth={1.8} />
            )}
          </div>
          {!collapsed ? <span className="text-[10px] font-bold text-white/45 tracking-wide">Menu</span> : null}
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
  collapsed = false,
}: {
  label: string;
  active: boolean;
  icon: typeof Home;
  onClick: () => void;
  onPreload: () => void;
  centerAction?: boolean;
  collapsed?: boolean;
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
      className={`ve-touch-target group relative flex min-w-0 flex-col items-center justify-center gap-1 transition-all active:scale-[0.92] ${Z8_INTERACTIVE} ${
        collapsed ? 'h-11' : 'h-12'
      }`}
    >
      <div
        className={`relative flex items-center justify-center transition-all ${
          centerAction
            ? `${collapsed ? 'h-8 w-8' : 'h-[38px] w-[38px]'} rounded-xl border ${active ? 'border-vouch-cyan/60 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_15px_rgba(79,184,220,0.25)]' : 'border-white/15 bg-black/40 text-white/55'}`
            : active ? 'text-vouch-cyan' : 'text-white/45 group-hover:text-white/70'
        }`}
      >
        <Icon className={collapsed ? 'h-[18px] w-[18px]' : centerAction ? 'h-5 w-5' : 'h-[22px] w-[22px]'} strokeWidth={active ? 2.2 : 1.8} />
      </div>
      {!collapsed ? (
        <span className={`text-[10px] font-bold tracking-wide transition-colors ${active ? 'text-white' : 'text-transparent'}`}>
          {active ? label.split(' ')[0] : ''}
        </span>
      ) : null}
      {active && !centerAction && !collapsed ? (
        <span className="absolute -top-1 h-0.5 w-6 rounded-b-sm bg-vouch-cyan shadow-[0_2px_8px_rgba(79,184,220,0.8)]" aria-hidden="true" />
      ) : null}
    </button>
  );
}
