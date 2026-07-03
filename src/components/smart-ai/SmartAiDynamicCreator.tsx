import type { SmartAiBuilderCategory } from './smartAiEngine.logic';
import { Bookmark, Cpu, Plus } from 'lucide-react';
import { SmartAiResearchDecisionPanel } from './SmartAiResearchDecisionPanel';
import { SmartAiLegCardList } from './SmartAiLegCardList';

interface SmartAiDynamicCreatorProps {
  builderLegs: number;
  builderCategory: SmartAiBuilderCategory;
  builderThreshold: number;
  dynamicParlay: any;
  onBuilderLegsChange: (legs: number) => void;
  onBuilderCategoryChange: (category: SmartAiBuilderCategory) => void;
  onBuilderThresholdChange: (threshold: number) => void;
  onSaveGradableParlay: () => void;
  onAddCustomParlayToSlip: () => void;
}

export function SmartAiDynamicCreator({
  builderLegs,
  builderCategory,
  builderThreshold,
  dynamicParlay,
  onBuilderLegsChange,
  onBuilderCategoryChange,
  onBuilderThresholdChange,
  onSaveGradableParlay,
  onAddCustomParlayToSlip,
}: SmartAiDynamicCreatorProps) {
  return (
  <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 p-6 space-y-5 shadow-2xl shadow-cyan-950/40 animate-fade-in ring-1 ring-cyan-300/10" id="dynamic-parlay-builder-deck">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
    <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
    <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

    <div className="relative flex items-start justify-between gap-3 border-b border-white/10 pb-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 shadow-lg shadow-cyan-950/30">
          <Cpu className="w-5 h-5 text-cyan-300 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] font-black text-cyan-300 font-mono tracking-[0.26em] uppercase">
            V.A.I Dynamic Creator
          </p>
          <h3 className="text-xl font-black text-white tracking-tight">
            Stats-Verified AI Pilot
          </h3>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            Build ledger-ready parlays from verified player trend profiles.
          </p>
        </div>
      </div>
      <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300 font-mono uppercase">
        Live Model
      </div>
    </div>

    <div className="relative rounded-2xl border border-white/10 bg-slate-950/55 p-4">
      <p className="text-sm text-slate-300 leading-relaxed">
        Builds dynamic parlay slips from player profiles whose <b className="text-white">historical game logs</b>, matchup shape, and market context verify they have successfully hit this metric.
      </p>
    </div>

    {/* Legs selector (2 to 5 legs as requested) */}
    <div className="relative space-y-2 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-black text-cyan-300 font-mono uppercase tracking-[0.22em] block">Multiplier Depth</label>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black text-cyan-200 font-mono uppercase">
          Legs
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[2, 3, 4, 5].map(cnt => (
          <button
            key={cnt}
            type="button"
            onClick={() => onBuilderLegsChange(cnt)}
            className={`py-2.5 rounded-2xl border text-center transition-all text-xs font-mono font-black ${
              builderLegs === cnt
                ? 'bg-cyan-400/15 border-cyan-300/40 text-cyan-100 shadow-lg shadow-cyan-950/20'
                : 'bg-slate-950/50 border-white/10 text-slate-400 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-slate-900/80 hover:text-white'
            }`}
          >
            {cnt} Legs
          </button>
        ))}
      </div>
    </div>

    {/* Focus Stat Category selector */}
    <div className="relative space-y-2 rounded-2xl border border-indigo-300/10 bg-indigo-400/[0.04] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-black text-indigo-200 font-mono uppercase tracking-[0.22em] block">Target Analytics Spec</label>
        <span className="rounded-full border border-indigo-300/20 bg-indigo-400/10 px-2 py-0.5 text-[9px] font-black text-indigo-200 font-mono uppercase">
          Market
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'HITS', label: '📈 1-3 Hits Focus' },
          { id: 'RBIS', label: '🎯 1-6 RBIs Focus' },
          { id: 'RUNS', label: '🏃 Runs' },
          { id: 'SB', label: '💨 Stolen Bases' },
          { id: 'HR', label: '⚾ Homeruns Focus' }
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onBuilderCategoryChange(cat.id as any)}
            className={`p-2.5 rounded-xl border text-left transition-all text-[11px] font-extrabold ${
              builderCategory === cat.id
                ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-300 shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/85 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>

    {/* Threshold level option elements */}
    <div className="relative space-y-2 rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.04] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-black text-emerald-200 font-mono uppercase tracking-[0.22em] block">Trigger Standard Value</label>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black text-emerald-200 font-mono uppercase">
          Threshold
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {builderCategory === 'HITS' && [1, 2, 3].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onBuilderThresholdChange(val)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-black transition-all hover:-translate-y-0.5 ${
              builderThreshold === val
                ? 'bg-slate-900 border-sky-500 text-sky-400'
                : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {val} Hit{val > 1 ? 's' : ''}
          </button>
        ))}
        {builderCategory === 'RBIS' && [1, 2, 3, 4, 5, 6].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onBuilderThresholdChange(val)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-black transition-all hover:-translate-y-0.5 ${
              builderThreshold === val
                ? 'bg-slate-900 border-indigo-500 text-indigo-400'
                : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {val} RBI{val > 1 ? 's' : ''}
          </button>
        ))}
        {builderCategory === 'RUNS' && [1, 2, 3, 4, 5].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onBuilderThresholdChange(val)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-black transition-all hover:-translate-y-0.5 ${
              builderThreshold === val
                ? 'bg-slate-900 border-amber-500 text-amber-400'
                : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {val} Run{val > 1 ? 's' : ''}
          </button>
        ))}
        {builderCategory === 'SB' && [1, 2].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onBuilderThresholdChange(val)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-black transition-all hover:-translate-y-0.5 ${
              builderThreshold === val
                ? 'bg-slate-900 border-cyan-500 text-cyan-400'
                : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {val} SB{val > 1 ? 's' : ''}
          </button>
        ))}
        {builderCategory === 'HR' && [1, 2].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => onBuilderThresholdChange(val)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono font-black transition-all hover:-translate-y-0.5 ${
              builderThreshold === val
                ? 'bg-slate-900 border-emerald-500 text-emerald-400'
                : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            {val === 1 ? 'Single HR (1+)' : 'Double HR (2+)'}
          </button>
        ))}
      </div>
    </div>

    {/* Compiled Dynamic Parlay Card Result */}
    {dynamicParlay ? (
      <div className="relative space-y-4 pt-4 border-t border-white/10 animate-slide-up">
        
        {/* Stats Parlay Top Header summary */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-950/20 via-slate-950/85 to-indigo-950/20 p-4 shadow-xl shadow-cyan-950/20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <span className="block text-[9px] font-mono text-cyan-300 uppercase tracking-[0.22em] leading-none font-black">Cumulative Return</span>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-xl font-mono font-black text-white">{dynamicParlay.totalOdds}</span>
                <span className="pb-0.5 text-[10px] text-slate-400 font-mono">({dynamicParlay.oddsValue}x)</span>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[9px] font-mono text-emerald-300 uppercase tracking-[0.22em] leading-none font-black">AI Confidence Edge</span>
              <div className="mt-1 inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm font-mono font-black text-emerald-300">
                {dynamicParlay.aiConfidenceScore}% Conf
              </div>
            </div>
          </div>
        </div>

        <SmartAiResearchDecisionPanel researchSignals={dynamicParlay.researchSignals} />

        {/* Parlay Active Legs Cards List */}
        <SmartAiLegCardList legs={dynamicParlay.legs} players={dynamicParlay.players} />

        {/* Save (gradable) + Transfer CTAs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSaveGradableParlay}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-mono text-xs shadow-md shadow-emerald-950/30 active:scale-[0.98]"
          >
            <Bookmark className="w-4 h-4" />
            SAVE &amp; TRACK
          </button>
          <button
            onClick={onAddCustomParlayToSlip}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-mono text-xs shadow-md shadow-sky-950/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-sky-100" />
            TO BUILDER
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-500 font-mono">
          Save &amp; Track logs a gradable parlay — it auto-settles in Results from the live MLB boxscore.
        </p>

      </div>
    ) : (
      <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-900 font-mono">
        ⚠️ No eligible matching players met this strict statistic benchmark. Try choosing a lower benchmark depth!
      </div>
    )}
  </div>
  );
}
