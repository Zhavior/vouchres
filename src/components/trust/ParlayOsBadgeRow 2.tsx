import React from "react";
import { resolveParlayOsSnapshot, type ParlayOsSnapshot } from "../../lib/parlayOsState";

const RECORD_STYLES: Record<ParlayOsSnapshot["recordState"], string> = {
  DRAFT: "border-white/20 text-white/50 bg-white/5",
  SAVED: "border-slate-600/50 text-slate-300 bg-slate-900/40",
  COMMITTED: "border-amber-500/40 text-amber-200 bg-amber-950/20",
  LOCKED: "border-cyan-500/40 text-cyan-200 bg-cyan-950/20",
  ANCHORED: "border-emerald-500/40 text-emerald-200 bg-emerald-950/20",
  ARCHIVED: "border-white/15 text-white/40 bg-black/30",
};

export default function ParlayOsBadgeRow({
  input,
  className = "",
}: {
  input: Parameters<typeof resolveParlayOsSnapshot>[0];
  className?: string;
}) {
  const snapshot = resolveParlayOsSnapshot(input);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${RECORD_STYLES[snapshot.recordState]}`}
      >
        {snapshot.recordLabel}
      </span>
      {snapshot.lockReasonLabel && (
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-violet-500/35 text-violet-200 bg-violet-950/20">
          {snapshot.lockReasonLabel}
        </span>
      )}
      {snapshot.proofState !== "none" && (
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-emerald-500/35 text-emerald-200 bg-emerald-950/15">
          {snapshot.proofLabel}
        </span>
      )}
      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-white/15 text-white/55 bg-black/20">
        {snapshot.outcomeLabel}
      </span>
    </div>
  );
}
