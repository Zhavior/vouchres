import { decimalToAmerican, decimalLabel } from '../lib/odds';
import { normalizePlayerId } from '../lib/mlbHeadshot';
import { resolveMarket } from '../sports/markets';
import type { Leg, Parlay, Vouch } from '../types';

export interface BackendProfile {
  id: string;
  age_confirmed_at?: string | null;
  jurisdiction_confirmed_at?: string | null;
  jurisdiction?: string | null;
}

export function isAiBackendCandidate(parlay: Parlay): boolean {
  return Boolean(parlay.aiGenerated);
}

export function mapParlayToBackendPayload(parlay: Parlay) {
  const legs = (parlay.legs || []).map((leg) => {
    const resolved = leg.marketCode ? { marketCode: leg.marketCode } : resolveMarket('mlb', leg.market, leg.selection);
    const oddsDecimal = typeof leg.odds === 'number' && Number.isFinite(leg.odds) ? leg.odds : null;
    if (!leg.gamePk || !resolved.marketCode || !leg.selection || !oddsDecimal) {
      return null;
    }
    return {
      event_id: String(leg.gamePk),
      market: resolved.marketCode,
      selection: leg.selection,
      odds_decimal: oddsDecimal,
    };
  }).filter(Boolean) as Array<{
    event_id: string;
    market: string;
    selection: string;
    odds_decimal: number;
  }>;

  if (legs.length < 2) return null;

  return {
    legs,
    stake_units: parlay.wagerAmount ?? 1,
    confidence: parlay.edgeScore ?? undefined,
    explanation: parlay.edgeReport ?? undefined,
  };
}

export function mapBackendParlay(pick: any): Parlay {
  const legs: Leg[] = (pick.legs || []).map((leg: any, i: number) => {
    const dec = typeof leg.odds_decimal === 'number' ? leg.odds_decimal : null;
    return {
      id: leg.id || `${pick.id}-leg-${i}`,
      sport: pick.sport || 'mlb',
      game: leg.event_id || '',
      market: leg.market || '',
      selection: leg.selection || '',
      odds: dec && dec > 1.01 ? decimalToAmerican(dec) : null,
      status: (['WON', 'LOST', 'VOID'].includes(String(leg.status || '').toUpperCase())
        ? (String(leg.status).toUpperCase() as Leg['status'])
        : 'PENDING'),
      gamePk: leg.event_id && leg.event_id !== 'manual' ? leg.event_id : undefined,
      marketCode: leg.market || undefined,
      actual: leg.actual ?? null,
      gameStartTime: leg.game_start_time || undefined,
      playerId: normalizePlayerId(leg.player_id),
    };
  });

  const status = ((): Parlay['status'] => {
    const s = String(pick.status || 'pending').toLowerCase();
    if (s === 'won') return 'WON';
    if (s === 'lost') return 'LOST';
    if (s === 'void' || s === 'push') return 'VOID';
    return 'PENDING';
  })();

  const decOdds = typeof pick.odds_decimal === 'number' ? pick.odds_decimal : null;
  const totalOdds = decimalLabel(decOdds);

  return {
    id: pick.id,
    title: pick.explanation || pick.market || 'Saved Parlay',
    legs,
    totalOdds,
    oddsValue: decOdds && decOdds > 1.01 ? decOdds : 0,
    riskTier: 'MEDIUM',
    status,
    mode: pick.is_demo ? 'PRACTICE' : 'REAL',
    createdAt: pick.created_at,
    wagerAmount: pick.stake_units,
    backendPickId: pick.id,
    backendSyncState: 'synced',
    backendSyncedAt: pick.updated_at || pick.created_at,
    aiGenerated: Boolean(pick.ai_generated),
    feedLockedAt: pick.locked_at ?? undefined,
    lockReason: pick.lock_reason ?? undefined,
    trustCommittedAt: pick.committed_at ?? undefined,
    trustLockAt: pick.trust_lock_at ?? undefined,
    trustAudience: (pick.visibility ?? "private") as Parlay["trustAudience"],
  };
}

export function mapBackendVouch(row: any): Vouch {
  const status = ((): Vouch['status'] => {
    const s = String(row.status || 'pending').toLowerCase();
    if (s === 'won') return 'WON';
    if (s === 'lost') return 'LOST';
    if (s === 'void' || s === 'push') return 'VOID';
    return 'PENDING';
  })();

  return {
    id: row.id,
    vouchSource: row.vouch_source,
    userNote: row.user_note || '',
    market: row.market,
    sport: row.sport,
    playerOrTeam: row.player_or_team || undefined,
    gameName: row.game_name,
    odds: row.odds,
    status,
    savedCount: row.saved_count ?? 0,
    vouchedCount: row.vouched_count ?? 0,
    createdAt: row.created_at,
    isSavedByUser: true,
    line: row.line || undefined,
    selection: row.selection || undefined,
    aiConfidence: row.ai_confidence ?? undefined,
    capperConfidence: row.capper_confidence ?? undefined,
    riskTier: row.risk_tier || undefined,
    isLocked: row.is_locked,
    lockTime: row.lock_time || undefined,
    longerBreakdown: row.longer_breakdown || undefined,
    cardTheme: row.card_theme || undefined,
    visibility: row.visibility,
    backendVouchId: row.id,
    backendSyncState: 'synced',
    backendSyncedAt: row.updated_at || row.created_at,
  };
}
