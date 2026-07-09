import type { SmartAiBuilderCategory } from './smartAiEngine.logic';
import { Bookmark, Cpu, Loader2 } from 'lucide-react';
import { SmartAiResearchDecisionPanel } from './SmartAiResearchDecisionPanel';
import { SmartAiLegCardList } from './SmartAiLegCardList';
import {
  Z8_ACTIVE,
  Z8_DISPLAY,
  Z8_EMERALD,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
  Z8_TABULAR,
  Z8_WARNING,
} from '../../theme/z8Tokens';

interface SmartAiDynamicCreatorProps {
  builderLegs: number;
  builderCategory: SmartAiBuilderCategory;
  builderThreshold: number;
  dynamicParlay: any;
  candidatesLoading?: boolean;
  usingProjectedPreview?: boolean;
  saveDisabled?: boolean;
  onBuilderLegsChange: (legs: number) => void;
  onBuilderCategoryChange: (category: SmartAiBuilderCategory) => void;
  onBuilderThresholdChange: (threshold: number) => void;
  onSaveGradableParlay: () => void;
  onAddCustomParlayToSlip: () => void;
}

const MARKET_OPTIONS: Array<{ id: SmartAiBuilderCategory; label: string; hint: string }> = [
  { id: 'HITS', label: 'Hits', hint: '1–3 hit focus' },
  { id: 'RBIS', label: 'RBIs', hint: '1–6 RBI focus' },
  { id: 'RUNS', label: 'Runs', hint: 'Run production' },
  { id: 'SB', label: 'Stolen Bases', hint: 'Speed edge' },
  { id: 'HR', label: 'Home Runs', hint: 'Power focus' },
];

function controlBtn(active: boolean) {
  return [
    'rounded-xl border px-3 py-2.5 text-xs font-bold transition-all z8-interactive',
    active ? Z8_ACTIVE : Z8_IDLE,
  ].join(' ');
}

export function SmartAiDynamicCreator({
  builderLegs,
  builderCategory,
  builderThreshold,
  dynamicParlay,
  candidatesLoading = false,
  usingProjectedPreview = false,
  saveDisabled = false,
  onBuilderLegsChange,
  onBuilderCategoryChange,
  onBuilderThresholdChange,
  onSaveGradableParlay,
}: SmartAiDynamicCreatorProps) {
  const thresholdOptions = (() => {
    switch (builderCategory) {
      case 'HITS':
        return [1, 2, 3].map((v) => ({ value: v, label: `${v} Hit${v > 1 ? 's' : ''}` }));
      case 'RBIS':
        return [1, 2, 3, 4, 5, 6].map((v) => ({ value: v, label: `${v} RBI${v > 1 ? 's' : ''}` }));
      case 'RUNS':
        return [1, 2, 3, 4, 5].map((v) => ({ value: v, label: `${v} Run${v > 1 ? 's' : ''}` }));
      case 'SB':
        return [1, 2].map((v) => ({ value: v, label: `${v} SB${v > 1 ? 's' : ''}` }));
      case 'HR':
        return [
          { value: 1, label: '1+ HR' },
          { value: 2, label: '2+ HR' },
        ];
      default:
        return [];
    }
  })();

  return (
    <div
      className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-[2rem] p-5 sm:p-6 space-y-5`}
      id="dynamic-parlay-builder-deck"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/50 to-transparent" />

      <div className="relative flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div className={Z8_SECTION_HEADER}>
            <p className={`${Z8_LABEL} text-vouch-cyan`}>V.A.I Dynamic Creator</p>
            <h2 className={`${Z8_DISPLAY} text-xl sm:text-2xl`}>Stats-Verified AI Pilot</h2>
            <p className="mt-1 max-w-xl text-xs text-white/45 sm:text-sm">
              Build ledger-ready parlays from verified player trend profiles. Model outputs are estimates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${Z8_LABEL} rounded-full border border-vouch-cyan/25 bg-vouch-cyan/10 px-3 py-1 text-vouch-cyan`}>
            Research model
          </span>
          {usingProjectedPreview && (
            <span className={`${Z8_LABEL} rounded-full border border-vouch-amber/25 bg-vouch-amber/10 px-3 py-1 ${Z8_WARNING}`}>
              Roster preview
            </span>
          )}
        </div>
      </div>

      {candidatesLoading ? (
        <div className={`${Z8_STAT_CHIP} flex items-center justify-center gap-2 py-10 text-sm text-white/45`}>
          <Loader2 className="h-4 w-4 animate-spin text-vouch-cyan" />
          Loading verified candidate pool…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${Z8_STAT_CHIP} space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <label className={`${Z8_LABEL} text-vouch-cyan`}>Leg depth</label>
                <span className={`${Z8_LABEL} text-white/35`}>2–5 legs</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => onBuilderLegsChange(cnt)}
                    className={controlBtn(builderLegs === cnt)}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${Z8_STAT_CHIP} space-y-3 lg:col-span-1`}>
              <label className={`${Z8_LABEL} text-vouch-cyan`}>Market focus</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 xl:grid-cols-2">
                {MARKET_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onBuilderCategoryChange(cat.id)}
                    className={`${controlBtn(builderCategory === cat.id)} text-left`}
                  >
                    <span className="block text-white">{cat.label}</span>
                    <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-white/40">
                      {cat.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${Z8_STAT_CHIP} space-y-3`}>
              <label className={`${Z8_LABEL} ${Z8_EMERALD}`}>Threshold</label>
              <div className="flex flex-wrap gap-2">
                {thresholdOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onBuilderThresholdChange(value)}
                    className={controlBtn(builderThreshold === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {dynamicParlay ? (
            <div className="space-y-4 border-t border-white/10 pt-4 animate-slide-up">
              <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-4`}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className={`${Z8_LABEL} text-white/40`}>Cumulative return</span>
                    <div className={`mt-1 flex items-end gap-2 ${Z8_TABULAR}`}>
                      <span className="text-2xl font-black text-white">
                        {dynamicParlay.totalOdds === 'Odds TBD' ? 'Odds TBD' : dynamicParlay.totalOdds}
                      </span>
                      {typeof dynamicParlay.oddsValue === 'number' && dynamicParlay.oddsValue > 0 && (
                        <span className="pb-1 text-xs text-white/40">({dynamicParlay.oddsValue}x est.)</span>
                      )}
                    </div>
                    {dynamicParlay.totalOdds === 'Odds TBD' && (
                      <p className="mt-1 text-[10px] text-white/35">No verified market prices for all legs.</p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <span className={`${Z8_LABEL} text-white/40`}>AI confidence</span>
                    <div className="mt-1 inline-flex items-center rounded-full border border-vouch-emerald/25 bg-vouch-emerald/10 px-3 py-1">
                      <span className={`text-lg font-black ${Z8_EMERALD} ${Z8_TABULAR}`}>
                        {dynamicParlay.aiConfidenceScore}%
                      </span>
                      <span className="ml-1.5 text-[10px] text-white/40">model est.</span>
                    </div>
                  </div>
                </div>
              </div>

              <SmartAiResearchDecisionPanel researchSignals={dynamicParlay.researchSignals} />
              <SmartAiLegCardList legs={dynamicParlay.legs} players={dynamicParlay.players} />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onSaveGradableParlay}
                  disabled={saveDisabled}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-vouch-emerald/40 bg-vouch-emerald/15 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-vouch-emerald/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Bookmark className="h-4 w-4" />
                  Save locked AI parlay
                </button>
                <p className="text-center text-[10px] text-white/35">
                  Locked V.A.I parlays stay separate from manual builder slips and auto-settle in Results from the MLB
                  boxscore.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${Z8_STAT_CHIP} py-10 text-center`}>
              <p className={`${Z8_LABEL} ${Z8_WARNING}`}>No eligible match</p>
              <p className="mt-2 text-xs text-white/45">
                No verified players met this benchmark today. Try a lower threshold or different market focus.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
