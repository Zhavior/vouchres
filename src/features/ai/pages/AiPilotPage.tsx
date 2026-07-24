import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Cpu,
  Database,
  Gauge,
  Layers3,
  LockKeyhole,
  Radar,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Leg, Parlay } from '../../../types';
import { normalizeParlaySlip } from '../../../lib/parlays/parlayBridge';
import type { CanonicalParlaySlip } from '../../../lib/parlays/parlayBridge';
import { resolveMarket } from '../../../sports/markets';
import {
  buildSmartAiDynamicParlay,
  type SmartAiBuilderCategory,
} from '../../../components/smart-ai/smartAiEngine.logic';
import { SmartAiDynamicCreator } from '../../../components/smart-ai/SmartAiDynamicCreator';
import { useSmartAiCandidates } from '../../../components/smart-ai/useSmartAiCandidates';
import {
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
} from '../../../theme/z8Tokens';
import '../../brain/brain.css';

interface AiPilotPageProps {
  onSectionChange: (section: string) => void;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => void;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <div className="brain-panel rounded-2xl border border-white/8 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`${Z8_LABEL} text-white/40`}>{label}</span>
        <Icon className="h-4 w-4 text-vouch-cyan/75" />
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/40">{detail}</p>
    </div>
  );
}

export default function AiPilotPage({ onSectionChange, onSaveParlay }: AiPilotPageProps) {
  const [builderLegs, setBuilderLegs] = useState(3);
  const [builderCategory, setBuilderCategory] = useState<SmartAiBuilderCategory>('HITS');
  const [builderThreshold, setBuilderThreshold] = useState(2);

  const { realCandidates, candidatesLoading, usingProjectedPreview } = useSmartAiCandidates();

  useEffect(() => {
    if (builderCategory === 'HITS' || builderCategory === 'RBIS' || builderCategory === 'RUNS') {
      setBuilderThreshold(2);
    } else if (builderCategory === 'SB' || builderCategory === 'HR') {
      setBuilderThreshold(1);
    }
  }, [builderCategory]);

  const dynamicParlay = useMemo(
    () =>
      buildSmartAiDynamicParlay({
        realCandidates,
        builderLegs,
        builderCategory,
        builderThreshold,
      }),
    [builderLegs, builderCategory, builderThreshold, realCandidates],
  );

  const boardStats = useMemo(() => {
    const confirmed = realCandidates.filter(
      (candidate) => String(candidate.lineupStatus ?? '').toLowerCase() === 'confirmed',
    ).length;
    const games = new Set(realCandidates.map((candidate) => candidate.gamePk)).size;
    const confidences = realCandidates
      .map((candidate) => candidate.dataConfidence)
      .filter((value): value is number => typeof value === 'number');
    const avgConfidence = confidences.length
      ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length)
      : null;

    return { total: realCandidates.length, confirmed, games, avgConfidence };
  }, [realCandidates]);

  const generationStatus = candidatesLoading
    ? 'Scanning slate'
    : dynamicParlay
      ? 'Decision ready'
      : 'Awaiting viable build';

  const handleAddCustomParlayToSlip = () => {
    alert(
      'V.A.I parlays are locked and cannot be transferred into the manual builder. Save this as an AI Made Parlay so results stay separate and trustworthy.',
    );
  };

  const handleSaveGradableParlay = () => {
    if (!dynamicParlay || !onSaveParlay) return;

    const legs: Leg[] = dynamicParlay.legs.map((leg) => {
      const { marketCode, threshold } = resolveMarket('mlb', leg.marketName, leg.customSpec);
      const gameId = String(leg.gamePk || '');
      const playerId = String(leg.playerId || '');
      const statTarget = Number(threshold || 1);
      const comparator = '>=';
      const eventKey = ['MLB', gameId, playerId, marketCode, statTarget, 'GTE'].join('_');
      const popularityKey = ['MLB', playerId, marketCode, statTarget, 'GTE'].join('_');

      return {
        id: `ai-leg-${gameId}-${playerId}-${marketCode}-${statTarget}`,
        sport: 'MLB',
        game: `${leg.team} vs opp`,
        market: leg.marketName,
        selection: leg.customSpec,
        odds: leg.odds,
        status: 'PENDING',
        gamePk: gameId,
        gameId,
        playerId,
        marketCode,
        statTarget,
        threshold: statTarget,
        comparator,
        eventKey,
        popularityKey,
        externalProvider: 'mlb_statsapi',
      };
    });

    const parlay: Parlay = {
      id: `ai-parlay-${Date.now()}`,
      title: `V.A.I ${builderLegs}-Leg ${builderCategory} Parlay`,
      legs,
      totalOdds: dynamicParlay.totalOdds,
      oddsValue: dynamicParlay.oddsValue ?? 0,
      riskTier:
        dynamicParlay.riskTier === 'LOW'
          ? 'LOW'
          : dynamicParlay.riskTier === 'HIGH'
            ? 'HIGH'
            : 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      wagerAmount: 1,
      edgeScore: dynamicParlay.aiConfidenceScore,
      aiGenerated: true,
      source: 'vai_ai_made_parlay',
      parlayType: 'AI_MADE',
      locked: true,
      canEditLegs: false,
      resultBucket: 'ai_made_parlays',
    } as Parlay & {
      source: 'vai_ai_made_parlay';
      parlayType: 'AI_MADE';
      locked: boolean;
      canEditLegs: boolean;
      resultBucket: 'ai_made_parlays';
    };

    onSaveParlay(normalizeParlaySlip(parlay, 'vai_ai_made_parlay'));
    const gradable = legs.filter((leg) => leg.gamePk).length;
    alert(
      `✅ Saved locked AI Made Parlay: "${parlay.title}"\n${gradable}/${legs.length} legs are tied to live MLB games and will auto-grade in Results after the games go final.`,
    );
    onSectionChange('results');
  };

  return (
    <main
      className={`${Z8_PAGE} brain-workspace min-h-0 min-w-0 overflow-x-hidden ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}
      id="ai-pilot-page"
    >
      <div className="mx-auto flex max-w-[1380px] flex-col gap-4 sm:gap-5">
        <header className="brain-hero relative overflow-hidden rounded-2xl p-4 sm:p-6" id="ai-pilot-hero">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-vouch-cyan/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`${Z8_LABEL} brain-product-mark text-xs font-bold text-vouch-cyan`}>
                <Brain className="h-3.5 w-3.5" /> ProjectVABrAIns · The Vouch AI Edge Lab
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl">
                Project every game. Explain every edge. <span className="text-vouch-emerald">Build from evidence.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/55 sm:text-sm">
                The Vouch AI Edge Lab combines home-run projections, player signals, matchup pressure, pitcher vulnerability, historical context, and locked AI builds inside one auditable research workspace.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:min-w-[360px]">
              <div className="brain-panel rounded-xl border border-vouch-cyan/20 bg-vouch-cyan/5 p-3">
                <div className={`${Z8_LABEL} text-vouch-cyan/70`}>Generation state</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-black text-white">
                  <Radar className="h-4 w-4 text-vouch-cyan" /> {generationStatus}
                </div>
              </div>
              <div className="brain-panel rounded-xl border border-vouch-emerald/20 bg-vouch-emerald/5 p-3">
                <div className={`${Z8_LABEL} text-vouch-emerald/70`}>Output policy</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-black text-white">
                  <LockKeyhole className="h-4 w-4 text-vouch-emerald" /> Locked ledger
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="AI Lab slate health">
          <MetricCard
            label="Games scanned"
            value={candidatesLoading ? '—' : boardStats.games}
            detail="Unique MLB games represented in the active candidate pool."
            icon={Radar}
          />
          <MetricCard
            label="Confirmed lineups"
            value={candidatesLoading ? '—' : boardStats.confirmed}
            detail="Candidates already supported by confirmed lineup status."
            icon={Shield}
          />
          <MetricCard
            label="Candidate pool"
            value={candidatesLoading ? '—' : boardStats.total}
            detail="Players currently available to the generation engine."
            icon={Database}
          />
          <MetricCard
            label="Average data"
            value={candidatesLoading || boardStats.avgConfidence == null ? '—' : `${boardStats.avgConfidence}%`}
            detail="Mean source-confidence score across the available slate."
            icon={Gauge}
          />
        </section>

        <section className="brain-panel rounded-2xl border border-white/8 bg-black/20 p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
                <Activity className="h-3.5 w-3.5" /> HR projection command board
              </div>
              <h2 className="mt-1 text-lg font-black tracking-tight text-white">
                Home-run projections by slate, game, and player
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/40">
                Review the strongest projected home-run signals across today&apos;s verified MLB slate. Every row is derived from the same production candidate pipeline used by the Vouch AI builder.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-2 text-center">
                <div className={`${Z8_LABEL} text-white/35`}>Slate</div>
                <div className="mt-1 text-sm font-black text-white">Today</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-2 text-center">
                <div className={`${Z8_LABEL} text-white/35`}>Games</div>
                <div className="mt-1 text-sm font-black text-white">{candidatesLoading ? '—' : boardStats.games}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-2 text-center">
                <div className={`${Z8_LABEL} text-white/35`}>Players</div>
                <div className="mt-1 text-sm font-black text-white">{candidatesLoading ? '—' : boardStats.total}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/8">
            <div className="hidden grid-cols-[44px_minmax(180px,1.5fr)_minmax(130px,1fr)_90px_90px_90px] gap-3 border-b border-white/8 bg-white/[0.025] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/35 md:grid">
              <span>Rank</span><span>Player</span><span>Game</span><span>HR edge</span><span>Data</span><span>Status</span>
            </div>

            <div className="divide-y divide-white/6">
              {realCandidates.slice(0, 12).map((candidate, index) => {
                const playerName = String(candidate.playerName || 'MLB Hitter');
                const team = String(candidate.team ?? 'MLB');
                const opponent = String(candidate.opponent || 'OPP');
                const edge =
                  typeof candidate.score === 'number'
                    ? Math.round(candidate.score)
                    : typeof candidate.dataConfidence === 'number'
                      ? Math.round(candidate.dataConfidence)
                      : null;
                const dataConfidence = typeof candidate.dataConfidence === 'number'
                  ? Math.round(candidate.dataConfidence)
                  : null;
                const lineupStatus = String(candidate.lineupStatus ?? 'projected');
                const id = String(candidate.playerId || `${playerName}-${index}`);

                return (
                  <div key={id} className="grid gap-3 px-4 py-3 transition hover:bg-white/[0.025] md:grid-cols-[44px_minmax(180px,1.5fr)_minmax(130px,1fr)_90px_90px_90px] md:items-center">
                    <div className="font-mono text-[11px] font-black text-white/30">#{index + 1}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{playerName}</div>
                      <div className="mt-0.5 text-[11px] text-white/35">{team}</div>
                    </div>
                    <div className="text-xs font-bold text-white/60">{team} <span className="text-white/25">vs</span> {opponent}</div>
                    <div>
                      <div className="text-sm font-black text-vouch-emerald">{edge == null ? '—' : `${edge}%`}</div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-vouch-emerald" style={{ width: `${Math.max(5, Math.min(100, edge ?? 0))}%` }} />
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-vouch-cyan">{dataConfidence == null ? '—' : `${dataConfidence}%`}</div>
                    <div><span className={`${Z8_LABEL} rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-white/50`}>{lineupStatus}</span></div>
                  </div>
                );
              })}

              {!candidatesLoading && realCandidates.length === 0 && (
                <div className="px-4 py-10 text-center text-xs text-white/35">No verified HR projection candidates are available for this slate yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="brain-panel rounded-2xl border border-vouch-cyan/15 bg-vouch-cyan/[0.03] p-4">
            <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}><Gauge className="h-3.5 w-3.5" /> Player projections</div>
            <h3 className="mt-2 text-sm font-black text-white">Signal-first player view</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">Rank hitters by HR edge, source confidence, lineup status, and matchup context.</p>
          </div>
          <div className="brain-panel rounded-2xl border border-vouch-amber/15 bg-vouch-amber/[0.03] p-4">
            <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-amber`}><Radar className="h-3.5 w-3.5" /> Game projections</div>
            <h3 className="mt-2 text-sm font-black text-white">Every matchup in one slate</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">See where home-run pressure concentrates across games before opening deeper player research.</p>
          </div>
          <div className="brain-panel rounded-2xl border border-vouch-emerald/15 bg-vouch-emerald/[0.03] p-4">
            <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-emerald`}><Layers3 className="h-3.5 w-3.5" /> Graph intelligence</div>
            <h3 className="mt-2 text-sm font-black text-white">Pro Graphs absorbed here</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">Signal graphs, player comparisons, matchup pressure, and pitcher vulnerability now belong to this workspace.</p>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="brain-panel min-w-0 rounded-2xl border border-white/8 bg-black/20 p-3 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
                  <Sparkles className="h-3.5 w-3.5" /> AI Edge workspace
                </div>
                <h2 className="mt-1 text-lg font-black tracking-tight text-white">Research, project, and build</h2>
                <p className="mt-1 text-xs text-white/40">Use the verified slate to inspect projected HR outcomes, compare signal strength, and generate locked Vouch AI builds.</p>
              </div>
              {usingProjectedPreview && (
                <span className={`${Z8_LABEL} rounded-full border border-vouch-amber/25 bg-vouch-amber/8 px-3 py-1 text-vouch-amber`}>
                  Projected preview · lineups pending
                </span>
              )}
            </div>

            <SmartAiDynamicCreator
              builderLegs={builderLegs}
              builderCategory={builderCategory}
              builderThreshold={builderThreshold}
              dynamicParlay={dynamicParlay}
              candidatesLoading={candidatesLoading}
              usingProjectedPreview={usingProjectedPreview}
              onBuilderLegsChange={setBuilderLegs}
              onBuilderCategoryChange={setBuilderCategory}
              onBuilderThresholdChange={setBuilderThreshold}
              onSaveGradableParlay={handleSaveGradableParlay}
              onAddCustomParlayToSlip={handleAddCustomParlayToSlip}
              saveDisabled={!onSaveParlay}
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-3">
            <div className="brain-panel rounded-2xl border border-vouch-cyan/15 bg-vouch-cyan/[0.035] p-4">
              <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
                <Cpu className="h-3.5 w-3.5" /> Decision protocol
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ['01', 'Scan', 'Read today’s verified candidate pool.'],
                  ['02', 'Constrain', 'Apply market, threshold, and leg count.'],
                  ['03', 'Assemble', 'Rank compatible legs into one build.'],
                  ['04', 'Lock', 'Save separately for clean grading.'],
                ].map(([step, title, detail]) => (
                  <div key={step} className="flex gap-3">
                    <span className="font-mono text-[10px] font-black text-vouch-cyan/55">{step}</span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-white">{title}</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="brain-panel rounded-2xl border border-vouch-amber/15 bg-vouch-amber/[0.035] p-4">
              <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-amber`}>
                <Shield className="h-3.5 w-3.5" /> Truth guardrails
              </div>
              <div className="mt-3 space-y-3 text-[11px] leading-relaxed text-white/45">
                <p>Confidence is a model estimate, not a guarantee or sportsbook line.</p>
                <p>Missing prices remain <strong className="text-white/70">Odds TBD</strong>; the system never invents them.</p>
                <p>AI-made parlays remain isolated from manual slips and preserve their original record.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSectionChange('results')}
              className="brain-tab z8-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-mono text-[11px] font-bold uppercase transition"
            >
              <Layers3 className="h-4 w-4" /> Open AI results ledger
            </button>
          </aside>
        </section>

        <footer className="brain-panel rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
          <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-vouch-emerald" /> Research tool — not betting advice.
            </span>
            <span>Live MLB boxscores grade eligible legs after games become final.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
