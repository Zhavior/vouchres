import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Award,
  Crown,
  Flame,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MLB_PLAYER_RECORDS } from '../data/playerData';
import type { CreatorProofProfile, MLBPlayer, Parlay } from '../types';
import { VEWidget } from './ui/ve';

interface PortfolioAnalyticsPanelProps {
  profile?: CreatorProofProfile;
  savedSlips?: Parlay[];
  isLoggedIn?: boolean;
  onSectionChange?: (section: string) => void;
}

interface CustomPlayerSelection {
  player: MLBPlayer;
  statType: 'Homeruns' | 'Runs' | 'Hits' | 'RBIs' | 'AVG' | 'OPS';
  customVal: string;
  aiConfidence?: number;
  playerConfidence?: number;
  customExplanation?: string;
}

const DEFAULT_PLAYERS: CustomPlayerSelection[] = [
  {
    player: MLB_PLAYER_RECORDS[0],
    statType: 'Homeruns',
    customVal: 'Over 0.5 HRs',
    aiConfidence: 94,
    playerConfidence: 90,
    customExplanation: 'Ohtani enjoys exceptional launch rate with high humidity coefficients tonight.',
  },
  {
    player: MLB_PLAYER_RECORDS[1],
    statType: 'Hits',
    customVal: 'Over 1.5 Hits',
    aiConfidence: 91,
    playerConfidence: 85,
    customExplanation: 'Judge’s high target index velocity coefficients suggest reliable hard-hit contact rates.',
  },
  {
    player: MLB_PLAYER_RECORDS[2],
    statType: 'Runs',
    customVal: 'Over 0.5 Runs',
    aiConfidence: 88,
    playerConfidence: 92,
    customExplanation: 'Betts serves as elite lead-off on base catalyst with high Dodger leverage ratios tonight.',
  },
];

export default function PortfolioAnalyticsPanel({
  profile,
  savedSlips = [],
  isLoggedIn = false,
  onSectionChange,
}: PortfolioAnalyticsPanelProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<CustomPlayerSelection[]>(DEFAULT_PLAYERS);
  const [simulationStakeUnit, setSimulationStakeUnit] = useState<number>(100);
  const [portfolioRiskFilter, setPortfolioRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [historicalTimeframe, setHistoricalTimeframe] = useState<'7d' | '14d' | '30d'>('14d');
  const hasVerifiedRecord = isLoggedIn && (profile?.totalPicks ?? 0) > 0;
  const verifiedWinRate = hasVerifiedRecord ? Math.round(profile!.winRate) : 75;
  const [simulatedWinRate, setSimulatedWinRate] = useState<number>(verifiedWinRate);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const slipStats = useMemo(() => {
    const pending = savedSlips.filter((s) => String(s.status || 'PENDING').toUpperCase() === 'PENDING').length;
    const won = savedSlips.filter((s) => String(s.status).toUpperCase() === 'WON').length;
    const lost = savedSlips.filter((s) => String(s.status).toUpperCase() === 'LOST').length;
    const voided = savedSlips.filter((s) => String(s.status).toUpperCase() === 'VOID').length;
    return { pending, won, lost, voided, total: savedSlips.length };
  }, [savedSlips]);

  useEffect(() => {
    if (hasVerifiedRecord && profile) {
      setSimulatedWinRate(Math.round(profile.winRate));
    }
  }, [hasVerifiedRecord, profile?.winRate, profile?.totalPicks]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleAddPlayerToCircle = (player: MLBPlayer) => {
    if (selectedPlayers.some((p) => p.player.id === player.id)) {
      triggerToast(`⚠️ ${player.name} is already active in your portfolio!`);
      return;
    }
    if (selectedPlayers.length >= 5) {
      triggerToast('⚠️ Maximum 5 players in portfolio simulation.');
      return;
    }

    const defaultProp = player.propositions?.[0];
    const defaultVal = defaultProp ? defaultProp.spec.replace(`${player.name} `, '') : 'Over 0.5 Hits';

    setSelectedPlayers([
      ...selectedPlayers,
      {
        player,
        statType: 'Hits',
        customVal: defaultVal,
        aiConfidence: 85,
        playerConfidence: 80,
        customExplanation: `Analytical matchup projection suggests high probability output for ${player.name.split(' ').pop()}.`,
      },
    ]);
    triggerToast(`Added ${player.name} to portfolio.`);
  };

  const handleRemovePlayerFromCircle = (playerId: string) => {
    if (selectedPlayers.length <= 1) {
      triggerToast('⚠️ You need at least 1 player in the portfolio simulation.');
      return;
    }
    setSelectedPlayers(selectedPlayers.filter((p) => p.player.id !== playerId));
  };

  const getPortfolioChartData = () => {
    const pointsCount = historicalTimeframe === '7d' ? 7 : historicalTimeframe === '14d' ? 14 : 30;
    const data = [];
    let cumulativeReturn = 0;

    const averageConfidence =
      selectedPlayers.length > 0
        ? selectedPlayers.reduce((acc, p) => acc + (p.aiConfidence || 85), 0) / selectedPlayers.length
        : 85;

    const multiplier = (simulatedWinRate / 75) * (simulationStakeUnit / 100);

    for (let i = pointsCount; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const noise = Math.sin(i * 0.8) * 1.5 + Math.cos(i * 0.3) * 0.5;
      const dailyReturn = (averageConfidence / 15 - 4.5 + noise) * multiplier;
      cumulativeReturn += dailyReturn;

      data.push({
        date: dateStr,
        units: parseFloat(cumulativeReturn.toFixed(1)),
        cashValue: Math.round(cumulativeReturn * 100 * (simulationStakeUnit / 100)),
        aiProjected: Math.round((cumulativeReturn * 1.08 + Math.sin(i * 0.5)) * 100 * (simulationStakeUnit / 100)),
      });
    }
    return data;
  };

  const handleStartAuditSimulation = () => {
    setIsAuditing(true);
    setAuditLog([]);

    const logs = [
      `[${new Date().toLocaleTimeString()}] 🚀 INITIALIZING VOUCH EDGE AUDIT MATRIX V3.2...`,
      `[${new Date().toLocaleTimeString()}] 📡 Syncing with Sabermetrics Data Engine...`,
      `[${new Date().toLocaleTimeString()}] 📥 Fetching historic splits for active roster (${selectedPlayers.map((p) => p.player.name.split(' ').pop()).join(', ')})...`,
      `[${new Date().toLocaleTimeString()}] 📈 Adjusting stake allocation coefficient at $${simulationStakeUnit} per unit...`,
      `[${new Date().toLocaleTimeString()}] ⚡ Testing risk factor category: "${portfolioRiskFilter.toUpperCase()}"`,
      `[${new Date().toLocaleTimeString()}] 📊 Simulation only — not verified performance.`,
      `[${new Date().toLocaleTimeString()}] ⚠️ Simulation only — not verified performance. No guaranteed outcomes.`,
      `[${new Date().toLocaleTimeString()}] 📋 Demo preview — no real profit/units tracked yet.`,
    ];

    logs.forEach((logLine, idx) => {
      window.setTimeout(() => {
        setAuditLog((prev) => [...prev, logLine]);
        if (idx === logs.length - 1) {
          setIsAuditing(false);
          triggerToast('🏆 Capper Ledger Audit Complete! Real-time performance watermarked successfully.');
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div className="space-y-4" id="vouch-portfolio-analytics">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-vouch-cyan/30 bg-[hsl(var(--ve-surface)/0.95)] px-4 py-3 text-xs font-mono font-bold text-vouch-cyan shadow-xl">
          {toast}
        </div>
      )}

      {isLoggedIn ? (
        <div className="rounded-2xl border border-vouch-emerald/20 bg-vouch-emerald/5 px-4 py-2.5 flex items-center gap-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-vouch-emerald shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-vouch-emerald">
            {hasVerifiedRecord
              ? 'Account ledger synced — verified stats below. Monte Carlo backtest is simulation only.'
              : 'Signed in — save and grade parlays to build verified stats. Backtest below is simulation only.'}
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300/10 bg-amber-400/5 px-4 py-2.5 flex items-center gap-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-amber-300">
            Sign in to load your verified ledger. Backtest numbers below are simulated, not real results.
          </span>
        </div>
      )}

      {isLoggedIn && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Verified Win Rate</span>
              <div className="text-2xl font-black text-vouch-emerald font-mono tracking-tight">
                {hasVerifiedRecord ? `${profile!.winRate.toFixed(1)}%` : '—'}
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))]">
                {hasVerifiedRecord ? `${profile!.wonPicks}W · ${profile!.totalPicks - profile!.wonPicks}L graded` : 'No graded picks yet'}
              </span>
            </div>
          </div>

          <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Net Units (Tracked)</span>
              <div className={`text-2xl font-black font-mono tracking-tight ${(profile?.unitsNetProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hasVerifiedRecord
                  ? `${profile!.unitsNetProfit >= 0 ? '+' : ''}${profile!.unitsNetProfit.toFixed(1)}u`
                  : '—'}
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))]">
                {hasVerifiedRecord ? `${profile!.totalPicks} picks tracked` : 'Grade slips in Results Ledger'}
              </span>
            </div>
          </div>

          <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-cyan/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Saved Parlays</span>
              <div className="text-2xl font-black text-vouch-cyan font-mono tracking-tight">{slipStats.total}</div>
              <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))]">
                {slipStats.pending} pending · {slipStats.won}W · {slipStats.lost}L
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSectionChange?.('results')}
            className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-amber/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] text-left hover:border-vouch-amber/40 transition-colors"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Results Ledger</span>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight flex items-center gap-1.5">
                <Trophy className="w-5 h-5" />
                Open
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))]">
                Full graded history &amp; proof
              </span>
            </div>
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-amber-300/10 bg-amber-400/5 px-4 py-2.5 flex items-center gap-2.5">
        <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-amber-300">
          Monte Carlo backtest — simulated, not verified performance. Slider values drive the chart below.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-emerald-300/20 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-emerald-300/35 transition-all duration-300 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Simulated Return (Demo)</span>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                +${Math.round(selectedPlayers.length * 4.2 * simulationStakeUnit * (simulatedWinRate / 75)).toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold text-emerald-500/80 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{parseFloat((selectedPlayers.length * 4.2 * (simulatedWinRate / 75)).toFixed(1))} Simulated Units (Demo)
              </span>
            </div>
            <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-900/40">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-amber/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-amber/40 transition-all duration-300 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-vouch-amber/10 rounded-full blur-2xl group-hover:bg-vouch-amber/15 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Assumed Accuracy (Demo)</span>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">{simulatedWinRate}%</div>
              <div className="w-24 bg-[hsl(var(--ve-surface-raised)/0.58)] h-1 rounded-full overflow-hidden mt-1.5">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${simulatedWinRate}%` }} />
              </div>
              <span className="text-[9px] text-[hsl(var(--ve-text-muted))] font-semibold block mt-1">Adjust accuracy with slider below</span>
            </div>
            <div className="p-2 bg-vouch-amber/10 rounded-xl border border-vouch-amber/30">
              <Award className="w-4 h-4 text-vouch-amber" />
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-emerald/40 transition-all duration-300 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Portfolio Roster</span>
              <div className="text-2xl font-black text-vouch-emerald tracking-tight">{selectedPlayers.length} Active Stars</div>
              <span className="text-[10px] font-semibold text-[hsl(var(--ve-text-secondary))] truncate block max-w-[170px] mt-1.5 font-mono">
                {selectedPlayers.map((p) => p.player.name.split(' ').pop()).join(' • ')}
              </span>
            </div>
            <div className="p-2 bg-vouch-emerald/10 rounded-xl border border-vouch-emerald/30">
              <Flame className="w-4 h-4 text-vouch-emerald" />
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--ve-surface)/0.72)] border border-vouch-emerald/25 p-4.5 rounded-2xl relative overflow-hidden shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] group hover:border-vouch-emerald/40 transition-all duration-300 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-vouch-emerald/10 rounded-full blur-2xl group-hover:bg-vouch-emerald/15 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase tracking-wider block font-mono">Efficiency Index (Demo)</span>
              <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">+14.25% ROI</div>
              <span className="text-[10px] text-[hsl(var(--ve-text-muted))] font-semibold flex items-center gap-1 mt-1 font-mono">
                <Activity className="w-3 h-3 text-vouch-emerald" />
                Sharpe: 2.84 • Simulated, not verified
              </span>
            </div>
            <div className="p-2 bg-vouch-emerald/10 rounded-xl border border-vouch-emerald/30">
              <Activity className="w-4 h-4 text-vouch-emerald" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <VEWidget className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Backtested Cumulative Performance Curve
                </h3>
                <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                  Cumulative ROI return modeled over designated Sabermetric historic logs ($ {simulationStakeUnit} Unit standard).
                </p>
              </div>
              <div className="flex bg-[hsl(var(--ve-surface-raised)/0.42)] p-1 rounded-lg border border-[hsl(var(--ve-border)/0.28)] text-[10px] font-bold font-mono">
                {(['7d', '14d', '30d'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setHistoricalTimeframe(tf)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      historicalTimeframe === tf
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                        : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'
                    }`}
                  >
                    {tf.toUpperCase()} Window
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getPortfolioChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161f30" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={9} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0c1322',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <RechartsLegend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Area name="Simulated Backtest Profit ($)" type="monotone" dataKey="cashValue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" activeDot={{ r: 6 }} />
                  <Area name="AI Optimized Path Model ($)" type="monotone" dataKey="aiProjected" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProjected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </VEWidget>

          <VEWidget className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-vouch-cyan" />
                VouchEdge Monte Carlo Roster Backtester (Simulation only — not verified performance)
              </h3>
              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                Tweak your model accuracy, update bankroll unit sizing, and trigger simulated deep audits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] rounded-2xl border border-[hsl(var(--ve-border)/0.28)]">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Assumed Accuracy</span>
                  <span className="font-black text-vouch-amber font-mono text-xs">{simulatedWinRate}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={simulatedWinRate}
                  onChange={(e) => setSimulatedWinRate(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-vouch-amber"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Stake per Unit</span>
                  <span className="font-black text-emerald-300 font-mono text-xs">${simulationStakeUnit}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={simulationStakeUnit}
                  onChange={(e) => setSimulationStakeUnit(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded-lg appearance-none cursor-pointer accent-emerald-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono block">Risk Profile Bias</label>
                <select
                  value={portfolioRiskFilter}
                  onChange={(e) => setPortfolioRiskFilter(e.target.value as typeof portfolioRiskFilter)}
                  className="w-full text-xs font-semibold bg-[hsl(var(--ve-surface-raised)/0.44)] border border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-secondary))] p-2 rounded-xl outline-none focus:border-vouch-cyan/55"
                >
                  <option value="all">⚡ Balanced (All Exposures)</option>
                  <option value="high">🔥 Aggressive (High Variance Only)</option>
                  <option value="medium">⚖️ Conservative (Medium Leverage)</option>
                  <option value="low">🛡️ Safe-Haven (Low Risk Thresholds)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStartAuditSimulation}
                disabled={isAuditing}
                className={`w-full py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  isAuditing
                    ? 'bg-slate-900 text-[hsl(var(--ve-text-muted))] border border-slate-800 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 border border-emerald-400/20 active:scale-[0.98]'
                }`}
              >
                <Activity className={`w-4 h-4 ${isAuditing ? 'animate-spin text-[hsl(var(--ve-text-muted))]' : 'text-[hsl(var(--ve-bg-deep))]'}`} />
                <span>{isAuditing ? '🧠 CALCULATING PROJECTIONS & SPLITS...' : '⚡ EXECUTE DEEP PORTFOLIO BACKTEST AUDIT'}</span>
              </button>

              <div className="font-mono text-[10px] text-[hsl(var(--ve-text-muted))] p-4 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] rounded-2xl min-h-[140px] max-h-[220px] overflow-y-auto space-y-1.5 leading-relaxed shadow-inner">
                {auditLog.length === 0 ? (
                  <div className="text-[hsl(var(--ve-text-muted)/0.72)] italic py-6 text-center select-none">
                    // Terminal offline. Click &quot;EXECUTE DEEP PORTFOLIO BACKTEST AUDIT&quot; to populate live simulation audits...
                  </div>
                ) : (
                  auditLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={`animate-fade-in ${
                        log.includes('✓') || log.includes('🏆') ? 'text-emerald-400 font-bold' : log.includes('⚡') ? 'text-cyan-400' : 'text-[hsl(var(--ve-text-muted))]'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </VEWidget>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-vouch-amber" />
                Active Circle Roster ({selectedPlayers.length})
              </h3>
              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                Represented stars in the portfolio simulation. Modify sliders to re-calculate risk weightings.
              </p>
            </div>

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {selectedPlayers.map((ps, idx) => (
                <div
                  key={ps.player.id}
                  className="p-3 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-vouch-cyan/35 transition-all rounded-2xl space-y-3 relative group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
                >
                  <button
                    type="button"
                    onClick={() => handleRemovePlayerFromCircle(ps.player.id)}
                    className="absolute top-3 right-3 text-[hsl(var(--ve-text-muted))] hover:text-red-300 p-1 bg-[hsl(var(--ve-surface-raised)/0.44)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] border border-[hsl(var(--ve-border)/0.28)] rounded-lg transition-colors"
                    title="Remove player"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src={ps.player.headshot || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
                      alt={ps.player.name}
                      className="w-10 h-10 rounded-full object-cover border border-[hsl(var(--ve-border)/0.34)] shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <h4 className="font-bold text-[hsl(var(--ve-text-primary))] text-xs truncate">{ps.player.name}</h4>
                      <p className="text-[9px] text-[hsl(var(--ve-text-muted))] uppercase font-bold font-mono">
                        {ps.player.team} • {ps.player.position}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-vouch-cyan/10 border border-vouch-cyan/30 text-vouch-cyan text-[8px] font-black rounded-md font-mono uppercase">
                        {ps.customVal}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[hsl(var(--ve-border)/0.26)] text-[9px]">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Assumed AI Conf</span>
                        <span className="font-black text-vouch-emerald font-mono">{ps.aiConfidence || 85}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="99"
                        value={ps.aiConfidence || 85}
                        onChange={(e) => {
                          const updated = [...selectedPlayers];
                          updated[idx].aiConfidence = parseInt(e.target.value, 10);
                          setSelectedPlayers(updated);
                        }}
                        className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-vouch-emerald"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[hsl(var(--ve-text-muted))] uppercase font-mono">Your Conf</span>
                        <span className="font-black text-vouch-cyan font-mono">{ps.playerConfidence || 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="99"
                        value={ps.playerConfidence || 80}
                        onChange={(e) => {
                          const updated = [...selectedPlayers];
                          updated[idx].playerConfidence = parseInt(e.target.value, 10);
                          setSelectedPlayers(updated);
                        }}
                        className="w-full h-1 bg-[hsl(var(--ve-surface-raised)/0.62)] rounded appearance-none cursor-pointer accent-vouch-cyan"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[hsl(var(--ve-surface)/0.74)] border border-[hsl(var(--ve-border)/0.34)] rounded-3xl p-5 space-y-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--ve-text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-300" />
                Sabermetric Star Candidates
              </h3>
              <p className="text-[10px] text-[hsl(var(--ve-text-muted))] mt-0.5">
                Add rest-advantaged players to your active portfolio layout with high historical variance coefficients.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {MLB_PLAYER_RECORDS.filter((p) => !selectedPlayers.some((sp) => sp.player.id === p.id)).map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 bg-[hsl(var(--ve-surface-raised)/0.34)] border border-[hsl(var(--ve-border)/0.28)] hover:border-vouch-cyan/35 transition-all rounded-2xl flex items-center justify-between gap-3 group shadow-lg shadow-[hsl(var(--ve-shadow)/0.10)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.headshot || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
                      alt={p.name}
                      className="w-8.5 h-8.5 rounded-full object-cover border border-[hsl(var(--ve-border)/0.34)] shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 leading-tight">
                      <h4 className="font-bold text-[hsl(var(--ve-text-primary))] text-xs truncate">{p.name}</h4>
                      <p className="text-[8px] text-[hsl(var(--ve-text-muted))] uppercase font-bold font-mono">
                        {p.team} • {p.position} • HR: {p.seasonStats.hr}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPlayerToCircle(p)}
                    className="py-1 px-2.5 bg-emerald-400/10 hover:bg-emerald-400/16 border border-emerald-300/25 text-emerald-300 hover:text-emerald-200 font-mono text-[9px] font-black rounded-xl transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Vouch</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
