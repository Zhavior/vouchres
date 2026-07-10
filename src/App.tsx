import { lazy, Suspense } from 'react';
import { useSectionNavigation } from './app/useSectionNavigation';

const AuthenticatedApp = lazy(() => import('./app/AuthenticatedApp'));
const VouchEdgeTerminalPage = lazy(() => import('./pages/VouchEdgeTerminalPage'));

function RouteFallback() {
  return <div className="ve-route-suspense-fallback" aria-hidden="true" />;
}

function PublicLanding({ onAuthed }: { onAuthed: () => void }) {
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

  if (navigation.isPublicFrontPage && navigation.activeSection === 'vouchedge_intro') {
    return <PublicLanding onAuthed={navigation.handleLoginSuccess} />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AuthenticatedApp navigation={navigation} />
    </Suspense>
  );
}
