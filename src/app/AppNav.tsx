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
      className={`ve-aurora-mobile-dock fixed left-1/2 bottom-[calc(0.9rem+env(safe-area-inset-bottom))] z-[60] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/35 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 ease-out md:hidden ${
        hideDock ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'opacity-100'
      } ${collapsed ? 'w-auto px-2.5' : 'w-[92vw] max-w-md px-2'}`}
      aria-label="Mobile app navigation"
    >
      {/* Five destinations. Account is not one of them: it lives in the app top
          bar, and on Today (which replaces that bar with its own header) in
          that header's right cluster — so it stays one tap away either way. */}
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
      className={`ve-touch-target group relative flex min-w-0 flex-col items-center justify-center gap-1 transition-all active:scale-[0.92] ${AURORA_INTERACTIVE} ${
        collapsed ? 'h-11' : 'h-12'
      }`}
    >
      <div
        className={`relative flex items-center justify-center transition-all ${
          centerAction
            ? `${collapsed ? 'h-8 w-8' : 'h-[38px] w-[38px]'} rounded-xl border ${active ? 'border-vouch-cyan/60 bg-vouch-cyan/15 text-vouch-cyan shadow-[0_0_15px_rgba(0,217,160,0.25)]' : 'border-white/15 bg-black/40 text-white/55'}`
            : active ? 'text-vouch-cyan' : 'text-white/45 group-hover:text-white/70'
        }`}
      >
        <Icon className={collapsed ? 'h-[18px] w-[18px]' : centerAction ? 'h-5 w-5' : 'h-[22px] w-[22px]'} strokeWidth={active ? 2.2 : 1.8} />
      </div>
      {!collapsed ? (
        <span className={`text-[10px] font-bold tracking-wide transition-colors ${active ? 'text-white' : 'text-white/40'}`}>
          {label.split(' ')[0]}
        </span>
      ) : null}
      {active && !centerAction && !collapsed ? (
        <span className="absolute -top-1 h-0.5 w-7 rounded-b-sm bg-gradient-to-r from-vouch-cyan to-vouch-emerald shadow-[0_2px_8px_rgba(0,217,160,0.8)]" aria-hidden="true" />
      ) : null}
    </button>
  );
}
