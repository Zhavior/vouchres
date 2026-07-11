import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ClientIdentityAssessment } from "../../lib/parlayIdentity";

export default function ParlayIdentityBadge({
  identity,
  className = "",
}: {
  identity: ClientIdentityAssessment;
  className?: string;
}) {
  if (identity.totalLegs === 0) return null;

  if (identity.complete) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-emerald-500/35 text-emerald-200 bg-emerald-950/15 ${className}`}
      >
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        Gradable
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-200 bg-amber-950/20 ${className}`}
      title={`Legs needing repair: ${identity.missingLegIndexes.map((i) => i + 1).join(", ")}`}
    >
      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
      Needs identity repair ({identity.missingLegIndexes.length})
    </span>
  );
}
