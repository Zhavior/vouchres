import { useEffect, useState } from 'react';
import WelcomeIntro from '../components/theEdge/WelcomeIntro';
import AuthModal from '../components/auth/AuthModal';
import { safeJsonFetch } from '../api/safeApiClient';
import { bootDataStore } from '../lib/boot/bootDataStore';
import type { Parlay } from '../types';

interface SlateGame {
  away: string;
  home: string;
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
          onStartTrial={() => { setAuthMode('signup'); setAuthOpen(true); }}
          onOpenDailyBoard={() => onSectionChange('daily_players')}
          onLogin={() => { setAuthMode('login'); setAuthOpen(true); }}
          onOpenModule={(section) => onSectionChange(section)}
        />
      </div>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
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
