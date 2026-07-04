import { useEffect, useState } from "react";
import { Bot, Crown, Flame, Layers3, Radio, Save, Sparkles, Wand2 } from "lucide-react";
import { PanelErrorBoundary } from "../common/PanelErrorBoundary";
import { normalizeParlayLeg } from "../../lib/parlays/parlayBridge";
import type { CanonicalParlaySlip } from "../../lib/parlays/parlayBridge";
import {
  selectActiveParlayPanel,
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
  type ParlayCommandPanel,
} from "../../stores/parlayCommandStore";

const tabs: Array<{
  id: ParlayCommandPanel;
  label: string;
  eyebrow: string;
  icon: typeof Layers3;
}> = [
  { id: "build", label: "Build Slip", eyebrow: "Manual builder", icon: Layers3 },
  { id: "ai", label: "V.A.I Picks", eyebrow: "AI discovery", icon: Bot },
  { id: "live", label: "Live Parlays", eyebrow: "Saved + synced", icon: Radio },
  { id: "premium", label: "Premium", eyebrow: "Posted slips", icon: Crown },
];

function LivePulseBars({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="flex h-5 items-end gap-[3px]" aria-label="Live parlay activity">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="w-[3px] rounded-full bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.65)]"
          style={{
            height: `${8 + (bar % 3) * 4}px`,
            animation: "ve-command-live-bar 0.9s ease-in-out infinite",
            animationDelay: `${bar * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Layers3;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/55 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">{body}</p>
        </div>
      </div>
    </div>
  );
}

function BuildSlipPanel({ onSaveParlay }: { onSaveParlay?: (parlay: CanonicalParlaySlip) => Promise<void> | void }) {
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const removeDraftLeg = useParlayCommandStore((state) => state.removeDraftLeg);
  const clearDraft = useParlayCommandStore((state) => state.clearDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllDraftLegs, setShowAllDraftLegs] = useState(false);
  const canSave = draftLegs.length > 0 && Boolean(onSaveParlay) && !isSaving;
  const visibleDraftLegs = showAllDraftLegs ? draftLegs : draftLegs.slice(0, 5);
  const hiddenDraftLegCount = Math.max(0, draftLegs.length - visibleDraftLegs.length);
  const readableOdds = draftLegs
    .map((leg) => Number((leg as Record<string, unknown>).odds))
    .filter((odds) => Number.isFinite(odds));
  const averageOdds =
    readableOdds.length > 0 ? Math.round(readableOdds.reduce((sum, odds) => sum + odds, 0) / readableOdds.length) : null;
  const plusMoneyLegs = readableOdds.filter((odds) => odds > 0).length;
  const weakLegCount = draftLegs.filter((leg) => {
    const record = leg as Record<string, unknown>;
    const score = Number(record.edgeScore ?? record.confidence ?? record.probability);
    return Number.isFinite(score) && score > 0 && score < 55;
  }).length;
  const exposureLabel =
    draftLegs.length === 0
      ? "No exposure"
      : draftLegs.length <= 2
        ? "Focused"
        : draftLegs.length <= 4
          ? "Volatile"
          : "High volatility";
  const judgeTone =
    draftLegs.length === 0
      ? "Start with 1–2 high-conviction legs. Do not build lottery slips."
      : weakLegCount > 0
        ? `${weakLegCount} leg${weakLegCount === 1 ? "" : "s"} may need review before saving.`
        : draftLegs.length > 4
          ? "This slip is entering high-volatility exposure. Consider trimming weaker legs."
          : "Slip structure looks disciplined enough to review and save.";

  const getTextField = (leg: unknown, keys: string[]) => {
    const record = leg as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
  };

  const formatGameStart = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getDraftLegGameContext = (leg: unknown) => {
    const awayTeam = getTextField(leg, ["awayTeam", "awayTeamName", "visitorTeam", "visitorTeamName"]);
    const homeTeam = getTextField(leg, ["homeTeam", "homeTeamName"]);
    const team = getTextField(leg, ["teamLabel", "teamName", "team"]);
    const opponent = getTextField(leg, ["opponent", "opponentName", "opponentTeam", "opponentTeamName"]);
    const gameStart = getTextField(leg, ["gameDate", "gameTime", "startTime", "gameStartTime", "commenceTime", "scheduled"]);

    const matchup =
      awayTeam && homeTeam
        ? `${awayTeam} vs ${homeTeam}`
        : team && opponent
          ? `${team} vs ${opponent}`
          : "";

    const startLabel = gameStart ? formatGameStart(gameStart) : "";

    if (matchup && startLabel) return `${matchup} · ${startLabel}`;
    if (matchup) return matchup;
    if (startLabel) return startLabel;
    return "";
  };

  const handleSaveDraft = async () => {
    if (!onSaveParlay || draftLegs.length === 0 || isSaving) return;

    const now = new Date().toISOString();
    const draftId = `command-draft-${Date.now()}`;
    const draftParlay: CanonicalParlaySlip = {
      id: draftId,
      clientRef: draftId,
      title: `Command Center ${draftLegs.length}-Leg Slip`,
      legs: draftLegs.map((leg) =>
        normalizeParlayLeg({
          ...leg,
          sport: leg.sport || "mlb",
          source: "command_center",
        })
      ),
      status: "pending",
      mode: "PRACTICE",
      wagerAmount: 0,
      sport: "mlb",
      createdAt: now,
      metadata: {
        summary: draftLegs.map((leg) => leg.playerName || leg.marketLabel || "Player prop").join(" · "),
        aiGenerated: false,
      },
      source: "command_center",
    };

    setIsSaving(true);
    try {
      await onSaveParlay(draftParlay);
      clearDraft();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl border border-slate-800/80 bg-[#07101d]/90 p-5 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Build Slip</p>
            <h3 className="mt-1 text-xl font-black text-white">One canonical builder</h3>
          </div>
          <div className="flex items-center gap-2">
            {draftLegs.length > 0 && (
              <button
                type="button"
                onClick={clearDraft}
                className="rounded-2xl border border-rose-500/25 bg-rose-950/20 px-3 py-2 text-xs font-black text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-950/35"
              >
                Clear Draft
              </button>
            )}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-xs font-black text-emerald-300">
              {draftLegs.length} legs
            </div>
          </div>
        </div>

        <div className="mt-5">
          {draftLegs.length === 0 ? (
            <EmptyPanel
              icon={Wand2}
              title="Start from AI picks or manual props"
              body="This will become the unified builder. V.A.I picks and manual player props will land in this same slip before saving through /api/me/parlays."
            />
          ) : (
            <div className="space-y-3">
              {visibleDraftLegs.map((leg) => (
                <div key={leg.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{leg.playerName || leg.selection}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {leg.marketLabel || leg.marketCode || "Player prop"}
                        {leg.teamLabel ? ` · ${leg.teamLabel}` : ""}
                      </p>
                      {getDraftLegGameContext(leg) && (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {getDraftLegGameContext(leg)}
                        </p>
                      )}

                      {Array.isArray(leg.tags) && leg.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {leg.tags.slice(0, 6).map((tag) => (
                            <span
                              key={`${leg.id}-${tag}`}
                              className="rounded-full border border-sky-400/15 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black text-sky-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                        {leg.odds !== undefined && (
                          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
                            Odds {leg.odds}
                          </span>
                        )}
                        {leg.statTarget !== undefined && (
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-950/20 px-2.5 py-1 text-cyan-200">
                            Target {leg.statTarget}
                          </span>
                        )}
                        {leg.source && (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1 text-emerald-200">
                            {leg.source}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraftLeg(leg.id)}
                      className="shrink-0 rounded-2xl border border-rose-500/25 bg-rose-950/15 px-3 py-2 text-[11px] font-black uppercase text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-950/30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {draftLegs.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllDraftLegs((current) => !current)}
                  className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  {showAllDraftLegs
                    ? "Collapse legs"
                    : `Show all ${draftLegs.length} legs${hiddenDraftLegCount > 0 ? ` · ${hiddenDraftLegCount} hidden` : ""}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-cyan-500/15 bg-cyan-950/10 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Slip Summary</p>
          <h3 className="mt-1 text-lg font-black text-white">Exposure stack</h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Legs</p>
              <p className="mt-1 text-2xl font-black text-white">{draftLegs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Avg odds</p>
              <p className="mt-1 text-2xl font-black text-white">{averageOdds === null ? "—" : averageOdds > 0 ? `+${averageOdds}` : averageOdds}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Plus money</p>
              <p className="mt-1 text-2xl font-black text-white">{plusMoneyLegs}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Risk band</p>
              <p className="mt-1 text-sm font-black text-cyan-100">{exposureLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-400/20 bg-amber-950/10 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">AI Judge</p>
          <h3 className="mt-1 text-lg font-black text-white">Discipline check</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{judgeTone}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Save runs through the Command Center contract and your canonical backend route. No local-only parlay truth.
          </p>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!canSave}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-400 disabled:border-slate-700 disabled:bg-slate-900/80 disabled:text-slate-500"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Slip"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AiSmartPicksPanel() {
  const aiPicks = useParlayCommandStore((state) => state.aiPicks);
  const addAiLegToDraft = useParlayCommandStore((state) => state.addAiLegToDraft);
  const draftLegs = useParlayCommandStore(selectDraftLegs);

  const hasAiPicks = aiPicks.length > 0;
  const stagedIds = new Set(draftLegs.map((leg) => leg.id));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-3xl border border-cyan-500/15 bg-slate-950/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">V.A.I Smart Picks</p>
            <h3 className="mt-1 text-xl font-black text-white">Add research legs into the same slip</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              This panel reads the Command Center AI-pick queue. Every Add to Slip action pushes a canonical draft leg into Build Slip.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Queued picks</p>
            <p className="mt-1 text-2xl font-black text-white">{aiPicks.length}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {hasAiPicks ? (
            aiPicks.map((pick) => {
              const alreadyStaged = stagedIds.has(pick.id);

              return (
                <article
                  key={pick.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{pick.playerName || pick.selection || "AI pick"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {pick.marketLabel || pick.marketCode || "Player prop"}
                        {pick.teamLabel ? ` · ${pick.teamLabel}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                          {pick.sport || "MLB"}
                        </span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                          {typeof pick.odds === "number" ? (pick.odds > 0 ? `+${pick.odds}` : pick.odds) : "odds pending"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addAiLegToDraft(pick)}
                      disabled={alreadyStaged}
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:border-slate-700 disabled:bg-slate-900/70 disabled:text-slate-500"
                    >
                      {alreadyStaged ? "Staged" : "Add to Slip"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-black/20 p-8 text-center">
              <p className="text-sm font-black text-white">No V.A.I picks queued yet</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                The next step is wiring SmartAiEngine, HR Board, and Player Research outputs into this queue with setAiPicks/addAiLegToDraft.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-amber-400/20 bg-amber-950/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">Command Rule</p>
        <h3 className="mt-1 text-lg font-black text-white">One slip owner</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          V.A.I does not save parlays directly. It only stages legs into the Command Center draft. Save Slip remains the only backend save action.
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Draft legs staged</p>
          <p className="mt-1 text-2xl font-black text-white">{draftLegs.length}</p>
        </div>
      </div>
    </div>
  );
}

function getLegResultVisual(leg: { status?: unknown; resultLabel?: unknown }) {
  const raw = `${leg.status ?? ""} ${leg.resultLabel ?? ""}`.toUpperCase();

  if (raw.includes("WON") || raw.includes("WIN") || raw.includes("HIT") || raw.includes("CASH")) {
    return {
      symbol: "✓",
      rowClass: "border-emerald-500/25 bg-emerald-950/10",
      badgeClass: "border-emerald-400/30 bg-emerald-950/35 text-emerald-200",
    };
  }

  if (raw.includes("LOST") || raw.includes("LOSS") || raw.includes("LOSE") || raw.includes("MISS")) {
    return {
      symbol: "✕",
      rowClass: "border-rose-500/25 bg-rose-950/10",
      badgeClass: "border-rose-400/30 bg-rose-950/35 text-rose-200",
    };
  }

  if (raw.includes("VOID") || raw.includes("PUSH") || raw.includes("CANCEL")) {
    return {
      symbol: "–",
      rowClass: "border-slate-700/80 bg-slate-950/70",
      badgeClass: "border-slate-700 bg-slate-900/80 text-slate-300",
    };
  }

  return {
    symbol: "…",
    rowClass: "border-amber-400/20 bg-amber-950/10",
    badgeClass: "border-amber-400/25 bg-amber-950/25 text-amber-200",
  };
}

type LiveSlipBucket = "open" | "live" | "lost" | "won";

function LiveSavedParlaysPanel({ onHideParlay }: { onHideParlay?: (parlayId: string) => Promise<void> | void }) {
  const allSlips = useParlayCommandStore(selectSavedSlips);
  const [hidingSlipId, setHidingSlipId] = useState<string | null>(null);
  const [hideError, setHideError] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<LiveSlipBucket>("live");

  const getSlipStatus = (status: unknown) => String(status ?? "").toLowerCase();
  const isOpenStatus = (status: unknown) => ["pending", "open", "scheduled", "pre_game"].includes(getSlipStatus(status));
  const isLiveStatus = (status: unknown) => ["live", "active", "in_progress"].includes(getSlipStatus(status));
  const isLostStatus = (status: unknown) => ["lost", "loss", "failed"].includes(getSlipStatus(status));
  const isWonStatus = (status: unknown) => ["won", "win", "hit"].includes(getSlipStatus(status));

  const getSlipBucket = (slip: (typeof allSlips)[number]): LiveSlipBucket => {
    if (isWonStatus(slip.status)) return "won";
    if (isLostStatus(slip.status)) return "lost";
    if (isLiveStatus(slip.status)) return "live";
    return "open";
  };

  const hasVoidedLegs = (slip: (typeof allSlips)[number]) =>
    slip.legs.some((leg) => {
      const record = leg as Record<string, unknown>;
      const values = [record.status, record.result, record.outcome, record.legStatus]
        .map((value) => String(value ?? "").toLowerCase());

      return values.some((value) => ["void", "voided", "push", "no_action", "cancelled", "canceled"].includes(value));
    });

  const liveSlips = allSlips.filter((slip) => isOpenStatus(slip.status) || isLiveStatus(slip.status));
  const bucketTabs: Array<{ id: LiveSlipBucket; label: string; helper: string }> = [
    { id: "open", label: "Open", helper: "not started" },
    { id: "live", label: "Live", helper: "in progress" },
    { id: "lost", label: "Lost", helper: "truth ledger" },
    { id: "won", label: "Won", helper: "truth ledger" },
  ];
  const bucketCounts = bucketTabs.reduce(
    (counts, tab) => {
      counts[tab.id] = allSlips.filter((slip) => getSlipBucket(slip) === tab.id).length;
      return counts;
    },
    {} as Record<LiveSlipBucket, number>
  );
  const bucketVoidCounts = bucketTabs.reduce(
    (counts, tab) => {
      counts[tab.id] = allSlips.filter((slip) => getSlipBucket(slip) === tab.id && hasVoidedLegs(slip)).length;
      return counts;
    },
    {} as Record<LiveSlipBucket, number>
  );
  const visibleSlips = [...allSlips]
    .filter((slip) => getSlipBucket(slip) === activeBucket)
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });

  const handleHide = async (slipId: string) => {
    if (!onHideParlay) return;

    const slip = allSlips.find((item) => String(item.sourceId) === String(slipId));
    const status = String(slip?.status ?? '').toLowerCase();

    if (['pending', 'live', 'open', 'active', 'in_progress'].includes(status)) return;

    const ok = window.confirm(
      'Hide this parlay from My Parlay Board? This will not void it, change its grading status, or alter Results Ledger truth.'
    );
    if (!ok) return;

    setHideError(null);
    setHidingSlipId(slipId);

    try {
      await onHideParlay(slipId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not hide this parlay.';
      setHideError(message);
    } finally {
      setHidingSlipId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-[#07101d]/90 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Live Parlays</p>
          <h3 className="mt-1 text-xl font-black text-white">Saved and synced slips</h3>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
          <LivePulseBars active={liveSlips.length > 0} />
          <span className="text-xs font-black text-cyan-200">{liveSlips.length} live</span>
        </div>
      </div>

      {hideError && (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100">
          {hideError}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {bucketTabs.map((tab) => {
          const isActive = activeBucket === tab.id;
          const voidedCount = bucketVoidCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveBucket(tab.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-50"
                  : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.2em]">{tab.label}</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black">
                  {bucketCounts[tab.id]}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{tab.helper}</p>
              {voidedCount > 0 && (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
                  {voidedCount} with voided leg{voidedCount === 1 ? "" : "s"}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {allSlips.length === 0 ? (
          <EmptyPanel
            icon={Radio}
            title="No synced parlays yet"
            body="Once the backend saved slips are hydrated into the Command Center store, this panel will show pending/live cards with animation bars."
          />
        ) : visibleSlips.length === 0 ? (
          <EmptyPanel
            icon={Radio}
            title={`No ${activeBucket} parlays`}
            body="This truth bucket is empty. Lost, won, live, and open records stay separated without changing backend grading truth."
          />
        ) : (
          <div className="grid gap-4">
            {visibleSlips.map((slip, slipIndex) => {
              const previewLegs = slip.legs.slice(0, 3);
              const hiddenLegCount = Math.max(0, slip.legs.length - previewLegs.length);
              const slipRenderKey =
                slip.sourceId || `${slip.publicId}-${slip.createdAt ?? "unknown"}-${slipIndex}`;
              const slipHasVoidedLegs = hasVoidedLegs(slip);

              return (
                <article
                  key={slipRenderKey}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{slip.title}</p>
                        <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
                          {slip.statusLabel}
                        </span>
                        {slip.isLiveLike && (
                          <span className="rounded-full border border-cyan-400/25 bg-cyan-950/25 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">
                            Tracking
                          </span>
                        )}
                        {slipHasVoidedLegs && (
                          <span className="rounded-full border border-amber-400/25 bg-amber-950/25 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">
                            Voided leg
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{slip.summary}</p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                        <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-slate-400">
                          {slip.legs.length} legs
                        </span>
                        <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-slate-400">
                          {slip.oddsLabel}
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-950/15 px-2.5 py-1 text-emerald-300">
                          {slip.syncedLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <LivePulseBars active={slip.isLiveLike} />
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          {slip.isLiveLike ? "Live watch" : "Saved"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleHide(slip.sourceId)}
                        disabled={
                          !onHideParlay ||
                          hidingSlipId === slip.sourceId ||
                          ['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                        }
                        title={
                          ['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                            ? 'Live or pending parlays are locked to protect grading truth.'
                            : 'Hide this parlay from My Parlay Board. This does not void or change grading truth.'
                        }
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300 transition hover:border-rose-300/50 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                      >
                        {['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                          ? 'Live Locked'
                          : hidingSlipId === slip.sourceId
                            ? 'Hiding'
                            : 'Hide'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] font-bold leading-relaxed text-rose-100/90">
                        Board action only. Hide removes this card from your saved board but does not void, grade, or change ledger truth.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleHide(slip.sourceId)}
                        disabled={
                          !onHideParlay ||
                          hidingSlipId === slip.sourceId ||
                          ['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                        }
                        title={
                          ['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                            ? 'Live or pending parlays are locked to protect grading truth.'
                            : 'Hide this parlay from My Parlay Board. This does not void or change grading truth.'
                        }
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-300/40 bg-rose-400/15 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950/50 disabled:text-slate-600 sm:w-auto"
                      >
                        {['pending', 'live', 'open', 'active', 'in_progress'].includes(String(slip.status ?? '').toLowerCase())
                          ? 'Live Locked'
                          : hidingSlipId === slip.sourceId
                            ? 'Hiding'
                            : 'Hide Parlay'}
                      </button>
                    </div>
                  </div>

                  {previewLegs.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {previewLegs.map((leg, legIndex) => {
                        const resultVisual = getLegResultVisual(leg);
                        const legRenderKey = `${slipRenderKey}-${leg.publicId}-${legIndex}`;

                        return (
                          <div
                            key={legRenderKey}
                            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 ${resultVisual.rowClass}`}
                          >
                          <div className="flex min-w-0 items-center gap-3">
                            {leg.headshotUrl ? (
                              <img
                                src={leg.headshotUrl}
                                alt=""
                                className="h-9 w-9 rounded-2xl border border-slate-700 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-[10px] font-black text-slate-500">
                                MLB
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-white">
                                {leg.playerName || "Player prop"}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {leg.marketLabel}
                                {leg.teamLabel ? ` · ${leg.teamLabel}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-black text-slate-200">{leg.oddsLabel}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${resultVisual.badgeClass}`}>
                              <span aria-hidden="true">{resultVisual.symbol}</span>
                              {leg.resultLabel}
                            </span>
                          </div>
                        </div>
                        );
                      })}

                      {hiddenLegCount > 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-800 px-3 py-2 text-center text-[11px] font-black text-slate-500">
                          +{hiddenLegCount} more legs
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumPostedPanel() {
  return (
    <EmptyPanel
      icon={Crown}
      title="Premium posted slips will be unified"
      body="Subscriber and premium slips will use the same public display model, so customer cards never show clientRef, meta, or raw IDs."
    />
  );
}

function CommandPanel({
  onSaveParlay,
  onHideParlay,
}: {
  onSaveParlay?: (parlay: CanonicalParlaySlip) => Promise<void> | void;
  onHideParlay?: (parlayId: string) => Promise<void> | void;
}) {
  const activePanel = useParlayCommandStore(selectActiveParlayPanel);

  if (activePanel === "ai") return <AiSmartPicksPanel />;
  if (activePanel === "live") return <LiveSavedParlaysPanel onHideParlay={onHideParlay} />;
  if (activePanel === "premium") return <PremiumPostedPanel />;
  return <BuildSlipPanel onSaveParlay={onSaveParlay} />;
}

type ParlayCommandPanelName = "build" | "ai" | "live" | "premium";

type ParlayCommandCenterProps = {
  savedSlips?: unknown[];
  initialPanel?: ParlayCommandPanelName;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => Promise<void> | void;
  onHideParlay?: (parlayId: string) => Promise<void> | void;
};

export default function ParlayCommandCenter({
  savedSlips = [],
  initialPanel = "live",
  onSaveParlay,
  onHideParlay,
}: ParlayCommandCenterProps) {
  const activePanel = useParlayCommandStore(selectActiveParlayPanel);
  const setActivePanel = useParlayCommandStore((state) => state.setActivePanel);
  const hydrateSavedSlips = useParlayCommandStore((state) => state.hydrateSavedSlips);
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const commandSavedSlips = useParlayCommandStore(selectSavedSlips);
  const liveSlips = commandSavedSlips.filter((slip) => ['pending', 'live', 'open', 'active'].includes(String(slip.status).toLowerCase()));
  const gradedSlips = commandSavedSlips.filter((slip) => ['won', 'lost', 'push', 'void'].includes(String(slip.status).toLowerCase()));
  const totalLegsTracked = commandSavedSlips.reduce((count, slip) => count + (Array.isArray(slip.legs) ? slip.legs.length : 0), 0);
  const commandStats = [
    { label: 'Draft legs', value: draftLegs.length, note: 'builder queue' },
    { label: 'Live locked', value: liveSlips.length, note: 'truth protected' },
    { label: 'Saved slips', value: commandSavedSlips.length, note: 'account board' },
    { label: 'Tracked legs', value: totalLegsTracked, note: `${gradedSlips.length} graded slips` },
  ];

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel, setActivePanel]);

  useEffect(() => {
    hydrateSavedSlips(savedSlips);
  }, [hydrateSavedSlips, savedSlips]);

  return (
    <section className="min-h-screen bg-[#020817] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <style>{`
        @keyframes ve-command-live-bar {
          0%, 100% { transform: scaleY(0.45); opacity: 0.45; }
          50% { transform: scaleY(1.25); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {commandStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-slate-950/20 backdrop-blur"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200/70">{stat.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-3xl font-black text-white">{stat.value}</span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                  {stat.note}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-[#07101d] via-[#061120] to-[#020817] p-6 shadow-2xl shadow-cyan-950/20">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-[-90px] left-[-90px] h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Parlay Command Center
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Build, AI-select, save, and monitor in one place.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                This replaces the split Build Parlay, V.A.I Smart Picks, and old Parlay Hub surfaces with one app page that still saves through the canonical backend.
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePanel(tab.id)}
                className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  isActive
                    ? "border-cyan-400/50 bg-cyan-950/25 shadow-lg shadow-cyan-950/20"
                    : "border-slate-800 bg-slate-950/55 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-2xl border p-2 ${
                    isActive ? "border-cyan-400/30 bg-cyan-500/10" : "border-slate-800 bg-slate-900"
                  }`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
                  </div>
                  {tab.id === "live" && <LivePulseBars active={liveSlips.length > 0} />}
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {tab.eyebrow}
                </p>
                <p className="mt-1 text-sm font-black text-white">{tab.label}</p>
              </button>
            );
          })}
        </div>

        <PanelErrorBoundary title="Parlay Command Center Panel">
          <CommandPanel onSaveParlay={onSaveParlay} onHideParlay={onHideParlay} />
        </PanelErrorBoundary>
      </div>
    </section>
  );
}
