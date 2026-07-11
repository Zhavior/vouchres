import React from "react";
import type { TemplateProgress } from "../../../lib/parlays/templateProgress";

export default function ParlayHubTemplateGuide({
  progress,
}: {
  progress: TemplateProgress;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
            Template guide
          </p>
          <p className="text-sm font-bold text-white">{progress.template.label}</p>
        </div>
        <p className="text-xs font-mono text-cyan-200">
          {progress.filledCount}/{progress.totalSlots}
        </p>
      </div>
      <ul className="space-y-2">
        {progress.slots.map((slot) => (
          <li
            key={slot.slotId}
            className={`flex items-center gap-2 text-[11px] rounded-lg px-2 py-1.5 ${
              slot.filled ? "text-emerald-200/90 bg-emerald-500/10" : "text-white/55 bg-black/20"
            }`}
          >
            <span aria-hidden="true">{slot.filled ? "✓" : "○"}</span>
            <span className="flex-1">{slot.label}</span>
            {!slot.filled ? (
              <span className="text-[9px] uppercase tracking-wide text-white/35">Research +</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-white/40 leading-relaxed">
        Add each leg from Player Research — tap <strong className="text-cyan-300/80">+</strong> on the matching prop tier.
        {progress.complete ? " Template complete — review slip before lock." : ""}
      </p>
    </div>
  );
}
