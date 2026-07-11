import React, { useMemo, useState, useCallback } from "react";
import { Layers3, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { useParlayOsStore } from "../../../stores/parlayOsStore";
import {
  selectDraftLegs,
  useParlayCommandStore,
} from "../../../stores/parlayCommandStore";
import { useAppCommandStore } from "../../../stores/appCommandStore";
import ParlayBuilderRail from "../ParlayBuilderRail";
import ParlayPropPickerModal from "./ParlayPropPickerModal";
import ParlayLegCardPro from "./ParlayLegCardPro";
import ParlayLegEditorSheet from "./ParlayLegEditorSheet";
import type { ParlayMarketTier } from "../../../lib/parlays/parlayMarketCatalog";
import { draftLegsToUiLegs } from "../../../lib/parlays/draftLegsToUiLegs";
import { assessSlipOdds } from "../../../lib/parlays/slipOddsPolicy";
import { assessClientParlayIdentity } from "../../../lib/parlayIdentity";
import { useParlaySlipLiveProgress, liveProgressMap } from "../../../hooks/useParlaySlipLiveProgress";
import ParlayIdentityExplainer from "../../trust/ParlayIdentityExplainer";
import ParlayIdentityBadge from "../../trust/ParlayIdentityBadge";
import { notify } from "../../../lib/appNotifications";
import { useAutoRepairDraftIdentity } from "../../../hooks/useAutoRepairDraftIdentity";

export type ParlayOsLayerProps = {
  onConfirmTier: (tier: ParlayMarketTier) => void;
  onSaveParlay?: () => void;
  navigateSection?: (section: string) => void;
  /** Hide global floating dock when Hub provides its own slip bar. */
  suppressFloatingDock?: boolean;
};

export default function ParlayOsLayer({
  onConfirmTier,
  onSaveParlay,
  navigateSection,
  suppressFloatingDock = false,
}: ParlayOsLayerProps) {
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const removeDraftLeg = useParlayCommandStore((s) => s.removeDraftLeg);
  const replaceDraftLeg = useParlayCommandStore((s) => s.replaceDraftLeg);
  useAutoRepairDraftIdentity(draftLegs.length > 0);
  const sheetOpen = useParlayOsStore((s) => s.sheetOpen);
  const sheetExpanded = useParlayOsStore((s) => s.sheetExpanded);
  const toggleSheet = useParlayOsStore((s) => s.toggleSheet);
  const setSheetExpanded = useParlayOsStore((s) => s.setSheetExpanded);
  const editorLegId = useParlayOsStore((s) => s.editorLegId);
  const openLegEditor = useParlayOsStore((s) => s.openLegEditor);
  const closeLegEditor = useParlayOsStore((s) => s.closeLegEditor);

  const [stake, setStake] = useState(10);
  const [identityExplainerOpen, setIdentityExplainerOpen] = useState(false);

  const uiLegs = useMemo(() => draftLegsToUiLegs(draftLegs), [draftLegs]);
  const slipIdentity = useMemo(
    () => assessClientParlayIdentity(draftLegs as unknown as Record<string, unknown>[]),
    [draftLegs],
  );
  const oddsAssessment = useMemo(() => assessSlipOdds(uiLegs), [uiLegs]);
  const totalOdds = oddsAssessment.canShowCombined ? (oddsAssessment.combined?.american ?? "—") : "TBD";
  const potentialPayout =
    oddsAssessment.canShowPayout && oddsAssessment.combined?.decimal != null
      ? Math.round(oddsAssessment.combined.decimal * stake * 100) / 100
      : null;

  const liveProgressQuery = useParlaySlipLiveProgress(
    draftLegs.map((leg) => ({
      id: leg.id,
      gamePk: leg.gamePk,
      playerId: leg.playerId,
      marketCode: leg.marketCode,
      statTarget: leg.statTarget != null ? Number(leg.statTarget) : null,
    })),
    { enabled: sheetOpen && draftLegs.length > 0 },
  );
  const liveProgressByLegId = useMemo(() => {
    const map = liveProgressMap(liveProgressQuery.data);
    const out: Record<string, { current: number; target: number; label: string }> = {};
    map.forEach((value, key) => {
      if (value.current != null) {
        out[key] = { current: value.current, target: value.target, label: value.label };
      }
    });
    return out;
  }, [liveProgressQuery.data]);

  const legCount = draftLegs.length;
  const editingLeg = draftLegs.find((leg) => leg.id === editorLegId) ?? null;

  const legContent = useMemo(() => {
    if (uiLegs.length === 0) return undefined;
    return (
      <div className="flex flex-col gap-3">
        {uiLegs.map((leg) => (
          <ParlayLegCardPro
            key={leg.id}
            leg={{
              ...leg,
              actual: liveProgressByLegId[leg.id]?.current ?? leg.actual,
              statTarget: liveProgressByLegId[leg.id]?.target ?? leg.statTarget,
            }}
            compact
            onEdit={() => openLegEditor(leg.id)}
            onRemove={() => removeDraftLeg(leg.id)}
          />
        ))}
      </div>
    );
  }, [uiLegs, liveProgressByLegId, openLegEditor, removeDraftLeg]);

  const handleOpenHub = useCallback(() => {
    navigateSection?.("build");
  }, [navigateSection]);

  return (
    <>
      <ParlayPropPickerModal onConfirmTier={onConfirmTier} />

      {/* Floating dock */}
      {!sheetOpen && !suppressFloatingDock && (
        <button
          type="button"
          onClick={() => toggleSheet()}
          className="fixed bottom-20 right-4 z-[90] flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-[var(--bg-obsidian)]/95 px-4 py-3 shadow-xl shadow-cyan-500/15 backdrop-blur-xl hover:border-cyan-300/60 transition-all"
          aria-label={`Open ParlayOS slip${legCount ? `, ${legCount} legs` : ""}`}
        >
          <div className="relative">
            <Layers3 className="w-5 h-5 text-cyan-300" />
            {legCount > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-cyan-400 text-[10px] font-black text-black flex items-center justify-center px-1">
                {legCount}
              </span>
            ) : null}
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-white">ParlayOS</span>
        </button>
      )}

      {/* Bottom sheet */}
      {sheetOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[95] flex flex-col max-h-[85vh] rounded-t-3xl border border-white/10 bg-[var(--bg-obsidian)]/98 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-black text-white">ParlayOS Slip</span>
              <span className="text-[10px] font-mono text-white/40">{legCount} leg{legCount !== 1 ? "s" : ""}</span>
              {legCount > 0 ? (
                <ParlayIdentityBadge
                  identity={slipIdentity}
                  onExplain={() => setIdentityExplainerOpen(true)}
                />
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSheetExpanded(!sheetExpanded)}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                aria-label={sheetExpanded ? "Collapse slip" : "Expand slip"}
              >
                {sheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => useParlayOsStore.getState().closeSheet()}
                className="text-[10px] font-bold uppercase tracking-wide text-white/40 hover:text-white px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>

          {sheetExpanded ? (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <ParlayBuilderRail
                layout="sheet"
                legs={uiLegs}
                legContent={legContent}
                onRemoveLeg={(id) => removeDraftLeg(id)}
                onSaveParlay={onSaveParlay}
                saveLabel="Save Slip"
                stake={stake}
                onStakeChange={setStake}
                totalOdds={totalOdds}
                potentialPayout={potentialPayout}
                title="Active Slip"
                subtitle="Add from any player page via +"
                liveProgressByLegId={liveProgressByLegId}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenHub}
                  className="flex-1 rounded-xl border border-white/15 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  Open Parlay Hub
                </button>
                <button
                  type="button"
                  onClick={() => notify({ kind: 'info', title: 'Add legs', body: 'Browse Player Research and tap + on any prop.' })}
                  className="flex items-center justify-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-cyan-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 text-[11px] text-white/45 font-mono">
              Tap expand to edit slip · {totalOdds} combined
            </div>
          )}
        </div>
      ) : null}

      {identityExplainerOpen ? (
        <ParlayIdentityExplainer
          identity={slipIdentity}
          onClose={() => setIdentityExplainerOpen(false)}
        />
      ) : null}

      <ParlayLegEditorSheet
        leg={editingLeg}
        open={Boolean(editorLegId && editingLeg)}
        onClose={closeLegEditor}
        onSave={(updated) => replaceDraftLeg(updated.id, updated)}
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
