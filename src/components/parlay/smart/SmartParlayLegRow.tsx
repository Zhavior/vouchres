import React from "react";
import { LEG_STATUS_META, type LegGradeStatus } from "../types/parlayHubTypes";
import { z8StatusColor } from "../../../theme/z8Tokens";
import type { SmartParlayLeg } from "../../../domain/parlay";
import { marketStyle } from "./smartSlipStyles";

export default function SmartParlayLegRow({ leg }: { leg: SmartParlayLeg }) {
  const legStatus = String(leg.status ?? "pending").toLowerCase() as LegGradeStatus;
  const legMeta = LEG_STATUS_META[legStatus] ?? LEG_STATUS_META.pending;
  const market = marketStyle(leg.marketCode);

  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 py-1.5 pl-3 pr-2 text-[10px] text-white/70">
      <div className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${market.stripe}`} aria-hidden="true" />
      <img
        src={leg.headshotUrl ?? undefined}
        alt=""
        className="h-6 w-6 rounded-md border border-white/10 shrink-0 object-cover bg-black/40"
      />
      <span aria-hidden="true" style={{ color: z8StatusColor(legMeta.token) }}>
        {legMeta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-white/90">{leg.playerName || leg.selection}</span>
        <span className="block truncate text-[9px] text-white/40">{leg.marketLabel}</span>
      </div>
      {!leg.identityComplete ? (
        <span className="text-[8px] font-bold uppercase tracking-wide text-amber-300/90 shrink-0">
          Link
        </span>
      ) : null}
      <span className="font-mono text-[9px] text-cyan-300/80 shrink-0 tabular-nums">{leg.oddsLabel}</span>
      <span
        className="text-[9px] font-bold shrink-0 uppercase"
        style={{ color: z8StatusColor(legMeta.token) }}
      >
        {legMeta.label}
      </span>
    </div>
  );
}
