import type { Vouch } from '../types';
import { apiClient } from '../lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from '../lib/supabaseClient';
import { useVouchesStore } from '../stores/vouchesStore';

export function handleSaveVouch(vouch: Vouch): void {
  const savedVouches = useVouchesStore.getState().savedVouches;
  const syncVouches = useVouchesStore.getState().syncVouches;
  const existing = savedVouches.find((v) => v.id === vouch.id);

  if (existing) {
    syncVouches(savedVouches.filter((v) => v.id !== vouch.id));
    if (existing.backendVouchId) {
      apiClient.delete(`/api/vouches/${encodeURIComponent(existing.backendVouchId)}`)
        .catch((err) => console.warn('[vouches] backend hide failed', err));
    }
    return;
  }

  const newVouch: Vouch = { ...vouch, isSavedByUser: true };
  syncVouches([...savedVouches, newVouch]);
  void pushVouchToBackend(newVouch);
}

export function handleRemoveVouchFromBoard(vouchId: string): void {
  const savedVouches = useVouchesStore.getState().savedVouches;
  const syncVouches = useVouchesStore.getState().syncVouches;
  const existing = savedVouches.find((v) => v.id === vouchId);
  syncVouches(savedVouches.filter((v) => v.id !== vouchId));
  if (existing?.backendVouchId) {
    apiClient.delete(`/api/vouches/${encodeURIComponent(existing.backendVouchId)}`)
      .catch((err) => console.warn('[vouches] backend hide failed', err));
  }
}

/** Best-effort backend sync — never throws. Returns backend id on success. */
export async function pushVouchToBackend(vouch: Vouch): Promise<string | undefined> {
  if (!isSupabaseConfigured) return undefined;

  if (vouch.backendVouchId && vouch.backendSyncState === 'synced') {
    return vouch.backendVouchId;
  }

  const syncVouches = useVouchesStore.getState().syncVouches;

  const markState = (state: Vouch['backendSyncState'], extra?: Partial<Vouch>) => {
    const prev = useVouchesStore.getState().savedVouches;
    syncVouches(
      prev.map((v) => (v.id === vouch.id ? { ...v, backendSyncState: state, ...extra } : v)),
    );
  };

  try {
    const token = await getAuthToken();
    if (!token) {
      markState('auth_required', {
        backendSyncError: 'Sign in to sync this vouch to your account.',
      });
      return undefined;
    }

    markState('saving', { backendSyncError: undefined });

    const payload = {
      vouch_source: vouch.vouchSource,
      user_note: vouch.userNote,
      market: vouch.market,
      sport: vouch.sport,
      player_or_team: vouch.playerOrTeam,
      game_name: vouch.gameName,
      odds: vouch.odds,
      line: vouch.line,
      selection: vouch.selection,
      ai_confidence: vouch.aiConfidence,
      capper_confidence: vouch.capperConfidence,
      risk_tier: vouch.riskTier,
      longer_breakdown: vouch.longerBreakdown,
      card_theme: vouch.cardTheme,
      visibility: vouch.visibility,
    };

    const result = await apiClient.post<{ id: string }>('/api/vouches', payload);

    if (result?.id) {
      markState('synced', {
        backendVouchId: result.id,
        backendSyncedAt: new Date().toISOString(),
      });
      return result.id;
    }

    markState('failed', { backendSyncError: 'Backend did not return a vouch id.' });
    return undefined;
  } catch (err: any) {
    console.warn('[vouches] backend save failed (kept in localStorage)', err);
    markState('failed', {
      backendSyncError: err?.error || err?.message || 'Backend save failed.',
    });
    return undefined;
  }
}
