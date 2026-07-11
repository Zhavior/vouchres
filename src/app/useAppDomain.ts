import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { INITIAL_PROFILE } from '../data/mockData';
import { resolveMarket } from '../sports/markets';
import { notify } from '../lib/appNotifications';
import { apiClient } from '../lib/apiClient';
import { normalizePlayerId } from '../lib/mlbHeadshot';
import { type CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
import { useParlayCommandStore } from '../stores/parlayCommandStore';
import { useFeedStore } from '../stores/feedStore';
import { useSlipsStore } from '../stores/slipsStore';
import { useProfileStore } from '../stores/profileStore';
import { useVouchesStore } from '../stores/vouchesStore';
import { handleSaveVouch as saveVouchAction } from '../domain/vouchActions';
import { handleSaveParlaySlip as saveParlaySlipAction, handleCommitParlayTrust as commitParlayTrustAction } from '../domain/parlayActions';
import { useAppCommandStore } from '../stores/appCommandStore';
import type { AppShellState } from '../context/AppShellContext';
import type { CreatorProofProfile, Leg, MLBPlayer, Parlay, Vouch } from '../types';

type UseAppDomainArgs = {
  navigateSection: (section: string) => void;
  handleLoginSuccess: () => void;
  handleLogoutComplete: () => void;
  handleClearProfileViewUser: () => void;
  liveGames: any[];
  savedSlips: Parlay[];
  savedVouches: Vouch[];
  posts: AppShellState['posts'];
  profile: CreatorProofProfile;
  syncSlips: (slips: Parlay[]) => void;
  syncProfile: (profile: CreatorProofProfile) => void;
};

function resolvePlayerResearchMarket(market: string, spec: string) {
  const text = `${market} ${spec}`.toLowerCase();

  const parseTarget = (fallback = 1) => {
    const plus = text.match(/(\d+)\s*\+/);
    if (plus) return Number.parseInt(plus[1], 10);

    const leading = text.match(/^\s*(\d+)\b/);
    if (leading) return Number.parseInt(leading[1], 10);

    return fallback;
  };

  if (/home\s*run|\bhr\b/.test(text)) {
    return { marketCode: 'ANYTIME_HR', statTarget: 1, threshold: 1, comparator: '>=' };
  }

  if (/stolen\s*base|\bsb\b/.test(text)) {
    return { marketCode: 'STOLEN_BASE', statTarget: 1, threshold: 1, comparator: '>=' };
  }

  if (/total\s*bases|\btb\b/.test(text)) {
    const target = parseTarget(1);
    return { marketCode: 'TOTAL_BASES', statTarget: target, threshold: target, comparator: '>=' };
  }

  if (/\brbi\b|runs?\s+batted\s+in/.test(text)) {
    const target = parseTarget(1);
    return { marketCode: 'RBI', statTarget: target, threshold: target, comparator: '>=' };
  }

  if (/\btriple\b/.test(text)) {
    return { marketCode: 'TRIPLE', statTarget: 1, threshold: 1, comparator: '>=' };
  }

  if (/\bdouble\b/.test(text)) {
    return { marketCode: 'DOUBLE', statTarget: 1, threshold: 1, comparator: '>=' };
  }

  if (/\bsingle\b/.test(text)) {
    return { marketCode: 'SINGLE', statTarget: 1, threshold: 1, comparator: '>=' };
  }

  if (/\bhits?\b/.test(text)) {
    const target = parseTarget(1);
    return { marketCode: 'HIT', statTarget: target, threshold: target, comparator: '>=' };
  }

  const fallback = resolveMarket('mlb', market, spec);
  return {
    marketCode: fallback.marketCode,
    statTarget: fallback.threshold,
    threshold: fallback.threshold,
    comparator: '>=',
  };
}

function buildPlayerResearchEventKey(parts: {
  sport: string;
  gamePk?: string;
  playerId?: string | number | null;
  marketCode?: string | null;
  statTarget?: string | number | null;
  comparator?: string | null;
}) {
  const gamePart = parts.gamePk ?? 'GAME_TBD';
  const playerPart = parts.playerId ?? 'PLAYER_TBD';
  const marketPart = parts.marketCode ?? 'MARKET_TBD';
  const targetPart = parts.statTarget ?? 'TARGET_TBD';
  const comparatorPart = String(parts.comparator ?? '>=').replace(/[^a-zA-Z0-9]+/g, '');
  return `${parts.sport}_${gamePart}_${playerPart}_${marketPart}_${targetPart}_${comparatorPart}`;
}

export function useAppDomain({
  navigateSection,
  handleLoginSuccess,
  handleLogoutComplete,
  handleClearProfileViewUser,
  liveGames,
  savedSlips,
  savedVouches,
  posts,
  profile,
  syncSlips,
  syncProfile,
}: UseAppDomainArgs) {
  const [activeLegs, setActiveLegs] = useState<Leg[]>([]);
  const activeLegsRef = useRef<Leg[]>([]);

  useEffect(() => {
    activeLegsRef.current = activeLegs;
  }, [activeLegs]);

  const handleSaveVouch = useCallback((vouch: Vouch) => {
    saveVouchAction(vouch);
  }, []);

  const handleSaveParlaySlip = useCallback(async (newParlay: Parlay | CanonicalParlaySlip) => {
    await saveParlaySlipAction(newParlay, navigateSection);
  }, [navigateSection]);

  const handleCommitParlayTrust = useCallback(async (input: {
    parlay: Parlay;
    audience: "private" | "public" | "subscriber";
  }) => {
    await commitParlayTrustAction({
      parlay: input.parlay,
      audience: input.audience,
      navigateSection,
    });
  }, [navigateSection]);

  const handleUpdateProfile = useCallback((updatedProfile: Partial<CreatorProofProfile>) => {
    const cur = useProfileStore.getState().profile ?? INITIAL_PROFILE;
    syncProfile({ ...cur, ...updatedProfile });
  }, [syncProfile]);

  const handleResetDatabase = useCallback(() => {
    useFeedStore.getState().resetPosts();
    useSlipsStore.getState().resetSlips();
    useVouchesStore.getState().resetVouches();
    useProfileStore.getState().resetProfile();
  }, []);

  const handleAddLegFromResearch = useCallback((player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }) => {
    const playerTeam = player.team ? player.team.toLowerCase() : '';
    const matchedGame = liveGames.find((g: any) =>
      g.homeTeam.toLowerCase() === playerTeam ||
      g.awayTeam.toLowerCase() === playerTeam,
    );

    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      alert(`⚠️ Cannot bet on player: The game for ${player.name} (${matchedGame.awayTeam} @ ${matchedGame.homeTeam}) has already played and is concluded (status: Final). You cannot place picks on completed games.`);
      return;
    }

    if (activeLegsRef.current.some((l) => l.selection === prop.spec)) {
      alert('This player prop selection is already added to your current parlay slip!');
      return;
    }
    const { marketCode, statTarget, threshold, comparator } = resolvePlayerResearchMarket(prop.market, prop.spec);
    const gamePk = prop.gamePk != null ? String(prop.gamePk) : (matchedGame?.gamePk != null ? String(matchedGame.gamePk) : undefined);
    const playerId = normalizePlayerId(prop.playerId ?? player.id ?? prop.id);
    const teamId = (player as { teamId?: string | number | null }).teamId ?? null;
    const eventKey = buildPlayerResearchEventKey({
      sport: 'MLB',
      gamePk,
      playerId,
      marketCode,
      statTarget,
      comparator,
    });
    const popularityKey = `MLB_${playerId ?? 'PLAYER_TBD'}_${marketCode || 'MARKET_TBD'}_${statTarget ?? 'TARGET_TBD'}`;
    const makeTag = (value: unknown) => {
      const raw = String(value ?? '')
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, '');

      return raw ? `#${raw}` : null;
    };

    const marketTag =
      prop.market.toLowerCase().includes('home run') || prop.market.toLowerCase().includes('hr')
        ? '#HR'
        : makeTag(prop.market);

    const draftTags = [
      makeTag('MLB'),
      makeTag(player.team),
      makeTag(player.name),
      marketTag,
      makeTag('PlayerProp'),
      makeTag('Research'),
    ].filter((tag): tag is string => Boolean(tag));

    const newLeg: Leg = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sport: 'MLB',
      game: matchedGame ? `${matchedGame.awayTeam} @ ${matchedGame.homeTeam}` : `${player.team} Live Target`,
      market: prop.market,
      selection: prop.spec,
      odds: prop.odds,
      status: 'PENDING',
      gamePk,
      marketCode,
      statTarget,
      threshold,
      comparator,
      eventKey,
      popularityKey,
      externalProvider: 'vouchedge_player_research',
      playerId,
      teamId,
    };
    setActiveLegs((prev) => [...prev, newLeg]);
    useParlayCommandStore.getState().addDraftLeg({
      id: newLeg.id,
      source: 'manual',
      sport: newLeg.sport,
      game: newLeg.game,
      selection: newLeg.selection,
      odds: newLeg.odds ?? undefined,
      marketCode: newLeg.marketCode,
      marketLabel: newLeg.market,
      playerId: newLeg.playerId,
      playerName: player.name,
      teamLabel: player.team,
      statTarget: newLeg.statTarget ?? newLeg.threshold,
      comparator: newLeg.comparator,
      externalProvider: newLeg.externalProvider ?? 'vouchedge_player_research',
      eventKey: newLeg.eventKey,
      teamId: newLeg.teamId,
      gamePk: newLeg.gamePk,
      tags: draftTags,
    });
    alert(`🎯 Added "${prop.spec}" to your active parlay slip context and Command Center Build Slip!`);
  }, [liveGames]);

  const handleHideSavedParlay = useCallback(async (parlayId: string) => {
    const target = useSlipsStore.getState().savedSlips.find((slip) => {
      const realId = String((slip as any).id ?? (slip as any).sourceId ?? '');
      const publicId = String((slip as any).publicId ?? '');
      return realId === String(parlayId) || publicId === String(parlayId);
    });

    if (!target) {
      throw new Error('Could not find this saved parlay. Refresh My Parlay Board and try again.');
    }

    const status = String((target as any).status ?? '').toLowerCase();
    if (['pending', 'live', 'open', 'active', 'in_progress'].includes(status)) {
      throw new Error('Pending or live parlays are locked to protect grading truth.');
    }

    const realId = String((target as any).id ?? (target as any).sourceId ?? parlayId);
    const isBackendSynced = Boolean((target as any).synced) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(realId);

    if (isBackendSynced) {
      await apiClient.delete(`/api/parlays/${encodeURIComponent(realId)}`);
    }

    const nextSlips = useSlipsStore.getState().savedSlips.filter((slip) => {
      const slipRealId = String((slip as any).id ?? (slip as any).sourceId ?? '');
      const slipPublicId = String((slip as any).publicId ?? '');
      return slipRealId !== realId && slipRealId !== String(parlayId) && slipPublicId !== String(parlayId);
    });

    syncSlips(nextSlips);
  }, [syncSlips]);

  useEffect(() => {
    useAppCommandStore.getState().bind({
      navigateSection,
      onLoginSuccess: handleLoginSuccess,
      onClearProfileViewUser: handleClearProfileViewUser,
      onSaveParlaySlip: handleSaveParlaySlip,
      onCommitParlayTrust: handleCommitParlayTrust,
      onHideSavedParlay: handleHideSavedParlay,
      onAddLegFromResearch: handleAddLegFromResearch,
      onUpdateProfile: handleUpdateProfile,
      onResetDatabase: handleResetDatabase,
      liveGames,
    });
  }, [
    navigateSection,
    handleLoginSuccess,
    handleClearProfileViewUser,
    handleSaveParlaySlip,
    handleCommitParlayTrust,
    handleHideSavedParlay,
    handleAddLegFromResearch,
    handleUpdateProfile,
    handleResetDatabase,
    liveGames,
  ]);

  const savedVouchIds = useMemo(() => savedVouches.map((v) => v.id), [savedVouches]);

  const appShellState = useMemo(
    () => ({
      posts,
      profile,
      savedVouchIds,
      savedVouches,
      savedSlips,
      activeLegs,
      onSaveVouch: handleSaveVouch,
      onAuthLoginSuccess: handleLoginSuccess,
      onAuthLogoutComplete: handleLogoutComplete,
    }),
    [
      posts,
      profile,
      savedVouchIds,
      savedVouches,
      savedSlips,
      activeLegs,
      handleSaveVouch,
      handleLoginSuccess,
      handleLogoutComplete,
    ],
  );

  return {
    appShellState,
    activeLegs,
    handleUpdateProfile,
    handleSaveVouch,
    handleSaveParlaySlip,
    handleLoginSuccess,
    handleLogoutComplete,
  };
}
