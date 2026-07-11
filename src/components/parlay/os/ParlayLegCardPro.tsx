import React from "react";
import type { Leg } from "../../../types";
import { americanLabel } from "../../../lib/odds";
import { deriveLegProgress } from "../../../lib/parlayLegProgress";
import { isClientLegIdentityComplete } from "../../../lib/parlayIdentity";
import { getMlbHeadshotUrl, getFallbackHeadshot } from "../../../lib/parlayDisplay";

const MARKET_COLORS: Record<string, string> = {
  ANYTIME_HR: "from-amber-500/20 to-orange-600/10 border-amber-400/40",
  RUN: "from-emerald-500/15 to-teal-600/10 border-emerald-400/35",
  HIT: "from-cyan-500/15 to-sky-600/10 border-cyan-400/35",
  RBI: "from-violet-500/15 to-purple-600/10 border-violet-400/35",
  TOTAL_BASES: "from-rose-500/15 to-pink-600/10 border-rose-400/35",
  STRIKEOUTS: "from-red-500/20 to-orange-700/10 border-red-400/40",
  PITCHER_OUTS: "from-slate-500/15 to-zinc-600/10 border-slate-400/35",
  STOLEN_BASE: "from-yellow-500/15 to-lime-600/10 border-yellow-400/35",
};

function marketGradient(code?: string | null): string {
  const key = String(code ?? "").toUpperCase();
  return MARKET_COLORS[key] ?? "from-white/5 to-white/[0.02] border-white/15";
}

export default React.memo(function ParlayLegCardPro({
  leg,
  onRemove,
  onEdit,
  compact = false,
  isWeak = false,
}: {
  leg: Leg;
  onRemove?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  isWeak?: boolean;
}) {
  const oddsLabel = leg.odds != null ? americanLabel(leg.odds) : "TBD";
  const progress = deriveLegProgress({
    status: leg.status,
    marketCode: leg.marketCode,
    market: leg.market,
    selection: leg.selection,
    statTarget: leg.statTarget ?? leg.threshold,
    threshold: leg.threshold ?? leg.statTarget,
    actual: leg.actual,
  });
  const identityComplete = isClientLegIdentityComplete(leg as unknown as Record<string, unknown>, 0);
  const headshot =
    getMlbHeadshotUrl(leg.playerId) ??
    getFallbackHeadshot(String(leg.selection ?? "").split(" ")[0]);

  const gradient = marketGradient(leg.marketCode);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} backdrop-blur-md transition-all hover:shadow-lg hover:shadow-cyan-500/5 ${compact ? "p-3" : "p-4"} ${isWeak ? "ring-1 ring-amber-400/50" : ""}`}
    >
      <div className="flex gap-3">
        <img
          src={headshot}
          alt=""
          className={`rounded-xl border border-white/10 bg-black/40 object-cover shrink-0 ${compact ? "h-10 w-10" : "h-12 w-12"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/45 truncate">
                {leg.market || "Player Prop"}
              </p>
              <p className={`font-bold text-white truncate ${compact ? "text-xs" : "text-sm"}`}>
                {leg.selection}
              </p>
              {!identityComplete ? (
                <p className="text-[9px] font-bold uppercase tracking-wide text-amber-300/90 mt-0.5">
                  Needs identity repair
                </p>
              ) : null}
              {leg.game ? (
                <p className="text-[10px] text-white/40 truncate mt-0.5">{leg.game}</p>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-mono font-black text-cyan-300">{oddsLabel}</span>
              <div className="mt-1 flex flex-col items-end gap-0.5">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-[10px] text-cyan-300/70 hover:text-cyan-200 uppercase tracking-wide min-h-[1.75rem]"
                  >
                    Edit
                  </button>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="text-[10px] text-white/35 hover:text-rose-300 uppercase tracking-wide min-h-[1.75rem]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {progress ? (
            <div className="mt-2">
              <div className="flex justify-between text-[9px] font-mono text-cyan-200/70 mb-1">
                <span>{progress.label}</span>
                <span>{progress.current}/{progress.target}</span>
              </div>
              <div className="h-1 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
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
