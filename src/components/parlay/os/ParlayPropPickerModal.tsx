import React, { useMemo, useState, useEffect } from "react";
import { X, Layers3, ChevronRight } from "lucide-react";
import type { ParlayMarketFamilyId, ParlayMarketTier } from "../../../lib/parlays/parlayMarketCatalog";
import {
  PARLAY_MARKET_FAMILIES,
  inferFamilyFromText,
  tiersForRole,
} from "../../../lib/parlays/parlayMarketCatalog";
import { resolveTierOddsMap, resolveTierOdds, mergeTierOddsQuote } from "../../../lib/parlays/parlayTierOddsResolver";
import { fetchParlayTierOddsBatch } from "../../../lib/parlays/parlayTierOddsFeed";
import {
  buildCustomTierFromFamily,
  CUSTOM_STAT_LIMITS,
  validateCustomStatTarget,
} from "../../../lib/parlays/parlayCustomLine";
import { useParlayOsStore } from "../../../stores/parlayOsStore";
import { getFallbackHeadshot, getMlbHeadshotUrl } from "../../../lib/parlayDisplay";

export type ParlayTierConfirmHandler = (tier: ParlayMarketTier) => void;

export default function ParlayPropPickerModal({
  onConfirmTier,
}: {
  onConfirmTier: ParlayTierConfirmHandler;
}) {
  const pickerOpen = useParlayOsStore((s) => s.pickerOpen);
  const context = useParlayOsStore((s) => s.pickerContext);
  const editLegId = useParlayOsStore((s) => s.editLegId);
  const closePicker = useParlayOsStore((s) => s.closePicker);
  const setPickerLiveOdds = useParlayOsStore((s) => s.setPickerLiveOdds);
  const pickerLiveOdds = useParlayOsStore((s) => s.pickerLiveOdds);

  const player = context?.player;
  const isPitcher = context?.isPitcher ?? false;
  const role = isPitcher ? "pitcher" : "batter";

  const defaultFamily = useMemo((): ParlayMarketFamilyId => {
    if (context?.initialFamily) return context.initialFamily;
    const hint = `${context?.propHint?.market ?? ""} ${context?.propHint?.spec ?? ""} ${context?.vouch?.market ?? ""} ${context?.vouch?.selection ?? ""}`;
    return inferFamilyFromText(hint);
  }, [context]);

  const families = useMemo(() => tiersForRole(role), [role]);
  const [activeFamily, setActiveFamily] = useState<ParlayMarketFamilyId>(defaultFamily);
  const [customTarget, setCustomTarget] = useState(1);
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    if (pickerOpen) setActiveFamily(defaultFamily);
  }, [pickerOpen, defaultFamily]);

  const activeFamilyData = useMemo(
    () => families.find((f) => f.id === activeFamily) ?? families[0],
    [families, activeFamily],
  );

  const customLimits = activeFamilyData ? CUSTOM_STAT_LIMITS[activeFamilyData.id] : null;

  useEffect(() => {
    if (pickerOpen && customLimits) {
      setCustomTarget(customLimits.min);
      setCustomError(null);
    }
  }, [pickerOpen, activeFamily, customLimits?.min]);

  const customTier = useMemo(() => {
    if (!activeFamilyData) return null;
    return buildCustomTierFromFamily(activeFamilyData, customTarget);
  }, [activeFamilyData, customTarget]);

  const customQuote = useMemo(() => {
    if (!customTier) return null;
    const research = resolveTierOdds({
      tier: customTier,
      propHint: context?.propHint,
      propositions: player?.propositions ?? [],
    });
    return mergeTierOddsQuote(research, pickerLiveOdds[customTier.id]);
  }, [customTier, context?.propHint, player?.propositions, pickerLiveOdds]);

  const tierOddsMap = useMemo(
    () => resolveTierOddsMap({
      tiers: activeFamilyData?.tiers ?? [],
      propHint: context?.propHint,
      propositions: player?.propositions ?? [],
    }),
    [activeFamilyData?.tiers, context?.propHint, player?.propositions],
  );

  useEffect(() => {
    if (!pickerOpen || !player?.name) return;

    const tiers = PARLAY_MARKET_FAMILIES.flatMap((family) =>
      family.role === role ? family.tiers : [],
    );
    const controller = new AbortController();

    void fetchParlayTierOddsBatch({
      playerName: player.name,
      teamName: player.team,
      tiers,
    }).then((quotes) => {
      if (controller.signal.aborted) return;
      const next: Record<string, ReturnType<typeof resolveTierOdds>> = {};
      quotes.forEach((quote, tierId) => {
        next[tierId] = quote;
      });
      setPickerLiveOdds(next);
    });

    return () => controller.abort();
  }, [pickerOpen, player?.name, player?.team, role, setPickerLiveOdds]);

  useEffect(() => {
    if (!pickerOpen || !player?.name || !customTier) return;

    const controller = new AbortController();

    void fetchParlayTierOddsBatch({
      playerName: player.name,
      teamName: player.team,
      tiers: [customTier],
    }).then((quotes) => {
      if (controller.signal.aborted) return;
      const quote = quotes.get(customTier.id);
      if (!quote) return;
      setPickerLiveOdds({
        ...useParlayOsStore.getState().pickerLiveOdds,
        [customTier.id]: quote,
      });
    });

    return () => controller.abort();
  }, [pickerOpen, player?.name, player?.team, customTier, setPickerLiveOdds]);

  const displayQuote = (tierId: string) => {
    const research = tierOddsMap.get(tierId);
    const live = pickerLiveOdds[tierId];
    if (!research) return live ?? null;
    return mergeTierOddsQuote(research, live);
  };

  const propOdds = context?.propHint?.odds;
  const oddsBadge = propOdds != null && Number.isFinite(Number(propOdds))
    ? { label: String(propOdds), source: "live" as const }
    : { label: "TBD", source: "tbd" as const };

  if (!pickerOpen || !player) return null;

  const family = activeFamilyData;
  const headshot =
    getMlbHeadshotUrl(player.id) ?? getFallbackHeadshot(player.name);

  const handleSelect = (tier: ParlayMarketTier) => {
    onConfirmTier(tier);
    closePicker();
  };

  const handleCustomConfirm = () => {
    if (!activeFamilyData || !customTier) return;
    const check = validateCustomStatTarget(activeFamilyData.id, customTarget);
    if (!check.valid) {
      setCustomError(check.reason ?? "Invalid line.");
      return;
    }
    handleSelect(customTier);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="ParlayOS prop picker"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={closePicker}
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[var(--bg-obsidian)]/98 shadow-2xl shadow-cyan-500/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 to-transparent">
          <img src={headshot} alt="" className="h-14 w-14 rounded-2xl border border-white/15 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
              {editLegId ? "Replace leg" : "ParlayOS"}
            </p>
            <h2 className="text-lg font-black text-white truncate">{player.name}</h2>
            <p className="text-xs text-white/45 truncate">{player.team} · {role === "pitcher" ? "Pitcher props" : "Batter props"}</p>
            <p className="text-[10px] font-mono mt-1">
              <span className={oddsBadge.source === "live" ? "text-emerald-300" : "text-amber-200/80"}>
                Odds {oddsBadge.label}
              </span>
              <span className="text-white/30 ml-2 uppercase tracking-wide">
                {oddsBadge.source === "live" ? "· from research" : "· TBD until book price linked"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={closePicker}
            className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Family tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-white/5 scrollbar-none">
          {families.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFamily(f.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide border transition-all ${
                family?.id === f.id
                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-200"
                  : "border-white/10 text-white/45 hover:border-white/25"
              }`}
            >
              <span aria-hidden="true">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tiers grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[11px] text-white/40 mb-3">{family?.subtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {family?.tiers.map((tier) => {
              const tierQuote = displayQuote(tier.id);
              return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleSelect(tier)}
                className="group text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-500/5 p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-cyan-100">{tier.label}</p>
                    <p className="text-[10px] text-white/40 mt-1">{tier.marketLabel}</p>
                    {tier.comboLegs?.length ? (
                      <p className="text-[9px] text-amber-300/80 mt-1 font-mono">
                        {tier.comboLegs.length} legs · combo slip
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {tierQuote ? (
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          tierQuote.source === "live" ? "text-emerald-300" : "text-amber-200/80"
                        }`}
                        title={tierQuote.detail}
                      >
                        {tierQuote.label}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400" />
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-mono text-white/35 truncate">
                  {tier.selection(player.name ?? "Player")}
                </p>
              </button>
            );
            })}
          </div>

          {customLimits && customTier ? (
            <div className="mt-4 rounded-2xl border border-dashed border-cyan-400/25 bg-cyan-500/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80 mb-3">
                Custom line
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTarget((v) => Math.max(customLimits.min, v - 1));
                      setCustomError(null);
                    }}
                    disabled={customTarget <= customLimits.min}
                    className="min-h-[2.75rem] min-w-[2.75rem] rounded-xl border border-white/15 text-white/70 disabled:opacity-30"
                    aria-label="Decrease custom line"
                  >
                    −
                  </button>
                  <span className="text-2xl font-black text-cyan-200 min-w-[2.5rem] text-center">{customTarget}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTarget((v) => Math.min(customLimits.max, v + 1));
                      setCustomError(null);
                    }}
                    disabled={customTarget >= customLimits.max}
                    className="min-h-[2.75rem] min-w-[2.75rem] rounded-xl border border-white/15 text-white/70 disabled:opacity-30"
                    aria-label="Increase custom line"
                  >
                    +
                  </button>
                  <span className="text-[10px] text-white/35 ml-1">{customLimits.min}–{customLimits.max}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{customTier.selection(player.name ?? "Player")}</p>
                  <p className="text-[10px] font-mono mt-0.5">
                    <span className={customQuote?.source === "live" ? "text-emerald-300" : "text-amber-200/80"}>
                      {customQuote?.label ?? "TBD"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCustomConfirm}
                  className="shrink-0 min-h-[2.75rem] px-4 rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-[11px] font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25"
                >
                  Add custom
                </button>
              </div>
              {customError ? (
                <p role="alert" className="mt-2 text-[10px] text-amber-200/90">{customError}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center gap-2 text-[10px] text-white/35">
          <Layers3 className="w-3.5 h-3.5 text-cyan-500/60" />
          Selection adds to your ParlayOS slip — review before locking to ledger.
        </div>
      </div>
    </div>
  );
}
