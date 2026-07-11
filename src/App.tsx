import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSectionNavigation } from './app/useSectionNavigation';
import { queryClient } from './lib/queryClient';
import { warmGuestHrBoardCache } from './lib/boot/guestHrBoardWarmCache';
import { queryKeys } from './hooks/queries/queryKeys';
import { vouchedgeApi } from './api/vouchedgeApi';
import VouchEdgeTerminalPage from './pages/VouchEdgeTerminalPage';

const AuthenticatedApp = lazy(() => import('./app/AuthenticatedApp'));

/** Archived landings only — everything else logged-out goes to the terminal landing. */
const LEGACY_LANDING_SECTIONS = new Set(['edge_island_preview', 'legacy_studio']);

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

function PublicLanding({ onAuthed }: { onAuthed: () => void }) {
  useEffect(() => {
    void warmGuestHrBoardCache();
    void queryClient.prefetchQuery({
      queryKey: queryKeys.liveGames(),
      queryFn: () => vouchedgeApi.liveGames(),
    });
  }, []);

  return (
    <div className="z8-app-shell ve-motion-shell ve-theme-transition font-z8">
      <div className="ve-motion-bg" aria-hidden="true">
        <div className="ve-motion-grid" />
        <div className="ve-motion-noise" />
        <div className="ve-motion-spotlight" />
      </div>
      <div className="ve-motion-content">
        <div id="layout-inner-frame" className="ve-layout-frame ve-layout-welcome">
          <div id="center-main-content-column">
            <div id="inner-view-slot">
              <VouchEdgeTerminalPage onAuthed={onAuthed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigation = useSectionNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      {!navigation.isLoggedIn && !LEGACY_LANDING_SECTIONS.has(navigation.activeSection) ? (
        <PublicLanding onAuthed={navigation.handleLoginSuccess} />
      ) : (
        <Suspense fallback={<RouteFallback />}>
          <AuthenticatedApp navigation={navigation} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
