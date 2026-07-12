import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  Lock,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
} from "lucide-react";
import { apiClient } from "../../lib/apiClient";
import { formatFeedLockTimestamp } from "../../lib/parlayLockPolicy";

interface AuditEntry {
  id: string;
  action: string;
  field_changes?: Record<string, unknown>;
  created_at: string;
}

interface ParlayTrustPanelProps {
  pickId: string;
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionLabel(action: string): string {
  switch (action) {
    case "commit_trust_pending":
      return "Committed to trust ledger";
    case "lock_trust_ledger":
      return "Locked on trust ledger";
    case "update_summary":
      return "Summary updated";
    case "lock_feed_share":
      return "Locked on feed share";
    case "repair_identity":
      return "Identity repaired";
    case "grade_live_hr":
      return "Graded live (HR detected)";
    case "grade_correction":
      return "Result corrected";
    default:
      return action.replace(/_/g, " ");
  }
}

export default function ParlayTrustPanel({
  pickId,
  title,
  defaultExpanded = false,
  className = "",
}: ParlayTrustPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [identityComplete, setIdentityComplete] = useState<boolean | null>(null);
  const [missingLegs, setMissingLegs] = useState<number[]>([]);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const [otsStampedAt, setOtsStampedAt] = useState<string | null>(null);
  const [hasOtsProof, setHasOtsProof] = useState(false);

  const loadTrust = useCallback(async () => {
    if (!pickId) return;
    setLoading(true);
    setError(null);
    try {
      const [audit, parlayPayload] = await Promise.all([
        apiClient.get<{
          entries?: AuditEntry[];
          created_at?: string | null;
          updated_at?: string | null;
          locked_at?: string | null;
        }>(`/api/parlays/${encodeURIComponent(pickId)}/audit`),
        apiClient.get<{ parlay?: { identity?: { complete?: boolean; missingLegIndexes?: number[] }; proof_hash?: string | null; ots_stamped_at?: string | null; has_ots_proof?: boolean } }>(
          `/api/parlays/${encodeURIComponent(pickId)}`,
        ).catch(() => null),
      ]);

      setEntries(audit.entries ?? []);
      setCreatedAt(audit.created_at ?? null);
      setUpdatedAt(audit.updated_at ?? null);
      setLockedAt(audit.locked_at ?? null);
      setProofHash(parlayPayload?.parlay?.proof_hash ?? null);
      setOtsStampedAt(parlayPayload?.parlay?.ots_stamped_at ?? null);
      setHasOtsProof(Boolean(parlayPayload?.parlay?.has_ots_proof));

      const identity = parlayPayload?.parlay?.identity;
      if (identity) {
        setIdentityComplete(Boolean(identity.complete));
        setMissingLegs(Array.isArray(identity.missingLegIndexes) ? identity.missingLegIndexes : []);
      } else {
        setIdentityComplete(null);
        setMissingLegs([]);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load trust history.");
    } finally {
      setLoading(false);
    }
  }, [pickId]);

  useEffect(() => {
    if (expanded) {
      void loadTrust();
    }
  }, [expanded, loadTrust]);

  const handleRepair = async () => {
    setRepairing(true);
    setError(null);
    try {
      await apiClient.post(`/api/parlays/${encodeURIComponent(pickId)}/repair-identity`, {});
      await loadTrust();
    } catch (err: any) {
      setError(err?.message ?? "Identity repair failed.");
    } finally {
      setRepairing(false);
    }
  };

  const lockLabel = formatFeedLockTimestamp(lockedAt ?? undefined);

  return (
    <div className={`rounded-xl border border-slate-800/80 bg-ve-storm/30 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-black/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-wider text-white/80 truncate">
              Trust & Proof{title ? ` · ${title}` : ""}
            </div>
            <div className="text-[10px] text-white/40 font-mono truncate">{pickId}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lockedAt && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-cyan-950/40 text-cyan-300 border-cyan-800/50 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              LOCKED
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60">
          {loading ? (
            <p className="text-[11px] text-white/45 font-mono py-2">Loading trust record…</p>
          ) : (
            <>
              {error && (
                <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="rounded-lg border border-slate-800 bg-black/20 p-2">
                  <div className="text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Created
                  </div>
                  <div className="text-white/80">{formatTimestamp(createdAt)}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-black/20 p-2">
                  <div className="text-white/40 uppercase tracking-wider mb-1">Updated</div>
                  <div className="text-white/80">{formatTimestamp(updatedAt)}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-black/20 p-2">
                  <div className="text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </div>
                  <div className="text-white/80">{lockLabel || (lockedAt ? formatTimestamp(lockedAt) : "Not locked")}</div>
                </div>
              </div>

              {proofHash && (
                <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/15 p-2">
                  <div className="text-[10px] text-cyan-300/70 uppercase tracking-wider mb-1">Proof hash (SHA-256)</div>
                  <div className="text-[10px] font-mono text-cyan-200 break-all">{proofHash}</div>
                  {hasOtsProof && (
                    <a
                      href={`/api/proof/parlay/${encodeURIComponent(pickId)}/ots`}
                      className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono font-black uppercase text-vouch-cyan hover:text-cyan-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Download OpenTimestamp proof
                      {otsStampedAt ? ` · ${formatTimestamp(otsStampedAt)}` : ""}
                    </a>
                  )}
                </div>
              )}

              {identityComplete === false && !lockedAt && (
                <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-[11px] text-amber-300/90">
                    Canonical leg identity incomplete
                    {missingLegs.length > 0 ? ` (legs: ${missingLegs.join(", ")})` : ""}.
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRepair()}
                    disabled={repairing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-700/50 bg-amber-950/40 text-amber-200 text-[10px] font-mono font-black uppercase disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${repairing ? "animate-spin" : ""}`} />
                    Repair identity
                  </button>
                </div>
              )}

              {identityComplete === true && (
                <p className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Canonical leg identity complete.
                </p>
              )}

              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  Audit history
                </div>
                {entries.length === 0 ? (
                  <p className="text-[11px] text-white/35 font-mono">No audit entries yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="text-[10px] font-mono flex items-start justify-between gap-2 rounded-lg border border-slate-850 bg-black/15 px-2 py-1.5"
                      >
                        <span className="text-white/75">{actionLabel(entry.action)}</span>
                        <span className="text-white/35 shrink-0">{formatTimestamp(entry.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <a
                href={`/p/${encodeURIComponent(pickId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase text-vouch-cyan hover:text-cyan-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View public proof page
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
