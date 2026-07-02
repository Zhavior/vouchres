import React, { useEffect, useState } from 'react';
import {
  Home, Users, Flame, Swords, UserRoundSearch, Radio, BarChart3,
  ArrowRight, Sparkles, ShieldCheck, Check, Bell, Crown, FlaskConical, Layers,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { Parlay } from '../types';
import { Section, Card } from '../components/ui/primitives';

/**
 * Edge Island — the post-login command center / main app hub.
 *
 * Self-contained (does not embed TodayDashboard, to avoid stacking two
 * "welcome" headers + two action grids). Reuses the same real-data pattern
 * TodayDashboard already established: one live call to vouchedgeApi for
 * today's game count, real saved-parlay counts from props, no invented
 * betting cards or fake stats. Package preview copy mirrors the real tier
 * copy already live in PremiumSubPage.tsx.
 */
interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
}

const SHORTCUTS = [
  { icon: Layers, color: '#38bdf8', section: 'daily_players', title: "Today's Slate", tag: 'START HERE', sub: 'Live games, upcoming games, high-run spots' },
  { icon: ShieldCheck, color: '#22d3ee', section: 'live_parlays', title: 'Parlay Dock', tag: 'BUILDER', sub: 'Build, save, and track parlays' },
  { icon: Flame, color: '#fb923c', section: 'hr_board', title: 'HR Board', tag: 'RESEARCH', sub: "Today's best home-run edge targets" },
  { icon: FlaskConical, color: '#a78bfa', section: 'player_edge_lab', title: 'Research Lab', tag: 'DEEP DIVE', sub: 'Player, pitcher, matchup research' },
  { icon: BarChart3, color: '#34d399', section: 'results', title: 'Ledger Vault', tag: 'PROOF', sub: 'Verified wins, losses, and full history' },
  { icon: Bell, color: '#f472b6', section: 'notifications', title: 'Notifications', tag: 'ALERTS', sub: 'HR alerts, parlay alerts, live updates' },
  { icon: Crown, color: '#818cf8', section: 'premium', title: 'Pro Tower', tag: 'PRO', sub: 'Premium tools and upgrade path' },
] as const;

const PACKAGES = [
  {
    id: 'BASIC',
    name: 'VEdge Basic',
    price: '$0',
    accent: '#94a3b8',
    perks: ['Build up to 20 slips in Parlay Lab', 'Local board bookmarks', 'Unit settlement ledger'],
  },
  {
    id: 'GOLD',
    name: 'VEdge Gold',
    price: '$12.99/mo',
    accent: '#38bdf8',
    perks: ['Verification badge on posts', 'All 4 Pro Labs unlocked', 'Real-time signal graphs'],
  },
  {
    id: 'SELLER_PRO',
    name: 'Research Seller PRO',
    price: '$49.99/mo',
    accent: '#818cf8',
    perks: ['Everything in Gold', 'Deep research suite', 'Sell picks + subscriber clubs'],
  },
] as const;


function friendlyParlayTitle(parlay: any): string {
  const rawTitle = String(parlay?.title || parlay?.market || '').trim();
  const rawSource = String(parlay?.source || '').toLowerCase();

  const isTechnical =
    !rawTitle ||
    rawTitle.includes('clientRef=') ||
    rawTitle.includes('source=') ||
    rawTitle.includes('backend-ai-') ||
    rawTitle.length > 80;

  if (!isTechnical) return rawTitle;
  if (rawSource.includes('builder')) return 'Builder Parlay';
  if (rawSource.includes('local_import')) return 'Imported HR Parlay';
  if (rawSource.includes('ai') || rawSource.includes('vai')) return 'V.A.I Smart Picks Parlay';
  return 'My Saved Parlay';
}

function getParlayOdds(parlay: any): string {
  const raw =
    parlay?.oddsDisplay ||
    parlay?.odds_display ||
    parlay?.totalOdds ||
    parlay?.odds ||
    parlay?.oddsValue ||
    '';
  const value = String(raw).trim();

  if (!value || value === '0' || value === '0x') return 'Pending';
  return value.startsWith('+') || value.includes('x') ? value : `+${value}`;
}


export default function EdgeIslandPage({ onSectionChange, savedSlips = [] }: Props) {
  const [gamesToday, setGamesToday] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    vouchedgeApi
      .dailyReport()
      .then((r) => {
        if (alive) setGamesToday(typeof r?.gameCount === 'number' ? r.gameCount : 0);
      })
      .catch(() => {
        if (alive) setGamesToday(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const pendingSlips = savedSlips.filter((p) => String(p.status).toUpperCase() === 'PENDING');
  const pendingCount = pendingSlips.length;
  const settledCount = savedSlips.filter((p) => ['WON', 'LOST', 'VOID', 'PUSH'].includes(String(p.status).toUpperCase())).length;
  const pendingPreview = pendingSlips.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 text-slate-100">
      {/* Header */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          Edge Island
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Welcome back, ProEdge.</h1>
        <p className="text-xs text-slate-400 mt-0.5">Your quick-launch dock for research, parlays, and verified results.</p>
      </div>

      {/* Command Dock */}
      <Section
        title="Command Dock"
        subtitle="Start research, build a slip, or verify your ledger from one clean hub."
        action={
          <span className="text-[10px] font-bold text-slate-500">
            {gamesToday !== null ? `${gamesToday} game${gamesToday === 1 ? '' : 's'} today` : 'Games today —'}
            {' · '}
            {pendingCount} pending
            {' · '}
            {settledCount} settled
          </span>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.section} onClick={() => onSectionChange(s.section)} className="group">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 border"
                  style={{ background: s.color + '18', borderColor: s.color + '33' }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black flex items-center gap-1">
                    {s.title}
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-300 transition-all" />
                  </h3>
                  <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[8px] font-black tracking-[0.16em] text-slate-300">
                    {s.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{s.sub}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Parlay command preview */}
      <Section
        title="Pending parlays"
        subtitle="Recent parent parlays waiting for verified grading."
        action={
          <button
            type="button"
            onClick={() => onSectionChange('results')}
            className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300 hover:text-cyan-100"
          >
            View Verified Results →
          </button>
        }
      >
        {pendingPreview.length > 0 ? (
          <div className="space-y-2">
            {pendingPreview.map((parlay: any, index) => (
              <button
                key={parlay.id || parlay.backendPickId || parlay.clientRef || index}
                type="button"
                onClick={() => onSectionChange('results')}
                className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/45 px-3 py-2 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-slate-100">
                      {friendlyParlayTitle(parlay)}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {Array.isArray((parlay as any).legs) ? (parlay as any).legs.length : '—'} legs · Pending official sync
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-black text-slate-300">
                    {getParlayOdds(parlay)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card onClick={() => onSectionChange('live_parlays')}>
            <div className="text-sm font-black text-slate-100">No pending parlays yet</div>
            <p className="mt-1 text-xs text-slate-400">Build a parlay to start tracking verified results.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-cyan-300">
              Build Parlay <ArrowRight className="h-3 w-3" />
            </span>
          </Card>
        )}
      </Section>

      {/* Package previews — copy mirrors the real tiers in PremiumSubPage.tsx */}
      <Section title="Package previews" subtitle="See what unlocks at each tier.">
        <div className="grid sm:grid-cols-3 gap-3">
          {PACKAGES.map((p) => (
            <Card key={p.id} onClick={() => onSectionChange('premium')} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-black" style={{ color: p.accent }}>
                  {p.name}
                </h3>
                {p.id !== 'BASIC' && <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: p.accent }} />}
              </div>
              <div className="text-lg font-black text-slate-100 mb-2">{p.price}</div>
              <div className="space-y-1.5 mb-3">
                {p.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                    <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: p.accent }} />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: p.accent }}>
                View plans <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
              </span>
            </Card>
          ))}
        </div>
      </Section>

      <p className="text-[10px] text-slate-600 text-center mt-4">
        Probability-based research for entertainment — not betting advice. No guaranteed outcomes.
      </p>
    </div>
  );
}
