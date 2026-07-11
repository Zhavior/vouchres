import React from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { ClientIdentityAssessment } from "../../lib/parlayIdentity";
import { isClientLegIdentityComplete } from "../../lib/parlayIdentity";

function CheckRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`font-semibold ${ok ? "text-white/85" : "text-amber-100"}`}>{label}</p>
        {detail ? <p className="text-[11px] text-white/45 mt-0.5">{detail}</p> : null}
      </div>
    </li>
  );
}

export default function ParlayIdentityExplainer({
  leg,
  index,
  identity,
  onClose,
}: {
  leg?: Record<string, unknown>;
  index?: number;
  identity?: ClientIdentityAssessment;
  onClose: () => void;
}) {
  const checks = leg
    ? [
        {
          ok: Boolean(leg.gamePk ?? leg.game_pk ?? leg.gameId ?? leg.game_id),
          label: "gamePk",
          detail: String(leg.gamePk ?? leg.game_pk ?? leg.gameId ?? "Missing — player's game not linked"),
        },
        {
          ok: Boolean(leg.playerId ?? leg.player_id) && String(leg.playerId ?? leg.player_id) !== "0",
          label: "playerId",
          detail: String(leg.playerId ?? leg.player_id ?? "Missing official MLB player id"),
        },
        {
          ok: Boolean(String(leg.marketCode ?? leg.market_code ?? "").trim()),
          label: "marketCode",
          detail: String(leg.marketCode ?? leg.market_code ?? "Missing canonical market"),
        },
        {
          ok: leg.statTarget != null || leg.threshold != null || leg.stat_target != null,
          label: "statTarget",
          detail: String(leg.statTarget ?? leg.threshold ?? leg.stat_target ?? "Missing stat target"),
        },
        {
          ok: Boolean(String(leg.comparator ?? ">=").trim()),
          label: "comparator",
          detail: String(leg.comparator ?? ">="),
        },
      ]
    : [];

  const complete = leg ? isClientLegIdentityComplete(leg, index ?? 0) : identity?.complete;

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-3xl border border-white/10 bg-[var(--bg-obsidian)] p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black text-white">Grading identity</h2>
        </div>
        <p className="text-sm text-white/50 mb-4">
          ParlayOS only saves or locks slips when every leg can be graded honestly against official MLB data.
        </p>
        {leg ? (
          <ul className="space-y-3 mb-5">{checks.map((row) => <CheckRow key={row.label} {...row} />)}</ul>
        ) : identity ? (
          <p className="text-sm text-white/70 mb-5">
            {identity.complete
              ? "All legs have complete grading identity."
              : `Legs needing repair: ${identity.missingLegIndexes.map((i) => i + 1).join(", ")}`}
          </p>
        ) : null}
        <p className={`text-xs font-bold uppercase tracking-wide mb-4 ${complete ? "text-emerald-300" : "text-amber-300"}`}>
          {complete ? "Gradable" : "Needs identity repair"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-3 text-xs font-bold uppercase tracking-wide text-cyan-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
