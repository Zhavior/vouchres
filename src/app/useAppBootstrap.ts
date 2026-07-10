import { syncAnalyticsProfile } from '../lib/syncAnalyticsProfile';
import { ProductEvents } from '../lib/productEvents';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useLiveGames } from '../hooks/queries/useLiveGames';
import { useMyParlays } from '../hooks/queries/useMyParlays';
import { useMyVouches } from '../hooks/queries/useMyVouches';
import { useFeedQuery, flattenFeedPages } from '../hooks/queries/useFeedQuery';
import { canAccessThemeStore } from '../lib/adminDevAccess';
import { notify } from '../lib/appNotifications';
import { isLive } from '../lib/parlayLifecycle';
import { pushAiParlaysToBackend } from '../domain/parlayActions';
import { warmGuestHrBoardCache } from '../lib/boot/guestHrBoardWarmCache';
import { useFeedStore, selectPosts, selectSyncPosts } from '../stores/feedStore';
import { useSlipsStore, selectSavedSlips, selectSyncSlips } from '../stores/slipsStore';
import { useProfileStore, selectProfile, selectSyncProfile } from '../stores/profileStore';
import { useVouchesStore, selectSavedVouches, selectSyncVouches } from '../stores/vouchesStore';
import { SECTIONS_USING_LIVE_GAMES } from './sectionNavigation';
import { fetchAuthMe } from '../hooks/queries/useAuthMe';
import { mapAuthMeToCreatorProof } from '../lib/profileFromAuth';
import { mapBackendParlay, mapBackendVouch } from './backendMappers';

/** Default daily time the AI builds the slate (local time, "HH:MM"). */
const AI_GEN_DEFAULT_TIME = '10:00';

const SESSION_TRACK_KEY = 'vouchedge_session_tracked';

function trackReturningSession() {
  if (typeof window === 'undefined') return;

  if (sessionStorage.getItem(SESSION_TRACK_KEY)) {
    return;
  }

  sessionStorage.setItem(SESSION_TRACK_KEY, 'true');
  ProductEvents.returningSession();
}

type UseAppBootstrapArgs = {
  activeSection: string;
  commitSection: (section: string) => void;
  isLoggedIn: boolean;
};

export function useAppBootstrap({ activeSection, commitSection, isLoggedIn }: UseAppBootstrapArgs) {
  const gradingRef = useRef(false);
  const [, setIsGrading] = useState(false);
  const [, setGradingLastChecked] = useState<Date | null>(null);

  const posts = useFeedStore(selectPosts);
  const syncPosts = useFeedStore(selectSyncPosts);
  const savedSlips = useSlipsStore(selectSavedSlips);
  const syncSlips = useSlipsStore(selectSyncSlips);
  const profile = useProfileStore(selectProfile);
  const syncProfile = useProfileStore(selectSyncProfile);
  const savedVouches = useVouchesStore(selectSavedVouches);
  const syncVouches = useVouchesStore(selectSyncVouches);

  const needsLiveGames = SECTIONS_USING_LIVE_GAMES.has(activeSection);
  const { data: liveGamesPayload } = useLiveGames({ enabled: needsLiveGames });
  const liveGames = liveGamesPayload?.games ?? [];
  const { data: backendParlayRows } = useMyParlays();
  const { data: backendVouchRows } = useMyVouches();
  const { data: backendFeedPages } = useFeedQuery();
  const backendFeedPosts = useMemo(
    () => flattenFeedPages(backendFeedPages),
    [backendFeedPages],
  );
  const canSeeThemeStore = canAccessThemeStore(profile);

  useEffect(() => {
    if (activeSection === 'themestore' && !canSeeThemeStore) {
      commitSection('profile');
    }
  }, [activeSection, canSeeThemeStore, commitSection]);

  useEffect(() => {
    useFeedStore.getState().hydrateFromStorage();
    useSlipsStore.getState().hydrateFromStorage();
    useProfileStore.getState().hydrateFromStorage();

    const profile = selectProfile(useProfileStore.getState());

    syncAnalyticsProfile(
      'local-profile',
      profile
    );
    useVouchesStore.getState().hydrateFromStorage();
  }, []);

  useEffect(() => {
    trackReturningSession();
  }, []);

  useEffect(() => {
    if (!backendParlayRows?.length) return;

    const backendParlays = backendParlayRows.map(mapBackendParlay);
    const backendPickIds = new Set(
      backendParlays
        .map((p) => p.backendPickId || p.id)
        .filter(Boolean)
        .map(String),
    );

    const localSlips = useSlipsStore.getState().savedSlips;
    const localOnly = localSlips.filter((p) => {
      if (!p.backendPickId) return true;
      return !backendPickIds.has(String(p.backendPickId));
    });

    const merged = [...backendParlays, ...localOnly];
    const seen = new Set<string>();
    const deduped = merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    syncSlips(deduped);
  }, [backendParlayRows, syncSlips]);

  useEffect(() => {
    if (!backendVouchRows?.length) return;

    const backendVouches = backendVouchRows.map(mapBackendVouch);
    const backendVouchIds = new Set(
      backendVouches.map((v) => v.backendVouchId || v.id).filter(Boolean).map(String),
    );

    const localOnly = useVouchesStore.getState().savedVouches.filter((v) => {
      if (!v.backendVouchId) return true;
      return !backendVouchIds.has(String(v.backendVouchId));
    });

    const merged = [...backendVouches, ...localOnly];
    const seen = new Set<string>();
    const deduped = merged.filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    syncVouches(deduped);
  }, [backendVouchRows, syncVouches]);

  useEffect(() => {
    if (!backendFeedPosts?.length) return;

    const backendIds = new Set(
      backendFeedPosts
        .map((post) => post.backendPostId || post.id)
        .filter(Boolean)
        .map(String),
    );

    const localPosts = useFeedStore.getState().posts;
    const localOnly = localPosts.filter((post) => {
      if (!post.backendPostId) return true;
      return !backendIds.has(String(post.backendPostId));
    });

    const merged = [...backendFeedPosts, ...localOnly];
    const seen = new Set<string>();
    const deduped = merged.filter((post) => {
      const key = post.backendPostId ? String(post.backendPostId) : post.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    syncPosts(deduped);
  }, [backendFeedPosts, syncPosts]);

  const handleGradeResults = useCallback(async () => {
    if (gradingRef.current) return;
    gradingRef.current = true;
    setIsGrading(true);
    try {
      const { gradePendingParlays } = await import('../lib/parlayGrading');
      const { parlays, newlySettled, changed } = await gradePendingParlays(useSlipsStore.getState().savedSlips);
      if (!changed) return;
      syncSlips(parlays);
      if (newlySettled.length) {
        let wins = 0, losses = 0, units = 0;
        for (const s of newlySettled) {
          if (s.after.status === 'WON') wins++;
          else if (s.after.status === 'LOST') losses++;
          units += s.settledUnits;
          notify({
            kind: 'result',
            title: `${s.after.status === 'WON' ? '🏆 Parlay won' : 'Parlay graded'}: ${s.after.title}`,
            body: `${s.after.status} · ${s.settledUnits >= 0 ? '+' : ''}${s.settledUnits.toFixed(2)} units. View in Results.`,
            section: 'results',
          });
        }
        const cur = useProfileStore.getState().profile!;
        const newTotal = cur.totalPicks + wins + losses;
        const newWon = cur.wonPicks + wins;
        syncProfile({
          ...cur,
          totalPicks: newTotal,
          wonPicks: newWon,
          unitsNetProfit: cur.unitsNetProfit + units,
          winRate: newTotal ? (newWon / newTotal) * 100 : cur.winRate,
        });
      }
    } finally {
      gradingRef.current = false;
      setIsGrading(false);
      setGradingLastChecked(new Date());
    }
  }, [syncSlips, syncProfile]);

  useEffect(() => {
    if (activeSection === 'results' || activeSection === 'live_parlays') handleGradeResults();
  }, [activeSection, handleGradeResults]);

  const runScheduledAiGeneration = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastGen = localStorage.getItem('vouchedge_ai_gen_date');
    if (lastGen === today) return;
    const genTime = localStorage.getItem('vouchedge_ai_gen_time') || AI_GEN_DEFAULT_TIME;
    const [gh, gm] = genTime.split(':').map(Number);
    const now = new Date();
    if (now.getHours() < gh || (now.getHours() === gh && now.getMinutes() < gm)) return;

    const created = await (await import('../lib/aiParlayGenerator')).generateAiParlays({ sport: 'mlb' });
    localStorage.setItem('vouchedge_ai_gen_date', today);
    if (created.length === 0) return;
    const kept = useSlipsStore.getState().savedSlips.filter((p) => !p.aiGenerated || p.status !== 'PENDING');
    syncSlips([...created, ...kept]);
    void pushAiParlaysToBackend(created);
    notify({
      kind: 'ai',
      title: `🤖 V.A.I built ${created.length} parlays for today`,
      body: 'Confirmed starters only. They lock 30 min before first pitch, then move to Parlay Hub.',
      section: 'live_parlays',
    });
  };

  const checkParlayLocks = () => {
    let changed = false;
    const updated = useSlipsStore.getState().savedSlips.map((p) => {
      if (p.status !== 'PENDING' || p.lockNotified) return p;
      if (isLive(p)) {
        changed = true;
        notify({
          kind: 'lock',
          title: `🔒 Locked: ${p.title}`,
          body: 'Moved to Parlay Hub. It will auto-grade when the games are final.',
          section: 'live_parlays',
        });
        return { ...p, lockNotified: true };
      }
      return p;
    });
    if (changed) syncSlips(updated);
  };

  useEffect(() => {
    const tick = () => {
      runScheduledAiGeneration();
      checkParlayLocks();
    };
    const warmup = window.setTimeout(tick, 1500);
    const id = window.setInterval(tick, 60_000);
    return () => { window.clearTimeout(warmup); window.clearInterval(id); };
     
  }, []);

  useEffect(() => {
    if (isLoggedIn) return;
    if (!['hr_board', 'daily_hr_watch_new'].includes(activeSection)) return;
    void warmGuestHrBoardCache();
  }, [activeSection, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    void fetchAuthMe().then((data) => {
      if (cancelled || !data) return;
      const current = useProfileStore.getState().profile;
      syncProfile(mapAuthMeToCreatorProof(data as unknown as Record<string, unknown>, current));
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, syncProfile]);

  return {
    posts,
    profile,
    savedSlips,
    savedVouches,
    liveGames,
    canSeeThemeStore,
    syncSlips,
    syncProfile,
  };
}
