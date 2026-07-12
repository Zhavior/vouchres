import React from "react";
import { GitBranch, Ticket } from "lucide-react";
import ParlayOsBadgeRow from "../../trust/ParlayOsBadgeRow";
import ParlayTrustPanel from "../../trust/ParlayTrustPanel";
import ParlayIdentityBadge from "../../trust/ParlayIdentityBadge";
import ParlayLockCountdownBanner from "../os/ParlayLockCountdownBanner";
import SmartParlayLegRow from "./SmartParlayLegRow";
import SmartParlayLegCard from "./SmartParlayLegCard";
import { trustLockCountdownLabel } from "../../../lib/trustLockSchedule";
import type { SmartParlaySlip } from "../../../domain/parlay";
import { ParlayOsStatusBadge } from "../hub/parlayOsUi";
import type { LegGradeStatus } from "../types/parlayOsTypes";
import {
  deriveSlipDisplayTitle,
  deriveSlipMarketChips,
  deriveSlipVisualTheme,
} from "./smartSlipTheme";

export type SmartParlaySlipVariant = "hub" | "results" | "embedded" | "feed";

function Perforation() {
  return (
    <div
      className="flex justify-center gap-[3px] py-1.5 border-b border-dashed border-white/10"
      aria-hidden="true"
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-white/15" />
      ))}
    </div>
  );
}

function resultsShellStyle(status: string): { background: string; border: string } {
  const normalized = String(status ?? "pending").toUpperCase();
  if (normalized === "WON" || normalized === "won") {
    return { background: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" };
  }
  if (normalized === "LOST" || normalized === "lost") {
    return { background: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" };
  }
  if (normalized === "VOID" || normalized === "void") {
    return { background: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" };
  }
  return { background: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.18)" };
}

export default function SmartParlaySlipCard({
  slip,
  onViewStructure,
  onViewProof,
  showTrustPanel = true,
  showOsBadges = true,
  showIdentityBadge = true,
  maxLegs = 3,
  legVariant = "pro",
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
  const theme = deriveSlipVisualTheme(slip);
  const displayTitle = deriveSlipDisplayTitle(slip);
  const marketChips = deriveSlipMarketChips(slip.legs);
  const pendingLock = slip.trustCommittedAt && !slip.feedLockedAt;
  const lockLabel = pendingLock ? trustLockCountdownLabel(slip.trustLockAt ?? undefined) : null;
  const pickId = String(slip.sourceId ?? "").trim();
  const showTrust = showTrustPanel && Boolean(pickId && (slip.trustCommittedAt || slip.feedLockedAt));
  const visibleLegs = slip.legs.slice(0, maxLegs);
  const resultsStyle = variant === "results" ? resultsShellStyle(slip.status) : null;
  const identitySummary = slip.identity.complete
    ? `${slip.identity.completeLegs}/${slip.identity.totalLegs} legs linked to slate`
    : `${slip.identity.completeLegs}/${slip.identity.totalLegs} legs linked — repair before lock`;

  const legNodes = visibleLegs.map((leg, index) =>
    legVariant === "pro" ? (
      <SmartParlayLegCard
        key={leg.id}
        leg={leg}
        legIndex={index + 1}
        odds={legOdds?.[leg.id]}
        compact
      />
    ) : (
      <SmartParlayLegRow key={leg.id} leg={leg} legIndex={index + 1} />
    ),
  );

  const useTicketChrome = variant === "hub" || variant === "feed";

  if (variant === "embedded") {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`.trim()}>
        {showIdentityBadge ? (
          <ParlayIdentityBadge identity={slip.identity} />
        ) : null}
        {legNodes}
        {slip.legCount > maxLegs ? (
          <p className="text-[9px] text-center text-white/40">
            +{slip.legCount - maxLegs} more legs
          </p>
        ) : null}
      </div>
    );
  }

  const isTicket = useTicketChrome;
  const shellClass = isTicket
    ? `rounded-2xl border border-dashed bg-gradient-to-b shadow-lg ${theme.borderClass} ${theme.shellGradient}`
    : variant === "results"
      ? "rounded-xl p-4 backdrop-blur-md"
      : "rounded-xl border border-[hsl(var(--ve-border)/0.5)] bg-[hsl(var(--ve-surface)/0.6)] p-3";

  return (
    <article
      className={`relative overflow-hidden flex flex-col ${shellClass} ${className}`.trim()}
      style={
        resultsStyle
          ? { background: resultsStyle.background, border: `1px solid ${resultsStyle.border}` }
          : undefined
      }
      aria-label={slip.title}
    >
      {isTicket ? <Perforation /> : null}

      <div className={`flex flex-col gap-2 ${isTicket ? "px-3 pt-2 pb-3" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isTicket ? (
              <div className="flex items-center gap-1.5 mb-1">
                <Ticket className={`h-3.5 w-3.5 ${theme.ticketIconClass}`} aria-hidden="true" />
                <span className={`font-mono text-[10px] font-bold tracking-wider ${theme.headerAccent}`}>
                  {slip.publicId}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">
                  {theme.label}
                </span>
              </div>
            ) : null}
            <p
              className={`font-bold truncate ${
                variant === "results" ? "text-sm text-white" : "text-sm text-white"
              }`}
            >
              {displayTitle}
            </p>
            {marketChips.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {marketChips.map((chip) => (
                  <span
                    key={chip}
                    className={`rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${theme.chipClass}`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-0.5 text-[10px] text-white/45">
              {metaLine ??
                `${slip.legCount} leg${slip.legCount !== 1 ? "s" : ""}${lockLabel ? ` · ${lockLabel}` : ""}`}
            </p>
            {slip.oddsLabel && slip.oddsLabel !== "—" ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300/70">Combined</span>
                <span className="font-mono text-xs font-black text-emerald-300 tabular-nums">{slip.oddsLabel}</span>
              </div>
            ) : null}
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <ParlayIdentityBadge identity={slip.identity} />
                <span className={`text-[9px] ${slip.identity.complete ? "text-emerald-300/70" : "text-amber-300/80"}`}>
                  {identitySummary}
                </span>
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
              <p className="text-[10px] text-cyan-300/80 font-mono mt-1 tabular-nums">
                Live: {slip.slipProgress.label} ({slip.slipProgress.current}/{slip.slipProgress.target})
              </p>
            ) : null}
          </div>
          <ParlayOsStatusBadge status={status} size="xs" />
        </div>

        <div
          className={
            isTicket
              ? "rounded-xl border border-white/10 bg-black/35 p-2 space-y-2"
              : "space-y-2"
          }
        >
          {legNodes}
        </div>

        {slip.legCount > maxLegs ? (
          <p className="text-[9px] text-center text-white/40">
            +{slip.legCount - maxLegs} more legs
          </p>
        ) : null}

        {footerNote ? (
          <p className="text-[9px] text-slate-500 pt-2 border-t border-white/5">{footerNote}</p>
        ) : null}

        {onViewStructure && slip.legCount > 0 ? (
          <button
            type="button"
            onClick={onViewStructure}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/45 transition hover:border-cyan-500/40 hover:text-cyan-300 min-h-[2.75rem]"
          >
            <GitBranch className="h-3 w-3" />
            View Structure
          </button>
        ) : null}

        {showTrust ? (
          <ParlayTrustPanel pickId={pickId} title={slip.title} className="mt-1" />
        ) : null}
      </div>

      {isTicket ? (
        <div className="border-t border-dashed border-white/10 py-1" aria-hidden="true" />
      ) : null}
    </article>
  );
}
