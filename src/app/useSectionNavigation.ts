import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import {
  DEV_BYPASS_AUTH,
  PUBLIC_SECTIONS,
  SIGNED_IN_HOME,
  hasRealAuthToken,
  replaceLandingUrl,
  resolveAuthenticatedSection,
  resolvePublicSection,
  resolveDevSectionFromLocation,
  saveActiveSection,
  requiresLogin,
  isPublicFrontPage,
} from './sectionNavigation';
import { persistAuthSession, supabase } from '../lib/supabaseClient';

export function useSectionNavigation() {
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
      ?? (DEV_BYPASS_AUTH && hasRealAuthToken() ? 'hr_board' : 'vouchedge_intro');
    return resolveAuthenticatedSection(raw);
  });
  const activeSectionRef = useRef(activeSection);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isPendingRoute, startTransition] = useTransition();

  const [profileViewUserId, setProfileViewUserId] = useState<string | null>(null);

  const commitSection = useCallback((target: string) => {
    void import('../lib/routePreload').then(({ preloadSection }) => preloadSection(target));
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

    if (requiresLogin(target) && !hasRealAuthToken()) {
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
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        persistAuthSession(data.session);
      }

      let destination = SIGNED_IN_HOME;
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
    setLoggingOut(true);
    window.history.replaceState(null, '', '/');
    commitSection('vouchedge_intro');
    window.setTimeout(() => {
      setLoggingOut(false);
    }, 900);
  }, [commitSection]);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    if (loggingOut) return;
    if (!hasRealAuthToken()) return;
    if (activeSection !== 'vouchedge_intro') return;
    const next = resolveAuthenticatedSection(activeSection);
    replaceLandingUrl(next);
    commitSection(next);
  }, [activeSection, commitSection, loggingOut]);

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

  const isLoggedIn = hasRealAuthToken();
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
