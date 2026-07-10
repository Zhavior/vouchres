import { lazy, Suspense, useEffect, useState } from 'react';
import { TerminalBackground } from './components/layout/TerminalBackground';
import { useSectionNavigation } from './app/useSectionNavigation';

const AuthenticatedApp = lazy(() => import('./app/AuthenticatedApp'));
const VouchEdgeTerminalPage = lazy(() => import('./pages/VouchEdgeTerminalPage'));

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
  return (
    <div className="z8-app-shell ve-motion-shell ve-theme-transition font-z8">
      <TerminalBackground />
      <div className="ve-motion-content">
        <div id="layout-inner-frame" className="ve-layout-frame ve-layout-welcome">
          <div id="center-main-content-column">
            <div id="inner-view-slot">
              <Suspense fallback={<RouteFallback />}>
                <VouchEdgeTerminalPage onAuthed={onAuthed} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigation = useSectionNavigation();

  if (!navigation.isLoggedIn) {
    return <PublicLanding onAuthed={navigation.handleLoginSuccess} />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AuthenticatedApp navigation={navigation} />
    </Suspense>
  );
}
