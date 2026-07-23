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
import { pushAiParlaysToBackend, finalizeParlayTrustLockClient } from '../domain/parlayActions';
import { warmGuestHrBoardCache } from '../lib/boot/guestHrBoardWarmCache';
import { useFeedStore, selectPosts, selectSyncPosts } from '../stores/feedStore';
import { useSlipsStore, selectSavedSlips, selectSyncSlips } from '../stores/slipsStore';
import { useProfileStore, selectProfile, selectSyncProfile } from '../stores/profileStore';
import { useVouchesStore, selectSavedVouches, selectSyncVouches } from '../stores/vouchesStore';
import { SECTIONS_USING_LIVE_GAMES } from './sectionNavigation';
import { fetchAuthMe } from '../hooks/queries/useAuthMe';
import { mapAuthMeToCreatorProof } from '../lib/profileFromAuth';
import { mapBackendParlay, mapBackendVouch } from './backendMappers';
import { normalizeSlipStatus } from '../lib/parlayDisplay';
import { repairAllSavedParlays } from '../lib/parlays/repairSavedParlay';
import { useParlayCommandStore } from '../stores/parlayCommandStore';
import { setAccountStorageScope } from '../lib/accountStorage';
import { queryClient } from '../lib/queryClient';
import { queryKeys } from '../hooks/queries/queryKeys';
import { INITIAL_PROFILE } from '../data/mockData';

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
  const [accountId, setAccountId] = useState<string | null>(null);
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

  const needsLiveGames = SECTIONS_USING_LIVE_GAMES.has(activeSection)
    || savedSlips.some((slip) => normalizeSlipStatus(slip.status) === 'PENDING');
  const { data: liveGamesPayload } = useLiveGames({ enabled: needsLiveGames });
  const liveGames = useMemo(() => liveGamesPayload?.games ?? [], [liveGamesPayload?.games]);
  const { data: backendParlayRows } = useMyParlays({ enabled: Boolean(accountId) });
  const { data: backendVouchRows } = useMyVouches({ enabled: Boolean(accountId) });
  const { data: backendFeedPages } = useFeedQuery({ enabled: Boolean(accountId) });
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
    if (!isLoggedIn) {
      setAccountId(null);
      setAccountStorageScope(null);
      useFeedStore.getState().hydrateFromStorage();
      useSlipsStore.getState().hydrateFromStorage();
      useProfileStore.getState().hydrateFromStorage();
      useVouchesStore.getState().hydrateFromStorage();
      useParlayCommandStore.getState().hydrateDraftSession();
      syncAnalyticsProfile('guest', selectProfile(useProfileStore.getState()));
      return;
    }

    // Never show anonymous or a prior account's browser cache during account bootstrap.
    setAccountId(null);
    useFeedStore.setState({ posts: [] });
    useSlipsStore.setState({ savedSlips: [] });
    useVouchesStore.setState({ savedVouches: [] });
    useProfileStore.setState({ profile: INITIAL_PROFILE });

    let cancelled = false;
    void fetchAuthMe().then((data) => {
      const userId = String(data?.id ?? '');
      if (cancelled || !userId) return;
      setAccountStorageScope(userId);
      useParlayCommandStore.getState().hydrateDraftSession();
      queryClient.removeQueries({ queryKey: queryKeys.myParlays() });
      queryClient.removeQueries({ queryKey: queryKeys.myVouches() });
      queryClient.removeQueries({ queryKey: queryKeys.feed() });
      useProfileStore.getState().hydrateFromStorage();
      const current = useProfileStore.getState().profile;
      const nextProfile = mapAuthMeToCreatorProof(data as unknown as Record<string, unknown>, current);
      syncProfile(nextProfile);
      syncAnalyticsProfile(userId, nextProfile);
      setAccountId(userId);
    });

    return () => { cancelled = true; };
  }, [isLoggedIn, syncProfile]);

  useEffect(() => {
    trackReturningSession();
  }, []);

  useEffect(() => {
    if (!accountId || backendParlayRows === undefined) return;

    const backendParlays = backendParlayRows.map(mapBackendParlay);
    syncSlips(backendParlays);
  }, [accountId, backendParlayRows, syncSlips]);

  useEffect(() => {
    if (!accountId || backendVouchRows === undefined) return;

    const backendVouches = backendVouchRows.map(mapBackendVouch);
    syncVouches(backendVouches);
  }, [accountId, backendVouchRows, syncVouches]);

  useEffect(() => {
    if (!accountId || backendFeedPages === undefined) return;
    syncPosts(backendFeedPosts);
  }, [accountId, backendFeedPages, backendFeedPosts, syncPosts]);

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
    const hasPending = useSlipsStore.getState().savedSlips.some(
      (slip) => slip.status === 'PENDING',
    );
    if (!hasPending) return;

    const run = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const stillPending = useSlipsStore.getState().savedSlips.some(
        (slip) => slip.status === 'PENDING',
      );
      if (!stillPending) return;
      void handleGradeResults();
    };

    run();
    const interval = setInterval(run, 60_000);
    return () => clearInterval(interval);
  }, [handleGradeResults]);

  useEffect(() => {
    if (liveGames.length === 0 || savedSlips.length === 0) return;

    const { parlays, changed } = repairAllSavedParlays(savedSlips, liveGames);
    if (!changed) return;

    syncSlips(parlays);
    useParlayCommandStore.getState().hydrateSavedSlips(parlays);
  }, [liveGames, savedSlips, syncSlips]);

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
      body: 'Confirmed starters only. They lock 30 min before first pitch, then move to ParlayOS.',
      section: 'live_parlays',
    });
  };

  const checkTrustLockSchedule = () => {
    const now = Date.now();
    let changed = false;
    const updated = useSlipsStore.getState().savedSlips.map((p) => {
      if (!p.trustCommittedAt || p.feedLockedAt) return p;
      const lockMs = p.trustLockAt ? new Date(p.trustLockAt).getTime() : 0;
      if (!lockMs) return p;

      let next = p;
      if (!p.trustLockWarningNotified && now >= lockMs - 60_000 && now < lockMs) {
        notify({
          kind: 'lock',
          title: `⏳ Locking in 1 minute`,
          body: `${p.title} locks to your trust ledger soon.`,
          section: 'live_parlays',
        });
        next = { ...next, trustLockWarningNotified: true };
        changed = true;
      }

      if (now >= lockMs && !p.feedLockedAt) {
        void finalizeParlayTrustLockClient(next).then((locked) => {
          if (locked?.feedLockedAt) {
            notify({
              kind: 'lock',
              title: `🔒 Locked: ${p.title}`,
              body: 'Now on your graded trust ledger. Edits are blocked.',
              section: 'live_parlays',
            });
          }
        });
      }
      return next;
    });
    if (changed) syncSlips(updated);
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
      body: 'Moved to ParlayOS. It will auto-grade when the games are final.',
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
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      runScheduledAiGeneration();
      checkTrustLockSchedule();
      checkParlayLocks();
    };
    const warmup = window.setTimeout(tick, 4000);
    const id = window.setInterval(tick, 90_000);
    return () => { window.clearTimeout(warmup); window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn) return;
    if (!['hr_board', 'daily_hr_watch_new'].includes(activeSection)) return;
    void warmGuestHrBoardCache();
  }, [activeSection, isLoggedIn]);

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
