import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  Clock3,
  Flame,
  MapPin,
  Plus,
  ShieldCheck,
  ShieldQuestion,
  Target,
  TriangleAlert,
} from 'lucide-react';
import type { HrBuckets } from '../../hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../../types/hrWatch';
import { buildHrDecisionBrief } from '../../utils/hrDecisionBrief';
import type { HrCardResult } from '../Cards/HrPlayerCard';
import {
  buildHrGameMapGroups,
  buildHrSignalPoints,
  flattenHrMapRows,
} from '../Treemap/hrMapModel';

interface HrSignalFieldProps {
  buckets: HrBuckets;
  onSelectPlayer: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
  getHrResult?: (playerId: string | number | null) => HrCardResult;
}

type TierName = keyof HrBuckets;

const WIDTH = 900;
const HEIGHT = 500;
const TIER_ORDER: TierName[] = ['Elite', 'Strong', 'Watch', 'Sleepers'];
const TIER_COLOR: Record<TierName, string> = {
  Elite: '#22d3ee',
  Strong: '#34d399',
  Watch: '#fbbf24',
  Sleepers: '#fb923c',
};

function shortTime(value: string | null): string {
  if (!value) return 'Time pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function metric(value: number | null): string {
  return value == null || !Number.isFinite(value) ? 'Unavailable' : String(Math.round(value));
}

export function HrSignalField({ buckets, onSelectPlayer, onAddToSlip, getHrResult }: HrSignalFieldProps) {
  const rows = useMemo(() => flattenHrMapRows(buckets), [buckets]);
  const games = useMemo(() => buildHrGameMapGroups(rows), [rows]);
  const tierByPlayer = useMemo(() => {
    const map = new Map<string, TierName>();
    TIER_ORDER.forEach((tier) => buckets[tier].forEach((row) => map.set(row.stableId, tier)));
    return map;
  }, [buckets]);
  const [selectedGameKey, setSelectedGameKey] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const plotScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (games.length === 0) return;
    if (!games.some((game) => game.key === selectedGameKey)) setSelectedGameKey(games[0].key);
  }, [games, selectedGameKey]);

  const selectedGame = games.find((game) => game.key === selectedGameKey) ?? games[0] ?? null;
  const displayedRows = useMemo(() => selectedGame?.rows.slice(0, 8) ?? [], [selectedGame]);
  const plotted = useMemo(
    () => buildHrSignalPoints(displayedRows, WIDTH, HEIGHT),
    [displayedRows],
  );

  useEffect(() => {
    if (!selectedGame) return;
    if (!selectedGame.rows.some((row) => row.stableId === selectedPlayerId)) {
      setSelectedPlayerId(selectedGame.rows[0]?.stableId ?? '');
    }
  }, [selectedGame, selectedPlayerId]);

  const selectedPlayer = selectedGame?.rows.find((row) => row.stableId === selectedPlayerId)
    ?? selectedGame?.rows[0]
    ?? null;
  const selectedBrief = selectedPlayer
    ? buildHrDecisionBrief(selectedPlayer, 'fresh', null, Boolean(onAddToSlip))
    : null;
  const totalHits = rows.filter((row) => getHrResult?.(row.playerId) === 'hit').length;

  useEffect(() => {
    const scroller = plotScrollRef.current;
    const selectedPoint = plotted.points.find((point) => point.row.stableId === selectedPlayer?.stableId);
    if (!scroller || !selectedPoint || scroller.scrollWidth <= scroller.clientWidth) return;

    const renderedX = (selectedPoint.x / WIDTH) * scroller.scrollWidth;
    const left = Math.max(0, renderedX - scroller.clientWidth / 2);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [plotted.points, selectedPlayer?.stableId]);

  if (!selectedGame || !selectedPlayer) {
    return (
      <div className="flex min-h-72 items-center justify-center border border-white/[0.08] bg-black/20 text-sm text-white/45">
        No players are available for the Signal Field.
      </div>
    );
  }

  return (
    <section className="z8-hr-map overflow-hidden border border-white/[0.09] bg-ve-obsidian shadow-[0_24px_80px_rgba(0,0,0,0.3)]" aria-label="HR Signal Field">
      <header className="border-b border-white/[0.08] bg-white/[0.02] px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-cyan-300">Matchup strip</p>
            <h2 className="mt-0.5 text-base font-black uppercase tracking-[-0.02em] text-white">Ballpark Signal Map</h2>
          </div>
          <div className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.1em] ${totalHits > 0 ? 'border-orange-300/45 bg-orange-400/10 text-orange-200' : 'border-emerald-300/25 bg-emerald-400/[0.06] text-emerald-200'}`}>
            <Activity className="h-3 w-3" /> {totalHits > 0 ? `${totalHits} verified HR${totalHits === 1 ? '' : 's'}` : 'Results live'}
          </div>
        </div>

        <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Select matchup">
          {games.map((game) => {
            const active = game.key === selectedGame.key;
            const hitCount = game.rows.filter((row) => getHrResult?.(row.playerId) === 'hit').length;
            return (
              <button
                key={game.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedGameKey(game.key)}
                className={`min-w-[230px] snap-start border px-3 py-2.5 text-left transition-colors ${active ? 'border-cyan-300/70 bg-cyan-400/[0.08]' : 'border-white/[0.08] bg-black/25 hover:border-white/20'}`}
              >
                <span className="flex items-center gap-2">
                  {[game.awayLogoUrl, game.homeLogoUrl].map((logo, index) => logo ? (
                    <img key={`${game.key}-${index}`} src={logo} alt="" className="h-7 w-7 object-contain" />
                  ) : null)}
                  <span className="font-mono text-[13px] font-black text-white">{game.awayTeam} @ {game.homeTeam}</span>
                </span>
                <span className="mt-2 flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.06em] text-white/50">
                  <Clock3 className="h-3 w-3 text-cyan-300" /> {shortTime(game.gameTime)}
                  <span>·</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-300" /> {game.confirmedCount}/{game.rows.length} confirmed
                </span>
                <span className="mt-1.5 flex items-center justify-between gap-2 text-[9px] text-white/45">
                  <span className="truncate">{game.venue || 'Venue pending'}</span>
                  {hitCount > 0 ? <span className="shrink-0 font-mono font-black uppercase text-orange-200">{hitCount} verified HR</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 border-b border-white/[0.08] lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-cyan-300" />
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white">Signal field</span>
            </div>
            <span className="text-[9px] text-white/42">Power vs pitcher vulnerability</span>
            {plotted.omitted.length > 0 || selectedGame.rows.length > displayedRows.length ? (
              <span className="ml-auto inline-flex items-center gap-1 font-mono text-[8px] font-bold uppercase text-amber-200/80">
                <TriangleAlert className="h-3 w-3" />
                {plotted.omitted.length > 0 ? `${plotted.omitted.length} missing inputs` : `Top ${displayedRows.length} of ${selectedGame.rows.length}`}
              </span>
            ) : null}
          </div>

          <div ref={plotScrollRef} className="overflow-x-auto" aria-label="Scroll within the Signal Field on smaller screens">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block min-w-[680px]" role="img" aria-label={`${selectedGame.awayTeam} at ${selectedGame.homeTeam} HR signals plotted by hitter power and pitcher vulnerability`}>
              <defs>
                <radialGradient id="signal-field-surface" cx="50%" cy="48%" r="70%">
                  <stop offset="0%" stopColor="#0b2730" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#020608" stopOpacity="0" />
                </radialGradient>
                <filter id="signal-hr-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#fb923c" floodOpacity="0.9" />
                </filter>
                {plotted.points.map(({ row }) => (
                  <clipPath key={row.stableId} id={`signal-headshot-${safeSvgId(row.stableId)}`}>
                    <circle cx="0" cy="0" r="25" />
                  </clipPath>
                ))}
              </defs>

              <rect width={WIDTH} height={HEIGHT} fill="#03080b" />
              <rect x="76" y="38" width={WIDTH - 112} height={HEIGHT - 100} fill="url(#signal-field-surface)" />
              {[0, 20, 40, 60, 80, 100].map((tick) => {
                const x = 76 + (tick / 100) * (WIDTH - 112);
                const y = 38 + ((100 - tick) / 100) * (HEIGHT - 100);
                return (
                  <React.Fragment key={tick}>
                    <line x1={x} y1="38" x2={x} y2={HEIGHT - 62} stroke="rgba(255,255,255,.10)" strokeDasharray="4 7" />
                    <line x1="76" y1={y} x2={WIDTH - 36} y2={y} stroke="rgba(255,255,255,.10)" strokeDasharray="4 7" />
                    <text x={x} y={HEIGHT - 39} textAnchor="middle" fill="rgba(255,255,255,.42)" fontSize="10" fontFamily="monospace">{tick}</text>
                    <text x="60" y={y + 3} textAnchor="end" fill="rgba(255,255,255,.42)" fontSize="10" fontFamily="monospace">{tick}</text>
                  </React.Fragment>
                );
              })}
              <path d="M265 438 L450 263 L635 438 M355 438 L450 350 L545 438 M450 263 L450 438" fill="none" stroke="rgba(34,211,238,.09)" strokeWidth="2" />
              <text x={WIDTH / 2} y={HEIGHT - 12} textAnchor="middle" fill="rgba(255,255,255,.64)" fontSize="11" fontWeight="800" fontFamily="monospace" letterSpacing="1.5">PITCHER VULNERABILITY</text>
              <text transform={`translate(19 ${HEIGHT / 2}) rotate(-90)`} textAnchor="middle" fill="rgba(255,255,255,.64)" fontSize="11" fontWeight="800" fontFamily="monospace" letterSpacing="1.5">HITTER POWER</text>

              {plotted.points.map(({ row, x, y, anchorX, anchorY, radius }) => {
                const tier = tierByPlayer.get(row.stableId) ?? 'Watch';
                const color = TIER_COLOR[tier];
                const selected = row.stableId === selectedPlayer.stableId;
                const hit = getHrResult?.(row.playerId) === 'hit';
                const confirmed = row.truthStatus === 'official';
                const clipId = `signal-headshot-${safeSvgId(row.stableId)}`;
                return (
                  <g
                    key={row.stableId}
                    transform={`translate(${x} ${y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${row.playerName}, HR score ${Math.round(row.hrScore)}, ${confirmed ? 'confirmed lineup' : 'projected lineup'}${hit ? ', verified home run' : ''}`}
                    onClick={() => setSelectedPlayerId(row.stableId)}
                    onDoubleClick={() => onSelectPlayer(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedPlayerId(row.stableId);
                      }
                    }}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    {Math.hypot(x - anchorX, y - anchorY) > 4 ? (
                      <line x1={anchorX - x} y1={anchorY - y} x2="0" y2="0" stroke={color} strokeOpacity="0.36" strokeWidth="1.5" strokeDasharray="3 4" />
                    ) : null}
                    <circle r={radius + (selected ? 5 : 2)} fill="rgba(2,8,11,.92)" stroke={hit ? '#fb923c' : selected ? '#ffffff' : confirmed ? '#34d399' : '#fbbf24'} strokeWidth={hit ? 5 : selected ? 3 : 2.5} strokeDasharray={!confirmed && !hit ? '7 5' : undefined} filter={hit ? 'url(#signal-hr-glow)' : undefined} className={hit ? 'z8-hr-map-hit' : undefined} />
                    <circle r="27" fill={`${color}22`} stroke={color} strokeWidth="1.5" />
                    {row.headshotUrl ? (
                      <image href={row.headshotUrl} x="-25" y="-25" width="50" height="50" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
                    ) : (
                      <text y="5" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900">{initials(row.playerName)}</text>
                    )}
                    <circle cx={radius - 2} cy={-radius + 3} r="14" fill={hit ? '#f97316' : '#071116'} stroke={hit ? '#fed7aa' : color} strokeWidth="1.5" />
                    <text x={radius - 2} y={-radius + 7} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900">{Math.round(row.hrScore)}</text>
                    {selected || hit ? (
                      <text y={radius + 16} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="monospace" className="z8-hr-map__svg-label">{row.playerName.toUpperCase()}</text>
                    ) : null}
                    {hit ? (
                      <g transform={`translate(${-Math.min(55, radius)} ${radius + 23})`}>
                        <rect width="110" height="23" rx="4" fill="#fff7ed" />
                        <text x="55" y="15" textAnchor="middle" fill="#9a3412" fontSize="10" fontWeight="950" fontFamily="monospace">HR CONFIRMED</text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.07] px-3 py-2.5 font-mono text-[8px] font-bold uppercase tracking-[0.06em] text-white/48">
            {TIER_ORDER.map((tier) => <span key={tier} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: TIER_COLOR[tier] }} />{tier === 'Sleepers' ? 'Sleeper' : tier}</span>)}
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-300" />Confirmed</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-300" />Projected</span>
          </div>
        </div>

        <aside className="bg-gradient-to-b from-white/[0.025] to-transparent p-4" aria-label={`${selectedPlayer.playerName} evidence`}>
          <div className="flex items-start gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-full border border-cyan-300/30 bg-cyan-400/[0.08]">
              {selectedPlayer.headshotUrl ? <img src={selectedPlayer.headshotUrl} alt="" className="h-full w-full object-contain object-center" /> : <span className="mb-4 font-black text-white">{initials(selectedPlayer.playerName)}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black uppercase text-white">{selectedPlayer.playerName}</p>
              <p className="mt-1 text-[10px] text-white/55">{selectedPlayer.team} vs {selectedPlayer.opponent}</p>
              <span className={`mt-2 inline-flex items-center gap-1 border px-1.5 py-1 font-mono text-[8px] font-black uppercase ${selectedPlayer.truthStatus === 'official' ? 'border-emerald-300/30 bg-emerald-400/[0.08] text-emerald-200' : 'border-amber-300/30 bg-amber-400/[0.08] text-amber-200'}`}>
                {selectedPlayer.truthStatus === 'official' ? <ShieldCheck className="h-3 w-3" /> : <ShieldQuestion className="h-3 w-3" />}
                {selectedBrief?.lineupLabel}
              </span>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-black tabular-nums text-white">{Math.round(selectedPlayer.hrScore)}</p>
              <p className="font-mono text-[7px] font-black uppercase tracking-[0.1em] text-cyan-300">Signal score</p>
            </div>
          </div>

          {getHrResult?.(selectedPlayer.playerId) === 'hit' ? (
            <div className="mt-3 flex items-center gap-2 border border-orange-300/45 bg-orange-400/10 px-2.5 py-2 text-orange-100">
              <Flame className="h-4 w-4" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.08em]">Verified home run</span>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.13em] text-cyan-300">Why it matters</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/72">{selectedBrief?.reason}</p>
          </div>
          <div className="mt-3 border-t border-white/[0.07] pt-3">
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">Main risk</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/65">{selectedBrief?.risk}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 border border-white/[0.08] bg-black/25">
            {[
              ['Power', metric(selectedPlayer.hitterPower)],
              ['Pitcher', metric(selectedPlayer.pitcherVulnerability)],
              ['Park', metric(selectedPlayer.parkFactor)],
              ['Confidence', metric(selectedPlayer.dataConfidence)],
            ].map(([label, value], index) => (
              <div key={label} className={`px-2.5 py-2 ${index % 2 ? 'border-l border-white/[0.08]' : ''} ${index > 1 ? 'border-t border-white/[0.08]' : ''}`}>
                <p className="font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-white/38">{label}</p>
                <p className="mt-1 font-mono text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2 text-[9px] text-white/48">
            <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-cyan-300" />{selectedGame.venue || 'Venue unavailable'}</p>
            <p className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-300" />{selectedBrief?.pitcherLabel}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => onSelectPlayer(selectedPlayer)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyan-300/40 bg-cyan-400/10 text-[10px] font-black text-cyan-100 transition-colors hover:bg-cyan-400/15">Research player <ArrowRight className="h-3.5 w-3.5" /></button>
            {onAddToSlip ? (
              <button type="button" disabled={!selectedBrief?.canAddToSlip} onClick={() => onAddToSlip(selectedPlayer)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-emerald-300/30 bg-emerald-400/[0.07] text-[10px] font-black text-emerald-100 transition-colors hover:bg-emerald-400/12 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Add to slip</button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default HrSignalField;
