import React from "react";
import { LEG_STATUS_META, type LegGradeStatus } from "../types/parlayHubTypes";
import { z8StatusColor } from "../../../theme/z8Tokens";
import type { SmartParlayLeg } from "../../../domain/parlay";

export default function SmartParlayLegRow({ leg }: { leg: SmartParlayLeg }) {
  const legStatus = String(leg.status ?? "pending").toLowerCase() as LegGradeStatus;
  const legMeta = LEG_STATUS_META[legStatus] ?? LEG_STATUS_META.pending;

  return (
    <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--ve-text-muted))]">
      <img
        src={leg.headshotUrl ?? undefined}
        alt=""
        className="h-5 w-5 rounded-full border border-white/10 shrink-0 object-cover bg-black/40"
      />
      <span aria-hidden="true" style={{ color: z8StatusColor(legMeta.token) }}>
        {legMeta.icon}
      </span>
      <span className="truncate min-w-0">{leg.selection}</span>
      {!leg.identityComplete ? (
        <span className="text-[8px] font-bold uppercase tracking-wide text-amber-300/80 shrink-0">
          Repair
        </span>
      ) : null}
      <span
        className="ml-auto text-[9px] font-bold shrink-0"
        style={{ color: z8StatusColor(legMeta.token) }}
      >
        {legMeta.label}
      </span>
    </div>
  );
}
