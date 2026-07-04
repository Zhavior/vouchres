import { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Database,
  CheckCircle2,
  Activity,
  Award,
  Gauge,
  Lock,
  Unlock,
  Crown,
  Bookmark,
} from 'lucide-react';
import { VAI_PERSONAS, type VaiPersonaId } from '../lib/vai/vaiPersonas';
import { getDailyVaiPersona, getVaiEntitlements } from '../lib/vai/vaiEntitlements';

import { MLBPlayer, Leg, FeedPost, Parlay } from '../types';
import { normalizeParlaySlip } from '../lib/parlays/parlayBridge';
import type { CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
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
  onSaveVouch: (vouchItem: unknown) => void;
  onPostCreated?: (newPost: FeedPost) => void;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => void;
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
  const [aiAgreementAccepted, setAiAgreementAccepted] = useState(false);

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
        const confirmed: Record<string, unknown>[] = Array.isArray(r.data?.candidates) ? r.data.candidates : [];
        const projected: Record<string, unknown>[] = Array.isArray(r.data?.projectedCandidates) ? r.data.projectedCandidates : [];
        const rows: Record<string, unknown>[] = Array.isArray(r.data?.rows) ? r.data.rows : [];
        const raw: Record<string, unknown>[] = confirmed.length ? confirmed : projected.length ? projected : rows;
        const mapped: RealCandidate[] = raw
          .filter((c) => c && (c.gamePk ?? c.gameId) != null)
          .map((c: SmartAiRawCandidate) => ({
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
            batSide: c.batSide === 'L' || c.batSide === 'R' || c.batSide === 'S' ? c.batSide : null,
            injuryStatus: typeof c.injuryStatus === 'string' ? c.injuryStatus : null,
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
  

    return () => {
      alive = false;
    };
  }, []);

  // V.A.I Rooms shell: frontend/dev adapter for now.
  // Final paid access enforcement should move to the server route.
  const vaiTodayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [vaiAccessTier, setVaiAccessTier] = useState<string>(() => {
    if (typeof window === 'undefined') return 'pro';
    return window.localStorage.getItem('vouchedge_vai_tier') ?? 'pro';
  });

  const handleVaiAccessTierChange = (tier: string) => {
    setVaiAccessTier(tier);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('vouchedge_vai_tier', tier);
    }
  };

  const vaiEntitlements = useMemo(
    () => getVaiEntitlements({ tier: vaiAccessTier, dateKey: vaiTodayKey }),
    [vaiAccessTier, vaiTodayKey]
  );

  const [selectedVaiPersonaId, setSelectedVaiPersonaId] = useState<VaiPersonaId>(() =>
    getDailyVaiPersona(vaiTodayKey)
  );

  useEffect(() => {
    if (
      vaiEntitlements.allowedPersonaIds.length > 0 &&
      !vaiEntitlements.allowedPersonaIds.includes(selectedVaiPersonaId)
    ) {
      setSelectedVaiPersonaId(vaiEntitlements.allowedPersonaIds[0]);
    }
  }, [selectedVaiPersonaId, vaiEntitlements.allowedPersonaIds]);

  const selectedVaiPersona =
    VAI_PERSONAS.find((persona) => persona.id === selectedVaiPersonaId) ?? VAI_PERSONAS[0];

  const isSelectedVaiRoomUnlocked = vaiEntitlements.allowedPersonaIds.includes(selectedVaiPersona.id);

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
    alert('V.A.I parlays are locked and cannot be transferred into the manual builder. Save this as an AI Made Parlay so results stay separate and trustworthy.');
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
    alert(`✅ Saved locked AI Made Parlay: "${parlay.title}"\n${gradable}/${legs.length} legs are tied to live MLB games and will auto-grade in Results after the games go final.`);
    onSectionChange('results');
  };

  // Deep Research → Build Slip. Model probability is NOT a market price, so the
  // transferred leg carries odds: null ("Odds TBD") — grading is boxscore-based.
  const handleAddCandidateToSlip = (_candidate: RealCandidate) => {
    alert('Verified candidates are research inputs only. To protect AI Made Parlay records, save a full locked V.A.I parlay instead of adding single AI legs to the manual builder.');
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

  if (!aiAgreementAccepted) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 text-slate-200 selection:bg-sky-500/20 font-sans max-w-none mx-auto animate-fade-in" id="smart-ai-agreement-gate">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-400/20 bg-slate-950/90 p-6 sm:p-8 shadow-2xl shadow-sky-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_35%)]" />
          <div className="relative space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-sky-300/25 bg-sky-400/10 p-3">
                <Award className="h-6 w-6 text-sky-300" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">
                  V.A.I Locked AI Made Parlays
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
                  Research tool only — not betting advice.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
                  V.A.I generates locked AI Made Parlays from available research signals. These picks can be wrong, player
                  status can change, odds are not guaranteed, and sportsbook markets may differ. Use this as research support,
                  verify every leg yourself, and never risk money you cannot afford to lose.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                <h3 className="text-sm font-black text-white">Locked separation</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  AI Made Parlays stay separate from manual Build Parlay slips.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <Database className="mb-3 h-5 w-5 text-sky-300" />
                <h3 className="text-sm font-black text-white">Research inputs</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Candidate boards are informational and must be verified before use.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <Gauge className="mb-3 h-5 w-5 text-indigo-300" />
                <h3 className="text-sm font-black text-white">No guarantees</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Model confidence is not a promise, price, sportsbook line, or financial recommendation.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-100/90">
              By unlocking V.A.I, you understand that this feature is for sports research and entertainment only. You are
              responsible for your own choices and local rules.
            </div>

            <button
              type="button"
              onClick={() => setAiAgreementAccepted(true)}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-sky-950/30 transition hover:from-sky-400 hover:to-emerald-400 active:scale-[0.99]"
            >
              I Understand — Unlock V.A.I
            </button>
          </div>
        </div>
      </div>
    );
  }

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


      {/* V.A.I ROOMS — one-page locked/unlocked room selector */}
      <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 shadow-2xl shadow-black/30" id="vai-rooms-command-deck">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
              <Crown className="h-3.5 w-3.5" />
              V.A.I Rooms
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">
              Choose today&apos;s AI research room
            </h2>
            <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-400">
              All four rooms are visible. Pro unlocks one room per day. Research Seller Pro unlocks the full AI desk.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
            <span className="font-mono uppercase tracking-wider text-slate-500">Access</span>
            <div className="font-bold text-white">{vaiEntitlements.reason}</div>

            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="V.A.I access preview">
              {[
                ['free', 'Free'],
                ['pro', 'Pro'],
                ['research_seller_pro', 'Seller Pro'],
                ['admin', 'Admin'],
              ].map(([tier, label]) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleVaiAccessTierChange(tier)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                    vaiAccessTier === tier
                      ? 'border-sky-300/60 bg-sky-400/15 text-sky-100'
                      : 'border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {VAI_PERSONAS.map((persona) => {
            const unlocked = vaiEntitlements.allowedPersonaIds.includes(persona.id);
            const selected = selectedVaiPersonaId === persona.id;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedVaiPersonaId(persona.id)}
                className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${persona.gradient} ${persona.border} p-4 text-left transition-all duration-200 ${
                  selected ? `ring-2 ring-white/25 shadow-2xl ${persona.glow}` : 'hover:border-slate-500/50'
                }`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {persona.accent}
                      </div>
                      <h3 className="mt-1 text-lg font-black text-white">{persona.name}</h3>
                    </div>

                    <div className={`rounded-2xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      unlocked
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-700 bg-slate-950/70 text-slate-400'
                    }`}>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1"><Unlock className="h-3 w-3" /> Open</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                      )}
                    </div>
                  </div>

                  <p className="min-h-[44px] text-xs leading-relaxed text-slate-300">
                    {persona.specialtyLine}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {persona.specialties.slice(0, 4).map((specialty) => (
                      <span
                        key={`${persona.id}-${specialty}`}
                        className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-[10px] font-bold text-slate-300"
                      >
                        {specialty.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-200">{persona.roomName}</span>
                    <span className="mx-1">·</span>
                    <span>{unlocked ? 'Tap to enter today.' : persona.lockedLine}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-[2rem] border ${selectedVaiPersona.border} bg-slate-950/70 p-4 sm:p-5 shadow-2xl ${selectedVaiPersona.glow}`} id="vai-selected-room-panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Selected room
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">{selectedVaiPersona.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{selectedVaiPersona.toneLine}</p>
          </div>

          <div className={`w-fit rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${
            isSelectedVaiRoomUnlocked
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-700 bg-slate-900/80 text-slate-400'
          }`}>
            {isSelectedVaiRoomUnlocked ? 'Room open today' : 'Upgrade to unlock'}
          </div>
        </div>

        {isSelectedVaiRoomUnlocked ? (
          <>

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

          </>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 text-center" id="vai-locked-room-upgrade-panel">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
              <Lock className="h-7 w-7 text-slate-300" />
            </div>
            <div className="mx-auto max-w-xl space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                {selectedVaiPersona.roomName} sealed
              </div>
              <h3 className="text-2xl font-black text-white">{selectedVaiPersona.lockedLine}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                You can see the room identity, specialty, and risk style, but the actual slips, player names,
                and research receipts stay hidden until this room is unlocked.
              </p>
            </div>
            <button
              type="button"
              className="mt-5 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-sky-200 hover:bg-sky-500/20"
              onClick={() => onSectionChange('pricing')}
            >
              Upgrade to enter room
            </button>
          </div>
        )}
      </div>

      {/* DISCLOSURE CARD SECTION */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 flex items-start gap-3" id="scouting-policy-foot-note">
        <Award className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs text-slate-400">
          <h4 className="font-bold text-slate-200">Research Data Policy</h4>
          <p className="leading-relaxed">
            Candidates come from the validated HR board pipeline: real MLB season stats, probable pitchers with confirmed
            throwing hand where posted, and sourced park factors. First-pitch weather is a real Open-Meteo forecast with roofed
            venues flagged; batter-vs-pitcher history is real MLB career data; season Statcast quality (xwOBA, barrel rate,
            hard-hit rate) comes from Baseball Savant leaderboards. Sportsbook odds are not connected and are never
            estimated. Model HR probabilities are research estimates — not betting advice and not market prices. Verify player
            detail in the <b>Player Research Console</b> before trusting any single signal.
          </p>
        </div>
      </div>

    </div>
  );
}
