import React from 'react';
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import MobileProfileDrawer, { TierAvatar } from './MobileProfileDrawer';
import CmdKPalette from './CmdKPalette';
import { FeedPost, CreatorProofProfile, Vouch, Parlay, Leg } from '../../types';
import { Sparkles } from 'lucide-react';
import AuthStatusBadge from '../../components/auth/AuthStatusBadge';
import {
  NotificationProvider,
  NotificationBellButton,
} from '../../components/notifications/UnifiedNotificationCenter';
import { useTheme } from '../../components/theme/ThemeProvider';
import { VisualTheme } from '../../theme/themeRegistry';
import { BubbleField } from '../../components/vouchedge/ParticleFields';

interface HomeFeedLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  posts: FeedPost[];
  profile: CreatorProofProfile;
  savedVouchIds: string[];
  onSaveVouch: (vouch: Vouch) => void;
  children: React.ReactNode;
  activeLegs?: Leg[];
  savedSlips?: Parlay[];
  isRouteSwitching?: boolean;
  onAuthLoginSuccess?: () => void;
  onAuthLogoutComplete?: () => void;
  /** True only for the bare public front page (logged-out 'welcome') — hides
   * the sidebar/header/right-rail app chrome. Logged-in users landing on
   * 'welcome' (Edge Island) still get the normal app shell. */
  isPublicFrontPage?: boolean;
}

export default function HomeFeedLayout(props: HomeFeedLayoutProps) {
  return <HomeFeedLayoutInner {...props} />;
}

function HomeFeedLayoutInner({
  activeSection,
  onSectionChange,
  posts,
  profile,
  savedVouchIds,
  onSaveVouch,
  children,
  activeLegs = [],
  savedSlips = [],
  isRouteSwitching = false,
  onAuthLoginSuccess,
  onAuthLogoutComplete,
  isPublicFrontPage = false,
}: HomeFeedLayoutProps) {
  const { activeTheme, reduceMotion } = useTheme();
  const [edgeTransitioning, setEdgeTransitioning] = React.useState(false);
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const previousSectionRef = React.useRef(activeSection);

  const closeNavigationOverlays = React.useCallback(() => {
    setMobileDrawerOpen(false);
    setCmdKOpen(false);
  }, []);

  const handleSectionChange = React.useCallback((section: string) => {
    closeNavigationOverlays();
    onSectionChange(section);
  }, [closeNavigationOverlays, onSectionChange]);

  React.useEffect(() => {
    closeNavigationOverlays();
  }, [activeSection, closeNavigationOverlays]);

  React.useEffect(() => {
    if (previousSectionRef.current === activeSection) return;

    setEdgeTransitioning(true);
    const timer = window.setTimeout(() => {
      setEdgeTransitioning(false);
      previousSectionRef.current = activeSection;
    }, reduceMotion ? 0 : 360);

    return () => window.clearTimeout(timer);
  }, [activeSection, reduceMotion]);

  // Global Cmd+K / Ctrl+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdKOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const getThemeVars = (theme: VisualTheme) => {
    return {
      '--theme-border-color': theme.borderColor || 'rgba(6,182,212,0.2)',
      '--theme-shadow-glow': theme.accentText.includes('cyan') ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
      '--theme-card-bg-gradient': 'linear-gradient(135deg, rgba(8, 20, 48, 0.84) 0%, rgba(2, 6, 23, 0.90) 100%)',
      '--theme-accent-color': theme.accentText.includes('cyan') ? '#22d3ee' : theme.accentText.includes('orange') ? '#f97316' : theme.accentText.includes('emerald') ? '#10b981' : theme.accentText.includes('rose') ? '#e11d48' : '#eab308',
    };
  };

  const themeVars = activeTheme ? getThemeVars(activeTheme) : null;

  return (
    <NotificationProvider savedSlips={savedSlips} onNavigate={handleSectionChange}>
    <div
      className={`z8-layout-root font-z8 min-h-screen text-white flex justify-center w-full relative transition-colors duration-500 overflow-x-clip ${
        activeTheme && activeTheme.id !== 'cyber-blue' ? 'bg-transparent has-active-theme' : 'bg-transparent'
      }`}
      style={activeTheme && activeTheme.id !== 'cyber-blue' ? (themeVars as React.CSSProperties) : undefined}
      id="vouchedge-container-root"
      data-route-switching={isRouteSwitching ? 'true' : 'false'}
    >

      {/* Grid Overlay matching theme particles vibe */}
      {activeTheme && activeTheme.id !== 'cyber-blue' && activeTheme.gridOverlay && (
        <div className={`absolute inset-0 pointer-events-none z-0 ${activeTheme.gridOverlay}`} />
      )}

      {/* Immersive reactive Equalizer music beat lines for "music_beat_lines" theme */}
      {activeTheme?.id === 'music_beat_lines' && (
        <>
          <style>{`
            @keyframes equalizer-pulse {
              0% { height: 16px; opacity: 0.25; filter: saturate(0.85); }
              50% { height: 135px; opacity: 0.55; filter: saturate(1.2); }
              100% { height: 38px; opacity: 0.35; filter: saturate(1.4); }
            }
          `}</style>
          <div className="absolute bottom-12 left-0 right-0 h-44 pointer-events-none z-0 select-none flex items-end justify-around px-2 opacity-40 gap-1 overflow-hidden" id="bg-equalizer-beat-lines">
            {Array.from({ length: 42 }).map((_, i) => {
              const animDuration = `${0.5 + (i % 8) * 0.12}s`;
              const animDelay = `-${(i % 5) * 0.18}s`;
              const barColor = i % 4 === 0 ? '#00F0FF' : i % 3 === 0 ? '#00FF9D' : '#FFB800';
              return (
                <div 
                  key={i} 
                  className="w-1.5 rounded-t-md origin-bottom"
                  style={{
                    background: barColor,
                    animationName: 'equalizer-pulse',
                    animationDuration: animDuration,
                    animationDelay: animDelay,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                    height: '16px',
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Drifting glass bubbles */}
      {activeTheme && activeTheme.id !== 'cyber-blue' && !reduceMotion && (
        <BubbleField count={15} mobileCount={8} variant="drift" className="z-0" />
      )}
      
      {/* Structural Container - max 1300px for feed, expand to 1580px for widescreen analytical interfaces */}
      <div className={`ve-layout-frame w-full min-h-screen relative transition-all duration-300 z-10 ${
        isPublicFrontPage ? 've-layout-welcome' : activeSection === 'feed' ? 've-layout-feed' : 've-layout-wide'
      }`} id="layout-inner-frame">

        {/* Column 1: Left Sticky Sidebar (hidden on mobile, responsive xl width) */}
        {!isPublicFrontPage && (
          <div className={`ve-edge-rail ve-edge-rail-left ${edgeTransitioning ? 've-edge-rail-switching' : ''}`}>
            <FeedSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              profile={profile}
              onOpenCmdK={() => setCmdKOpen(true)}
            />
          </div>
        )}

        {/* Column 2: Center Main Content (scrollable feed or other active tabs) */}
        <main className={`flex flex-1 min-h-0 min-w-0 flex-col bg-transparent font-z8 ${isPublicFrontPage ? 'pb-0 border-none' : 'max-md:pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'}`} id="center-main-content-column">
          {/* Desktop slim header — notification bell on the right */}
          {!isPublicFrontPage && (
            <header className="sticky top-0 z-30 hidden select-none items-center justify-end gap-2 border-b border-white/5 bg-black/20 px-4 py-2 backdrop-blur-xl md:flex font-z8">
              <NotificationBellButton />
              <AuthStatusBadge
                inline
                onLoginSuccess={onAuthLoginSuccess}
                onLogoutComplete={onAuthLogoutComplete}
              />
            </header>
          )}

          {/* Mobile compact header */}
          {!isPublicFrontPage && (
            <header className="ve-mobile-header sticky top-0 z-30 flex items-center justify-between gap-2 bg-black/20 px-3 py-2.5 backdrop-blur-xl select-none font-z8 md:hidden">
              {/* Profile avatar (corner) — ring color = real subscription tier;
                  tapping it opens the X-style navigation drawer. */}
              <div className="flex items-center gap-2.5 min-w-0">
                <TierAvatar
                  profile={profile}
                  size={36}
                  onClick={() => setMobileDrawerOpen(true)}
                  ariaLabel="Open navigation menu"
                />
                <button type="button" onClick={() => handleSectionChange('feed')} className="text-sm font-black text-white tracking-wider">
                  VOUCH<span className="text-vouch-cyan">EDGE</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-1.5 font-mono text-[10px]">
                <NotificationBellButton size="sm" />

                {profile.subscriptionTier !== 'SELLER_PRO' && (
                  <button
                    onClick={() => handleSectionChange('premium')}
                    className="flex items-center gap-1 bg-vouch-emerald/10 border border-vouch-emerald/30 px-2.5 py-1 rounded-full text-vouch-emerald font-bold active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>UPGRADE</span>
                  </button>
                )}

                {/* Login/guest state — rendered inline here (not as a fixed
                    overlay) so it can't collide with page content below it. */}
                <AuthStatusBadge
                  inline
                  onLoginSuccess={onAuthLoginSuccess}
                  onLogoutComplete={onAuthLogoutComplete}
                />
              </div>
            </header>
          )}

          {/* Render Active Page Content */}
          <div className="ve-scroll-pane w-full min-h-0 flex-1" id="inner-view-slot">
            {children}
          </div>
        </main>

        {/* Column 3: Right Sticky Rail (hidden on mobile, and only rendered on central feed for optimal focus) */}
        {activeSection === 'feed' && (
          <div className={`ve-edge-rail ve-edge-rail-right ${edgeTransitioning ? 've-edge-rail-switching' : ''}`}>
            <FeedRightRail 
              posts={posts} 
              profile={profile} 
              savedVouchIds={savedVouchIds} 
              onSaveVouch={onSaveVouch} 
            />
          </div>
        )}
        
      </div>

      {/* X-style mobile navigation drawer (replaces the old bottom nav bar) */}
      {!isPublicFrontPage && (
        <MobileProfileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          profile={profile}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}

      {/* Command Palette (Cmd+K) */}
      {!isPublicFrontPage && (
        <CmdKPalette
          open={cmdKOpen}
          onClose={() => setCmdKOpen(false)}
          onNavigate={handleSectionChange}
        />
      )}

    </div>
    </NotificationProvider>
  );
}
