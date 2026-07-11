import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ClientIdentityAssessment } from "../../lib/parlayIdentity";

export default function ParlayIdentityBadge({
  identity,
  className = "",
  onExplain,
}: {
  identity: ClientIdentityAssessment;
  className?: string;
  onExplain?: () => void;
}) {
  if (identity.totalLegs === 0) return null;

  const baseClass = identity.complete
    ? "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-emerald-500/35 text-emerald-200 bg-emerald-950/15"
    : "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-200 bg-amber-950/20";

  const content = identity.complete ? (
    <>
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      Gradable
    </>
  ) : (
    <>
      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
      Needs identity repair ({identity.missingLegIndexes.length})
    </>
  );

  if (onExplain) {
    return (
      <button
        type="button"
        onClick={onExplain}
        title={identity.complete ? "Why is this gradable?" : `Legs needing repair: ${identity.missingLegIndexes.map((i) => i + 1).join(", ")}`}
        className={`${baseClass} ${className} cursor-pointer hover:opacity-90`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`${baseClass} ${className}`}
      title={!identity.complete ? `Legs needing repair: ${identity.missingLegIndexes.map((i) => i + 1).join(", ")}` : undefined}
    >
      {content}
    </span>
  );
}
