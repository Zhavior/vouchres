import { useEffect, useRef, useState } from 'react';
import { History, LayoutDashboard, Radio, Settings, Zap } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';
import { useParlayOsStore } from '../stores/parlayOsStore';
import { AURORA_INTERACTIVE } from '../theme/auroraTokens';
import { isBetaDestinationActive } from './betaNavigation';
import '../styles/aurora-sidebar.css';

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
    /* Which element scrolls depends on the breakpoint: at >=1181px the shell
       scrolls #inner-view-slot; below that the pane is released and the
       document scrolls (mobile block in styles/legacy/feed.css, with its
       counterpart in styles/app-topbar.css).

       Resolving that once at mount is a race — feed.css is imported lazily, so
       the pane can still compute as scrollable when this effect first runs and
       the listener binds to an element that never moves. Listen to both and
       read whichever actually has offset; only one of them is ever the
       scroller, so the max is the live position. */
    const inner = document.getElementById('inner-view-slot');
    const readY = () =>
      Math.max(inner?.scrollTop ?? 0, document.scrollingElement?.scrollTop ?? 0);

    lastScrollY.current = readY();

    const handleScroll = () => {
      const y = readY();
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y < 40 || delta < -8) setCollapsed(false);
      else if (delta > 8) setCollapsed(true);

      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setCollapsed(false), 900);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    inner?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      inner?.removeEventListener('scroll', handleScroll);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  return collapsed;
}

export function AppNav({ activeSection, onNavigate }: AppNavProps) {
  const worldChatOpen = useNavUiStore((s) => s.worldChatOpen);
  const parlayDockOpen = useParlayOsStore((s) => s.sheetOpen);
  const collapsed = useScrollCollapse();
  // The bottom nav pill, ParlayOS dock, and World Chat panel all fight over
  // the same mobile screen real estate — only one can be up at a time.
  const hideDock = parlayDockOpen || worldChatOpen;

  const todayActive = isBetaDestinationActive(activeSection, 'today');
  const researchActive = isBetaDestinationActive(activeSection, 'research');
  const trackRecordActive = isBetaDestinationActive(activeSection, 'track_record');
  const liveActive = activeSection === 'live_games';
  const settingsActive = activeSection === 'settings';

  return (
    <nav
      className={`ve-aurora-mobile-dock fixed left-1/2 bottom-[calc(0.9rem+env(safe-area-inset-bottom))] z-[60] -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-[#090A0F]/95 shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ease-out md:hidden ${
        hideDock ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'opacity-100'
      } ${collapsed ? 'w-auto px-2.5' : 'w-[92vw] max-w-md px-2'}`}
      aria-label="Mobile app navigation"
    >
      {/* Five destinations */}
      <div className={`grid grid-cols-5 items-center transition-all duration-300 ${collapsed ? 'h-11 gap-0.5' : 'h-[64px]'}`}>
        <DockButton
          label="Today"
          active={todayActive}
          icon={LayoutDashboard}
          collapsed={collapsed}
          onClick={() => onNavigate('today')}
          onPreload={() => preloadSection('today')}
        />
        <DockButton
          label="HR Board"
          active={researchActive}
          icon={Zap}
          collapsed={collapsed}
          onClick={() => onNavigate('hr_board')}
          onPreload={() => preloadSection('hr_board')}
        />
        <DockButton
          label="Live"
          active={liveActive}
          icon={Radio}
          collapsed={collapsed}
          onClick={() => onNavigate('live_games')}
          onPreload={() => preloadSection('live_games')}
        />
        <DockButton
          label="Settings"
          active={settingsActive}
          icon={Settings}
          collapsed={collapsed}
          onClick={() => onNavigate('settings')}
          onPreload={() => preloadSection('settings')}
        />
        <DockButton
          label="Track"
          active={trackRecordActive}
          icon={History}
          collapsed={collapsed}
          onClick={() => onNavigate('results')}
          onPreload={() => preloadSection('results')}
        />
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
  icon: typeof LayoutDashboard;
  onClick: () => void;
  onPreload?: () => void;
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
      className={`ve-touch-target group relative flex min-w-0 flex-col items-center justify-center gap-1 transition-all active:scale-[0.92] cursor-pointer ${AURORA_INTERACTIVE} ${
        collapsed ? 'h-11' : 'h-12'
      }`}
    >
      <div
        className={`relative flex items-center justify-center transition-all ${
          centerAction
            ? `${collapsed ? 'h-8 w-8' : 'h-[38px] w-[38px]'} border ${active ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'border-white/10 bg-zinc-900/80 text-zinc-400'}`
            : active ? 'text-amber-400 scale-105' : 'text-zinc-500 group-hover:text-zinc-300'
        }`}
      >
        <Icon className={collapsed ? 'h-[18px] w-[18px]' : centerAction ? 'h-5 w-5' : 'h-[22px] w-[22px]'} strokeWidth={active ? 2.2 : 1.8} />
      </div>
      {!collapsed ? (
        <span className={`text-[10px] font-sans font-medium tracking-normal transition-colors ${active ? 'text-amber-300 font-semibold' : 'text-zinc-500'}`}>
          {label.split(' ')[0]}
        </span>
      ) : null}
      {active && !centerAction && !collapsed ? (
        <span className="absolute -top-1 h-0.5 w-6 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" aria-hidden="true" />
      ) : null}
    </button>
  );
}
