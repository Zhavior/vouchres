import type { Parlay } from '../types';
import { assessClientParlayIdentity } from '../lib/parlayIdentity';

export type ParlaySettlementState = 'pending' | 'won' | 'lost' | 'push' | 'void';
export type ParlaySyncState = 'synced' | 'saving' | 'local_recent' | 'practice' | 'failed';
export type ParlayIdentityState = 'complete' | 'repair_required';
export type ParlayLifecycleState = 'upcoming' | 'locked' | 'live' | 'awaiting_result' | 'settled' | 'time_tbd';

export interface CanonicalParlayState {
  settlement: ParlaySettlementState;
  sync: ParlaySyncState;
  identity: ParlayIdentityState;
  lifecycle: ParlayLifecycleState;
  attentionReasons: Array<'sync_failed' | 'identity_repair' | 'start_time_missing' | 'awaiting_result'>;
}

type LegGameState = 'scheduled' | 'live' | 'final' | 'disrupted' | 'unknown';

function legGameState(status: unknown): LegGameState {
  const value = String(status ?? '').trim().toLowerCase();
  if (!value) return 'unknown';
  if (/postpon|suspend|cancel|forfeit/.test(value)) return 'disrupted';
  if (/final|game over|completed|official/.test(value)) return 'final';
  if (/progress|live|in play|warmup|delayed|challenge|review|top |bottom |middle |end /.test(value)) return 'live';
  if (/scheduled|preview|pre-game|pregame/.test(value)) return 'scheduled';
  return 'unknown';
}

function settlementState(parlay: Parlay): ParlaySettlementState {
  if (parlay.status === 'WON') return 'won';
  if (parlay.status === 'LOST') return 'lost';
  if (parlay.status === 'VOID') return 'void';
  return 'pending';
}

function syncState(parlay: Parlay): ParlaySyncState {
  if (parlay.mode === 'PRACTICE') return 'practice';
  if (parlay.backendPickId && parlay.backendSyncState === 'synced') return 'synced';
  if (parlay.backendSyncState === 'saving') return 'saving';
  if (parlay.backendSyncState === 'failed') return 'failed';
  return 'local_recent';
}

function lifecycleState(parlay: Parlay, settlement: ParlaySettlementState, now: Date): ParlayLifecycleState {
  if (settlement !== 'pending') return 'settled';

  const gameStates = (parlay.legs || []).map((leg) => legGameState(leg.gameStatus));
  if (gameStates.includes('live')) return 'live';
  if (gameStates.length > 0 && gameStates.every((state) => state === 'final')) return 'awaiting_result';

  const starts = (parlay.legs || [])
    .map((leg) => Date.parse(String(leg.gameStartTime ?? '')))
    .filter(Number.isFinite);
  if (starts.length === 0) return 'time_tbd';

  const earliest = Math.min(...starts);
  const latest = Math.max(...starts);
  if (now.getTime() < earliest) return 'upcoming';
  if (now.getTime() >= latest) return 'awaiting_result';
  return gameStates.includes('final') ? 'upcoming' : 'live';
}

export function deriveCanonicalParlayState(parlay: Parlay, now = new Date()): CanonicalParlayState {
  const settlement = settlementState(parlay);
  const sync = syncState(parlay);
  const identity = assessClientParlayIdentity(
    (parlay.legs || []).map((leg) => leg as unknown as Record<string, unknown>),
  ).complete ? 'complete' : 'repair_required';
  const lifecycle = lifecycleState(parlay, settlement, now);
  const attentionReasons: CanonicalParlayState['attentionReasons'] = [];

  if (sync === 'failed') attentionReasons.push('sync_failed');
  if (identity === 'repair_required') attentionReasons.push('identity_repair');
  if (lifecycle === 'time_tbd') attentionReasons.push('start_time_missing');
  if (lifecycle === 'awaiting_result') attentionReasons.push('awaiting_result');

  return { settlement, sync, identity, lifecycle, attentionReasons };
}

export function selectParlayWorkspaces(parlays: Parlay[], now = new Date()) {
  const rows = parlays.map((parlay) => ({ parlay, state: deriveCanonicalParlayState(parlay, now) }));
  return {
    upcoming: rows.filter(({ state }) => state.lifecycle === 'upcoming'),
    live: rows.filter(({ state }) => state.lifecycle === 'locked' || state.lifecycle === 'live'),
    results: rows.filter(({ state }) => state.lifecycle === 'settled'),
    attention: rows.filter(({ state }) => state.attentionReasons.length > 0),
  };
}
