import { useState, useEffect, useMemo } from 'react';
import { Cpu, Database, CheckCircle2, Activity, Award, Gauge } from 'lucide-react';
import { MLBPlayer, Leg, FeedPost, Parlay } from '../types';
import { safeJsonFetch } from '../api/safeApiClient';
import { resolveMarket } from '../sports/markets';
import {
  americanToDecimalOdds,
  buildSmartAiDynamicParlay,
  type RealCandidate,
  type SmartAiBuilderCategory,
} from './smart-ai/smartAiEngine.logic';
import { SmartAiDynamicCreator } from './smart-ai/SmartAiDynamicCreator';
import { SmartAiDeepResearchPanel } from './smart-ai/SmartAiDeepResearchPanel';

/**
 * V.A.I Research Command Center.
 *
 * Truth rules:
 *   - Every candidate comes from the validated HR board pipeline (real MLB
 *     season stats, probable pitchers, sourced park factors). Nothing is
 *     generated client-side to fill gaps.
 *   - Missing data renders as an explicit warning, never a fabricated value.
 *   - Model probability estimates are labeled as estimates — they are not
 *     sportsbook odds and are never saved as market prices.
 */

interface SmartAiEngineProps {
  onSectionChange: (section: string) => void;
  onAddLegToParlay: (
    player: MLBPlayer,
    prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }
  ) => void;
  onSaveVouch: (vouchItem: any) => void;
  onPostCreated?: (newPost: FeedPost) => void;
  onSaveParlay?: (parlay: Parlay) => void;
  liveGames?: any[];
}

/** Minimal MLBPlayer shim for leg transfer. The transfer path only reads
 *  id/name/team; the remaining fields are type-required placeholders and must
 *  NOT be rendered as verified data (bats/throws cannot express "unknown" yet). */
function buildTransferPlayerShim(id: string, name: string, team: string, note: string): MLBPlayer {
  return {
    id,
    name,
    team,
    position: 'Batter',
    number: '',
    headshot: '',
    injuryStatus: 'Unknown',
    injurySeverity: 'NONE',
    injuryNotes: 'Injury status is not verified in this transfer context.',
    batterScore: 0,
    seasonStats: { avg: '', hr: '', rbi: '', ops: '', obp: '', slg: '' },
    gameLogs: [],
    propositions: [],
    bats: 'R',
    throws: 'R',
    height: '',
    weight: '',
    birthdate: '',
    advanced: {} as MLBPlayer['advanced'],
    splits: {
      vLHP: { avg: '', obp: '', slg: '', ops: '' },
      vRHP: { avg: '', obp: '', slg: '', ops: '' },
      home: { avg: '', obp: '', slg: '', ops: '' },
      away: { avg: '', obp: '', slg: '', ops: '' },
      last10: { avg: '', obp: '', slg: '', ops: '' },
    },
    scoutingReport: {
      powerText: note,
      contactText: 'Transfer display profile only.',
      disciplineText: 'No expanded discipline profile available in this context.',
      overallScouting: note,
      hotZones: [],
      riskFactor: 'MEDIUM',
    },
  };
}

export default function SmartAiEngine({
  onSectionChange,
  onAddLegToParlay,
  onSaveParlay,
}: SmartAiEngineProps) {
  // Dynamic parlay parameters (2, 3, 4, 5 Legs, based on AI confidence & physical evidence)
  const [builderLegs, setBuilderLegs] = useState<number>(3);
  const [builderCategory, setBuilderCategory] = useState<SmartAiBuilderCategory>('HITS');
  const [builderThreshold, setBuilderThreshold] = useState<number>(2);

  // Auto adjusting threshold bounds so that focus options make complete tactical sense
  useEffect(() => {
    if (builderCategory === 'HITS') {
      setBuilderThreshold(2);
    } else if (builderCategory === 'RBIS') {
      setBuilderThreshold(2);
    } else if (builderCategory === 'RUNS') {
      setBuilderThreshold(2);
    } else if (builderCategory === 'SB') {
      setBuilderThreshold(1);
    } else if (builderCategory === 'HR') {
      setBuilderThreshold(1);
    }
  }, [builderCategory]);

  // ── Real candidates from the live HR Board (carry gamePk → gradable) ──
  const [realCandidates, setRealCandidates] = useState<RealCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setCandidatesLoading(true);
    safeJsonFetch<any>('/api/mlb/hr-board/today?limit=75', { fallbackData: { candidates: [] }, timeoutMs: 14000 })
      .then((r) => {
        if (!alive) return;
        // Use confirmed candidates when available, else fall back to projected
        // candidates (pre-lineup), so the vault always has real players to build
        // from instead of showing "no eligible players".
        const confirmed: any[] = Array.isArray(r.data?.candidates) ? r.data.candidates : [];
        const projected: any[] = Array.isArray(r.data?.projectedCandidates) ? r.data.projectedCandidates : [];
        const rows: any[] = Array.isArray(r.data?.rows) ? r.data.rows : [];
        const raw: any[] = confirmed.length ? confirmed : projected.length ? projected : rows;
        const mapped: RealCandidate[] = raw
          .filter((c) => c && (c.gamePk ?? c.gameId) != null)
          .map((c) => ({
            playerId: String(c.playerId ?? c.player_id ?? c.id ?? c.playerName),
            playerName: c.playerName ?? c.player_name ?? c.name ?? 'Unknown',
            gamePk: String(c.gamePk ?? c.gameId),
            team: c.team ?? c.teamAbbrev ?? 'MLB',
            opponent: c.opponent ?? c.opponentTeam ?? c.opponentPitcherName ?? 'opponent',
            oddsDecimal: americanToDecimalOdds(c.impliedOdds ?? c.odds), // null when the board has no real price — never fabricated
            score: Number(c.hrScore ?? c.score ?? c.edge ?? 0),
            opponentPitcherName: c.opponentPitcherName ?? c.opposingPitcher ?? c.probablePitcher?.name ?? null,
            opponentPitcherId: typeof c.opponentPitcherId === 'number' && c.opponentPitcherId > 0 ? c.opponentPitcherId : null,
            pitcherHand: c.opponentPitcherHand ?? c.pitcherHand ?? c.opposingPitcherHand ?? c.probablePitcher?.throws ?? null,
            pitcherVulnerability:
              typeof c.pitcherVulnerability === 'number'
                ? c.pitcherVulnerability
                : typeof c.probablePitcher?.vulnerability === 'number'
                  ? c.probablePitcher.vulnerability
                  : null,
            parkFactor: typeof c.parkFactor === 'number' ? c.parkFactor : null,
            venue: c.venue ?? c.ballpark ?? null,
            lineupStatus: c.lineupStatus ?? c.lineup_status ?? null,
            confidenceTier: c.confidenceTier ?? null,
            riskLabel: typeof c.riskTier === 'string' ? c.riskTier : null,
            estimatedHrProbability: typeof c.estimatedHrProbability === 'number' ? c.estimatedHrProbability : null,
            dataConfidence: typeof c.dataConfidence === 'number' ? c.dataConfidence : null,
            battingOrder: typeof c.battingOrder === 'number' ? c.battingOrder : null,
            dataQuality: typeof c.dataQuality === 'string' ? c.dataQuality : null,
            reasons: Array.isArray(c.reasons) ? c.reasons.map(String) : [],
            boardWarnings: Array.isArray(c.warnings) ? c.warnings.map(String) : [],
            scoreBreakdown: c.scoreBreakdown && typeof c.scoreBreakdown === 'object' ? c.scoreBreakdown : null,
          }));
        setRealCandidates(mapped);
        setCandidatesLoading(false);
      });
    return () => { alive = false; };
  }, []);

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

  // Real header stats — computed from today's actual board, never hardcoded.
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

  const toDynamicParlayMLBPlayer = (leg: NonNullable<typeof dynamicParlay>['legs'][number]): MLBPlayer => {
    const source = realCandidates.find((candidate) => candidate.playerId === leg.playerId);
    const shim = buildTransferPlayerShim(
      leg.playerId,
      leg.playerName,
      leg.team,
      source
        ? `${source.playerName} is included from today's verified Smart AI candidate pool.`
        : `${leg.playerName} is included from the current dynamic parlay.`,
    );
    shim.batterScore = source?.score ?? 0;
    return shim;
  };

  const handleAddCustomParlayToSlip = () => {
    if (!dynamicParlay) return;
    let addedCount = 0;
    dynamicParlay.legs.forEach((leg) => {
      const player = toDynamicParlayMLBPlayer(leg);
      onAddLegToParlay(player, {
        id: `prop-ai-custom-${leg.playerId}-${Date.now()}`,
        market: leg.marketName,
        odds: leg.odds,
        spec: leg.customSpec,
        gamePk: leg.gamePk, // real game → gradable
        playerId: leg.playerId,
      });
      addedCount++;
    });
    alert(`🎯 Transferred ${addedCount} verified legs into your active parlay builder slip!`);
    onSectionChange('build');
  };

  // Save the current AI parlay directly as a gradable Parlay → Results grades it
  // from the MLB boxscore. Each leg carries gamePk + marketCode + threshold.
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
      oddsValue: dynamicParlay.oddsValue ?? 0, // Parlay contract: 0 = odds unknown ("Odds TBD")
      riskTier: (dynamicParlay.riskTier === 'LOW' ? 'LOW' : dynamicParlay.riskTier === 'HIGH' ? 'HIGH' : 'MEDIUM'),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      wagerAmount: 1,
      edgeScore: dynamicParlay.aiConfidenceScore,
      aiGenerated: true,
    };
    onSaveParlay(parlay);
    const gradable = legs.filter((l) => l.gamePk).length;
    alert(`✅ Saved "${parlay.title}" to your slips.\n${gradable}/${legs.length} legs are tied to live MLB games and will auto-grade in Results after the games go final.`);
    onSectionChange('results');
  };

  // Deep Research → Build Slip. Model probability is NOT a market price, so the
  // transferred leg carries odds: null ("Odds TBD") — grading is boxscore-based.
  const handleAddCandidateToSlip = (candidate: RealCandidate) => {
    const player = buildTransferPlayerShim(
      candidate.playerId,
      candidate.playerName,
      candidate.team,
      `${candidate.playerName} is included from today's verified Smart AI candidate pool.`,
    );
    player.batterScore = candidate.score ?? 0;

    onAddLegToParlay(player, {
      id: `prop-ai-research-${candidate.playerId}-${Date.now()}`,
      market: 'To Hit 1+ Home Run',
      odds: null,
      spec: `${candidate.playerName} Over 0.5 HRs`,
      gamePk: candidate.gamePk,
      playerId: candidate.playerId,
    });
  };

  // Safe redirect to Player Research Console with the real MLB player id.
  const handleOpenResearch = (candidate: RealCandidate) => {
    try {
      localStorage.setItem('vouchedge_selected_research_player_id', String(candidate.playerId));
    } catch {
      // ignore storage failures
    }
    onSectionChange('research');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 text-slate-200 selection:bg-sky-500/20 font-sans max-w-none mx-auto animate-fade-in" id="smart-ai-ledger-root">

      {/* HEADER HERO AREA */}
      <div className="ve-hero p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="ai-banner-container">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-0.5 rounded-full text-[10px] font-black font-mono tracking-widest uppercase">
              Verified MLB data only
            </span>
            <span className="bg-[#1e293b] text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
              {candidatesLoading ? 'Loading board...' : `${boardStats.total} candidates today`}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display select-text tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-sky-400 animate-pulse" />
            V.A.I <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Research Command Center</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl">
            Build gradable parlays and research today&apos;s validated hitter board side by side. Every signal comes from real
            MLB season stats, probable pitchers, and sourced park factors — missing data is flagged, never invented.
          </p>
        </div>
      </div>

      {/* METRIC CARD BAR — real board stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="metric-analytics-bar">
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Validated Candidates</span>
            <span className="text-lg font-mono font-black text-white mt-1 block">
              {candidatesLoading ? '—' : boardStats.total}
            </span>
          </div>
          <Database className="w-5 h-5 text-sky-400" />
        </div>
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Confirmed Lineups</span>
            <span className="text-lg font-mono font-black text-emerald-400 mt-1 block">
              {candidatesLoading ? '—' : boardStats.confirmed}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Games Covered</span>
            <span className="text-lg font-mono font-black text-amber-400 mt-1 block">
              {candidatesLoading ? '—' : boardStats.games}
            </span>
          </div>
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Avg Data Confidence</span>
            <span className="text-lg font-mono font-black text-indigo-400 mt-1 block">
              {candidatesLoading || boardStats.avgConfidence === null ? '—' : `${boardStats.avgConfidence}%`}
            </span>
          </div>
          <Gauge className="w-5 h-5 text-indigo-400" />
        </div>
      </div>

      {/* DUAL WORKSPACE LAYOUT: builder left, research board right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="ai-workspace-container">
        <div className="xl:col-span-5 space-y-6" id="ai-dynamic-creator-column">
          <SmartAiDynamicCreator
            builderLegs={builderLegs}
            builderCategory={builderCategory}
            builderThreshold={builderThreshold}
            dynamicParlay={dynamicParlay}
            onBuilderLegsChange={setBuilderLegs}
            onBuilderCategoryChange={setBuilderCategory}
            onBuilderThresholdChange={setBuilderThreshold}
            onSaveGradableParlay={handleSaveGradableParlay}
            onAddCustomParlayToSlip={handleAddCustomParlayToSlip}
          />
        </div>

        <div className="xl:col-span-7 space-y-6" id="ai-deep-research-column">
          <SmartAiDeepResearchPanel
            candidates={realCandidates}
            loading={candidatesLoading}
            onAddToSlip={handleAddCandidateToSlip}
            onOpenResearch={handleOpenResearch}
          />
        </div>
      </div>

      {/* DISCLOSURE CARD SECTION */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 flex items-start gap-3" id="scouting-policy-foot-note">
        <Award className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs text-slate-400">
          <h4 className="font-bold text-slate-200">Research Data Policy</h4>
          <p className="leading-relaxed">
            Candidates come from the validated HR board pipeline: real MLB season stats, probable pitchers with confirmed
            throwing hand where posted, and sourced park factors. Weather and sportsbook odds feeds are not connected, so those
            values are shown as unavailable rather than estimated. Model HR probabilities are research estimates — not betting
            advice and not market prices. Verify player detail in the <b>Player Research Console</b> before trusting any single signal.
          </p>
        </div>
      </div>

    </div>
  );
}
