import { Suspense, useEffect } from 'react';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSectionNavigation } from './app/useSectionNavigation';
import { queryClient } from './lib/queryClient';
import { warmGuestHrBoardCache } from './lib/boot/guestHrBoardWarmCache';
import AuthCallbackPage from './pages/AuthCallbackPage';
import {
  devAuthActive,
  PUBLIC_SECTIONS,
  hasRealAuthToken,
  resolveAuthenticatedSection,
  resolveDevSectionFromLocation,
  shouldForcePublicLanding,
} from './app/sectionNavigation';
import { AURORA_MAX_SHELL } from './theme/auroraTokens';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { CookieConsentBanner } from './components/legal/CookieConsentBanner';
import { GlobalCanvasRoot } from './components/visual/GlobalCanvasRoot';

function isAuthCallbackPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.toLowerCase() === '/auth/callback';
}

function isPasswordResetPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.toLowerCase() === '/auth/reset-password';
}

function getStaticPublicPage(): 'policy' | 'about' | 'contact' | 'blog' | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  if (path === '/policy' || path === '/terms') return 'policy';
  if (path === '/about') return 'about';
  if (path === '/contact' || path === '/support') return 'contact';
  if (path === '/blog' || path === '/updates') return 'blog';
  return null;
}

function isPublicAuthPath(): boolean {
  if (typeof window === 'undefined') return false;
  return ['/login', '/signin', '/signup', '/join'].includes(window.location.pathname.toLowerCase());
}

const AuthenticatedApp = lazyWithRetry(() => import('./app/AuthenticatedApp'));
const VouchEdgeTerminalPage = lazyWithRetry(() => import('./pages/VouchEdgeTerminalPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const PolicyPage = lazyWithRetry(() => import('./pages/PolicyPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'));

/** Archived landings only — everything else logged-out goes to the terminal landing. */
const LEGACY_LANDING_SECTIONS = new Set(['legacy_studio']);

/**
 * Start the boot route's chunk during entry evaluation instead of waiting for
 * React's first render to trip the lazy boundary. This mirrors the routing
 * decision in MainAppRoutes so only the chunk this refresh actually lands on is
 * warmed — guests never pay for the authed bundle. The later React.lazy()
 * import hits the module registry and resolves with no network round trip, so
 * the Suspense boundary is typically already settled at first commit.
 */
function warmBootRouteChunk() {
  if (typeof window === 'undefined') return;
  if (isAuthCallbackPath() || isPasswordResetPath() || getStaticPublicPage()) return;

  // Same resolution useSectionNavigation runs for its initial section.
  const bootSection = resolveAuthenticatedSection(
    resolveDevSectionFromLocation() ?? (devAuthActive() ? 'hr_board' : 'vouchedge_intro'),
  );
  const canRenderLoggedOutRoute = PUBLIC_SECTIONS.has(bootSection) && bootSection !== 'vouchedge_intro';
  const rendersPublicLanding =
    isPublicAuthPath() ||
    ((shouldForcePublicLanding() || !(devAuthActive() || hasRealAuthToken())) &&
      !LEGACY_LANDING_SECTIONS.has(bootSection) &&
      !canRenderLoggedOutRoute);

  void (rendersPublicLanding
    ? import('./pages/VouchEdgeTerminalPage')
    : import('./app/AuthenticatedApp')
  ).catch(() => {
    /* The lazy boundary owns chunk-failure recovery; this warm pass stays silent. */
  });
}

warmBootRouteChunk();

/**
 * Boot Suspense placeholder — deliberately silent.
 *
 * The route chunk is warmed during entry evaluation (see below), so this
 * boundary usually resolves inside a frame or two. Painting a spinner card
 * here only produced a "Loading VouchEdge" flash that popped in and straight
 * back out; holding the app's own canvas instead means the refresh reads as
 * one paint. Reserves height so nothing shifts when the route mounts.
 */
function RouteFallback() {
  return <div className="ve-route-suspense-fallback min-h-[45vh]" aria-hidden="true" />;
}

function PublicLanding({ onAuthed }: { onAuthed: () => void }) {
  useEffect(() => {
    // HR board warm only — live games are owned by LandingLiveGamesCenter to avoid duplicate fetches.
    void warmGuestHrBoardCache();
  }, []);

  return (
    <div
      className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`}
      data-aurora-generation="max"
      data-scroll-owner="document"
    >
      <Suspense fallback={<RouteFallback />}>
        <VouchEdgeTerminalPage onAuthed={onAuthed} />
      </Suspense>
    </div>
  );
}

function MainAppRoutes() {
  const navigation = useSectionNavigation();
  const canRenderLoggedOutRoute =
    PUBLIC_SECTIONS.has(navigation.activeSection) && navigation.activeSection !== 'vouchedge_intro';
  const forcePublicLanding = shouldForcePublicLanding();
  const showPublicLanding =
    isPublicAuthPath() ||
    ((forcePublicLanding || !navigation.isLoggedIn) &&
      !LEGACY_LANDING_SECTIONS.has(navigation.activeSection) &&
      !canRenderLoggedOutRoute);

  if (showPublicLanding) {
    return <PublicLanding onAuthed={navigation.handleLoginSuccess} />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AuthenticatedApp navigation={navigation} />
    </Suspense>
  );
}

export default function App() {
  const staticPage = getStaticPublicPage();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Backdrop first, and outside the route tree: the ambient WebGL field is
          a sibling of the router rather than a descendant, so navigating,
          signing in, or landing on /auth/* never unmounts the canvas. */}
      {!staticPage && <GlobalCanvasRoot />}
      <div className="relative z-10 min-h-screen bg-black flex flex-col">
        <div className="flex-grow">
          {isAuthCallbackPath() ? (
            <AuthCallbackPage />
          ) : isPasswordResetPath() ? (
            <Suspense fallback={<RouteFallback />}><ResetPasswordPage /></Suspense>
          ) : staticPage === 'policy' ? (
            <Suspense fallback={<RouteFallback />}><PolicyPage /></Suspense>
          ) : staticPage === 'blog' ? (
            <Suspense fallback={<RouteFallback />}><BlogPage /></Suspense>
          ) : window.location.pathname.startsWith('/blog/') ? (
            <Suspense fallback={<RouteFallback />}><BlogPage slug={window.location.pathname.replace('/blog/', '')} /></Suspense>
          ) : staticPage === 'about' ? (
            <Suspense fallback={<RouteFallback />}><AboutPage /></Suspense>
          ) : staticPage === 'contact' ? (
            <Suspense fallback={<RouteFallback />}><ContactPage /></Suspense>
          ) : (
            <MainAppRoutes />
          )}
        </div>
      </div>
      <CookieConsentBanner />
    </QueryClientProvider>
  );
}
