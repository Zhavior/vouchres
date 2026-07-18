import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Layers3, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  selectDraftLegs,
  useParlayCommandStore,
} from "../../../stores/parlayCommandStore";
import { useParlayOsStore } from "../../../stores/parlayOsStore";
import { draftLegsToUiLegs } from "../../../lib/parlays/draftLegsToUiLegs";
import { assessSlipOdds } from "../../../lib/parlays/slipOddsPolicy";
import ParlayPropPickerModal from "./ParlayPropPickerModal";
import ParlayLegEditorSheet from "./ParlayLegEditorSheet";
import type { ParlayMarketTier } from "../../../lib/parlays/parlayMarketCatalog";
import { notify } from "../../../lib/appNotifications";
import { useAutoRepairDraftIdentity } from "../../../hooks/useAutoRepairDraftIdentity";
import PlayerHeadshot from "../../parlays/PlayerHeadshot";

export type ParlayOsLayerProps = {
  onConfirmTier: (tier: ParlayMarketTier) => void;
  onSaveParlay?: () => void;
  navigateSection?: (section: string) => void;
  /** Hide the dock while the canonical workspace is already visible. */
  suppressFloatingDock?: boolean;
};

export default function ParlayOsLayer({
  onConfirmTier,
  navigateSection,
  suppressFloatingDock = false,
}: ParlayOsLayerProps) {
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const removeDraftLeg = useParlayCommandStore((state) => state.removeDraftLeg);
  const replaceDraftLeg = useParlayCommandStore((state) => state.replaceDraftLeg);
  const moveDraftLegToWaiting = useParlayCommandStore((state) => state.moveDraftLegToWaiting);
  const sheetOpen = useParlayOsStore((state) => state.sheetOpen);
  const toggleSheet = useParlayOsStore((state) => state.toggleSheet);
  const closeSheet = useParlayOsStore((state) => state.closeSheet);
  const openLegEditor = useParlayOsStore((state) => state.openLegEditor);
  const editorLegId = useParlayOsStore((state) => state.editorLegId);
  const closeLegEditor = useParlayOsStore((state) => state.closeLegEditor);
  const [expandedLegId, setExpandedLegId] = useState<string | null>(null);
  const legListRef = useRef<HTMLDivElement>(null);
  const previousLegCountRef = useRef(draftLegs.length);
  useAutoRepairDraftIdentity(draftLegs.length > 0);

  const uiLegs = useMemo(() => draftLegsToUiLegs(draftLegs), [draftLegs]);
  const oddsAssessment = useMemo(() => assessSlipOdds(uiLegs), [uiLegs]);
  const combinedOdds = oddsAssessment.canShowCombined
    ? oddsAssessment.combined?.american ?? "—"
    : "TBD";
  const legCount = draftLegs.length;
  const editingLeg = draftLegs.find((leg) => leg.id === editorLegId) ?? null;

  useEffect(() => {
    const previousCount = previousLegCountRef.current;
    previousLegCountRef.current = draftLegs.length;
    if (!sheetOpen || draftLegs.length <= previousCount) return;

    const list = legListRef.current;
    const newestRow = list?.querySelector<HTMLElement>(`[data-parlay-leg-id="${CSS.escape(draftLegs[draftLegs.length - 1].id)}"]`);
    if (!newestRow) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    newestRow.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [draftLegs, sheetOpen]);

  const handleOpenHub = useCallback(() => {
    closeSheet();
    navigateSection?.("build");
  }, [closeSheet, navigateSection]);

  const handleFindPlayers = useCallback(() => {
    closeSheet();
    navigateSection?.("hr_board");
  }, [closeSheet, navigateSection]);

  return (
    <>
      <ParlayPropPickerModal onConfirmTier={onConfirmTier} />

      {!suppressFloatingDock ? (
        <>
          {sheetOpen ? (
            <button
              type="button"
              aria-label="Close ParlayOS dock"
              onClick={closeSheet}
              className="fixed inset-0 z-[88] bg-black/35 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
            />
          ) : null}

          {sheetOpen ? (
            <section
              role="dialog"
              aria-modal="false"
              aria-label="ParlayOS dock"
              className="fixed inset-x-2.5 bottom-[5.25rem] z-[90] flex h-[min(78dvh,720px)] flex-col overflow-hidden rounded-lg border border-cyan-300/30 bg-[radial-gradient(circle_at_85%_0%,rgba(0,240,255,0.1),transparent_30%),linear-gradient(155deg,#07131c_0%,#02070c_72%)] shadow-[0_32px_100px_rgba(0,0,0,0.74),0_0_32px_rgba(0,240,255,0.09),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl lg:inset-x-auto lg:bottom-5 lg:right-5 lg:h-[min(86vh,780px)] lg:w-[410px]"
            >
              <header className="flex shrink-0 items-center gap-2.5 border-b border-white/10 bg-black/10 px-3.5 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10">
                  <Layers3 className="h-4.5 w-4.5 text-cyan-200" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-white">ParlayOS</h2>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] font-bold text-white/55">
                      {legCount} {legCount === 1 ? "leg" : "legs"}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-white/42">
                    <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald/80" aria-hidden="true" />
                    Draft auto-saved on this device
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/45 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98] hover:border-white/20 hover:text-white"
                  aria-label="Close ParlayOS dock"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="relative min-h-0 flex-1">
                {draftLegs.length === 0 ? (
                  <div className="m-3.5 flex h-[calc(100%_-_1.75rem)] min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/20 px-5 py-7 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
                      <Plus className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-sm font-black text-white">Your slip is ready</h3>
                    <p className="mt-2 max-w-[260px] text-[11px] leading-5 text-white/45">
                      Add a researched player or prop. Nothing is pre-filled and nothing is simulated.
                    </p>
                    <button
                      type="button"
                      onClick={handleFindPlayers}
                      className="mt-5 min-h-10 rounded-xl border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-vouch-emerald"
                    >
                      Find HR Signals
                    </button>
                  </div>
                ) : (
                  <div
                    ref={legListRef}
                    className="h-full space-y-1.5 overflow-y-auto overscroll-contain px-2.5 py-2.5 scroll-smooth [scrollbar-color:rgba(0,240,255,0.25)_transparent] [scrollbar-width:thin]"
                    aria-label="Current parlay legs"
                  >
                    {draftLegs.map((leg, index) => (
                      <article
                        key={leg.id}
                        data-parlay-leg-id={leg.id}
                        className={`group overflow-hidden rounded-md border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${expandedLegId === leg.id ? 'border-cyan-300/30 bg-cyan-300/[0.045] shadow-[0_8px_30px_rgba(0,0,0,0.22)]' : 'border-white/[0.085] bg-white/[0.022] hover:border-white/15 hover:bg-white/[0.035]'}`}
                      >
                        <button
                          type="button"
                          aria-expanded={expandedLegId === leg.id}
                          onClick={() => setExpandedLegId((current) => current === leg.id ? null : leg.id)}
                          className="grid min-h-[3.55rem] w-full grid-cols-[2.15rem_minmax(0,1fr)_auto_1.75rem] items-center gap-2 px-2.5 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                        >
                          <div className="relative">
                            <PlayerHeadshot name={leg.playerName ?? leg.selection} playerId={leg.playerId} size={34} />
                            <span className="absolute -bottom-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#07111a] bg-cyan-300 px-1 font-mono text-[8px] font-black text-black">{index + 1}</span>
                          </div>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] font-black tracking-tight text-white">{leg.playerName || leg.selection || "Selected prop"}</span>
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${leg.addSnapshot?.dataStatus === 'official' ? 'bg-vouch-emerald shadow-[0_0_7px_rgba(0,255,148,0.7)]' : 'bg-amber-300'}`} aria-label={leg.addSnapshot?.dataStatus ?? 'status unknown'} />
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] text-white/44">
                              {[leg.teamLabel, leg.marketLabel, leg.statTarget != null ? `${leg.comparator ?? ">="} ${leg.statTarget}` : null].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-mono text-[10px] font-black text-vouch-emerald">{leg.odds ?? "TBD"}</span>
                            <span className="mt-0.5 block max-w-[4.5rem] truncate text-[7px] font-bold uppercase tracking-wide text-white/28">{leg.addSnapshot?.source.replace(/_/g, ' ') ?? 'manual'}</span>
                          </span>
                          <ChevronDown className={`h-3.5 w-3.5 text-white/35 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${expandedLegId === leg.id ? 'rotate-180 text-cyan-200' : ''}`} aria-hidden="true" />
                        </button>

                        {expandedLegId === leg.id ? (
                          <div className="border-t border-white/[0.07] bg-black/15 px-3 pb-2.5 pt-2">
                            {leg.addSnapshot?.reasoningSnapshot || leg.addSnapshot?.riskSnapshot || leg.note ? (
                              <div className="grid gap-1 text-[9px] leading-4">
                                {leg.addSnapshot?.reasoningSnapshot ? <p className="text-white/50"><span className="font-black uppercase tracking-wide text-vouch-emerald/80">Why:</span> {leg.addSnapshot.reasoningSnapshot}</p> : null}
                                {leg.addSnapshot?.riskSnapshot ? <p className="text-white/45"><span className="font-black uppercase tracking-wide text-amber-200/80">Risk:</span> {leg.addSnapshot.riskSnapshot}</p> : null}
                                {leg.note ? <p className="text-white/45"><span className="font-black uppercase tracking-wide text-cyan-100/75">Note:</span> {leg.note}</p> : null}
                              </div>
                            ) : <p className="text-[9px] leading-4 text-white/35">No additional decision notes were captured for this leg.</p>}
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLegEditor(leg.id)}
                                className="flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-cyan-300/15 bg-cyan-300/[0.04] text-[8px] font-black uppercase tracking-wide text-cyan-100/70 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  removeDraftLeg(leg.id);
                                  setExpandedLegId(null);
                                }}
                                className="flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/10 text-[8px] font-black uppercase tracking-wide text-white/40 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98] hover:border-rose-300/25 hover:text-rose-200"
                              >
                                <Trash2 className="h-3 w-3" /> Remove
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
                {draftLegs.length > 0 ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#03080e] to-transparent" aria-hidden="true" />
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-[#03080e]/95 px-3 py-2.5 shadow-[0_-12px_35px_rgba(0,0,0,0.28)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/38">Combined odds</span>
                  <span className="font-mono text-sm font-black text-cyan-200">{combinedOdds}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFindPlayers}
                    className="min-h-10 rounded-md border border-white/12 bg-white/[0.025] text-[9px] font-black uppercase tracking-[0.09em] text-white/65 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                  >
                    Add Players
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenHub}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-cyan-300/35 bg-cyan-300/12 text-[9px] font-black uppercase tracking-[0.09em] text-cyan-100 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                  >
                    Full Workspace <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </footer>
            </section>
          ) : (
            <button
              type="button"
              onClick={toggleSheet}
              className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-3 z-[90] flex min-h-11 max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-cyan-300/35 bg-[#050b12]/95 px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_28px_rgba(0,240,255,0.12)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 sm:right-4 lg:bottom-6 lg:right-6 lg:min-h-12 lg:px-4 lg:py-2.5"
              aria-label={`Open ParlayOS dock${legCount ? `, ${legCount} legs` : ""}`}
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                <Layers3 className="h-4.5 w-4.5 text-cyan-200" />
                {legCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan-300 px-1 text-[10px] font-black text-black">{legCount}</span>
                ) : null}
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-white">ParlayOS</span>
                <span className="mt-0.5 hidden text-[9px] text-white/45 sm:block">Open slip dock</span>
              </span>
            </button>
          )}
        </>
      ) : null}

      <ParlayLegEditorSheet
        leg={editingLeg}
        open={Boolean(editorLegId && editingLeg)}
        onClose={closeLegEditor}
        onSave={(updated) => replaceDraftLeg(updated.id, updated)}
        onMoveToWaiting={(updated, reason) => {
          replaceDraftLeg(updated.id, updated);
          moveDraftLegToWaiting(updated.id, reason);
          notify({
            kind: "success",
            title: "Moved to Waiting",
            body: `${updated.playerName ?? updated.selection} is out of the active slip until you promote it.`,
          });
        }}
        onSwapPlayer={(leg) => {
          useParlayOsStore.setState({ editLegId: leg.id });
          closeLegEditor();
          notify({
            kind: "info",
            title: "Change player",
            body: "Open Player Research, pick a player, and tap +. This leg will be replaced.",
          });
        }}
      />
    </>
  );
}
