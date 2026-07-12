import { useEffect, useMemo, useState } from 'react';
import { Cpu, Database, Gauge, Shield } from 'lucide-react';
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
  Z8_DISPLAY,
  Z8_EMERALD,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
  Z8_WARNING,
} from '../../../theme/z8Tokens';

interface AiPilotPageProps {
  onSectionChange: (section: string) => void;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => void;
}

export default function AiPilotPage({ onSectionChange, onSaveParlay }: AiPilotPageProps) {
  const [builderLegs, setBuilderLegs] = useState(3);
  const [builderCategory, setBuilderCategory] = useState<SmartAiBuilderCategory>('HITS');
  const [builderThreshold, setBuilderThreshold] = useState(2);

  const { realCandidates, candidatesLoading, usingProjectedPreview } = useSmartAiCandidates();

  useEffect(() => {
    if (builderCategory === 'HITS' || builderCategory === 'RBIS' || builderCategory === 'RUNS') {
      setBuilderThreshold(2);
    } else if (builderCategory === 'SB') {
      setBuilderThreshold(1);
    } else if (builderCategory === 'HR') {
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
    const confirmed = realCandidates.filter((c) => String(c.lineupStatus ?? '').toLowerCase() === 'confirmed').length;
    const games = new Set(realCandidates.map((c) => c.gamePk)).size;
    const confidences = realCandidates
      .map((c) => c.dataConfidence)
      .filter((v): v is number => typeof v === 'number');
    const avgConfidence = confidences.length
      ? Math.round(confidences.reduce((sum, v) => sum + v, 0) / confidences.length)
      : null;
    return { total: realCandidates.length, confirmed, games, avgConfidence };
  }, [realCandidates]);

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
      riskTier: dynamicParlay.riskTier === 'LOW' ? 'LOW' : dynamicParlay.riskTier === 'HIGH' ? 'HIGH' : 'MEDIUM',
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
    const gradable = legs.filter((l) => l.gamePk).length;
    alert(
      `✅ Saved locked AI Made Parlay: "${parlay.title}"\n${gradable}/${legs.length} legs are tied to live MLB games and will auto-grade in Results after the games go final.`,
    );
    onSectionChange('results');
  };

  return (
    <main
      className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP} mx-auto max-w-6xl animate-fade-in`}
      id="ai-pilot-page"
    >
      <header className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-[2rem] p-6 sm:p-8`} id="ai-pilot-hero">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-vouch-cyan/10 blur-3xl" />
        <div className={`${Z8_SECTION_HEADER} relative space-y-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${Z8_LABEL} rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 px-3 py-0.5 ${Z8_EMERALD}`}>
              Stats-verified inputs
            </span>
            <span className={`${Z8_LABEL} rounded-full border border-white/10 bg-black/35 px-2.5 py-0.5 text-white/45`}>
              {candidatesLoading ? 'Loading board…' : `${boardStats.total} candidates`}
            </span>
            {usingProjectedPreview && (
              <span className={`${Z8_LABEL} rounded-full border border-vouch-amber/30 bg-vouch-amber/10 px-2.5 py-0.5 ${Z8_WARNING}`}>
                Preview roster — lineup not posted
              </span>
            )}
          </div>

          <h1 className={`${Z8_DISPLAY} flex flex-wrap items-center gap-3`}>
            <Cpu className="h-8 w-8 text-vouch-cyan" />
            V.A.I <span className="text-vouch-cyan">Dynamic Creator</span>
          </h1>

          <p className="max-w-3xl text-sm leading-relaxed text-white/45">
            Build locked AI Made Parlays from verified player trend profiles. Model confidence and combined odds are
            estimates — sportsbook prices may differ. Missing market prices show as Odds TBD, never invented.
          </p>

          <div className="z8-accent-line w-full max-w-md" />
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={Z8_STAT_CHIP}>
            <span className={`${Z8_LABEL} text-white/40`}>Games</span>
            <span className="mt-1 block text-xl font-black text-white">{candidatesLoading ? '—' : boardStats.games}</span>
          </div>
          <div className={Z8_STAT_CHIP}>
            <span className={`${Z8_LABEL} text-white/40`}>Confirmed</span>
            <span className="mt-1 block text-xl font-black text-white">{candidatesLoading ? '—' : boardStats.confirmed}</span>
          </div>
          <div className={Z8_STAT_CHIP}>
            <span className={`${Z8_LABEL} text-white/40`}>Pool</span>
            <span className="mt-1 block text-xl font-black text-white">{candidatesLoading ? '—' : boardStats.total}</span>
          </div>
          <div className={Z8_STAT_CHIP}>
            <span className={`${Z8_LABEL} text-white/40`}>Avg data</span>
            <span className="mt-1 block text-xl font-black text-white">
              {candidatesLoading || boardStats.avgConfidence == null ? '—' : `${boardStats.avgConfidence}%`}
            </span>
          </div>
        </div>
      </header>

      <section className={`${Z8_PANEL_PREMIUM} rounded-2xl border border-vouch-amber/20 bg-vouch-amber/5 p-4`}>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-vouch-amber" />
          <div className="space-y-1 text-xs leading-relaxed text-white/55">
            <p className={`${Z8_LABEL} ${Z8_WARNING}`}>Research tool — not betting advice</p>
            <p>
              Legs grade from live MLB boxscores when game IDs are present. AI confidence is a model estimate, not a
              guarantee or sportsbook line.
            </p>
          </div>
        </div>
      </section>

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

      <footer className="grid gap-3 sm:grid-cols-3">
        <div className={Z8_STAT_CHIP}>
          <Database className={`mb-2 h-5 w-5 text-vouch-cyan`} />
          <h3 className="text-sm font-black text-white">Verified inputs</h3>
          <p className="mt-1 text-xs text-white/45">Candidates from today&apos;s HR board pipeline only.</p>
        </div>
        <div className={Z8_STAT_CHIP}>
          <Gauge className="mb-2 h-5 w-5 text-vouch-cyan/80" />
          <h3 className="text-sm font-black text-white">Honest pricing</h3>
          <p className="mt-1 text-xs text-white/45">Missing odds stay TBD — never backfilled with fake lines.</p>
        </div>
        <div className={Z8_STAT_CHIP}>
          <Shield className="mb-2 h-5 w-5 text-vouch-emerald" />
          <h3 className="text-sm font-black text-white">Locked separation</h3>
          <p className="mt-1 text-xs text-white/45">AI Made Parlays stay separate from manual ParlayOS slips.</p>
        </div>
      </footer>
    </main>
  );
}
