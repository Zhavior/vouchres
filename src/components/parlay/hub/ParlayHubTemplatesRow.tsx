import React from "react";
import { PARLAY_SLIP_TEMPLATES } from "../../../lib/parlays/parlaySlipTemplates";

export default function ParlayHubTemplatesRow({
  activeTemplateId,
  onSelect,
  onClear,
}: {
  activeTemplateId: string | null;
  onSelect: (templateId: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Slip templates
        </p>
        {activeTemplateId ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-bold uppercase tracking-wide text-white/40 hover:text-rose-300 min-h-[2rem] px-2"
          >
            Clear guide
          </button>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
        {PARLAY_SLIP_TEMPLATES.map((template) => {
          const active = activeTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`shrink-0 snap-start min-w-[9.5rem] max-w-[11rem] text-left rounded-xl border p-3 transition-all min-h-[4.5rem] ${
                active
                  ? "border-cyan-400/50 bg-cyan-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <span className="text-lg" aria-hidden="true">{template.icon}</span>
              <p className="text-xs font-bold text-white mt-1">{template.label}</p>
              <p className="text-[9px] text-white/40 mt-0.5 line-clamp-2">{template.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
