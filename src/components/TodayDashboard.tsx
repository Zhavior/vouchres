import React, { useState, useEffect } from 'react';
import { Flame, Sliders, Users, Tv, BarChart3, ArrowRight, Activity, CloudSun, AlertTriangle, ClipboardList } from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { DailyMlbReport } from '../types/mlb';
import type { Parlay } from '../types';
import { useMode } from '../lib/useMode';
import { Section, Card, Button, StatusBadge, RiskBadge } from './ui/primitives';

interface Props { onSectionChange: (section: string) => void; savedSlips?: Parlay[]; }

const ACTIONS = [
  { icon: Flame, color: '#fb923c', section: 'hr_board', title: 'Find Edge Picks', sub: "See today's best player edge targets" },
  { icon: Sliders, color: '#22d3ee', section: 'build', title: 'Build a Parlay', sub: 'Combine legs and check the edge' },
  { icon: Users, color: '#f472b6', section: 'daily_players', title: 'Daily Players', sub: "Every player in today's games" },
  { icon: Tv, color: '#38bdf8', section: 'live_games', title: "Check Today's Games", sub: 'Live matchups + win probabilities' },
  { icon: BarChart3, color: '#34d399', section: 'results', title: 'Track My Results', sub: 'Your record, win rate, and ROI' },
];

export default function TodayDashboard({ onSectionChange, savedSlips = [] }: Props) {
  const [mode, , toggleMode] = useMode();
  const [report, setReport] = useState<DailyMlbReport | null>(null);
  const [loading, setLoading] = useState(true);
  const beginner = mode === 'beginner';

  useEffect(() => {
    vouchedgeApi.dailyReport().then(setReport).catch(() => setReport(null)).finally(() => setLoading(false));
  }, []);

  const hr = report?.hrTargets?.[0];
  const env = report?.runEnvironments?.[0];
  const vp = report?.vulnerablePitchers?.[0];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 text-slate-100">
      {/* Header + mode toggle */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Welcome to VouchEdge</h1>
          <p className="text-xs text-slate-400 mt-0.5">Your daily MLB research, made simple.</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
          {(['beginner', 'advanced'] as const).map((m) => (
            <button key={m} onClick={() => m !== mode && toggleMode()} className={`px-2.5 py-1 rounded-lg capitalize transition-all ${mode === m ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400'}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Action cards */}
      <Section title="What do you want to do today?">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.section} onClick={() => onSectionChange(a.section)} className="group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 border" style={{ background: a.color + '18', borderColor: a.color + '33' }}>
                  <Icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <h3 className="text-sm font-black flex items-center gap-1">{a.title}<ArrowRight className="w-3 h-3 text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-300 transition-all" /></h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{a.sub}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Today's VouchEdge Brief */}
      <Section title="Today’s VouchEdge Brief" subtitle="Generated from live MLB data" action={<StatusBadge status={report?.dataQuality === 'limited' ? 'Limited' : 'Projected'} />}>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />)}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <BriefCard icon={Flame} color="#fb923c" label="Top HR Target" status="Projected"
              line={hr ? (beginner ? `${hr.team} have the best home-run matchup today vs ${hr.opposingPitcher}.` : `${hr.team} vs ${hr.opposingPitcher} · HR score ${hr.hrScore}`) : 'No games available yet.'}
              badge={hr ? <RiskBadge risk={hr.label} /> : null}
              onClick={() => onSectionChange('hr_board')} cta="Open HR Board" />
            <BriefCard icon={CloudSun} color="#34d399" label="Best Game Environment" status="Projected"
              line={env ? (beginner ? `${env.matchup} projects as today’s highest-scoring game.` : `${env.matchup} · run env ${env.runEnvironmentScore}/100 (${env.tier})`) : 'No games available yet.'}
              onClick={() => onSectionChange('live_games')} cta="See Live Games" />
            <BriefCard icon={AlertTriangle} color="#fbbf24" label="Most Vulnerable Pitcher" status="Projected"
              line={vp ? (beginner ? `${vp.pitcherName} (${vp.team}) is today’s most hittable starter.` : `${vp.pitcherName} · vulnerability ${vp.vulnerabilityScore}/100`) : 'No probables set yet.'}
              onClick={() => onSectionChange('intel')} cta="MLB Intelligence" />
            <BriefCard icon={ClipboardList} color="#22d3ee" label="My Saved Parlays" status={savedSlips.length ? 'Pending' : 'Projected'}
              line={savedSlips.length ? (beginner ? `You have ${savedSlips.length} saved parlay${savedSlips.length > 1 ? 's' : ''} to track.` : savedSlips.slice(0, 2).map((s) => s.title).join(' · ')) : 'No saved parlays yet — build one to track it.'}
              onClick={() => onSectionChange(savedSlips.length ? 'results' : 'build')} cta={savedSlips.length ? 'View Results' : 'Build a Parlay'} />
          </div>
        )}
      </Section>

      <p className="text-[10px] text-slate-600 text-center">Probability-based research for entertainment — not betting advice. No guaranteed outcomes.</p>
    </div>
  );
}

function BriefCard({ icon: Icon, color, label, line, status, badge, onClick, cta }: { icon: React.ComponentType<{ className?: string }>; color: string; label: string; line: string; status: string; badge?: React.ReactNode; onClick: () => void; cta: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-black font-mono uppercase tracking-wider" style={{ color }}><Icon className="w-3.5 h-3.5" /> {label}</span>
        <div className="flex items-center gap-1.5">{badge}<StatusBadge status={status} /></div>
      </div>
      <p className="text-sm text-slate-200 leading-snug mb-3 min-h-[40px]">{line}</p>
      <Button size="sm" variant="ghost" onClick={onClick}>{cta} <ArrowRight className="w-3 h-3" /></Button>
    </Card>
  );
}
