import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import {
  DEV_BYPASS_AUTH,
  SIGNED_IN_HOME,
  consumeAfterAuthDestination,
  gateSectionForAuth,
  hasRealAuthToken,
  replaceLandingUrl,
  resolveAuthenticatedSection,
  resolveDevSectionFromLocation,
  redirectToPublicIntro,
  saveActiveSection,
  requiresLogin,
  isPublicFrontPage,
} from './sectionNavigation';
import { supabase } from '../lib/supabaseClient';

const AUTH_ROUTE_SYNC_MS = 200;

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

  const [edgeIslandOpen, setEdgeIslandOpen] = useState(false);
  const [profileViewUserId, setProfileViewUserId] = useState<string | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  const authSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const target = resolveAuthenticatedSection(section);
    if (target !== section) {
      if (hasRealAuthToken()) {
        replaceLandingUrl(target);
      }
      commitSection(target);
      return;
    }

    if (!hasRealAuthToken() && requiresLogin(target)) {
      gateSectionForAuth(target);
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
    void Promise.all([
      import('../lib/queryClient'),
      import('../hooks/queries/queryKeys'),
    ]).then(([{ queryClient }, { queryKeys }]) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
    });
    const saved = consumeAfterAuthDestination();
    navigateSection(saved && requiresLogin(saved) ? saved : SIGNED_IN_HOME);
  }, [navigateSection]);

  const handleLogoutComplete = useCallback(() => {
    setLoggingOut(true);
    window.setTimeout(() => {
      redirectToPublicIntro();
      commitSection('vouchedge_intro');
      setLoggingOut(false);
    }, 900);
  }, [commitSection]);

  useEffect(() => {
    const bumpAuthRevision = () => {
      if (authSyncTimerRef.current) clearTimeout(authSyncTimerRef.current);
      authSyncTimerRef.current = setTimeout(() => {
        setAuthRevision((value) => value + 1);
      }, AUTH_ROUTE_SYNC_MS);
    };

    void supabase.auth.getSession().finally(bumpAuthRevision);

    const { data } = supabase.auth.onAuthStateChange(() => {
      bumpAuthRevision();
    });

    return () => {
      if (authSyncTimerRef.current) clearTimeout(authSyncTimerRef.current);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    if (hasRealAuthToken()) return;
    if (!requiresLogin(activeSection)) return;
    gateSectionForAuth(activeSection);
    commitSection('vouchedge_intro');
  }, [activeSection, commitSection]);

  useEffect(() => {
    if (!hasRealAuthToken()) return;
    if (activeSection !== 'vouchedge_intro') return;
    const next = resolveAuthenticatedSection(activeSection);
    replaceLandingUrl(next);
    commitSection(next);
  }, [activeSection, commitSection]);

  useEffect(() => {
    const syncSectionFromLocation = () => {
      const locationSection = resolveDevSectionFromLocation();
      if (locationSection) {
        navigateSection(locationSection);
      }
    };

    syncSectionFromLocation();
    window.addEventListener('hashchange', syncSectionFromLocation);
    window.addEventListener('popstate', syncSectionFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncSectionFromLocation);
      window.removeEventListener('popstate', syncSectionFromLocation);
    };
  }, [navigateSection]);

  const isLoggedIn = useMemo(() => hasRealAuthToken(), [authRevision]);
  const isPublicFrontPageView = isPublicFrontPage(activeSection, isLoggedIn);
  const showGlobalAppChrome = !isPublicFrontPageView;

  return {
    activeSection,
    activeSectionRef,
    loggingOut,
    isPendingRoute,
    edgeIslandOpen,
    setEdgeIslandOpen,
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
