import React from 'react';
import { ShieldCheck, Gavel, Share2, Save, Sparkles, AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import type { Leg } from '../../types';
import { Button, RiskBadge, ScorePill } from '../ui/primitives';

export type BuilderMode = 'safe' | 'balanced' | 'moonshot';

const MODES: { key: BuilderMode; label: string; sub: string; color: string }[] = [
  { key: 'safe', label: 'Safe', sub: '2 legs · shorter odds', color: '#34d399' },
  { key: 'balanced', label: 'Balanced', sub: '3 legs · mixed', color: '#22d3ee' },
  { key: 'moonshot', label: 'Moonshot', sub: '4+ legs · high risk', color: '#fb923c' },
];

interface Props {
  legs: Leg[];
  mode: BuilderMode;
  setMode: (m: BuilderMode) => void;
  judgeScore?: number;
  analyzing?: boolean;
  onAnalyze: () => void;
  onSave: () => void;
  onShare: () => void;
}

function impliedProb(decimalOdds: number): number {
  return decimalOdds > 1 ? 1 / decimalOdds : 0.5;
}

export default function ParlaySlipSummary({ legs, mode, setMode, judgeScore, analyzing, onAnalyze, onSave, onShare }: Props) {
  const count = legs.length;

  // Combined implied probability -> risk score (more legs / longer odds = riskier).
  const combined = legs.reduce((p, l) => p * impliedProb(l.odds), 1);
  const riskScore = count === 0 ? 0 : Math.max(1, Math.min(100, Math.round((1 - combined) * 100)));
  const riskLabel = count === 0 ? 'Empty' : riskScore >= 80 ? 'Lotto' : riskScore >= 62 ? 'Risky' : riskScore >= 42 ? 'Balanced' : 'Safe';

  // Best = highest implied prob (shortest odds); weakest = lowest.
  const sorted = [...legs].sort((a, b) => impliedProb(b.odds) - impliedProb(a.odds));
  const best = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Correlation: same game appearing in 2+ legs.
  const games = legs.map((l) => l.game).filter(Boolean);
  const dupGame = games.find((g, i) => games.indexOf(g) !== i);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 mb-3 space-y-3">
      {/* Mode tabs */}
      <div className="flex items-center gap-1.5">
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-black border transition-all ${mode === m.key ? 'text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            style={mode === m.key ? { background: m.color, borderColor: m.color } : undefined}>
            {m.label}
            <span className={`block text-[8px] font-mono font-normal ${mode === m.key ? 'text-slate-900/80' : 'text-slate-600'}`}>{m.sub}</span>
          </button>
        ))}
      </div>

      {/* Scores */}
      <div className="flex items-center gap-2">
        <ScorePill label="Risk" value={count === 0 ? '—' : riskScore} color={riskScore >= 62 ? '#fb923c' : '#34d399'} />
        <ScorePill label="AI Judge" value={judgeScore ?? '—'} color="#a78bfa" />
        <div className="ml-auto"><RiskBadge risk={riskLabel} /></div>
      </div>

      {/* Best / weakest / correlation */}
      {count > 0 ? (
        <div className="space-y-1.5 text-[11px]">
          {best && <p className="flex items-center gap-1.5 text-slate-300"><TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" /> <span className="text-slate-500">Best leg:</span> {best.selection}</p>}
          {weakest && count > 1 && <p className="flex items-center gap-1.5 text-slate-300"><TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" /> <span className="text-slate-500">Weakest leg:</span> {weakest.selection}</p>}
          <p className="flex items-center gap-1.5" style={{ color: dupGame ? '#fbbf24' : '#64748b' }}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            {dupGame ? `Correlation: 2+ legs share a game (${dupGame}) — not independent.` : 'No same-game correlation detected.'}
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">Add legs to see risk, best/weakest, and correlation.</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={onAnalyze} className="flex-1">
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Analyze
        </Button>
        <Button size="sm" variant="ghost" onClick={onSave}><Save className="w-3.5 h-3.5" /> Save</Button>
        <Button size="sm" variant="ghost" onClick={onShare}><Share2 className="w-3.5 h-3.5" /> Share</Button>
      </div>
      <p className="text-[9px] text-slate-600 flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Probability-based research — not betting advice.</p>
    </div>
  );
}
