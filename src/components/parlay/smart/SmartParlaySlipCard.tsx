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

export type SmartParlaySlipVariant = "hub" | "results" | "embedded";

function resultsShellStyle(status: string): { background: string; border: string } {
  const normalized = String(status ?? "pending").toUpperCase();
  if (normalized === "WON" || normalized === "won") {
    return { background: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" };
  }
  if (normalized === "LOST" || normalized === "lost") {
    return { background: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" };
  }
  if (normalized === "VOID" || normalized === "void") {
    return { background: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" };
  }
  return { background: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.15)" };
}

export default function SmartParlaySlipCard({
  slip,
  onViewStructure,
  onViewProof,
  showTrustPanel = true,
  showOsBadges = true,
  showIdentityBadge = true,
  maxLegs = 3,
  legVariant = "row",
  variant = "hub",
  metaLine,
  footerNote,
  legOdds,
  className = "",
}: {
  slip: SmartParlaySlip;
  onViewStructure?: () => void;
  onViewProof?: () => void;
  showTrustPanel?: boolean;
  showOsBadges?: boolean;
  showIdentityBadge?: boolean;
  maxLegs?: number;
  legVariant?: "row" | "pro";
  variant?: SmartParlaySlipVariant;
  metaLine?: string;
  footerNote?: string;
  legOdds?: Record<string, number | null | undefined>;
  className?: string;
}) {
  const status = String(slip.status ?? "pending").toLowerCase() as LegGradeStatus;
  const pendingLock = slip.trustCommittedAt && !slip.feedLockedAt;
  const lockLabel = pendingLock ? trustLockCountdownLabel(slip.trustLockAt ?? undefined) : null;
  const pickId = String(slip.sourceId ?? "").trim();
  const showTrust = showTrustPanel && Boolean(pickId && (slip.trustCommittedAt || slip.feedLockedAt));
  const visibleLegs = slip.legs.slice(0, maxLegs);
  const resultsStyle = variant === "results" ? resultsShellStyle(slip.status) : null;

  const legNodes = visibleLegs.map((leg) =>
    legVariant === "pro" ? (
      <SmartParlayLegCard
        key={leg.id}
        leg={leg}
        odds={legOdds?.[leg.id]}
        compact
      />
    ) : (
      <SmartParlayLegRow key={leg.id} leg={leg} />
    ),
  );

  if (variant === "embedded") {
    return (
      <div className={`flex flex-col gap-3 ${className}`.trim()}>
        {showIdentityBadge ? (
          <ParlayIdentityBadge identity={slip.identity} />
        ) : null}
        {legNodes}
        {slip.legCount > maxLegs ? (
          <p className="text-[9px] text-[hsl(var(--ve-text-muted))] text-center">
            +{slip.legCount - maxLegs} more legs
          </p>
        ) : null}
      </div>
    );
  }

  const shellClass =
    variant === "results"
      ? "rounded-xl p-4 backdrop-blur-md"
      : "rounded-xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-surface)/0.6)] p-3";

  return (
    <article
      className={`flex flex-col gap-2 ${shellClass} ${className}`.trim()}
      style={
        resultsStyle
          ? { background: resultsStyle.background, border: `1px solid ${resultsStyle.border}` }
          : undefined
      }
      aria-label={slip.title}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`font-bold truncate ${
              variant === "results"
                ? "text-sm text-white"
                : "text-xs text-[hsl(var(--ve-text-primary))]"
            }`}
          >
            {slip.title}
          </p>
          <p
            className={`mt-0.5 ${
              variant === "results"
                ? "text-[10px] text-slate-500"
                : "text-[10px] text-[hsl(var(--ve-text-muted))]"
            }`}
          >
            {metaLine ??
              `${slip.legCount} leg${slip.legCount !== 1 ? "s" : ""}${lockLabel ? ` · ${lockLabel}` : ""}${slip.oddsLabel && slip.oddsLabel !== "—" ? ` · ${slip.oddsLabel}` : ""}`}
          </p>
          {showOsBadges ? (
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
          ) : null}
          {showIdentityBadge ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ParlayIdentityBadge identity={slip.identity} />
            </div>
          ) : null}
          {variant === "hub" ? (
            <ParlayLockCountdownBanner
              trustCommittedAt={slip.trustCommittedAt}
              trustLockAt={slip.trustLockAt}
              feedLockedAt={slip.feedLockedAt}
            />
          ) : null}
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

      {legNodes}

      {slip.legCount > maxLegs ? (
        <p className="text-[9px] text-[hsl(var(--ve-text-muted))] text-center">
          +{slip.legCount - maxLegs} more legs
        </p>
      ) : null}

      {footerNote ? (
        <p className="text-[9px] text-slate-600 pt-2 border-t border-white/5">{footerNote}</p>
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
