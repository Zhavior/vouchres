import type { Parlay, Leg } from '../types';
import { notify } from '../lib/appNotifications';
import { apiClient } from '../lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from '../lib/supabaseClient';
import { assessClientParlayIdentity } from '../lib/parlayIdentity';
import { type CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
import { buildBackendSavePayloadFromParlay, draftLegsToParlay } from './parlay/smartParlayPersist';
import { repairDraftLegsIdentity } from '../lib/parlays/repairDraftLegIdentity';
import { useSlipsStore } from '../stores/slipsStore';
import { useParlayCommandStore, type DraftParlayLeg } from '../stores/parlayCommandStore';
import { useAppCommandStore } from '../stores/appCommandStore';

type BackendParlay = {
  id: string;
  updated_at?: string | null;
  created_at?: string | null;
};

function mapBackendParlayFromSave(result: BackendParlay, parlay: Parlay): Parlay {
  return {
    ...parlay,
    backendPickId: result.id,
    backendSyncedAt: new Date().toISOString(),
    backendSyncState: 'synced',
    backendSyncError: undefined,
  };
}

/** Best-effort backend sync — never throws. Parlay survives in localStorage. */
export async function pushParlayToBackend(parlay: Parlay): Promise<void> {
  if (!isSupabaseConfigured) return;

  const syncSlips = useSlipsStore.getState().syncSlips;
  const current = useSlipsStore.getState().savedSlips.find((p) => p.id === parlay.id);
  if (current?.backendPickId && current?.backendSyncState === 'synced') {
    return;
  }
  if (current?.backendSyncState === 'saving' && current !== parlay) {
    return;
  }

  const markState = (state: Parlay['backendSyncState'], extra?: Partial<Parlay>) => {
    syncSlips(
      useSlipsStore.getState().savedSlips.map((p) =>
        p.id === parlay.id ? { ...p, backendSyncState: state, ...extra } : p,
      ),
    );
  };

  try {
    const token = await getAuthToken();
    if (!token) {
      markState('auth_required', {
        backendSyncError: 'Sign in to save this parlay to your account.',
      });
      return;
    }

    markState('saving', { backendSyncError: undefined });

    const payload = buildBackendSavePayloadFromParlay(parlay);

    const result = await apiClient.post<BackendParlay & { deduped?: boolean }>('/api/me/parlays', payload);

    if (result?.id) {
      syncSlips(
        useSlipsStore.getState().savedSlips.map((p) =>
          p.id === parlay.id ? mapBackendParlayFromSave(result, p) : p,
        ),
      );
    } else {
      markState('failed', { backendSyncError: 'Backend did not return a parlay id.' });
    }
  } catch (err: any) {
    console.warn('[parlays] backend save failed (kept in localStorage)', err);
    markState('failed', {
      backendSyncError: err?.error || err?.message || 'Backend save failed.',
    });
  }
}

export async function handleSaveParlaySlip(
  newParlay: Parlay | CanonicalParlaySlip,
  navigateSection: (section: string) => void,
): Promise<void> {
  const liveGames = useAppCommandStore.getState().liveGames;
  const rawLegs = (Array.isArray(newParlay.legs) ? newParlay.legs : []) as DraftParlayLeg[];
  const { legs: repairedLegs } = repairDraftLegsIdentity(rawLegs, liveGames);
  const parlayToSave = { ...newParlay, legs: repairedLegs };

  const identity = assessClientParlayIdentity(
    repairedLegs.map((leg) => leg as Record<string, unknown>),
  );
  if (!identity.complete) {
    notify({
      kind: 'info',
      title: 'Cannot save parlay',
      body: `Leg${identity.missingLegIndexes.length === 1 ? '' : 's'} ${identity.missingLegIndexes.map((i) => i + 1).join(', ')} missing grading identity (gamePk, playerId, market, target). Open Player Research to pick an official player, then re-add the leg.`,
    });
    throw new Error('Parlay legs are missing grading identity.');
  }

  const syncSlips = useSlipsStore.getState().syncSlips;

  const normalizedUiStatus =
    parlayToSave.status === 'won'
      ? 'WON'
      : parlayToSave.status === 'lost'
        ? 'LOST'
        : parlayToSave.status === 'void'
          ? 'VOID'
          : 'PENDING';

  const savedParlay = draftLegsToParlay({
    id: parlayToSave.id || `parlay-${Date.now()}`,
    title: parlayToSave.title,
    legs: repairedLegs,
    status: normalizedUiStatus,
    mode: parlayToSave.mode || 'PRACTICE',
    createdAt: parlayToSave.createdAt || new Date().toISOString(),
    totalOdds: 'totalOdds' in parlayToSave ? String(parlayToSave.totalOdds || '') : '',
    oddsValue: 'oddsValue' in parlayToSave ? Number(parlayToSave.oddsValue || 0) : 0,
    riskTier: 'riskTier' in parlayToSave ? parlayToSave.riskTier : 'LOW',
    aiGenerated: 'aiGenerated' in parlayToSave ? Boolean(parlayToSave.aiGenerated) : false,
  });
  savedParlay.lockNotified = false;
  savedParlay.backendSyncState = 'saving';

  syncSlips([savedParlay, ...useSlipsStore.getState().savedSlips]);

  notify({
    kind: 'success',
    title: '✅ Parlay Saved',
    body: `${savedParlay.title || 'Your parlay'} was saved to Parlay Hub.`,
    section: 'live_parlays',
  });

  useParlayCommandStore.getState().setActivePanel('vai_ledger');
  navigateSection('live_parlays');

  await pushParlayToBackend(savedParlay);
}

export async function pushAiParlaysToBackend(parlays: Parlay[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  for (const parlay of parlays) {
    if (!parlay.aiGenerated) continue;
    await pushParlayToBackend(parlay);
  }
}

function patchSlipTrustFields(parlayId: string, patch: Partial<Parlay>): void {
  const syncSlips = useSlipsStore.getState().syncSlips;
  syncSlips(
    useSlipsStore.getState().savedSlips.map((p) =>
      p.id === parlayId || p.backendPickId === parlayId ? { ...p, ...patch } : p,
    ),
  );
  const slips = useSlipsStore.getState().savedSlips.map((p) => {
    if (p.id === parlayId || p.backendPickId === parlayId) {
      return { ...p, ...patch };
    }
    return p;
  });
  useParlayCommandStore.getState().hydrateSavedSlips(slips);
}

export async function handleCommitParlayTrust(input: {
  parlay: Parlay;
  audience: "private" | "public" | "subscriber";
  navigateSection: (section: string) => void;
}): Promise<Parlay> {
  let working = { ...input.parlay };
  const liveGames = useAppCommandStore.getState().liveGames;
  const { legs: repairedLegs } = repairDraftLegsIdentity(
    (working.legs || []) as DraftParlayLeg[],
    liveGames,
  );
  working = {
    ...working,
    legs: draftLegsToParlay({
      id: working.id,
      title: working.title,
      legs: repairedLegs,
      mode: working.mode,
      status: working.status,
      createdAt: working.createdAt,
      totalOdds: working.totalOdds,
      oddsValue: working.oddsValue,
      riskTier: working.riskTier,
      aiGenerated: working.aiGenerated,
    }).legs,
  };

  const identity = assessClientParlayIdentity(
    (working.legs || []).map((leg) => ({ ...leg } as Record<string, unknown>)),
  );
  if (!identity.complete) {
    throw new Error(
      `Cannot lock to ledger — leg${identity.missingLegIndexes.length === 1 ? '' : 's'} ${identity.missingLegIndexes.map((i) => i + 1).join(', ')} missing grading identity.`,
    );
  }

  if (!working.backendPickId) {
    await pushParlayToBackend(working);
    working = useSlipsStore.getState().savedSlips.find((p) => p.id === input.parlay.id) ?? working;
  }

  const pickId = working.backendPickId ?? working.id;
  if (!pickId) {
    throw new Error("Save this parlay to your account before locking to the trust ledger.");
  }

  const result = await apiClient.post<{ parlay?: Record<string, unknown> }>(
    `/api/parlays/${encodeURIComponent(pickId)}/commit-trust`,
    { audience: input.audience },
  );

  const row = result?.parlay ?? {};
  const committedAt = String(row.committed_at ?? new Date().toISOString());
  const trustLockAt = String(row.trust_lock_at ?? "");
  const audience = (row.visibility ?? input.audience) as Parlay["trustAudience"];

  const patch: Partial<Parlay> = {
    backendPickId: pickId,
    trustCommittedAt: committedAt,
    trustLockAt: trustLockAt || undefined,
    trustAudience: audience,
    trustLockWarningNotified: false,
    trustLockedNotified: false,
  };

  patchSlipTrustFields(pickId, patch);

  notify({
    kind: "success",
    title: "Private wins",
    body: `${working.title || "Your parlay"} is in Private wins. It locks to your trust ledger in 5 minutes.`,
    section: "live_parlays",
  });

  useParlayCommandStore.getState().setActivePanel("live");
  input.navigateSection("live_parlays");

  return { ...working, ...patch };
}

export async function finalizeParlayTrustLockClient(parlay: Parlay): Promise<Parlay | null> {
  const pickId = parlay.backendPickId ?? parlay.id;
  if (!pickId || parlay.feedLockedAt) return parlay;

  try {
    const result = await apiClient.post<{ parlay?: Record<string, unknown> }>(
      `/api/parlays/${encodeURIComponent(pickId)}/finalize-trust-lock`,
    );
    const row = result?.parlay;
    if (!row?.locked_at) return null;

    const patch: Partial<Parlay> = {
      feedLockedAt: String(row.locked_at),
      trustLockAt: undefined,
      trustLockedNotified: true,
    };
    patchSlipTrustFields(pickId, patch);
    return { ...parlay, ...patch };
  } catch {
    return null;
  }
}
