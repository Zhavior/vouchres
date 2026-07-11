import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { INITIAL_PROFILE } from '../data/mockData';
import { notify } from '../lib/appNotifications';
import { apiClient } from '../lib/apiClient';
import { type CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
import { useParlayCommandStore } from '../stores/parlayCommandStore';
import { useParlayOsStore } from '../stores/parlayOsStore';
import { buildLegsFromTier } from '../lib/parlays/parlayOsLegBuilder';
import { validateParlayLegBatch } from '../lib/parlays/parlayLegValidator';
import type { ParlayMarketTier } from '../lib/parlays/parlayMarketCatalog';
import { inferFamilyFromText } from '../lib/parlays/parlayMarketCatalog';
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

  const commitLegsToSlip = useCallback((newLegs: Leg[]) => {
    if (newLegs.length === 0) return;
    setActiveLegs((prev) => [...prev, ...newLegs]);
    for (const newLeg of newLegs) {
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
        playerName: newLeg.selection.split(' ')[0],
        teamLabel: undefined,
        statTarget: newLeg.statTarget ?? newLeg.threshold,
        comparator: newLeg.comparator,
        externalProvider: newLeg.externalProvider ?? 'parlayos',
        eventKey: newLeg.eventKey,
        teamId: newLeg.teamId,
        gamePk: newLeg.gamePk,
        tags: ['#ParlayOS'],
      });
    }
    useParlayOsStore.getState().openSheet(true);
  }, []);

  const handleConfirmParlayTier = useCallback((tier: ParlayMarketTier) => {
    const ctx = useParlayOsStore.getState().pickerContext;
    if (!ctx?.player) return;

    const editLegId = useParlayOsStore.getState().editLegId;

    const matchedGameCheck = ctx.player.team?.toLowerCase() ?? '';
    const matchedGame = liveGames.find((g: any) =>
      g.homeTeam.toLowerCase() === matchedGameCheck ||
      g.awayTeam.toLowerCase() === matchedGameCheck,
    );
    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      notify({ kind: 'info', title: 'Cannot add legs', body: 'Player\'s game is already final.' });
      return;
    }

    const built = buildLegsFromTier(tier, {
      player: ctx.player,
      propHint: ctx.propHint,
      liveGames,
    });

    const validation = validateParlayLegBatch(
      built.map((entry) => entry.leg),
      ctx.player,
      liveGames,
    );
    if (!validation.valid) {
      notify({
        kind: 'info',
        title: 'Cannot add leg',
        body: validation.blockedReason ?? 'This leg is missing grading identity.',
      });
      return;
    }

    if (editLegId) {
      if (built.length !== 1) {
        notify({
          kind: 'info',
          title: 'Combo not supported',
          body: 'Replace one leg at a time — pick a single prop tier.',
        });
        return;
      }

      const replacement = built[0];
      useParlayCommandStore.getState().replaceDraftLeg(editLegId, replacement.draft);
      setActiveLegs((prev) =>
        prev.map((leg) => (leg.id === editLegId ? replacement.leg : leg)),
      );
      useParlayOsStore.getState().closePicker();
      notify({
        kind: 'success',
        title: 'Leg updated',
        body: replacement.draft.selection ?? tier.label,
        section: 'build',
      });
      useParlayOsStore.getState().openSheet(true);
      return;
    }

    const duplicate = built.some((b) =>
      activeLegsRef.current.some((l) => l.eventKey && l.eventKey === b.leg.eventKey),
    );
    if (duplicate) {
      notify({ kind: 'info', title: 'Already on slip', body: 'This prop is already on your ParlayOS slip.' });
      return;
    }

    commitLegsToSlip(built.map((b) => b.leg));
    notify({
      kind: 'success',
      title: built.length > 1 ? `${built.length} legs added` : 'Leg added',
      body: tier.label,
      section: 'build',
    });
  }, [liveGames, commitLegsToSlip]);

  const handleAddLegFromResearch = useCallback((player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }) => {
    const matchedGameCheck = player.team ? player.team.toLowerCase() : '';
    const matchedGame = liveGames.find((g: any) =>
      g.homeTeam.toLowerCase() === matchedGameCheck ||
      g.awayTeam.toLowerCase() === matchedGameCheck,
    );

    if (matchedGame && matchedGame.status.toLowerCase() === 'final') {
      notify({ kind: 'info', title: 'Game final', body: `Cannot add — ${player.name}'s game is already final.` });
      return;
    }

    const isPitcher = /pitcher|strikeout|\bp\b|\bk\b/i.test(`${prop.market} ${prop.spec}`);
    useParlayOsStore.getState().openPicker({
      player,
      propHint: prop,
      initialFamily: inferFamilyFromText(`${prop.market} ${prop.spec}`),
      isPitcher,
    });
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
      onConfirmParlayTier: handleConfirmParlayTier,
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
    handleConfirmParlayTier,
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
    handleConfirmParlayTier,
    handleLoginSuccess,
    handleLogoutComplete,
  };
}
