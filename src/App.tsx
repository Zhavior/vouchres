import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSectionNavigation } from './app/useSectionNavigation';
import { queryClient } from './lib/queryClient';
import { warmGuestHrBoardCache } from './lib/boot/guestHrBoardWarmCache';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { PUBLIC_SECTIONS, shouldForcePublicLanding } from './app/sectionNavigation';

function isAuthCallbackPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.toLowerCase() === '/auth/callback';
}

const AuthenticatedApp = lazy(() => import('./app/AuthenticatedApp'));
const VouchEdgeTerminalPage = lazy(() => import('./pages/VouchEdgeTerminalPage'));

/** Archived landings only — everything else logged-out goes to the terminal landing. */
const LEGACY_LANDING_SECTIONS = new Set(['legacy_studio']);

function RouteFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 160);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="ve-route-suspense-fallback flex min-h-[45vh] items-center justify-center px-5"
      role={visible ? 'status' : undefined}
      aria-live={visible ? 'polite' : undefined}
      aria-hidden={!visible}
    >
      {visible && (
        <div className="w-full max-w-sm rounded-2xl border border-vouch-cyan/20 bg-black/35 p-6 text-center shadow-[0_0_40px_rgba(0,240,255,0.08)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-vouch-cyan" />
          <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
            Loading VouchEdge
          </p>
        </div>
      )}
    </div>
  );
}

function PublicLanding({
  onAuthed,
  onGuest,
}: {
  onAuthed: () => void;
  onGuest: () => void;
}) {
  useEffect(() => {
    // HR board warm only — live games are owned by LandingLiveGamesCenter to avoid duplicate fetches.
    void warmGuestHrBoardCache();
  }, []);

  return (
    <div className="z8-app-shell ve-theme-transition font-z8" style={{ background: '#000' }}>
      <div>
        <div id="layout-inner-frame" className="ve-layout-frame ve-layout-welcome">
          <div id="center-main-content-column">
            <div id="inner-view-slot">
              <Suspense fallback={<RouteFallback />}>
                <VouchEdgeTerminalPage onAuthed={onAuthed} onGuest={onGuest} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainAppRoutes() {
  const navigation = useSectionNavigation();
  const canRenderLoggedOutRoute =
    PUBLIC_SECTIONS.has(navigation.activeSection) && navigation.activeSection !== 'vouchedge_intro';
  const forcePublicLanding = shouldForcePublicLanding();
  const showPublicLanding =
    (forcePublicLanding || !navigation.isLoggedIn) &&
    !LEGACY_LANDING_SECTIONS.has(navigation.activeSection) &&
    !canRenderLoggedOutRoute;

  if (showPublicLanding) {
    return <PublicLanding onAuthed={navigation.handleLoginSuccess} onGuest={navigation.handleGuestBrowse} />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AuthenticatedApp navigation={navigation} />
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {isAuthCallbackPath() ? <AuthCallbackPage /> : <MainAppRoutes />}
    </QueryClientProvider>
  );
}
