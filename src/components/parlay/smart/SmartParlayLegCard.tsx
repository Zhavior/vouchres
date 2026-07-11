import React from "react";
import { CheckCircle2, Link2, AlertTriangle } from "lucide-react";
import { americanLabel } from "../../../lib/odds";
import type { SmartParlayLeg } from "../../../domain/parlay";
import type { Leg } from "../../../types";
import {
  applySmartLegLiveProgress,
  projectSmartParlayLegFromLeg,
  type LegLiveProgress,
} from "../../../domain/parlay/smartParlayProject";
import { LEG_STATUS_META, type LegGradeStatus } from "../types/parlayHubTypes";
import { z8StatusColor } from "../../../theme/z8Tokens";
import { marketStyle } from "./smartSlipStyles";

function resolveOddsLabel(leg: SmartParlayLeg, odds?: number | null): string {
  if (odds != null) return americanLabel(odds);
  if (leg.oddsLabel && leg.oddsLabel !== "—") return leg.oddsLabel;
  return "TBD";
}

function IdentityChip({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
        Graded ID
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-200">
      <Link2 className="h-2.5 w-2.5" aria-hidden="true" />
      Link slate
    </span>
  );
}

export default React.memo(function SmartParlayLegCard({
  leg,
  odds,
  onRemove,
  onEdit,
  compact = false,
  isWeak = false,
  showTicketChrome = true,
}: {
  leg: SmartParlayLeg;
  odds?: number | null;
  onRemove?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  isWeak?: boolean;
  showTicketChrome?: boolean;
}) {
  const oddsLabel = resolveOddsLabel(leg, odds);
  const progress = leg.progress;
  const market = marketStyle(leg.marketCode);
  const legStatus = String(leg.status ?? "pending").toLowerCase() as LegGradeStatus;
  const legMeta = LEG_STATUS_META[legStatus] ?? LEG_STATUS_META.pending;
  const displayName = leg.playerName && leg.playerName !== "Unknown Player" ? leg.playerName : leg.selection;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${market.glow} backdrop-blur-md transition-all ${
        showTicketChrome ? "border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-white/10"
      } ${compact ? "p-2.5 pl-3" : "p-3 pl-4"} ${isWeak ? "ring-1 ring-amber-400/50" : ""}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${market.stripe}`} aria-hidden="true" />

      <div className="flex gap-2.5">
        <img
          src={leg.headshotUrl ?? undefined}
          alt=""
          className={`rounded-lg border border-white/15 bg-black/50 object-cover shrink-0 ring-1 ring-white/10 ${compact ? "h-10 w-10" : "h-11 w-11"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{market.label}</span>
                <IdentityChip complete={leg.identityComplete} />
                {isWeak ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase text-amber-300">
                    <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                    Weak
                  </span>
                ) : null}
              </div>
              <p className={`font-bold text-white truncate ${compact ? "text-xs" : "text-sm"}`}>{displayName}</p>
              <p className="text-[10px] text-white/45 truncate">{leg.marketLabel}</p>
              {leg.gameLabel ? (
                <p className="text-[9px] text-cyan-300/50 truncate mt-0.5">{leg.gameLabel}</p>
              ) : null}
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <span className="text-sm font-mono font-black text-cyan-300 tabular-nums">{oddsLabel}</span>
              <span
                className="text-[8px] font-bold uppercase tracking-wide"
                style={{ color: z8StatusColor(legMeta.token) }}
              >
                {legMeta.icon} {legMeta.label}
              </span>
              <div className="flex flex-col items-end gap-0.5">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-[9px] text-cyan-300/70 hover:text-cyan-200 uppercase tracking-wide min-h-[1.5rem]"
                  >
                    Edit
                  </button>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="text-[9px] text-white/35 hover:text-rose-300 uppercase tracking-wide min-h-[1.5rem]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {progress ? (
            <div className="mt-2 rounded-lg bg-black/35 border border-cyan-500/15 p-2">
              <div className="flex justify-between text-[9px] font-mono text-cyan-200/80 mb-1">
                <span>{progress.label}</span>
                <span className="tabular-nums">{progress.current}/{progress.target}</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300 transition-all"
                  style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export function SmartParlayLegCardFromLeg({
  leg,
  index = 0,
  liveProgress,
  weakLegIds,
  onEdit,
  onRemove,
  compact = false,
}: {
  leg: Leg;
  index?: number;
  liveProgress?: LegLiveProgress | null;
  weakLegIds?: string[];
  onEdit?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}) {
  const smartLeg = applySmartLegLiveProgress(projectSmartParlayLegFromLeg(leg, index), liveProgress);
  return (
    <SmartParlayLegCard
      leg={smartLeg}
      odds={leg.odds}
      onEdit={onEdit}
      onRemove={onRemove}
      compact={compact}
      isWeak={weakLegIds?.includes(leg.id)}
    />
  );
}

export function SmartParlayLegList({
  legs,
  liveProgressByLegId,
  weakLegIds,
  onEdit,
  onRemove,
  compact = false,
}: {
  legs: Leg[];
  liveProgressByLegId?: Record<string, LegLiveProgress>;
  weakLegIds?: string[];
  onEdit?: (legId: string) => void;
  onRemove?: (legId: string) => void;
  compact?: boolean;
}) {
  if (legs.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      {legs.map((leg, index) => (
        <SmartParlayLegCardFromLeg
          key={leg.id}
          leg={leg}
          index={index}
          liveProgress={liveProgressByLegId?.[leg.id]}
          weakLegIds={weakLegIds}
          onEdit={onEdit ? () => onEdit(leg.id) : undefined}
          onRemove={onRemove ? () => onRemove(leg.id) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}
