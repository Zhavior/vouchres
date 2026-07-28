import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HrWatchRow } from '../features/hr/types/hrWatch';
import type { DailyMlbReport } from '../types/mlb';
import type { LiveGameCard } from '../types/liveGames';
import {
  buildTodayChangeDigest,
  createTodayChangeSnapshot,
  parseTodayChangeDigestEnvelope,
  TODAY_CHANGE_DIGEST_VERSION,
  todayChangeDigestStorageKey,
  type TodayChangeSnapshotV1,
} from '../components/today/todayChangeDigestModel';

interface Input {
  accountId: string | null | undefined;
  report: DailyMlbReport | null;
  hrRows: HrWatchRow[];
  liveGames?: LiveGameCard[];
  enabled?: boolean;
}

export function useTodayChangeDigest({ accountId, report, hrRows, liveGames = [], enabled = true }: Input) {
  const [baseline, setBaseline] = useState<TodayChangeSnapshotV1 | null>(null);
  const [loadedAccountId, setLoadedAccountId] = useState<string | null>(null);
  const current = useMemo(() => createTodayChangeSnapshot(report, hrRows, liveGames), [hrRows, liveGames, report]);
  const hasCurrentData = enabled && (Boolean(report) || hrRows.length > 0 || liveGames.length > 0);

  useEffect(() => {
    if (!accountId || typeof window === 'undefined') {
      setBaseline(null);
      setLoadedAccountId(null);
      return;
    }
    let envelope = null;
    try {
      envelope = parseTodayChangeDigestEnvelope(
        window.localStorage.getItem(todayChangeDigestStorageKey(accountId)),
        accountId,
      );
    } catch {
      // Storage can be disabled; the digest still works for the current session.
    }
    setBaseline(envelope?.snapshot ?? null);
    setLoadedAccountId(accountId);
  }, [accountId]);

  const persist = useCallback((snapshot: TodayChangeSnapshotV1) => {
    if (!accountId || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(todayChangeDigestStorageKey(accountId), JSON.stringify({
        version: TODAY_CHANGE_DIGEST_VERSION,
        accountId,
        snapshot,
      }));
    } catch {
      // Keep the in-memory baseline when persistence is unavailable.
    }
    setBaseline(snapshot);
  }, [accountId]);

  useEffect(() => {
    if (!accountId || loadedAccountId !== accountId || !hasCurrentData) return;
    if (!baseline || (baseline.date && current.date && baseline.date !== current.date)) persist(current);
  }, [accountId, baseline, current, hasCurrentData, loadedAccountId, persist]);

  const changes = useMemo(
    () => enabled && loadedAccountId === accountId ? buildTodayChangeDigest(baseline, current) : [],
    [accountId, baseline, current, enabled, loadedAccountId],
  );

  const markAsChecked = useCallback(() => {
    if (hasCurrentData) persist(current);
  }, [current, hasCurrentData, persist]);

  return {
    changes,
    hasChanges: changes.length > 0,
    markAsChecked,
    baselineCapturedAt: baseline?.capturedAt ?? null,
  };
}
