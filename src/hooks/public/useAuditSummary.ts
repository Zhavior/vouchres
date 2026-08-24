/**
 * Audited track record for the public landing.
 *
 * Mirrors server/services/results/auditSummaryService.ts. Every field is a
 * count over the append-only pregame ledger; when the ledger is empty the hook
 * returns `hasLedger: false` and the section says so rather than showing a
 * proof module with invented proof in it.
 */
import { useEffect, useState } from 'react';

export interface AuditedHypothesis {
  slateDate: string;
  playerName: string;
  teamAbbrev: string | null;
  opponent: string | null;
  pregameHrScore: number | null;
  pregameConfidence: number | null;
  receipt: string;
  capturedAt: string;
  actualHomeRuns: number | null;
}

export interface AuditSummary {
  hasLedger: boolean;
  slatesLogged: number;
  hypothesesLogged: number;
  coverageRatePct: number | null;
  deletedPicks: number;
  deletedPicksBasis: string;
  recent: AuditedHypothesis[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: Omit<AuditSummary, 'isLoading' | 'isError'> = {
  hasLedger: false,
  slatesLogged: 0,
  hypothesesLogged: 0,
  coverageRatePct: null,
  deletedPicks: 0,
  deletedPicksBasis:
    'hr_feature_snapshots is append-only: no UPDATE or DELETE policy exists for any role.',
  recent: [],
};

export function useAuditSummary(): AuditSummary {
  const [state, setState] = useState<{ data: typeof EMPTY; isError: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/results/audit-summary')
      .then((response) => response.json())
      .then((payload) => {
        if (!alive) return;
        if (!payload?.ok) {
          setState({ data: EMPTY, isError: true });
          return;
        }
        setState({
          data: {
            hasLedger: Boolean(payload.hasLedger),
            slatesLogged: Number(payload.slatesLogged) || 0,
            hypothesesLogged: Number(payload.hypothesesLogged) || 0,
            coverageRatePct:
              typeof payload.coverageRatePct === 'number' ? payload.coverageRatePct : null,
            deletedPicks: Number(payload.deletedPicks) || 0,
            deletedPicksBasis: String(payload.deletedPicksBasis ?? EMPTY.deletedPicksBasis),
            recent: Array.isArray(payload.recent) ? payload.recent : [],
          },
          isError: false,
        });
      })
      .catch(() => {
        if (alive) setState({ data: EMPTY, isError: true });
      });

    return () => {
      alive = false;
    };
  }, []);

  return { ...(state?.data ?? EMPTY), isLoading: state == null, isError: state?.isError ?? false };
}
