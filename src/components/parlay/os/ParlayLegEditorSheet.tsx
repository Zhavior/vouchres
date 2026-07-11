import React, { useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, X } from "lucide-react";
import type { DraftParlayLeg } from "../../../stores/parlayCommandStore";
import {
  CUSTOM_STAT_LIMITS,
  inferFamilyFromLeg,
  validateCustomStatTarget,
} from "../../../lib/parlays/parlayCustomLine";
import { applyLegStatTargetEdit } from "../../../lib/parlays/parlayLegEditor";
import { americanLabel } from "../../../lib/odds";

export default function ParlayLegEditorSheet({
  leg,
  open,
  onClose,
  onSave,
  onSwapPlayer,
}: {
  leg: DraftParlayLeg | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: DraftParlayLeg) => void;
  onSwapPlayer?: (leg: DraftParlayLeg) => void;
}) {
  const familyId = leg ? inferFamilyFromLeg(leg) : null;
  const limits = familyId ? CUSTOM_STAT_LIMITS[familyId] : null;
  const isPresetOnlyLeg = String(leg?.marketCode ?? "").toUpperCase() === "PITCHER_OUTS";

  const initialTarget = leg?.statTarget != null ? Number(leg.statTarget) : limits?.min ?? 1;
  const [statTarget, setStatTarget] = useState(initialTarget);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open && leg) {
      setStatTarget(leg.statTarget != null ? Number(leg.statTarget) : limits?.min ?? 1);
      setError(null);
    }
  }, [open, leg, limits?.min]);

  const preview = useMemo(() => {
    if (!leg) return null;
    const result = applyLegStatTargetEdit(leg, statTarget);
    return result;
  }, [leg, statTarget]);

  if (!open || !leg) return null;

  const oddsLabel = preview?.leg.odds != null ? americanLabel(Number(preview.leg.odds)) : "TBD";

  function step(delta: number) {
    if (!limits) return;
    const next = Math.min(limits.max, Math.max(limits.min, statTarget + delta));
    setStatTarget(next);
    setError(null);
  }

  function handleSave() {
    if (!leg || !familyId) return;
    const check = validateCustomStatTarget(familyId, statTarget);
    if (!check.valid) {
      setError(check.reason ?? "Invalid line.");
      return;
    }
    const result = applyLegStatTargetEdit(leg, statTarget);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSave(result.leg);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit parlay leg"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close editor"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[var(--bg-obsidian)]/98 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">Edit Leg</p>
            <p className="text-sm font-bold text-white truncate max-w-[240px]">{leg.playerName ?? leg.selection}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Market</p>
            <p className="text-sm text-white/80">{leg.marketLabel ?? leg.marketCode}</p>
          </div>

          {isPresetOnlyLeg ? (
            <p className="text-xs text-amber-200/80">
              Pitcher outs use preset tiers — pick a new line from the prop picker.
            </p>
          ) : limits ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Custom line</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={statTarget <= limits.min}
                  className="min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center rounded-xl border border-white/15 text-white/70 hover:border-cyan-400/40 disabled:opacity-30"
                  aria-label="Decrease line"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center min-w-[5rem]">
                  <span className="text-3xl font-black text-cyan-300">{statTarget}</span>
                  <p className="text-[10px] text-white/35 mt-1">{limits.min}–{limits.max}</p>
                </div>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={statTarget >= limits.max}
                  className="min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center rounded-xl border border-white/15 text-white/70 hover:border-cyan-400/40 disabled:opacity-30"
                  aria-label="Increase line"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-200/80">This market type cannot be customized yet.</p>
          )}

          {preview?.leg && !isPresetOnlyLeg ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Preview</p>
              <p className="text-sm font-bold text-white mt-1">{preview.leg.selection}</p>
              <p className="text-[11px] font-mono text-cyan-300 mt-1">Odds {oddsLabel}</p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-xs text-amber-200/90">{error}</p>
          ) : null}

          <div className="flex flex-col gap-2 pt-1">
            {onSwapPlayer && limits ? (
              <button
                type="button"
                onClick={() => onSwapPlayer(leg)}
                className="w-full min-h-[2.75rem] flex items-center justify-center gap-2 rounded-xl border border-white/15 text-[11px] font-bold uppercase tracking-wide text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change player
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPresetOnlyLeg || !limits || Boolean(preview?.error)}
              className="w-full min-h-[2.75rem] rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-40"
            >
              Apply changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
