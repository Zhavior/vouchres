import React from "react";
import { GitBranch } from "lucide-react";
import ParlayOsBadgeRow from "../../trust/ParlayOsBadgeRow";
import ParlayTrustPanel from "../../trust/ParlayTrustPanel";
import ParlayIdentityBadge from "../../trust/ParlayIdentityBadge";
import ParlayLockCountdownBanner from "../os/ParlayLockCountdownBanner";
import SmartParlayLegRow from "./SmartParlayLegRow";
import SmartParlayLegCard from "./SmartParlayLegCard";
import { trustLockCountdownLabel } from "../../../lib/trustLockSchedule";
import type { SmartParlaySlip } from "../../../domain/parlay";
import { ParlayHubStatusBadge } from "../hub/parlayHubUi";
import type { LegGradeStatus } from "../types/parlayHubTypes";

export default function SmartParlaySlipCard({
  slip,
  onViewStructure,
  onViewProof,
  showTrustPanel = true,
  maxLegs = 3,
  legVariant = "row",
  className = "",
}: {
  slip: SmartParlaySlip;
  onViewStructure?: () => void;
  onViewProof?: () => void;
  showTrustPanel?: boolean;
  maxLegs?: number;
  legVariant?: "row" | "pro";
  className?: string;
}) {
  const status = String(slip.status ?? "pending").toLowerCase() as LegGradeStatus;
  const pendingLock = slip.trustCommittedAt && !slip.feedLockedAt;
  const lockLabel = pendingLock ? trustLockCountdownLabel(slip.trustLockAt ?? undefined) : null;
  const pickId = String(slip.sourceId ?? "").trim();
  const showTrust = showTrustPanel && Boolean(pickId && (slip.trustCommittedAt || slip.feedLockedAt));
  const visibleLegs = slip.legs.slice(0, maxLegs);

  return (
    <article
      className={`flex flex-col gap-2 p-3 rounded-xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-surface)/0.6)] ${className}`.trim()}
      aria-label={slip.title}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[hsl(var(--ve-text-primary))] truncate">{slip.title}</p>
          <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
            {slip.legCount} leg{slip.legCount !== 1 ? "s" : ""}
            {lockLabel ? ` · ${lockLabel}` : ""}
            {slip.oddsLabel && slip.oddsLabel !== "—" ? ` · ${slip.oddsLabel}` : ""}
          </p>
          <ParlayOsBadgeRow
            className="mt-1.5"
            input={{
              id: pickId || slip.publicId,
              status: slip.status,
              committedAt: slip.trustCommittedAt,
              feedLockedAt: slip.feedLockedAt,
              lockReason: slip.lockReason,
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ParlayIdentityBadge identity={slip.identity} />
          </div>
          <ParlayLockCountdownBanner
            trustCommittedAt={slip.trustCommittedAt}
            trustLockAt={slip.trustLockAt}
            feedLockedAt={slip.feedLockedAt}
          />
          {onViewProof ? (
            <button
              type="button"
              onClick={onViewProof}
              className="inline-flex text-[10px] font-bold uppercase tracking-wide text-cyan-300 hover:text-cyan-200 mt-1 min-h-[2rem]"
            >
              View proof
            </button>
          ) : null}
          {slip.slipProgress ? (
            <p className="text-[10px] text-cyan-300/80 font-mono mt-1">
              Live: {slip.slipProgress.label} ({slip.slipProgress.current}/{slip.slipProgress.target})
            </p>
          ) : null}
        </div>
        <ParlayHubStatusBadge status={status} size="xs" />
      </div>

      {visibleLegs.map((leg) =>
        legVariant === "pro" ? (
          <SmartParlayLegCard key={leg.id} leg={leg} compact />
        ) : (
          <SmartParlayLegRow key={leg.id} leg={leg} />
        ),
      )}

      {slip.legCount > maxLegs ? (
        <p className="text-[9px] text-[hsl(var(--ve-text-muted))] text-center">
          +{slip.legCount - maxLegs} more legs
        </p>
      ) : null}

      {onViewStructure && slip.legCount > 0 ? (
        <button
          type="button"
          onClick={onViewStructure}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--ve-border)/0.5)] py-1.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--ve-text-muted))] transition hover:border-cyan-500/40 hover:text-cyan-300 min-h-[2.75rem]"
        >
          <GitBranch className="h-3 w-3" />
          View Structure
        </button>
      ) : null}

      {showTrust ? (
        <ParlayTrustPanel pickId={pickId} title={slip.title} className="mt-1" />
      ) : null}
    </article>
  );
}
