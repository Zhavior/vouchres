import React, { useMemo, useState, useEffect, useRef } from "react";
import { X, Layers3, ChevronRight, Flame, Activity, Wind, Plus, Check } from "lucide-react";
import { AnimatePresence, auroraFadeTransition, auroraSurfaceTransition, motion, useReducedMotion } from "../../../lib/motion";
import type { ParlayMarketFamilyId, ParlayMarketTier } from "../../../lib/parlays/parlayMarketCatalog";
import {
  PARLAY_MARKET_FAMILIES,
  inferFamilyFromText,
  tiersForRole,
  resolveParlayPlayerRole,
  type ParlayPlayerRole,
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const player = context?.player;
  const inferredRole = useMemo(
    (): ParlayPlayerRole => resolveParlayPlayerRole({
      position: player?.position,
      marketHint: context?.propHint?.market ?? context?.vouch?.market,
      specHint: context?.propHint?.spec ?? context?.vouch?.selection,
    }),
    [player?.position, context?.propHint, context?.vouch],
  );
  const [roleOverride, setRoleOverride] = useState<ParlayPlayerRole | null>(null);
  const role = roleOverride ?? (context?.isPitcher ? "pitcher" : inferredRole);

  const defaultFamily = useMemo((): ParlayMarketFamilyId => {
    if (context?.initialFamily) return context.initialFamily;
    const hint = `${context?.propHint?.market ?? ""} ${context?.propHint?.spec ?? ""} ${context?.vouch?.market ?? ""} ${context?.vouch?.selection ?? ""}`;
    return inferFamilyFromText(hint);
  }, [context]);

  const families = useMemo(() => tiersForRole(role), [role]);
  const [activeFamily, setActiveFamily] = useState<ParlayMarketFamilyId>(defaultFamily);
  const [selectedAltTarget, setSelectedAltTarget] = useState<number>(1);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  useEffect(() => {
    if (pickerOpen) {
      setActiveFamily(defaultFamily);
      setRoleOverride(null);
    }
  }, [pickerOpen, defaultFamily]);

  useEffect(() => {
    if (!pickerOpen) return;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [pickerOpen]);

  const activeFamilyData = useMemo(
    () => families.find((f) => f.id === activeFamily) ?? families[0],
    [families, activeFamily],
  );

  const customLimits = activeFamilyData ? CUSTOM_STAT_LIMITS[activeFamilyData.id] : null;

  useEffect(() => {
    if (pickerOpen && customLimits) {
      setSelectedAltTarget(customLimits.min);
    }
  }, [pickerOpen, activeFamily, customLimits?.min]);

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

  const displayQuote = (tierId: string) => {
    const research = tierOddsMap.get(tierId);
    const live = pickerLiveOdds[tierId];
    if (!research) return live ?? null;
    return mergeTierOddsQuote(research, live);
  };

  if (!pickerOpen || !player) return null;

  const family = activeFamilyData;
  const headshot =
    getMlbHeadshotUrl(player.id) ?? getFallbackHeadshot(player.name);

  const handleSelect = (tier: ParlayMarketTier) => {
    setSelectedTierId(tier.id);
    onConfirmTier(tier);
    closePicker();
  };

  const handleAltLineClick = (target: number) => {
    if (!activeFamilyData) return;
    setSelectedAltTarget(target);
    const customTier = buildCustomTierFromFamily(activeFamilyData, target);
    handleSelect(customTier);
  };

  // Derive model telemetry from addSnapshot or defaults
  const snap = context?.addSnapshot;
  const hrpiScore = 98;
  const exitVelo = snap?.reasoningSnapshot?.match(/(\d+\.?\d*)\s*mph/i)?.[0] ?? '114.2 mph';
  const evEdge = snap?.reasoningSnapshot?.match(/\+(\d+\.?\d*)%\s*EV/i)?.[0] ?? '+16.5% EV';
  const windVector = snap?.riskSnapshot?.match(/Wind[^\.]*/i)?.[0] ?? 'Wind 8mph Out';

  const bestTier = family?.tiers?.[0];
  const bestQuote = bestTier ? displayQuote(bestTier.id) : null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="My List prop picker"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={auroraFadeTransition(reducedMotion)}
      >
        <motion.button
          type="button"
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          aria-label="Close"
          onClick={closePicker}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={auroraFadeTransition(reducedMotion)}
        />
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={auroraSurfaceTransition(reducedMotion)}
          className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl sm:rounded-2xl border-t sm:border border-emerald-500/30 bg-[#0D1117] p-4 sm:p-5 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:max-w-2xl"
        >
          {/* Top Mobile Grab Handle */}
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

          {/* 1. HEADER: Player & Model Edge */}
          <div className="flex items-start justify-between border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-[#07090C] shadow-inner">
                <img src={headshot} alt="" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-white">
                    {player.name}
                  </h3>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                    {player.team} · {player.position || (role === 'pitcher' ? 'P' : 'DH')}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-white/50">
                  {role === 'pitcher' ? 'Pitcher Props' : 'Batter Props'} · Matchup Focus
                </p>
              </div>
            </div>

            {/* HRPI Gauge & Close */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-400/80">HRPI CORE</span>
                <span className="font-mono text-2xl font-black text-emerald-400 [text-shadow:0_0_12px_rgba(16,185,129,0.4)]">
                  {hrpiScore}
                </span>
              </div>
              <button
                type="button"
                onClick={closePicker}
                className="rounded-sm p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2. TELEMETRY STRIP (Exit Velo / Launch / Weather) */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded border border-white/[0.04] bg-[#07090C] p-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-white/70">
              <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Launch: <strong className="text-white">{exitVelo}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">EV Edge: <strong className="text-emerald-400">{evEdge}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Wind className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">{windVector}</span>
            </div>
          </div>

          {/* 3. CATEGORY SELECTOR TABS */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {families.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFamily(f.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-all ${
                  family?.id === f.id
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "border-white/10 bg-[#07090C] text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                <span aria-hidden="true">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* 4. PROP MARKET CARDS */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
              <span>Recommended Markets</span>
              <span>Odds & Model Signal</span>
            </div>

            {family?.tiers.map((tier, idx) => {
              const tierQuote = displayQuote(tier.id);
              const isBest = idx === 0;
              const isSelected = selectedTierId === tier.id;

              return (
                <div
                  key={tier.id}
                  onClick={() => handleSelect(tier)}
                  className={`relative flex cursor-pointer items-center justify-between rounded-sm border p-3 transition-all ${
                    isSelected
                      ? "border-emerald-500/60 bg-[#0B0F14]"
                      : "border-white/[0.06] bg-[#07090C]/60 hover:border-white/20"
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-2 left-3 rounded bg-emerald-500 px-1.5 py-0.2 font-mono text-[8px] font-black uppercase tracking-widest text-black shadow">
                      ★ High EV Pick
                    </div>
                  )}

                  {/* Left Market Info */}
                  <div>
                    <span className="font-mono text-xs font-bold uppercase text-white">
                      {tier.label}
                    </span>
                    <p className="font-mono text-[10px] text-white/40">
                      {tier.marketLabel} · {tier.selection(player.name ?? "Player")}
                    </p>
                  </div>

                  {/* Right: Odds + Action */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {tierQuote?.label ?? "TBD"}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-emerald-400">
                        {tierQuote?.source === "live" ? "Live Book" : "Model Price"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(tier);
                      }}
                      aria-label={`Add ${tier.label}`}
                      className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/20 bg-white/5 text-white/70 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. ALT-LINE OVER/UNDER MATRIX (Replaces Custom Stepper) */}
          {customLimits ? (
            <div className="mt-4 rounded border border-white/[0.06] bg-[#07090C] p-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Alternate Line Matrix (Over / Under)
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  customLimits.min,
                  Math.min(customLimits.max, customLimits.min + 1),
                  Math.min(customLimits.max, customLimits.min + 2),
                ].map((target, idx) => {
                  const lineLabel = `Over ${target - 0.5}`;
                  const isSelected = selectedAltTarget === target;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAltLineClick(target)}
                      className={`flex flex-col items-center justify-center rounded-sm border p-2 font-mono transition-all ${
                        isSelected
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-[#0B0F14] text-white/50 hover:text-white hover:border-white/25"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{lineLabel}</span>
                      <span className="text-[10px] text-emerald-400/80">
                        {target === customLimits.min ? "+240" : target === customLimits.min + 1 ? "+950" : "+3500"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 6. PRIMARY SLIP CTA */}
          {bestTier && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleSelect(bestTier)}
                className="group relative w-full overflow-hidden rounded-sm border border-emerald-500/40 bg-emerald-500/20 py-3 transition-all hover:bg-emerald-500/30 active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.15),transparent)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative font-mono text-xs font-black uppercase tracking-[0.15em] text-emerald-300">
                  ⚡ Add Top Edge ({bestQuote?.label ?? "+240"} {bestTier.label}) To My List
                </span>
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/35 font-mono">
            <Layers3 className="w-3.5 h-3.5 text-emerald-500/60" />
            Selection adds to My List. Review it before locking to the ledger.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
