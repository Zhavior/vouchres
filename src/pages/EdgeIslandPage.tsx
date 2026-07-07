import { useEffect, useMemo, useState } from 'react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import { EdgeIslandShell } from '../components/edgeIsland/EdgeIslandShell';
import { EdgeSummaryPanel } from '../components/edgeIsland/EdgeSummaryPanel';
import { FavoriteStrip } from '../components/edgeIsland/FavoriteStrip';
import { LoggedOutTeaser } from '../components/edgeIsland/LoggedOutTeaser';
import { QuickActionsRow } from '../components/edgeIsland/QuickActionsRow';
import { TodaysEdgeBoard } from '../components/edgeIsland/TodaysEdgeBoard';
import type { CreatorProofProfile, Parlay } from '../types';
import type { EdgeBoardRow, EdgeIslandSummary, FavoriteSignal } from '../components/edgeIsland/edgeIslandTypes';

interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
  profile?: CreatorProofProfile | null;
  isLoggedIn?: boolean;
}

interface EdgeIslandRemoteState {
  gameCount: number | null;
  rows: EdgeBoardRow[];
  generatedAt: string | null;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function firstString(row: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function firstNumber(row: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return Math.round(parsed);
    }
  }
  return null;
}

function arrayFrom(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord).filter((row) => Object.keys(row).length > 0) : [];
}

function readSignals(row: UnknownRecord): string[] {
  const reasons = row.reasons;
  if (Array.isArray(reasons)) {
    return reasons.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 3);
  }

  const scoreBreakdown = asRecord(row.scoreBreakdown);
  const fallback = [
    firstNumber(scoreBreakdown, ['hitterPower']) != null ? `Hitter ${firstNumber(scoreBreakdown, ['hitterPower'])}` : '',
    firstNumber(scoreBreakdown, ['pitcherVulnerability']) != null ? `Pitcher ${firstNumber(scoreBreakdown, ['pitcherVulnerability'])}` : '',
    firstNumber(scoreBreakdown, ['parkFactor']) != null ? `Park ${firstNumber(scoreBreakdown, ['parkFactor'])}` : '',
  ].filter(Boolean);

  return fallback.length ? fallback : ['Verified backend row'];
}

function normalizeEdgeRows(board: unknown): EdgeBoardRow[] {
  const root = asRecord(board);
  const buckets = asRecord(root.candidateBuckets);
  const confirmed = arrayFrom(root.candidates).length ? arrayFrom(root.candidates) : arrayFrom(buckets.confirmed);
  const projected = arrayFrom(root.projectedCandidates).length ? arrayFrom(root.projectedCandidates) : arrayFrom(buckets.projected);

  const toRow = (row: UnknownRecord, index: number, truthStatus: 'confirmed' | 'preview'): EdgeBoardRow | null => {
    const playerName = firstString(row, ['playerName', 'name', 'batterName', 'fullName']);
    if (!playerName) return null;

    const gamePk = firstString(row, ['gamePk', 'gameId'], 'game');
    const team = firstString(row, ['team', 'teamAbbr', 'teamName'], 'TBD');
    const opponent = firstString(row, ['opponent', 'opponentAbbr', 'opponentName'], 'TBD');
    const score = firstNumber(row, ['hrScore', 'hrEdge', 'vouchScore', 'score']);

    return {
      id: `${truthStatus}-${gamePk}-${firstString(row, ['playerId', 'id'], playerName)}-${index}`,
      playerName,
      team,
      opponent,
      market: 'Player Home Runs',
      angle: truthStatus === 'confirmed' ? 'Official lineup candidate' : 'Projection preview only',
      score,
      status: firstString(row, ['lineupStatus', 'gameStatus', 'status'], truthStatus === 'confirmed' ? 'confirmed' : 'projected_unconfirmed'),
      gameTime: firstString(row, ['gameTime', 'startTime', 'firstPitch'], 'Time TBD'),
      signals: readSignals(row),
      truthStatus,
    };
  };

  return [
    ...confirmed.map((row, index) => toRow(row, index, 'confirmed')),
    ...projected.map((row, index) => toRow(row, index, 'preview')),
  ]
    .filter((row): row is EdgeBoardRow => row != null)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, 12);
}

function cleanSlipTitle(parlay: Parlay): string {
  const raw = String(parlay.title || '').trim();
  if (!raw || raw.includes('clientRef=') || raw.includes('backend-ai-') || raw.length > 72) return 'Saved slip';
  return raw;
}

function buildFavorites(savedSlips: Parlay[]): FavoriteSignal[] {
  const seen = new Set<string>();
  const favorites: FavoriteSignal[] = [];

  for (const slip of savedSlips) {
    for (const leg of slip.legs ?? []) {
      const label = String(leg.selection || '').replace(/\s+over\s+.*/i, '').trim();
      if (!label || seen.has(label.toLowerCase())) continue;
      seen.add(label.toLowerCase());
      favorites.push({
        id: `${slip.id}-${leg.id}`,
        label,
        context: leg.game || cleanSlipTitle(slip),
        status: String(slip.status || 'PENDING'),
        edgeSummary: leg.market || 'Tracked saved leg',
      });
      if (favorites.length >= 4) return favorites;
    }
  }

  return favorites;
}

function tierLabel(profile?: CreatorProofProfile | null): string {
  const raw = profile?.subscriptionTier || 'BASIC';
  if (raw === 'SELLER_PRO') return 'Seller Pro';
  if (raw === 'GOLD') return 'Gold';
  return 'Basic';
}

export default function EdgeIslandPage({ onSectionChange, savedSlips = [], profile, isLoggedIn = true }: Props) {
  const [remote, setRemote] = useState<EdgeIslandRemoteState>({ gameCount: null, rows: [], generatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [reportResult, boardResult] = await Promise.allSettled([
        vouchedgeApi.dailyReport(),
        vouchedgeApi.hrBoardToday(12),
      ]);

      if (!alive) return;

      const gameCount =
        reportResult.status === 'fulfilled' && typeof reportResult.value?.gameCount === 'number'
          ? reportResult.value.gameCount
          : null;

      if (boardResult.status === 'fulfilled') {
        const root = asRecord(boardResult.value);
        setRemote({
          gameCount,
          rows: normalizeEdgeRows(boardResult.value),
          generatedAt: firstString(root, ['generatedAt'], '') || new Date().toISOString(),
        });
      } else {
        setRemote({ gameCount, rows: [], generatedAt: null });
        setError(boardResult.reason instanceof Error ? boardResult.reason.message : 'HR board unavailable');
      }

      setLoading(false);
    }

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const personalProfile = isLoggedIn ? profile : null;
  const personalSlips = isLoggedIn ? savedSlips : [];
  const pendingSlips = personalSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING');
  const settledSlips = personalSlips.filter((slip) => ['WON', 'LOST', 'VOID', 'PUSH'].includes(String(slip.status).toUpperCase()));
  const favorites = useMemo<FavoriteSignal[]>(() => buildFavorites(personalSlips), [personalSlips]);
  const confirmedCount = remote.rows.filter((row) => row.truthStatus === 'confirmed').length;
  const previewCount = remote.rows.filter((row) => row.truthStatus === 'preview').length;

  const summary: EdgeIslandSummary = {
    gameCount: remote.gameCount,
    edgeCount: remote.rows.length,
    confirmedCount,
    previewCount,
    pendingSlipCount: pendingSlips.length,
    settledSlipCount: settledSlips.length,
    favoriteCount: favorites.length,
    winRate: personalProfile && personalProfile.totalPicks > 0 ? personalProfile.winRate : null,
    tierLabel: tierLabel(personalProfile),
    generatedAt: remote.generatedAt,
  };

  return (
    <EdgeIslandShell profile={personalProfile} isLoggedIn={isLoggedIn} updatedAt={remote.generatedAt}>
      <div className="space-y-4">
        {!isLoggedIn ? <LoggedOutTeaser onSectionChange={onSectionChange} /> : null}
        <EdgeSummaryPanel summary={summary} loading={loading} />
        <FavoriteStrip favorites={favorites} onSectionChange={onSectionChange} />
        <TodaysEdgeBoard rows={remote.rows} loading={loading} error={error} onSectionChange={onSectionChange} />
        <QuickActionsRow onSectionChange={onSectionChange} />
      </div>
    </EdgeIslandShell>
  );
}
