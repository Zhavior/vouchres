import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import {
  DEV_BYPASS_AUTH,
  PUBLIC_SECTIONS,
  SIGNED_IN_HOME,
  resolveSignedInHome,
  devAuthActive,
  hasSignedOut,
  markSignedOut,
  clearSignedOutFlag,
  hasRealAuthToken,
  replaceLandingUrl,
  resolveAuthenticatedSection,
  resolvePublicSection,
  resolveDevSectionFromLocation,
  saveActiveSection,
  requiresLogin,
  isPublicFrontPage,
  shouldForcePublicLanding,
} from './sectionNavigation';
import { persistAuthSession, supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/authSessionStore';
import { useProfileStore } from '../stores/profileStore';
import { canAccessAdminSurfaces } from '../lib/adminDevAccess';

/**
 * HR Next is the signed-in home for every user who can reach it. The profile
 * store rehydrates from localStorage on boot, so returning staff resolve this
 * synchronously and land on HR Next without an intermediate paint.
 */
function signedInHome(): string {
  return resolveSignedInHome(canAccessAdminSurfaces(useProfileStore.getState().profile));
}

export function useSectionNavigation() {
  const authSession = useAuthSession();
  const [edgePortalTransitionActive, setEdgePortalTransitionActive] = useState(() => {
    return sessionStorage.getItem('vouchedge_entering_edge_island') === 'true';
  });

  useEffect(() => {
    if (!edgePortalTransitionActive) return;

    const timer = window.setTimeout(() => {
      sessionStorage.removeItem('vouchedge_entering_edge_island');
      setEdgePortalTransitionActive(false);
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [edgePortalTransitionActive]);

  const [activeSection, setActiveSection] = useState<string>(() => {
    const locationSection = resolveDevSectionFromLocation();
    const raw = locationSection
      ?? (devAuthActive() ? 'hr_board' : 'vouchedge_intro');
    return resolveAuthenticatedSection(raw);
  });
  const activeSectionRef = useRef(activeSection);
  const [loggingOut, setLoggingOut] = useState(false);
  // Mirrors the persisted sign-out latch so a logout re-renders immediately
  // instead of waiting for the next localStorage read.
  const [signedOut, setSignedOut] = useState(() => hasSignedOut());
  const [isPendingRoute, startTransition] = useTransition();

  const [profileViewUserId, setProfileViewUserId] = useState<string | null>(null);

  const commitSection = useCallback((target: string) => {
    startTransition(() => {
      saveActiveSection(target);
      setActiveSection(target);
    });
  }, []);

  const navigateSection = useCallback((section: string) => {
    if (section !== 'profile') {
      setProfileViewUserId(null);
    }
    const target = resolveAuthenticatedSection(resolvePublicSection(section));
    if (target !== section) {
      replaceLandingUrl(target);
      commitSection(target);
      return;
    }

    if (PUBLIC_SECTIONS.has(target)) {
      commitSection(target);
      return;
    }

    if (requiresLogin(target) && !devAuthActive() && !hasRealAuthToken()) {
      try {
        localStorage.setItem('vouchedge_after_auth_destination', target);
      } catch {
        // ignore storage failures
      }

      commitSection('vouchedge_intro');
      return;
    }

    commitSection(target);
  }, [commitSection]);

  const navigateToUserProfile = useCallback((userId: string) => {
    if (!userId) return;
    setProfileViewUserId(userId);
    navigateSection('profile');
  }, [navigateSection]);

  const handleClearProfileViewUser = useCallback(() => {
    setProfileViewUserId(null);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    clearSignedOutFlag();
    setSignedOut(false);
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        persistAuthSession(data.session);
      }

      let destination = signedInHome();
      try {
        const pending = localStorage.getItem('vouchedge_after_auth_destination');
        if (pending) {
          destination = pending;
          localStorage.removeItem('vouchedge_after_auth_destination');
        }
        localStorage.removeItem('vouchedge_after_auth_mode');
      } catch {
        // ignore storage failures
      }
      void Promise.all([
        import('../lib/queryClient'),
        import('../hooks/queries/queryKeys'),
      ]).then(([{ queryClient }, { queryKeys }]) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      });
      replaceLandingUrl(destination);
      navigateSection(destination);
    })();
  }, [navigateSection]);

  const handleLogoutComplete = useCallback(() => {
    markSignedOut();
    setSignedOut(true);
    setLoggingOut(true);
    setProfileViewUserId(null);
    window.history.replaceState(null, '', '/');
    // Deliberately not a transition: startTransition keeps the signed-in tree
    // painted while the landing chunk resolves, which is exactly the "logged
    // out but still on the page" symptom. The landing must take over now.
    saveActiveSection('vouchedge_intro');
    setActiveSection('vouchedge_intro');
    window.setTimeout(() => {
      setLoggingOut(false);
    }, 900);
  }, []);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // A genuine session (magic link, OAuth callback, restored refresh token)
  // releases the latch even when it never went through handleLoginSuccess.
  useEffect(() => {
    if (authSession.status !== 'authenticated') return;
    clearSignedOutFlag();
    setSignedOut(false);
  }, [authSession.status]);

  useEffect(() => {
    if (loggingOut || signedOut) return;
    if (shouldForcePublicLanding()) return;
    if (authSession.status !== 'authenticated') return;
    if (activeSection !== 'vouchedge_intro') return;
    const resolved = resolveAuthenticatedSection(activeSection);
    // Only upgrade the generic home — a saved section is the user's own last
    // location and must win over the default landing.
    const next = resolved === SIGNED_IN_HOME ? signedInHome() : resolved;
    replaceLandingUrl(next);
    commitSection(next);
  }, [activeSection, authSession.status, commitSection, loggingOut, signedOut]);

  useEffect(() => {
    const syncSectionFromLocation = () => {
      const locationSection = resolveDevSectionFromLocation();
      if (locationSection) {
        navigateSection(locationSection);
      }
    };

    window.addEventListener('hashchange', syncSectionFromLocation);
    window.addEventListener('popstate', syncSectionFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncSectionFromLocation);
      window.removeEventListener('popstate', syncSectionFromLocation);
    };
  }, []);

  // A real session always wins; the dev bypass only counts until the user
  // explicitly signs out.
  const isLoggedIn = (DEV_BYPASS_AUTH && !signedOut) || authSession.status === 'authenticated';
  const isPublicFrontPageView = isPublicFrontPage(activeSection, isLoggedIn);
  const showGlobalAppChrome = !isPublicFrontPageView;

  return {
    activeSection,
    activeSectionRef,
    loggingOut,
    isPendingRoute,
    profileViewUserId,
    navigateSection,
    navigateToUserProfile,
    handleClearProfileViewUser,
    handleLoginSuccess,
    handleLogoutComplete,
    commitSection,
    isLoggedIn,
    isPublicFrontPage: isPublicFrontPageView,
    showGlobalAppChrome,
  };
}
