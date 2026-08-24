import { Suspense, useEffect } from 'react';
import './index.css';
import { MotionConfig } from 'motion/react';
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

/**
 * Flat public documents — pages that must render without booting the section
 * router or the application shell.
 *
 * `/blog/:slug` resolves to 'blog' as well. It used to fall through to the
 * article branch further down with `staticPage === null`, which quietly opted
 * article pages back into the application canvas and the boot chunk warm. The
 * slug itself is read separately by `getBlogSlug()`.
 */
function getStaticPublicPage(): 'policy' | 'about' | 'contact' | 'blog' | 'dev' | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  if (path === '/policy' || path === '/terms') return 'policy';
  if (path === '/about') return 'about';
  if (path === '/contact' || path === '/support') return 'contact';
  if (path === '/blog' || path === '/updates' || path.startsWith('/blog/')) return 'blog';
  if (
    path === '/dev' ||
    path === '/founder' ||
    path === '/boyd' ||
    path === '/boydsantos' ||
    path === '/@boydsantos' ||
    path === '/author/boyd' ||
    path === '/author/boydsantos'
  ) return 'dev';
  return null;
}

/** The article slug for a `/blog/:slug` deep link, or undefined on the index. */
function getBlogSlug(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const path = window.location.pathname;
  if (!path.toLowerCase().startsWith('/blog/')) return undefined;
  const slug = path.slice('/blog/'.length).replace(/\/+$/, '');
  return slug || undefined;
}

function isPublicAuthPath(): boolean {
  if (typeof window === 'undefined') return false;
  return ['/login', '/signin', '/signup', '/join'].includes(window.location.pathname.toLowerCase());
}

const AuthenticatedApp = lazyWithRetry(() => import('./app/AuthenticatedApp'));
const VouchEdgeTerminalPage = lazyWithRetry(() => import('./pages/VouchEdgeTerminalPage'));
const VouchEdgeLandingV4 = lazyWithRetry(() => import('./pages/VouchEdgeLandingV4'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const PolicyPage = lazyWithRetry(() => import('./pages/PolicyPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'));
const DevProfilePage = lazyWithRetry(() => import('./pages/DevProfilePage'));

/** Archived landings only — everything else logged-out goes to the public landing. */
const LEGACY_LANDING_SECTIONS = new Set(['legacy_studio']);

/**
 * Would this boot land on the public landing rather than the application?
 *
 * Mirrors the `showPublicLanding` expression in ApplicationRoutes, but from
 * storage-backed predicates instead of live session state, so it can run during
 * module evaluation. Only used to pick which chunk to warm — the authoritative,
 * reactive decision stays in ApplicationRoutes.
 */
function bootLandsOnPublicLanding(): boolean {
  const bootSection = resolveAuthenticatedSection(
    resolveDevSectionFromLocation() ?? (devAuthActive() ? 'hr_board' : 'vouchedge_intro'),
  );
  const canRenderLoggedOutRoute = PUBLIC_SECTIONS.has(bootSection) && bootSection !== 'vouchedge_intro';
  return (
    isPublicAuthPath() ||
    ((shouldForcePublicLanding() || !(devAuthActive() || hasRealAuthToken())) &&
      !LEGACY_LANDING_SECTIONS.has(bootSection) &&
      !canRenderLoggedOutRoute)
  );
}

/**
 * Start the boot route's chunk during entry evaluation instead of waiting for
 * React's first render to trip the lazy boundary. Only the chunk this refresh
 * actually lands on is warmed — an anonymous visitor to `/` pulls the V4
 * landing and never pays for the authenticated bundle.
 */
function warmBootRouteChunk() {
  if (typeof window === 'undefined') return;
  if (isAuthCallbackPath() || isPasswordResetPath() || getStaticPublicPage()) return;

  const warm = !bootLandsOnPublicLanding()
    ? import('./app/AuthenticatedApp')
    // The auth paths still render the terminal landing, which owns AuthModal.
    : isPublicAuthPath()
      ? import('./pages/VouchEdgeTerminalPage')
      : import('./pages/VouchEdgeLandingV4');

  void warm.catch(() => {
    /* The lazy boundary owns chunk-failure recovery; this warm pass stays silent. */
  });
}

warmBootRouteChunk();

/**
 * Boot Suspense placeholder — deliberately silent.
 *
 * The route chunk is warmed during entry evaluation (see above), so this
 * boundary usually resolves inside a frame or two. Painting a spinner card
 * here only produced a "Loading VouchEdge" flash that popped in and straight
 * back out; holding the app's own canvas instead means the refresh reads as
 * one paint. Reserves height so nothing shifts when the route mounts.
 */
function RouteFallback() {
  return <div className="ve-route-suspense-fallback min-h-[45vh]" aria-hidden="true" />;
}

/**
 * The logged-out surface.
 *
 * `/` and every other signed-out application route now get the V4 landing,
 * which brings its own visual system. `/login`, `/signin`, `/signup` and
 * `/join` stay on the terminal landing because that is where AuthModal lives —
 * unifying the two designs is a later, deliberate piece of work.
 */
function PublicLanding({ onAuthed }: { onAuthed: () => void }) {
  const authSurface = isPublicAuthPath();

  useEffect(() => {
    // Warms the board behind the landing's primary CTA (Launch Desk → /hr-board).
    void warmGuestHrBoardCache();
  }, []);

  if (!authSurface) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <VouchEdgeLandingV4 />
      </Suspense>
    );
  }

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

/**
 * Everything App.tsx does not claim as a flat document falls through to here,
 * where `useSectionNavigation` owns URL ↔ section resolution and MainViewRouter
 * (inside AppShell, inside AuthenticatedApp) renders the section. `/hr-board`,
 * `/today`, `/settings` and the rest are resolved by that layer, never here.
 *
 * The canvas is rendered here rather than in App so it can react to the same
 * navigation state that picks the surface, while still sitting *outside* the
 * `relative z-10` route wrapper that its stacking model depends on. It stays
 * mounted across section changes and across the landing → app transition, so
 * signing in never tears the WebGL context down.
 */
function ApplicationRoutes() {
  const navigation = useSectionNavigation();
  const canRenderLoggedOutRoute =
    PUBLIC_SECTIONS.has(navigation.activeSection) && navigation.activeSection !== 'vouchedge_intro';
  const forcePublicLanding = shouldForcePublicLanding();
  const showPublicLanding =
    isPublicAuthPath() ||
    ((forcePublicLanding || !navigation.isLoggedIn) &&
      !LEGACY_LANDING_SECTIONS.has(navigation.activeSection) &&
      !canRenderLoggedOutRoute);

  // The V4 landing owns its own visual system — no application ambient field.
  const showV4Landing = showPublicLanding && !isPublicAuthPath();

  return (
    <>
      {!showV4Landing && <GlobalCanvasRoot />}
      <div className="relative z-10 min-h-screen bg-black flex flex-col">
        <div className="flex-grow">
          {showPublicLanding ? (
            <PublicLanding onAuthed={navigation.handleLoginSuccess} />
          ) : (
            <Suspense fallback={<RouteFallback />}>
              <AuthenticatedApp navigation={navigation} />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}

function StaticDocument({ page }: { page: ReturnType<typeof getStaticPublicPage> }) {
  switch (page) {
    case 'policy':
      return <PolicyPage />;
    case 'about':
      return <AboutPage />;
    case 'contact':
      return <ContactPage />;
    case 'blog':
      return <BlogPage slug={getBlogSlug()} />;
    case 'dev':
      return <DevProfilePage />;
    default:
      return null;
  }
}

export default function App() {
  const staticPage = getStaticPublicPage();
  const isAuthCallback = isAuthCallbackPath();
  const isPasswordReset = isPasswordResetPath();
  const isDocumentRoute = Boolean(staticPage) || isAuthCallback || isPasswordReset;

  return (
    // Single shared public-surface motion policy: transform/layout motion is
    // suppressed when the OS asks for reduced motion; opacity still animates.
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        {isDocumentRoute ? (
          <>
            {/* Auth documents keep the canvas — they did in the committed
                architecture, and the field must survive the sign-in hand-off.
                The flat public pages own their own backgrounds. */}
            {!staticPage && <GlobalCanvasRoot />}
            <div className="relative z-10 min-h-screen bg-black flex flex-col">
              <div className="flex-grow">
                {isAuthCallback ? (
                  <AuthCallbackPage />
                ) : isPasswordReset ? (
                  <Suspense fallback={<RouteFallback />}><ResetPasswordPage /></Suspense>
                ) : (
                  <Suspense fallback={<RouteFallback />}><StaticDocument page={staticPage} /></Suspense>
                )}
              </div>
            </div>
          </>
        ) : (
          <ApplicationRoutes />
        )}
        <CookieConsentBanner />
      </QueryClientProvider>
    </MotionConfig>
  );
}
