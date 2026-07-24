/**
 * HrPlayerProfile — Full-screen Pro player profile overlay (v2)
 *
 * Layout:
 *   Desktop (lg+): fixed left sidebar (hero + score arcs + nav) + scrollable right content
 *   Mobile:        stacked — hero strip at top, horizontal nav, scrollable content below
 *
 * Design:
 *   - True full-screen (inset-0), no narrow max-w pocket
 *   - Rich SVG graphs: grouped bar chart for BvP, EV bar chart for team/form,
 *     wide horizontal rank bars for layers, big sparklines
 *   - Full CSS token system — zero hardcoded hex
 *   - Framer Motion slide-up entry + ESC to close
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Minus, Flame, Award, Eye, Moon,
  BarChart2, Users, Activity,
} from 'lucide-react';
import type { HrWatchRow } from '../../types/hrWatch';
import { buildHrDecisionBrief, type HrBoardFreshness } from '../../utils/hrDecisionBrief';
import { lastNGames, gamesAgainstOpponent } from '../../utils/realGameLogs';
import { useHrResearch } from '../../hooks/useHrResearch';
import { logoByTeamName } from '../../../../lib/teamLogos';
import { Z8_LABEL } from '../../../../theme/z8Tokens';
import { useAppProfile } from '../../../../context/AppShellContext';
import { useBodyScrollLock } from '../../../../lib/scroll/useBodyScrollLock';
import {
  GameLogEmpty,
  GameLogLoading,
  type LayerChartRow,
} from './HrProfileCharts';
import { HrMatchupPressureMatrix } from './HrMatchupPressureMatrix';
import { HrImpactTimeline } from './HrImpactTimeline';
import { HrOverviewDossier } from './HrOverviewDossier';
import {
  PlayerIdentityHeader,
  ConfidenceSummary,
  MarketDecision,
  EvidenceStack,
  RiskSummary,
  MatchupBreakdown,
  DataFreshness,
  ProResearchGate,
  StickyResearchAction,
  type EvidenceItem,
} from '../../../../components/player-intelligence';
import '../../../../styles/hr-profile.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HrPlayerProfileProps {
  player: HrWatchRow | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToSlip: (player: HrWatchRow) => void;
  boardFreshness: HrBoardFreshness;
  boardGeneratedAt: Date | null;
  boardDate: string;
  slipActionAvailable: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamHue(team: string): number {
  let h = 0;
  for (let i = 0; i < team.length; i++) h = team.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function fmtScore(v: number | null | undefined): string {
  return v == null ? '—' : Math.round(v).toString();
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—';
  const pct = v <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function fmtOdds(v: number | null | undefined): string {
  if (v == null) return '—';
  return v > 0 ? `+${v}` : `${v}`;
}

function tierConfig(score: number) {
  if (score >= 97) return { label: 'ELITE',   color: '#fbbf24',                rgb: '251,191,36',  icon: <Flame className="h-3.5 w-3.5" /> };
  if (score >= 92) return { label: 'STRONG',  color: '#00FF94',                rgb: '0,255,148',   icon: <Award className="h-3.5 w-3.5" /> };
  if (score >= 85) return { label: 'WATCH',   color: '#00F0FF',                rgb: '0,240,255',   icon: <Eye className="h-3.5 w-3.5" /> };
  if (score >= 75) return { label: 'SLEEPER', color: '#00F0FF',                rgb: '0,240,255',   icon: <Moon className="h-3.5 w-3.5" /> };
  return             { label: 'FADE',    color: 'rgba(255,255,255,0.4)', rgb: '255,255,255', icon: <Minus className="h-3.5 w-3.5" /> };
}

// ─── SVG Chart Primitives ─────────────────────────────────────────────────────

/** Horizontal rank bar with league-avg tick */
const RankBar: React.FC<{ value: number | null | undefined; avg?: number; color: string }> = ({ value, avg = 50, color }) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg width="100%" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
      <rect x={0} y={3} width={200} height={6} rx={3} fill="rgba(255,255,255,0.25)" />
      <rect x={0} y={3} width={(pct / 100) * 200} height={6} rx={3} fill={color} opacity={0.85} />
      <rect x={(avg / 100) * 200 - 1} y={0} width={2} height={12} fill="rgba(255,255,255,0.2)" rx={1} />
    </svg>
  );
};

/** Big score arc */
const Arc: React.FC<{ value: number; color: string; label: string; size?: number }> = ({ value, color, label, size = 80 }) => {
  const r = size / 2 - 7, cx = size / 2, cy = size / 2;
  const span = 220, start = 180 + (360 - span) / 2;
  const toR = (d: number) => (d * Math.PI) / 180;
  const pt = (d: number) => ({ x: cx + r * Math.cos(toR(d)), y: cy + r * Math.sin(toR(d)) });
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const s = pt(start), e = pt(start + span), f = pt(start + pct * span);
  const lge = pct * span > 180 ? 1 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`} stroke="rgba(255,255,255,0.3)" strokeWidth="5" fill="none" strokeLinecap="round" />
        {value > 0 && <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${lge} 1 ${f.x} ${f.y}`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={color}>{value > 0 ? Math.round(value) : '—'}</text>
      </svg>
      <span className={Z8_LABEL}>{label}</span>
    </div>
  );
};

// ─── Sub-section header ────────────────────────────────────────────────────────

const Sec: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.03]">{icon}</div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{title}</p>
      </div>
      {sub && <p className="text-[10px] text-white/40">{sub}</p>}
    </div>
  </div>
);

const Dot: React.FC<{ hrs: number }> = ({ hrs }) => (
  <span className={`inline-block h-3 w-3 rounded-full ring-2 ${hrs > 0 ? 'bg-amber-400 ring-amber-400/30' : 'bg-zinc-700 ring-zinc-700/20'}`} />
);

// ─── Layer definitions ─────────────────────────────────────────────────────────

interface LayerRow extends LayerChartRow { icon: string; avg: number; color: string; }

function getLayers(p: HrWatchRow | null): LayerRow[] {
  if (!p) return [];
  return [
    { id: 'power',   label: 'Hitter Power',          icon: '💪', weight: 25, value: p.hitterPower,          avg: 52, color: '#00F0FF' },
    { id: 'pitcher', label: 'Pitcher Vulnerability',  icon: '⚾', weight: 20, value: p.pitcherVulnerability, avg: 48, color: '#00F0FF' },
    { id: 'pitch',   label: 'Pitch Mix Advantage',    icon: '🎯', weight: 15, value: p.pitchMix,             avg: 50, color: '#00F0FF' },
    { id: 'park',    label: 'Park Factor',             icon: '🏟️', weight: 10, value: p.parkFactor,           avg: 50, color: '#00F0FF' },
    { id: 'form',    label: 'Recent Form',             icon: '🔥', weight: 10, value: p.recentForm,           avg: 50, color: '#00F0FF' },
    { id: 'weather', label: 'Weather',                 icon: '🌬️', weight: 5,  value: p.weather,             avg: 55, color: '#00F0FF' },
    { id: 'platoon', label: 'Platoon Split',           icon: '🤜', weight: 5,  value: p.platoon,             avg: 50, color: '#00F0FF' },
    { id: 'bullpen', label: 'Bullpen Risk',            icon: '🔄', weight: 3,  value: p.bullpen,             avg: 48, color: '#00F0FF' },
    { id: 'lineup',  label: 'Lineup Context',          icon: '📋', weight: 3,  value: p.lineupContext,        avg: 52, color: '#00F0FF' },
    { id: 'swing',   label: 'Swing Decisions',         icon: '🎪', weight: 2,  value: p.swingDecisions,      avg: 50, color: '#00F0FF' },
    { id: 'bvp',     label: 'Batter vs Pitcher',       icon: '📊', weight: 2,  value: p.bvpScore,            avg: 50, color: '#00F0FF' },
    { id: 'vegas',   label: 'Vegas Alignment',          icon: '💰', weight: 0,  value: p.vegasEdgeScore,      avg: 50, color: '#00F0FF' },
  ];
}

// ─── Main component ────────────────────────────────────────────────────────────

type CanonicalGameLogRow = {
  date: string;
  opponentAbbr: string;
  opponentName: string;
  ab: number;
  hits: number;
  hrs: number;
  rbi: number;
  doubles: number;
  triples: number;
  totalBases: number;
  strikeOuts: number;
  bb: number;
  result: 'HR' | 'Hit' | 'Out';
};

function recordNumber(
  value: Record<string, number | string | null> | null,
  key: string,
): number | null {
  if (!value) return null;

  const raw = value[key];

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatRate(value: number | null): string {
  return value === null ? '—' : value.toFixed(3);
}

function canonicalGameLogs(
  timeline: Array<{
    date: string;
    opponent: string | null;
    atBats: number | null;
    hits: number | null;
    homeRuns: number | null;
    totalBases: number | null;
    strikeOuts: number | null;
  }>,
): CanonicalGameLogRow[] {
  return timeline.map((game) => ({
    date: game.date,
    opponentAbbr: game.opponent ?? '—',
    opponentName: game.opponent ?? 'Unknown',
    ab: game.atBats ?? 0,
    hits: game.hits ?? 0,
    hrs: game.homeRuns ?? 0,
    rbi: 0,
    doubles: 0,
    triples: 0,
    totalBases: game.totalBases ?? 0,
    strikeOuts: game.strikeOuts ?? 0,
    bb: 0,
    result:
      (game.homeRuns ?? 0) > 0
        ? 'HR'
        : (game.hits ?? 0) > 0
          ? 'Hit'
          : 'Out',
  }));
}

export const HrPlayerProfile: React.FC<HrPlayerProfileProps> = ({
  player,
  isOpen,
  onClose,
  onAddToSlip,
  boardFreshness,
  boardGeneratedAt,
  boardDate,
  slipActionAvailable,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'layers' | 'bvp' | 'team' | 'form'>('overview');
  useBodyScrollLock(isOpen);
  const profile = useAppProfile();
  const {
    research,
    loading: researchLoading,
    error: researchError,
  } = useHrResearch(player?.playerId, boardDate, isOpen);

  useEffect(() => {
    if (isOpen) { setImgErr(false); setActiveSection('overview'); }
  }, [isOpen, player?.stableId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const canonicalLogs = useMemo(
    () => canonicalGameLogs(research?.charts.signalTimeline ?? []),
    [research?.charts.signalTimeline],
  );

  const formLogs = useMemo(
    () => lastNGames(canonicalLogs, 10),
    [canonicalLogs],
  );

  const teamLogs = useMemo(
    () => player
      ? gamesAgainstOpponent(canonicalLogs, player.opponent, 5)
      : [],
    [canonicalLogs, player?.opponent],
  );

  const bvpCareer = useMemo(() => {
    const row = research?.context.batterVsPitcher ?? null;
    const ab = recordNumber(row, 'ab');
    const sampleSize = recordNumber(row, 'sampleSize');
    const pa = sampleSize ?? ab;
    const hrs = recordNumber(row, 'hr');
    const avg = recordNumber(row, 'avg');
    const slg = recordNumber(row, 'slg');
    const ops = recordNumber(row, 'ops');
    const hits = recordNumber(row, 'h');
    const walks = recordNumber(row, 'bb');
    const strikeouts = recordNumber(row, 'k');

    return {
      available: row !== null,
      pa,
      ab,
      hrs,
      avg,
      slg,
      ops,
      hits,
      walks,
      strikeouts,
      hrPct:
        pa !== null && pa > 0 && hrs !== null
          ? Number(((hrs / pa) * 100).toFixed(1))
          : null,
    };
  }, [research?.context.batterVsPitcher]);

  const realLogState: 'loading' | 'ready' | 'unavailable' =
    researchLoading
      ? 'loading'
      : researchError || !research
        ? 'unavailable'
        : 'ready';

  // Structured evidence — every model reason/warning as its own ranked claim,
  // not folded into a single paragraph. warnings[0] drives RiskSummary
  // separately; anything past it still surfaces here as uncertainty.
  const evidenceItems: EvidenceItem[] = useMemo(() => {
    if (!player) return [];
    const reasons = player.reasons.filter((r) => r.trim());
    const extraWarnings = player.warnings.filter((w) => w.trim()).slice(1);
    return [
      ...reasons.map((text, i): EvidenceItem => ({
        tone: i === 0 ? 'strongest' : 'matchup',
        text,
      })),
      ...extraWarnings.map((text): EvidenceItem => ({ tone: 'uncertainty', text })),
    ];
  }, [player]);

  const compositeScore = useMemo(() => {
    const ls = getLayers(player);
    let sum = 0, wt = 0;
    for (const l of ls) { if (l.value != null && l.weight > 0) { sum += l.value * l.weight; wt += l.weight; } }
    return wt > 0 ? Math.round(sum / wt) : (player?.hrScore ?? 0);
  }, [player]);

  // ── All hooks above ── null guard safe ──
  if (!player || typeof document === 'undefined') return null;

  const tier    = tierConfig(player.hrScore);
  const layers  = getLayers(player);
  const hue     = teamHue(player.team);
  const showImg = player.headshotUrl && !imgErr;

  const formHRs = formLogs.filter(g => g.hrs > 0).length;
  const formTB  = formLogs.length > 0 ? +(formLogs.reduce((s, g) => s + g.totalBases, 0) / formLogs.length).toFixed(1) : 0;
  const teamHRs = teamLogs.reduce((s, g) => s + g.hrs, 0);
  const teamTB  = teamLogs.length > 0 ? +(teamLogs.reduce((s, g) => s + g.totalBases, 0) / teamLogs.length).toFixed(1) : 0;
  const teamLogo = logoByTeamName(player.team) || player.teamLogoUrl;
  const oppLogo = logoByTeamName(player.opponent) || player.opponentLogoUrl;
  const decision = buildHrDecisionBrief(player, boardFreshness, boardGeneratedAt, slipActionAvailable);


  const NAV = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'layers'   as const, label: '12 Layers' },
    { id: 'bvp'      as const, label: `vs ${player.pitcherName?.split(' ').pop() ?? 'Pitcher'}` },
    { id: 'team'     as const, label: `vs ${player.opponent}` },
    { id: 'form'     as const, label: 'Recent Form' },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="ve-hr-profile-backdrop fixed inset-0 z-[190]"
            aria-hidden="true"
          />

          {/* Full-screen profile */}
          <motion.div
            key="profile-panel"
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog" aria-modal="true" aria-label={`${player.playerName} full profile`}
            className="ve-hr-profile ve-hr-profile-shell fixed inset-0 z-[200] flex flex-col overflow-hidden lg:flex-row"
          >
            {/* ── LEFT SIDEBAR (desktop) / TOP HERO (mobile) ──────────────── */}
            <aside className="ve-hr-profile-sidebar ve-player-intelligence-rail relative flex-shrink-0 overflow-hidden border-b border-white/10 lg:flex lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-80">
              {/* Close button */}
              <button
                onClick={onClose} aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Identity — who this is and against whom */}
              <div className="p-5 lg:pt-8">
                <PlayerIdentityHeader
                  name={player.playerName}
                  avatarUrl={showImg ? player.headshotUrl : null}
                  teamHue={hue}
                  team={player.team}
                  teamLogoUrl={teamLogo}
                  opponent={player.opponent}
                  opponentLogoUrl={oppLogo}
                  subtitle={player.pitcherName ? `vs ${player.pitcherName}` : null}
                  meta={player.venue ? `🏟️ ${player.venue}${player.gameTime ? ` · ${player.gameTime}` : ''}` : null}
                  tierLabel={tier.label}
                  tierColor={tier.color}
                  chips={[
                    ...(player.oddsLabel ? [{ label: player.oddsLabel, tone: 'neutral' as const }] : []),
                    ...(player.bookOdds != null ? [{ label: fmtOdds(player.bookOdds), tone: 'caution' as const }] : []),
                    ...(player.truthStatus
                      ? [{
                          label: player.truthStatus === 'official' ? '✅ Official' : player.truthStatus === 'projected' ? '🔮 Projected' : '⛔ Blocked',
                          tone: (player.truthStatus === 'official' ? 'positive' : player.truthStatus === 'projected' ? 'caution' : 'neutral') as 'positive' | 'caution' | 'neutral',
                        }]
                      : []),
                  ]}
                />
              </div>

              {/* Weighted composite confidence */}
              <div className="ve-player-intelligence-rail__scorecard hidden px-5 lg:block">
                <ConfidenceSummary
                  score={compositeScore}
                  label="Weighted composite"
                  color={tier.color}
                  stats={[
                    { label: 'Power', value: fmtScore(player.hitterPower) },
                    { label: 'Pitcher', value: fmtScore(player.pitcherVulnerability) },
                    { label: 'Form', value: fmtScore(player.recentForm) },
                  ]}
                  edge={
                    player.bookOdds != null && player.hrProbability != null && player.impliedProbability != null
                      ? {
                          value: player.hrProbability - player.impliedProbability,
                          positive: player.hrProbability - player.impliedProbability >= 0,
                        }
                      : null
                  }
                />
              </div>

              {/* Nav — desktop vertical list */}
              <nav className="ve-player-intelligence-rail__nav mt-auto hidden lg:block px-3 pb-3 pt-4" aria-label="Player research sections">
                <div className="flex flex-col gap-0.5">
                  {NAV.map(n => (
                    <button
                      key={n.id}
                      onClick={() => setActiveSection(n.id)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all"
                      style={{
                        background: activeSection === n.id ? `rgba(${tier.rgb}, 0.12)` : 'transparent',
                        color: activeSection === n.id ? tier.color : 'rgba(255,255,255,0.4)',
                        borderLeft: activeSection === n.id ? `3px solid ${tier.color}` : '3px solid transparent',
                      }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Nav — mobile horizontal scroll strip */}
              <div
                className="ve-hr-nav-scroll border-t border-white/10 px-2 lg:hidden"
              >
                {NAV.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setActiveSection(n.id)}
                    className="ve-hr-profile-nav-btn relative flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
                    style={{ color: activeSection === n.id ? tier.color : 'rgba(255,255,255,0.4)' }}
                  >
                    {n.label}
                    {activeSection === n.id && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: tier.color }} />
                    )}
                  </button>
                ))}
              </div>

              <div className="hidden px-4 pb-5 lg:block">
                <StickyResearchAction
                  eyebrow="Home run market"
                  label="Choose HR prop"
                  disabled={!decision.canAddToSlip}
                  disabledReason={decision.addToSlipBlockReason}
                  onClick={() => onAddToSlip(player)}
                  trustLine={`${decision.lineupLabel} · ${decision.freshnessLabel}`}
                />
              </div>
            </aside>

            {/* ── RIGHT CONTENT AREA ──────────────────────────────────────────── */}
            <div className="ve-hr-profile-content flex-1 overflow-y-auto">
              <div className="hidden h-full border-l border-white/10 lg:block">
                <div className="p-6 xl:p-8">
                  {renderContent()}
                </div>
              </div>
              <div className="lg:hidden p-4">
                {renderContent()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );

  // ─── Content renderer ────────────────────────────────────────────────────────
  function renderContent() {
    return (
      <>
        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-5">
            <DataFreshness
              label={decision.freshnessLabel}
              tone={boardFreshness === 'fresh' ? 'fresh' : boardFreshness === 'stale' ? 'unavailable' : 'stale'}
              detail={decision.lineupLabel}
              className="self-start"
            />

            <MarketDecision
              eyebrow="Decision brief"
              title="The case, the risk, and what is confirmed."
              score={player.hrScore}
              statusItems={[decision.lineupLabel, `vs ${decision.pitcherLabel}`]}
              action={
                <StickyResearchAction
                  eyebrow="Home run market"
                  label="Choose HR prop"
                  disabled={!decision.canAddToSlip}
                  disabledReason={decision.addToSlipBlockReason}
                  onClick={() => onAddToSlip(player)}
                />
              }
            />

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5">
              <EvidenceStack items={evidenceItems.length > 0 ? evidenceItems : [{ tone: 'strongest', text: decision.reason }]} />
            </div>

            <RiskSummary
              risk={decision.risk}
              whatCouldChange={player.truthStatus !== 'official' ? 'Verify the lineup and market before saving.' : null}
            />

            <HrOverviewDossier
              player={player}
              formLogs={formLogs}
              logState={realLogState}
              variant="full"
            />
          </div>
        )}

        {/* ── 12 LAYERS ──────────────────────────────────────────────────────── */}
        {activeSection === 'layers' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<BarChart2 className="h-4 w-4 text-cyan-400" />}
              title="12-Layer Intelligence"
              sub="Signal strength, model weight, and composite influence"
            />

            <ProResearchGate
              profile={profile}
              title="12-Layer Intelligence is a Pro research tool"
              detail="Full weighted signal breakdown — same depth as Player Edge Lab and Pro Graphs Lab."
            >
              <HrMatchupPressureMatrix
                layers={layers}
                compositeScore={compositeScore}
              />
            </ProResearchGate>
          </div>
        )}

        {/* ── BvP ─────────────────────────────────────────────────────────────── */}
        {activeSection === 'bvp' && (
          <MatchupBreakdown
            title={`vs ${research?.matchup.pitcher.name ?? player.pitcherName ?? 'Pitcher'}`}
            subtitle="Official MLB career batter-versus-pitcher results"
            state={researchLoading ? 'loading' : bvpCareer.available ? 'ready' : 'empty'}
            emptyMessage={
              researchError
                ? 'The official BvP feed could not be loaded. No simulated values are shown.'
                : `No recorded career plate appearances against ${
                    research?.matchup.pitcher.name ?? player.pitcherName ?? 'this pitcher'
                  }. This is missing evidence, not a negative matchup signal.`
            }
            stats={[
              { label: 'Career PA', value: bvpCareer.pa ?? '—' },
              { label: 'Career HR', value: bvpCareer.hrs ?? '—', color: '#fbbf24' },
              { label: 'Career AVG', value: formatRate(bvpCareer.avg) },
              { label: 'Career SLG', value: formatRate(bvpCareer.slg), color: 'hsl(var(--ve-positive))' },
              { label: 'HR / PA', value: bvpCareer.hrPct === null ? '—' : `${bvpCareer.hrPct}%`, color: 'hsl(var(--ve-accent))' },
              { label: 'Walks', value: bvpCareer.walks ?? '—' },
              { label: 'Strikeouts', value: bvpCareer.strikeouts ?? '—' },
              { label: 'OPS', value: formatRate(bvpCareer.ops) },
            ]}
            narrative={
              (bvpCareer.hrs ?? 0) >= 2
                ? `${bvpCareer.hrs} recorded career HRs against this pitcher · ${bvpCareer.hrPct === null ? 'HR rate unavailable' : `${bvpCareer.hrPct}% HR rate`} · ${bvpCareer.pa ?? 'Unknown'} career PA`
                : (bvpCareer.hrs ?? 0) === 1
                  ? `One recorded career HR against this pitcher · ${bvpCareer.pa ?? 'Unknown'} career PA`
                  : `No recorded career HR against this pitcher · ${bvpCareer.pa ?? 'Unknown'} career PA`
            }
            narrativeTone={(bvpCareer.hrs ?? 0) > 0 ? 'positive' : 'neutral'}
          />
        )}

        {/* ── vs TEAM ──────────────────────────────────────────────────────────── */}
        {activeSection === 'team' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<Users className="h-4 w-4" style={{ color: '#fbbf24' }} />}
              title={`vs ${player.opponent}`}
              sub="Real box-score games this season — total bases per game"
            />

            {realLogState === 'loading' && <GameLogLoading />}

            {realLogState === 'unavailable' && (
              <GameLogEmpty message="No real game log available for this player right now." />
            )}

            {realLogState === 'ready' && teamLogs.length === 0 && (
              <GameLogEmpty message={`No games logged against ${player.opponent} yet this season.`} />
            )}

            {realLogState === 'ready' && teamLogs.length > 0 && (
              <>
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'HRs',      value: teamHRs,                                         color: '#fbbf24' },
                { label: 'Total H',  value: teamLogs.reduce((s, g) => s + g.hits, 0),         color: '#ffffff' },
                { label: 'Total AB', value: teamLogs.reduce((s, g) => s + g.ab, 0),           color: 'rgba(255,255,255,0.4)' },
                { label: 'Avg TB',   value: teamTB,                                           color: '#00F0FF' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <HrImpactTimeline
              logs={teamLogs}
              variant="full"
              title={`Impact against ${player.opponent}`}
            />

            {/* Game log table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              <div className="grid grid-cols-6 gap-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: '#050505', color: 'rgba(255,255,255,0.4)' }}>
                <span>Date</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">RBI</span><span className="text-right">TB</span>
              </div>
              {teamLogs.map((g, i) => (
                <div key={i} className="grid grid-cols-6 items-center gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center gap-2">
                    <Dot hrs={g.hrs} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.date}</span>
                  </div>
                  <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.ab}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.hits}</span>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{g.hrs > 0 ? g.hrs : '—'}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.rbi}</span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: g.totalBases >= 4 ? '#fbbf24' : g.totalBases >= 2 ? '#00FF94' : 'rgba(255,255,255,0.4)' }}>{g.totalBases}</span>
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        )}

        {/* ── RECENT FORM ───────────────────────────────────────────────────────── */}
        {activeSection === 'form' && (
          <div className="flex flex-col gap-6">
            <Sec
              icon={<Activity className="h-4 w-4" style={{ color: '#00FF94' }} />}
              title="Recent Form"
              sub={realLogState === 'ready' ? `Last ${formLogs.length} games — real box-score production` : 'Real box-score production'}
            />

            {realLogState === 'loading' && <GameLogLoading />}

            {realLogState === 'unavailable' && (
              <GameLogEmpty message="No real game log available for this player right now." />
            )}

            {realLogState === 'ready' && formLogs.length > 0 && (
              <>
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'HRs',     value: formHRs,                                          color: '#fbbf24' },
                { label: 'Total H', value: formLogs.reduce((s, g) => s + g.hits, 0),         color: '#ffffff' },
                { label: 'Avg TB',  value: formTB,                                           color: '#00F0FF' },
                { label: 'HR Rate', value: `${((formHRs / formLogs.length) * 100).toFixed(0)}%`, color: '#00FF94' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            <HrImpactTimeline
              logs={formLogs}
              variant="full"
              title="Recent production rhythm"
            />

            {/* Game-by-game table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
              <div className="grid grid-cols-5 gap-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ background: '#050505', color: 'rgba(255,255,255,0.4)' }}>
                <span>Opp</span><span className="text-right">AB</span><span className="text-right">H</span><span className="text-right">HR</span><span className="text-right">TB</span>
              </div>
              {formLogs.map((g, i) => (
                <div key={i} className="grid grid-cols-5 items-center gap-0 px-4 py-3" style={{ background: i % 2 === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center gap-2">
                    <Dot hrs={g.hrs} />
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.opponentAbbr}</span>
                  </div>
                  <span className="text-right text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.ab}</span>
                  <span className="text-right text-sm tabular-nums" style={{ color: '#ffffff' }}>{g.hits}</span>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: g.hrs > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{g.hrs > 0 ? '💥' : '—'}</span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: g.totalBases >= 4 ? '#fbbf24' : g.totalBases >= 2 ? '#00FF94' : 'rgba(255,255,255,0.4)' }}>{g.totalBases}</span>
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        )}
      </>
    );
  }
};
