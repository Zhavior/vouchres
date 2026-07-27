import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Trophy, ShieldAlert, BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';
import { Parlay } from '../types';
import { getFounderPointsLabel } from "../lib/founderAccess";

interface RiskTierVisualizationProps {
  savedParlays: Parlay[];
}

export default function RiskTierVisualization({ savedParlays }: RiskTierVisualizationProps) {
  // Compute counts & percentages
  const counts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0
  };

  const oddsSum = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0
  };

  savedParlays.forEach(p => {
    const tier = p.riskTier || 'MEDIUM';
    counts[tier] = (counts[tier] || 0) + 1;
    oddsSum[tier] = (oddsSum[tier] || 0) + (p.oddsValue || 1.5);
  });

  const totalSlips = savedParlays.length;

  // Chart data for Pie using canonical design tokens
  const pieData = [
    { name: 'Low Risk', value: counts.LOW, color: '#31B583', rawTier: 'LOW' },
    { name: 'Medium Risk', value: counts.MEDIUM, color: '#D99C4A', rawTier: 'MEDIUM' },
    { name: 'High Risk', value: counts.HIGH, color: '#D96459', rawTier: 'HIGH' }
  ].filter(item => item.value > 0);

  // Fallback preset data when there are no saved slips, to let users preview the dynamic dashboard
  const fallbackData = [
    { name: 'Low Risk', value: 4, color: '#31B583', rawTier: 'LOW' },
    { name: 'Medium Risk', value: 8, color: '#D99C4A', rawTier: 'MEDIUM' },
    { name: 'High Risk', value: 3, color: '#D96459', rawTier: 'HIGH' }
  ];

  const activeData = totalSlips > 0 ? pieData : fallbackData;

  // Compute average odds
  const getAvgOdds = (tier: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (counts[tier] === 0) return 0;
    return parseFloat((oddsSum[tier] / counts[tier]).toFixed(2));
  };

  // Custom tooltips to fit our clean, dark theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ve-graphite border border-slate-800 p-3 rounded-xl shadow-xl font-sans text-xs">
          <p className="font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-slate-400 mt-1 font-mono">
            Count: <span className="text-slate-100 font-bold">{data.value} slips</span>
          </p>
          {totalSlips > 0 && (
            <p className="text-slate-400 font-mono">
              Share: <span className="text-sky-400 font-bold">{((data.value / totalSlips) * 100).toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-ve-storm p-5 rounded-2xl border border-slate-850 space-y-5" id="risk-tier-visualization-module">
      
      {/* Module Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-850/60 pb-3">
        <div className="space-y-0.5">
          <h4 className="font-bold text-xs text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            VEdge Slip Risk Allocation
          </h4>
          <p className="text-[10.5px] text-slate-400 leading-normal">
            Real-time portfolio metrics across risk categories.
          </p>
        </div>

        {totalSlips === 0 ? (
          <span className="text-[9px] bg-amber-950/40 border border-amber-900/60 text-amber-500 font-bold px-2 py-0.5 rounded font-mono uppercase">
            Demo Mode (Build Slip below to update)
          </span>
        ) : (
          <span className="text-[9px] bg-sky-950/40 border border-sky-900/60 text-sky-400 font-bold px-2 py-0.5 rounded font-mono uppercase">
            Live Verified Logs
          </span>
        )}
      </div>

      {/* Grid of Chart vs Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Proportional visual chart area (Recharts PieChart) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[160px]" id="recharts-pie-container">
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {activeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121824" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Centered overall count */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-mono text-xl font-black text-slate-100">
              {totalSlips}
            </span>
            <span className="text-[8.5px] text-slate-500 uppercase font-extrabold tracking-wider">
              slips
            </span>
          </div>
        </div>

        {/* Real-time category allocation metrics */}
        <div className="md:col-span-7 space-y-3" id="risk-category-metrics-breakdown">
          
          {/* Low Risk Bar */}
          <div className="space-y-1 bg-ve-graphite/40 p-2.5 rounded-xl border border-slate-850/60 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                LOW RISK
              </span>
              <span className="font-mono text-slate-350">
                {counts.LOW} {counts.LOW === 1 ? 'slip' : 'slips'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalSlips > 0 ? (counts.LOW / totalSlips) * 100 : 25}%` }}
              />
            </div>
            {counts.LOW > 0 && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Avg Decimal Odds:</span>
                <span className="font-bold text-slate-350">x{getAvgOdds('LOW').toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Medium Risk Bar */}
          <div className="space-y-1 bg-ve-graphite/40 p-2.5 rounded-xl border border-slate-850/60 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-50" style={{ backgroundColor: 'var(--color-ve-caution)' }} />
                MEDIUM RISK
              </span>
              <span className="font-mono text-slate-350">
                {counts.MEDIUM} {counts.MEDIUM === 1 ? 'slip' : 'slips'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalSlips > 0 ? (counts.MEDIUM / totalSlips) * 100 : 50}%` }}
              />
            </div>
            {counts.MEDIUM > 0 && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Avg Decimal Odds:</span>
                <span className="font-bold text-slate-350">x{getAvgOdds('MEDIUM').toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* High Risk Bar */}
          <div className="space-y-1 bg-ve-graphite/40 p-2.5 rounded-xl border border-slate-850/60 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2 h-2 rounded-full bg-rose-50" style={{ backgroundColor: 'var(--color-ve-negative)' }} />
                HIGH RISK
              </span>
              <span className="font-mono text-slate-350">
                {counts.HIGH} {counts.HIGH === 1 ? 'slip' : 'slips'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalSlips > 0 ? (counts.HIGH / totalSlips) * 100 : 25}%` }}
              />
            </div>
            {counts.HIGH > 0 && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Avg Decimal Odds:</span>
                <span className="font-bold text-slate-350">x{getAvgOdds('HIGH').toFixed(2)}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Probability Analytics Advice Footer */}
      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed font-semibold">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="text-slate-300 block mb-0.5">LAB EXPLOIT TIP:</span>
          {counts.HIGH > counts.LOW ? (
            <span>You have a heavy skew towards high-risk multi-leg tickets. We recommend combining sharp low-risk MLB selection hedges to balance high volatility.</span>
          ) : (
            <span>Your slip allocation is healthy and keeps high variance under control. Keep verifying your decimal hedges to preserve net sports wallet units.</span>
          )}
        </div>
      </div>

    </div>
  );
}
