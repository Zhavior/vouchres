import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { FooterNavigationTarget } from '../components/landing-v3';
import VouchEdgeLandingV3 from './VouchEdgeLandingV3';

type AuthMode = 'login' | 'signup';
type SignupPlan = 'free' | 'pro';

const AuthModal = lazy(() => import('../components/auth/AuthModal'));

function authModeFromPath(): AuthMode | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  if (path === '/login' || path === '/signin') return 'login';
  if (path === '/signup' || path === '/join') return 'signup';
  return null;
}

function scrollToSection(id: string) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export default function VouchEdgeTerminalPage({ onAuthed }: { onAuthed?: () => void }) {
  const initialMode = authModeFromPath();
  const [authOpen, setAuthOpen] = useState(Boolean(initialMode));
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode ?? 'signup');
  const [authPlan, setAuthPlan] = useState<SignupPlan>(initialMode === 'login' ? 'free' : 'pro');

  const syncAuthPath = useCallback(() => {
    const mode = authModeFromPath();
    setAuthOpen(Boolean(mode));
    if (mode) setAuthMode(mode);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncAuthPath);
    return () => window.removeEventListener('popstate', syncAuthPath);
  }, [syncAuthPath]);

  const openAuth = useCallback((mode: AuthMode, plan: SignupPlan = 'free') => {
    setAuthMode(mode);
    setAuthPlan(plan);
    setAuthOpen(true);
    const nextPath = mode === 'login' ? '/login' : '/signup';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ vouchedgeAuthOverlay: true }, '', nextPath);
    }
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    if (!authModeFromPath()) return;
    if (window.history.state?.vouchedgeAuthOverlay) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', '/');
  }, []);

  const handleFooterNavigate = useCallback((target: FooterNavigationTarget) => {
    const sectionByTarget: Partial<Record<FooterNavigationTarget, string>> = {
      'Live Games': 'live-intelligence',
      Research: 'features',
      Results: 'community',
      Pricing: 'pricing',
    };

    if (target === 'GitHub') {
      window.open('https://github.com/Zhavior/vouchres', '_blank', 'noopener,noreferrer');
      return;
    }
    const section = sectionByTarget[target];
    if (section) scrollToSection(section);
  }, []);

  return (
    <>
      <VouchEdgeLandingV3
        onLogin={() => openAuth('login')}
        onJoinBeta={() => openAuth('signup', 'pro')}
        onViewDemo={() => scrollToSection('live-intelligence')}
        onExploreCommunity={() => openAuth('signup', 'free')}
        onFooterNavigate={handleFooterNavigate}
      />

      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal
            open
            initialMode={authMode}
            initialPlan={authPlan}
            onClose={closeAuth}
            onAuthed={() => {
              closeAuth();
              onAuthed?.();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
