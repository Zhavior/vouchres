import React, { useEffect, useState } from 'react';
import {
  Layers, ShieldCheck, Flame, FlaskConical, BarChart3, Bell, Crown,
  ArrowRight, Sparkles, Check,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { Parlay } from '../types';

/**
 * Edge Island — the post-login command center / main app hub.
 *
 * Self-contained (does not embed TodayDashboard, to avoid stacking two
 * "welcome" headers + two action grids). Reuses the same real-data pattern
 * TodayDashboard already established: one live call to vouchedgeApi for
 * today's game count, real saved-parlay counts from props, no invented
 * betting cards or fake stats. Package preview copy mirrors the real tier
 * copy already live in PremiumSubPage.tsx.
 *
 * Styled on the Z8 Obsidian design system (glass-panel/terminal-text/
 * vouch-emerald/vouch-cyan) — kept local to this page rather than touching
 * the shared ui/primitives.tsx Section/Card, which six other pages depend on.
 */
interface Props {
  onSectionChange: (section: string) => void;
  savedSlips?: Parlay[];
}

const SHORTCUTS = [
  { icon: Layers, section: 'daily_players', title: "Today's Slate", tag: 'START HERE', sub: 'Live games, upcoming games, high-run spots' },
  { icon: ShieldCheck, section: 'live_parlays', title: 'Parlay Dock', tag: 'BUILDER', sub: 'Build, save, and track parlays' },
  { icon: Flame, section: 'hr_board', title: 'HR Board', tag: 'RESEARCH', sub: "Today's best home-run edge targets" },
  { icon: FlaskConical, section: 'player_edge_lab', title: 'Research Lab', tag: 'DEEP DIVE', sub: 'Player, pitcher, matchup research' },
  { icon: BarChart3, section: 'results', title: 'Ledger Vault', tag: 'PROOF', sub: 'Verified wins, losses, and full history' },
  { icon: Bell, section: 'notifications', title: 'Notifications', tag: 'ALERTS', sub: 'HR alerts, parlay alerts, live updates' },
  { icon: Crown, section: 'premium', title: 'Pro Tower', tag: 'PRO', sub: 'Premium tools and upgrade path' },
] as const;

const PACKAGES = [
  { id: 'BASIC', name: 'VEdge Basic', price: '$0', perks: ['Build up to 20 slips in Parlay Lab', 'Local board bookmarks', 'Unit settlement ledger'] },
  { id: 'GOLD', name: 'VEdge Gold', price: '$12.99/mo', perks: ['Verification badge on posts', 'All 4 Pro Labs unlocked', 'Real-time signal graphs'] },
  { id: 'SELLER_PRO', name: 'Research Seller PRO', price: '$49.99/mo', perks: ['Everything in Gold', 'Deep research suite', 'Sell picks + subscriber clubs'] },
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
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 font-z8 text-white">
      {/* Header */}
      <div className="mb-6">
        <div className="glass-panel glass-border inline-flex items-center gap-2 rounded-full px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-vouch-emerald" />
          <span className="terminal-text">Edge Island</span>
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Welcome back, ProEdge.</h1>
        <p className="mt-1 text-xs text-white/40">Your quick-launch dock for research, parlays, and verified results.</p>
      </div>

      {/* Command Dock */}
      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Command Dock</h2>
            <p className="mt-0.5 text-xs text-white/40">Start research, build a slip, or verify your ledger from one clean hub.</p>
          </div>
          <span className="terminal-text text-right">
            {gamesToday !== null ? `${gamesToday} game${gamesToday === 1 ? '' : 's'} today` : 'Games today —'}
            {' · '}
            {pendingCount} pending
            {' · '}
            {settledCount} settled
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.section}
                type="button"
                onClick={() => onSectionChange(s.section)}
                className="glass-panel glass-border group rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
              >
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-vouch-emerald/10 text-vouch-emerald">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold flex items-center gap-1">
                    {s.title}
                    <ArrowRight className="w-3 h-3 text-white/20 group-hover:translate-x-0.5 group-hover:text-vouch-cyan transition-all" />
                  </h3>
                  <span className="terminal-text">{s.tag}</span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{s.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Parlay command preview */}
      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Pending parlays</h2>
            <p className="mt-0.5 text-xs text-white/40">Recent parent parlays waiting for verified grading.</p>
          </div>
          <button
            type="button"
            onClick={() => onSectionChange('results')}
            className="terminal-text text-vouch-cyan hover:text-vouch-emerald transition"
          >
            View Verified Results →
          </button>
        </div>

        {pendingPreview.length > 0 ? (
          <div className="space-y-2">
            {pendingPreview.map((parlay: any, index) => (
              <button
                key={parlay.id || parlay.backendPickId || parlay.clientRef || index}
                type="button"
                onClick={() => onSectionChange('results')}
                className="w-full rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5 text-left transition hover:border-vouch-cyan/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">
                      {friendlyParlayTitle(parlay)}
                    </div>
                    <div className="mt-0.5 terminal-text">
                      {Array.isArray((parlay as any).legs) ? (parlay as any).legs.length : '—'} legs · Pending official sync
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-black text-white/70">
                    {getParlayOdds(parlay)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSectionChange('live_parlays')}
            className="glass-panel glass-border w-full rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
          >
            <div className="text-sm font-bold text-white">No pending parlays yet</div>
            <p className="mt-1 text-xs text-white/40">Build a parlay to start tracking verified results.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-vouch-cyan">
              Build Parlay <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        )}
      </section>

      {/* Package previews — copy mirrors the real tiers in PremiumSubPage.tsx */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-white">Package previews</h2>
          <p className="mt-0.5 text-xs text-white/40">See what unlocks at each tier.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSectionChange('premium')}
              className="glass-panel glass-border group rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-bold text-white">{p.name}</h3>
                {p.id !== 'BASIC' && <ShieldCheck className="w-4 h-4 shrink-0 text-vouch-emerald" />}
              </div>
              <div className="text-lg font-black text-white mb-2">{p.price}</div>
              <div className="space-y-1.5 mb-3">
                {p.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-1.5 text-[11px] text-white/50">
                    <Check className="w-3 h-3 mt-0.5 shrink-0 text-vouch-emerald" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-bold flex items-center gap-1 text-vouch-cyan">
                View plans <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-[10px] text-white/25 text-center mt-6">
        Probability-based research for entertainment — not betting advice. No guaranteed outcomes.
      </p>
    </div>
  );
}
