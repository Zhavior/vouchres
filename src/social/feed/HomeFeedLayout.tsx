import React from 'react';
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import FeedMobileNav from './FeedMobileNav';
import CmdKPalette from './CmdKPalette';
import { FeedPost, CreatorProofProfile, Vouch, Parlay, Leg } from '../../types';
import { ShieldCheck, Sparkles, Bell } from 'lucide-react';
import AisFeatureAgent from '../../components/AisFeatureAgent';
import AuthStatusBadge from '../../components/auth/AuthStatusBadge';
import { useTheme } from '../../components/theme/ThemeProvider';
import { VisualTheme } from '../../theme/themeRegistry';

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
}

export default function HomeFeedLayout({
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
}: HomeFeedLayoutProps) {
  
  const { activeTheme, reduceMotion } = useTheme();
  const [edgeTransitioning, setEdgeTransitioning] = React.useState(false);
  const [cmdKOpen, setCmdKOpen] = React.useState(false);
  // Placeholder: wire to real notification store when available
  const unreadNotifications = 0;
  const previousSectionRef = React.useRef(activeSection);

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
      '--theme-card-bg-gradient': 'linear-gradient(135deg, rgba(20, 15, 45, 0.82) 0%, rgba(10, 10, 25, 0.88) 100%)',
      '--theme-accent-color': theme.accentText.includes('cyan') ? '#22d3ee' : theme.accentText.includes('orange') ? '#f97316' : theme.accentText.includes('emerald') ? '#10b981' : theme.accentText.includes('rose') ? '#e11d48' : '#eab308',
    };
  };

  const themeVars = activeTheme ? getThemeVars(activeTheme) : null;

  // Stagger 15 beautiful drifting particle elements
  const driftingParticles = activeTheme && !reduceMotion
    ? Array.from({ length: 15 }).map((_, i) => {
        const symbols = activeTheme.particleDemo || ['✨'];
        const symbol = symbols[i % symbols.length];
        const left = `${((i * 19) % 90) + 5}%`;
        const size = `${((i * 9) % 18) + 14}px`;
        const delay = `-${(i * 2.5) % 20}s`;
        const duration = `${((i * 6) % 15) + 18}s`;
        const driftX = `${((i * 27) % 120) - 60}px`;
        const driftRot = `${((i * 53) % 240) - 120}deg`;
        const opacity = i % 3 === 0 ? '0.22' : '0.12';
        return { symbol, left, size, delay, duration, driftX, driftRot, opacity };
      })
    : [];

  return (
    <div
      className={`min-h-screen text-slate-100 flex justify-center w-full relative transition-colors duration-500 overflow-x-clip ${
        activeTheme && activeTheme.id !== 'cyber-blue' ? `${activeTheme.pageBg} has-active-theme` : 'bg-obsidian-900'
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
              const barColor = i % 4 === 0 ? 'hsl(var(--ve-accent-cyan))' : i % 3 === 0 ? 'hsl(var(--ve-accent-pink))' : 'hsl(var(--ve-accent-gold))';
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

      {/* Drifting theme particles */}
      {activeTheme && activeTheme.id !== 'cyber-blue' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          {driftingParticles.map((p, idx) => (
            <span 
              key={idx} 
              className="animate-theme-drift select-none block text-center"
              style={{
                left: p.left,
                fontSize: p.size,
                '--drift-delay': p.delay,
                '--drift-duration': p.duration,
                '--drift-x': p.driftX,
                '--drift-rot': p.driftRot,
                '--theme-particle-opacity': p.opacity,
                filter: 'blur(0.5px)',
                width: '32px',
                height: '32px',
              } as React.CSSProperties}
            >
              {p.symbol}
            </span>
          ))}
        </div>
      )}
      
      {/* Structural Container - max 1300px for feed, expand to 1580px for widescreen analytical interfaces */}
      <div className={`ve-layout-frame w-full min-h-screen relative transition-all duration-300 z-10 ${
        activeSection === 'welcome' ? 've-layout-welcome' : activeSection === 'feed' ? 've-layout-feed' : 've-layout-wide'
      }`} id="layout-inner-frame">
        
        {/* Column 1: Left Sticky Sidebar (hidden on mobile, responsive xl width) */}
        {activeSection !== 'welcome' && (
          <div className={`ve-edge-rail ve-edge-rail-left ${edgeTransitioning ? 've-edge-rail-switching' : ''}`}>
            <FeedSidebar 
              activeSection={activeSection} 
              onSectionChange={onSectionChange} 
              profile={profile}
              onOpenCmdK={() => setCmdKOpen(true)}
              unreadNotifications={unreadNotifications}
            />
          </div>
        )}

        {/* Column 2: Center Main Content (scrollable feed or other active tabs) */}
        <main className={`flex-1 min-w-0 bg-obsidian-900 ${activeSection === 'welcome' ? 'pb-0 border-none' : 'border-r border-white/10 pb-[74px] md:pb-0'}`} id="center-main-content-column">
          {/* Mobile compact header */}
          {activeSection !== 'welcome' && (
            <header className="md:hidden sticky top-0 bg-[hsl(var(--ve-bg-deep)/0.90)] backdrop-blur-md border-b border-[hsl(var(--ve-border)/0.30)] px-4 py-3 flex flex-wrap items-center justify-between gap-y-2 z-30 select-none">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSectionChange('feed')}>
                <div className="w-8 h-8 rounded-lg border border-[hsl(var(--ve-accent-cyan)/0.50)] bg-[hsl(var(--ve-accent-cyan)/0.12)] flex items-center justify-center text-[hsl(var(--ve-accent-cyan))] font-bold text-xs shadow-[0_0_10px_hsl(var(--ve-accent-cyan)/0.20)]">
                  VE
                </div>
                <span className="text-sm font-black text-[hsl(var(--ve-text-primary))] tracking-wider">
                  VOUCH<span className="text-[hsl(var(--ve-accent-cyan))] font-black">EDGE</span>
                </span>
              </div>

              {/* Track Record compact view & PRO Upgrade + Notifications + Auth */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 font-mono text-[10px]">
                {/* Notification bell — mobile */}
                <button
                  onClick={() => onSectionChange('notifications')}
                  className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[hsl(var(--ve-border)/0.40)] bg-[hsl(var(--ve-bg-panel)/0.40)] text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-primary))] hover:border-[hsl(var(--ve-accent-cyan)/0.30)] transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[hsl(var(--ve-accent-pink))] text-[7px] font-black text-[hsl(var(--ve-bg))]">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                <div 
                  onClick={() => onSectionChange('premium')}
                  className="flex items-center gap-1 bg-[hsl(var(--ve-accent-cyan)/0.12)] border border-[hsl(var(--ve-accent-cyan)/0.30)] px-2.5 py-1 rounded-full text-[hsl(var(--ve-accent-cyan))] font-bold cursor-pointer active:scale-95 transition-all animate-pulse"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>UPGRADE</span>
                </div>

                <div
                  onClick={() => onSectionChange('profile')}
                  className="flex items-center gap-1 bg-[hsl(var(--ve-bg-panel)/0.60)] border border-[hsl(var(--ve-border)/0.40)] px-2 py-1 rounded-full text-[hsl(var(--ve-success))] font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{profile.winRate.toFixed(1)}% WR</span>
                </div>

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
          <div className="w-full h-full" id="inner-view-slot">
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

      {/* Persistent Bottom Mobile Nav */}
      {activeSection !== 'welcome' && (
        <FeedMobileNav 
          activeSection={activeSection} 
          onSectionChange={onSectionChange} 
          profile={profile}
        />
      )}

      {/* Globally Floating VouchEdge AI Agent */}
      <AisFeatureAgent 
        profile={profile} 
        savedSlips={savedSlips} 
        activeLegs={activeLegs}
        onSectionChange={onSectionChange}
      />

      {/* Command Palette (Cmd+K) */}
      <CmdKPalette
        open={cmdKOpen}
        onClose={() => setCmdKOpen(false)}
        onNavigate={onSectionChange}
      />

    </div>
  );
}
