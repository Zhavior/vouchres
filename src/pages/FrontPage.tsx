import { useEffect, useState } from 'react';
import WelcomeIntro from '../components/theEdge/WelcomeIntro';
import AuthModal from '../components/auth/AuthModal';
import { safeJsonFetch } from '../api/safeApiClient';
import { bootDataStore } from '../lib/boot/bootDataStore';
import type { Parlay } from '../types';

interface SlateGame {
  away: string;
  home: string;
  awayTeamId: number | null;
  homeTeamId: number | null;
  time: string;
  live: boolean;
}

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
  onAuthed?: () => void;
}

function mapSlateGames(payload: any): SlateGame[] {
  return (payload?.games ?? []).slice(0, 12).map((g: any) => ({
    away: g.awayTeam?.abbrev ?? g.awayTeam?.name ?? 'AWY',
    home: g.homeTeam?.abbrev ?? g.homeTeam?.name ?? 'HOM',
    awayTeamId: g.awayTeam?.id ?? null,
    homeTeamId: g.homeTeam?.id ?? null,
    time: g.gameDate ? new Date(g.gameDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
    live: /progress|live|in play/i.test(String(g.status ?? '')),
  }));
}

/**
 * The public front page — shown to logged-out visitors (including right
 * after logout) at the 'welcome' section. Logged-in users get
 * EdgeIslandPage instead (see the 'welcome' case in App.tsx).
 */
export default function FrontPage({ onSectionChange, savedSlips = [], onAuthed }: Props) {
  const [slate, setSlate] = useState<SlateGame[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authPlan, setAuthPlan] = useState<'free' | 'pro' | 'capper'>('free');

  useEffect(() => {
    let alive = true;

    const bootLineup = bootDataStore.get<any>('lineupToday');
    if (bootLineup) {
      const bootGames = mapSlateGames(bootLineup);
      if (bootGames.length > 0) setSlate(bootGames);
    }

    safeJsonFetch<any>('/api/mlb/lineup/today', { fallbackData: { games: [] }, timeoutMs: 12000 }).then((r) => {
      if (!alive) return;
      setSlate(mapSlateGames(r.data));
    });

    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAuth = params.get('auth');
    if (requestedAuth !== 'login' && requestedAuth !== 'signup') return;

    const requestedPlan = params.get('plan');
    const plan = requestedPlan === 'pro' || requestedPlan === 'capper' ? requestedPlan : 'free';

    setAuthPlan(plan);
    setAuthMode(requestedAuth);
    setAuthOpen(true);
  }, []);

  const stats = {
    gamesToday: slate.length,
    liveNow: slate.filter((g) => g.live).length,
    saved: savedSlips.length,
  };

  return (
    <>
      <div className="min-h-screen bg-obsidian-900 px-4 py-10 sm:px-8">
        <WelcomeIntro
          slate={slate}
          stats={stats}
          onStartTrial={() => { setAuthPlan('free'); setAuthMode('signup'); setAuthOpen(true); }}
          onOpenDailyBoard={() => onSectionChange('daily_players')}
          onLogin={() => { setAuthPlan('free'); setAuthMode('login'); setAuthOpen(true); }}
          onOpenModule={(section) => onSectionChange(section)}
        />
      </div>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        initialPlan={authPlan}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => {
          setAuthOpen(false);
          onAuthed?.();
        }}
        onGuest={() => setAuthOpen(false)}
      />
    </>
  );
}
