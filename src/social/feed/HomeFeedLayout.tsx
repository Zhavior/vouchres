import React from 'react';
import FeedSidebar from './FeedSidebar';
import FeedRightRail from './FeedRightRail';
import FeedMobileNav from './FeedMobileNav';
import CyberBackground from '../../components/CyberBackground';
import { FeedPost, CreatorProofProfile, Vouch, Parlay, Leg } from '../../types';
import { Sliders, ShieldCheck, Sparkles } from 'lucide-react';
import AisFeatureAgent from '../../components/AisFeatureAgent';
import { useTheme } from '../../components/theme/ThemeProvider';
import { VisualTheme } from '../../theme/themeRegistry';
import TheEdgeOverlay from '../../components/theEdge/TheEdgeOverlay';


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
}: HomeFeedLayoutProps) {
  
  const { activeTheme, reduceMotion } = useTheme();

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
        activeTheme && activeTheme.id !== 'cyber-blue' ? `${activeTheme.pageBg} has-active-theme` : 'bg-[#0b0f19]'
      }`} 
      style={activeTheme && activeTheme.id !== 'cyber-blue' ? (themeVars as React.CSSProperties) : undefined}
      id="vouchedge-container-root"
    >
      
      {/* Dynamic Animated Cyber Background Layer (only if not customized fully by profile theme) */}
      {(!activeTheme || activeTheme.id === 'cyber-blue') && <CyberBackground />}
      
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
              return (
                <div 
                  key={i} 
                  className="w-1.5 rounded-t-md bg-gradient-to-t from-fuchsia-500 via-purple-500 to-cyan-400 border-t border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                  style={{
                    animation: `equalizer-pulse ${animDuration} ease-in-out infinite alternate`,
                    animationDelay: animDelay,
                    height: '20px'
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Explosive Ambient Drifting floating particles of the equipped theme */}
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
      <div className={`flex w-full min-h-screen relative transition-all duration-300 z-10 mx-auto ${
        activeSection === 'welcome' ? 'max-w-none' : activeSection === 'feed' ? 'max-w-[1300px]' : 'max-w-[1580px]'
      }`} id="layout-inner-frame">
        
        {/* Column 1: Left Sticky Sidebar (hidden on mobile, responsive xl width) */}
        {activeSection !== 'welcome' && (
          <FeedSidebar 
            activeSection={activeSection} 
            onSectionChange={onSectionChange} 
            profile={profile} 
          />
        )}

        {/* Column 2: Center Main Content (scrollable feed or other active tabs) */}
        <main className={`flex-1 min-w-0 ${activeSection === 'welcome' ? 'pb-0 border-none' : 'border-r border-slate-900 pb-[74px] md:pb-0'}`} id="center-main-content-column">
          {/* Mobile compact header */}
          {activeSection !== 'welcome' && (
            <header className="md:hidden sticky top-0 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-850 px-4 py-3 flex items-center justify-between z-30 select-none">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSectionChange('feed')}>
                <div className="w-8 h-8 rounded-lg bg-amber-955/40 border border-[#FFE81F]/70 flex items-center justify-center text-[#FFE81F] font-bold text-xs shadow-[0_0_10px_rgba(255,232,31,0.2)]">
                  ★
                </div>
                <span className="text-sm font-black text-white starwars-font-crawl tracking-wider">
                  VOUCH<span className="text-[#FFE81F] starwars-font-solid font-black">EDGE</span>
                </span>
              </div>

              {/* Track Record compact view & PRO Upgrade */}
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <div 
                  onClick={() => onSectionChange('premium')}
                  className="flex items-center gap-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30 px-2.5 py-1 rounded-full text-sky-400 font-bold cursor-pointer active:scale-95 transition-all animate-pulse"
                >
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>UPGRADE</span>
                </div>

                <div 
                  onClick={() => onSectionChange('profile')}
                  className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-full text-emerald-400 font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{profile.winRate.toFixed(1)}% WR</span>
                </div>
              </div>
            </header>
          )}

          {/* Render Active Page Content */}
          <div className="relative min-h-screen w-full" id="inner-view-slot">
            {isRouteSwitching && (
              <div className="pointer-events-none absolute inset-x-4 top-4 z-50 rounded-2xl border border-cyan-300/20 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Loading VouchEdge screen</div>
                    <div className="text-xs text-slate-500">Keeping the app active while the next lab mounts.</div>
                  </div>
                </div>
              </div>
            )}
            <div className={`min-h-screen transition-opacity duration-150 ${isRouteSwitching ? 'opacity-60' : 'opacity-100'}`}>
              {children}
            </div>
          </div>
        </main>

        {/* Column 3: Right Sticky Rail (hidden on mobile, and only rendered on central feed for optimal focus) */}
        {activeSection === 'feed' && (
          <FeedRightRail 
            posts={posts} 
            profile={profile} 
            savedVouchIds={savedVouchIds} 
            onSaveVouch={onSaveVouch} 
          />
        )}
        
      </div>

      {/* Persistent Bottom Mobile Nav */}
      {activeSection !== 'welcome' && (
        <>
          <TheEdgeOverlay
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />

          <FeedMobileNav
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            profile={profile}
          />
        </>
      )}

      {/* Globally Floating VouchEdge AI Agent */}
      <AisFeatureAgent 
        profile={profile} 
        savedSlips={savedSlips} 
        activeLegs={activeLegs} 
        activeThemeId={profile.activeTheme} 
        onSectionChange={onSectionChange} 
      />
    </div>
  );
}
