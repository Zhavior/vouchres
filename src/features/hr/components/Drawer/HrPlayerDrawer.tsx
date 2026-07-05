import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  ShieldOff,
  Gauge,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import type { HrWatchRow, HrTruthStatus } from './HrPlayerCard';

export interface HrPlayerDrawerProps {
  player: HrWatchRow | null;
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab = 'overview' | 'signals' | 'reasons';

function getTierPalette(score: number): { text: string; bar: string; ring: string; border: string } {
  if (score >= 90) return { text: 'text-amber-400', bar: 'bg-amber-500', ring: '#f59e0b', border: 'border-amber-500/30' };
  if (score >= 80) return { text: 'text-emerald-400', bar: 'bg-emerald-500', ring: '#10b981', border: 'border-emerald-500/30' };
  if (score >= 70) return { text: 'text-blue-400', bar: 'bg-blue-500', ring: '#3b82f6', border: 'border-blue-500/30' };
  return { text: 'text-purple-400', bar: 'bg-purple-500', ring: '#a855f7', border: 'border-purple-500/30' };
}

function truthBadge(status: HrTruthStatus): { label: string; icon: React.ReactNode; className: string } {
  switch (status) {
    case 'official':
      return { label: 'Official', icon: <ShieldCheck className="h-3.5 w-3.5" />, className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25' };
    case 'projected':
      return { label: 'Projected', icon: <ShieldQuestion className="h-3.5 w-3.5" />, className: 'bg-blue-500/10 text-blue-300 ring-blue-500/25' };
    case 'blocked':
      return { label: 'Blocked', icon: <ShieldAlert className="h-3.5 w-3.5" />, className: 'bg-red-500/10 text-red-300 ring-red-500/25' };
    default:
      return { label: '—', icon: <ShieldOff className="h-3.5 w-3.5" />, className: 'bg-white/[0.04] text-zinc-500 ring-white/[0.08]' };
  }
}

function fmtVal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Math.round(value).toString();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function teamColor(team: string): string {
  let hash = 0;
  for (let i = 0; i < team.length; i++) {
    hash = team.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}

const MiniBar: React.FC<{ label: string; value: number | null | undefined; colorClass: string }> = ({
  label,
  value,
  colorClass,
}) => {
  const pct = value === null || value === undefined || Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
        <span className="text-xs font-bold text-slate-200">{fmtVal(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-lg font-extrabold text-slate-50">{value}</p>
  </div>
);

export const HrPlayerDrawer: React.FC<HrPlayerDrawerProps> = ({ player, isOpen, onClose }) => {
  const [tab, setTab] = useState<DrawerTab>('overview');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab('overview');
      setImgError(false);
    }
  }, [isOpen, player?.stableId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!player) return null;

  const palette = getTierPalette(player.hrScore);
  const badge = truthBadge(player.truthStatus);
  const avatarBg = teamColor(player.team);
  const hasWarnings = Boolean(player.warnings && player.warnings.length > 0);
  const reasons = player.reasons || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${player.playerName} details`}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/[0.06] bg-[#090C13] shadow-2xl"
          >
            {/* Header */}
            <div className={`relative border-b border-white/[0.06] bg-[#0A0D14] p-5`}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition duration-200 hover:text-cyan-300 hover:border-cyan-500/30"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                {player.headshotUrl && !imgError ? (
                  <img
                    src={player.headshotUrl}
                    alt={player.playerName}
                    onError={() => setImgError(true)}
                    className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/[0.08]"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/[0.08]"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials(player.playerName)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-extrabold text-slate-50">{player.playerName}</h2>
                  <p className="truncate text-sm text-zinc-400">
                    {player.team || '—'} <span className="text-zinc-600">vs</span> {player.opponent || '—'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
                    <Clock className="h-3 w-3" />
                    {player.gameTime || '—'}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Score section */}
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">HR Score</p>
                  <p className={`text-4xl font-black ${palette.text}`}>{Math.round(player.hrScore)}</p>
                </div>
                {player.rank !== null && player.rank !== undefined && (
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-semibold">Rank #{player.rank}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <MiniBar label="Power" value={player.hitterPower} colorClass={palette.bar} />
                <MiniBar label="Vulnerability" value={player.pitcherVulnerability} colorClass={palette.bar} />
                <MiniBar label="Park" value={player.parkFactor} colorClass={palette.bar} />
                <MiniBar label="Form" value={player.recentForm} colorClass={palette.bar} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] px-5">
              {(['overview', 'signals', 'reasons'] as DrawerTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`relative px-4 py-3 text-xs font-semibold uppercase tracking-wide transition duration-200 ${
                    tab === t ? 'text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t}
                  {tab === t && (
                    <motion.span
                      layoutId="drawer-tab-underline"
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cyan-400"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 p-5">
              {tab === 'overview' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Vouch Score"
                      value={player.vouchScore !== null && player.vouchScore !== undefined ? Math.round(player.vouchScore).toString() : '—'}
                    />
                    <StatBox
                      label="Data Confidence"
                      value={player.dataConfidence !== null && player.dataConfidence !== undefined ? `${Math.round(player.dataConfidence)}%` : '—'}
                    />
                    <StatBox label="Odds" value={player.oddsLabel || '—'} />
                    <StatBox label="Rank" value={player.rank !== null && player.rank !== undefined ? `#${player.rank}` : '—'} />
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Matchup
                    </p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Pitcher</dt>
                        <dd className="font-semibold text-slate-200">{player.pitcherName || '—'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Venue</dt>
                        <dd className="font-semibold text-slate-200">{player.venue || '—'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Game Time</dt>
                        <dd className="font-semibold text-slate-200">{player.gameTime || '—'}</dd>
                      </div>
                    </dl>
                  </div>

                  {hasWarnings && (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Warnings
                      </p>
                      {player.warnings?.map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-200"
                        >
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'signals' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      <Gauge className="h-3.5 w-3.5" />
                      Signal Breakdown
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <MiniBar label="Hitter Power" value={player.hitterPower} colorClass={palette.bar} />
                      <MiniBar label="Pitcher Vulnerability" value={player.pitcherVulnerability} colorClass={palette.bar} />
                      <MiniBar label="Park Factor" value={player.parkFactor} colorClass={palette.bar} />
                      <MiniBar label="Recent Form" value={player.recentForm} colorClass={palette.bar} />
                      <MiniBar label="Data Confidence" value={player.dataConfidence} colorClass={palette.bar} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'reasons' && (
                <div className="flex flex-col gap-2.5">
                  {reasons.length === 0 && (
                    <p className="text-sm text-zinc-600">No AI reasons available.</p>
                  )}
                  {reasons.map((reason, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-200"
                    >
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default HrPlayerDrawer;
