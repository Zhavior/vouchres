/**
 * LiveAtBatView — pitch-by-pitch "sweat screen" for one live game.
 *
 * Renders the current at-bat from /api/mlb/live-at-bat/:gamePk: pitch
 * sequence (type + velocity), strike-zone plot scaled to the batter's real
 * zone, and on contact a spray chart with exit velo / launch angle /
 * distance. Every number is real MLB feed data; xBA is Statcast-only and
 * deliberately not shown. Polls every 6s while in progress (React Query).
 *
 * Z8 palette: emerald = ball in play (the proof moment), rose = strikes,
 * muted white = balls, cyan = system chrome (live pulse, win prob).
 */
import React, { useEffect, useRef, useState } from 'react';
import { LiveAtBatMatchupCard } from "./LiveAtBatMatchupCard";
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { liveAtBatPollLabel, useLiveAtBat } from '../../hooks/queries/useLiveAtBat';
import type { LiveAtBatPitch, LiveAtBatRunner, LiveAtBatSnapshot } from '../../types/liveAtBat';

const EMERALD = '#00FF94';
const CYAN = '#00F0FF';
const ROSE = '#fb7185';
const MUTED = 'rgba(255,255,255,0.4)';
const FAINT = 'rgba(255,255,255,0.12)';

const BASE_COORDS: [number, number][] = [[163, 161], [125, 123], [87, 161]];

function pitchColor(p: LiveAtBatPitch): string {
  if (p.isInPlay) return EMERALD;
  if (p.isStrike) return ROSE;
  return MUTED;
}

function isHomeRunPlay(description: string | null | undefined): boolean {
  return /homers|home run|grand slam/i.test(description ?? '');
}

/* ── Count display with strike animation ──────────────────────────────────── */

const CountDisplay: React.FC<{
  balls: number | null;
  strikes: number | null;
  strikeFlash: boolean;
}> = ({ balls, strikes, strikeFlash }) => {
  const b = balls ?? 0;
  const s = strikes ?? 0;

  return (
    <div className="flex items-center gap-3 min-w-0" aria-label={`Count ${b} balls, ${s} strikes`}>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={`b${i}`}
            className="h-2 w-2 rounded-full transition-colors duration-200"
            style={{ background: i < b ? EMERALD : 'rgba(255,255,255,0.12)' }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={`s${i}`}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${i === s - 1 && strikeFlash ? 've-strike-pop' : ''}`}
            style={{ background: i < s ? ROSE : 'rgba(255,255,255,0.12)' }}
          />
        ))}
      </div>
      <span className="font-mono text-xs font-bold tabular-nums text-white/70">{b}-{s}</span>
    </div>
  );
};

/* ── Strike zone plot ─────────────────────────────────────────────────────── */

const StrikeZonePlot: React.FC<{ pitches: LiveAtBatPitch[] }> = ({ pitches }) => {
  const located = pitches.filter((p) => p.px != null && p.pz != null);
  const szTop = located.find((p) => p.szTop != null)?.szTop ?? 3.4;
  const szBot = located.find((p) => p.szBot != null)?.szBot ?? 1.6;

  const X_MIN = -1.7, X_MAX = 1.7;
  const Y_TOP = szTop + 0.8, Y_BOT = Math.max(0, szBot - 0.9);
  const W = 200, H = 230;
  const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
  const sy = (z: number) => ((Y_TOP - z) / (Y_TOP - Y_BOT)) * H;

  const zx = sx(-0.83), zw = sx(0.83) - sx(-0.83);
  const zy = sy(szTop), zh = sy(szBot) - sy(szTop);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Strike zone pitch locations" className="block w-full max-w-[160px] min-[380px]:max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] mx-auto h-auto">
      <rect x={zx} y={zy} width={zw} height={zh} fill="rgba(255,255,255,0.03)" stroke={FAINT} strokeWidth={1.5} rx={2} />
      {[1, 2].map((i) => (
        <React.Fragment key={i}>
          <line x1={zx + (zw / 3) * i} y1={zy} x2={zx + (zw / 3) * i} y2={zy + zh} stroke={FAINT} strokeWidth={0.75} />
          <line x1={zx} y1={zy + (zh / 3) * i} x2={zx + zw} y2={zy + (zh / 3) * i} stroke={FAINT} strokeWidth={0.75} />
        </React.Fragment>
      ))}
      <path d={`M${sx(-0.7)},${H - 12} L${sx(0.7)},${H - 12} L${sx(0.45)},${H - 4} L${sx(-0.45)},${H - 4} Z`} fill="none" stroke={FAINT} strokeWidth={1} />
      {located.map((p) => {
        const color = pitchColor(p);
        return (
          <g key={p.number} transform={`translate(${sx(p.px!)},${sy(p.pz!)})`}>
            <circle r={9.5} fill={color} fillOpacity={p.isInPlay ? 0.95 : 0.85} stroke="#050505" strokeWidth={1.5}>
              <title>{`#${p.number} ${p.result} — ${p.pitchType ?? 'Pitch'}${p.velo != null ? ` ${p.velo} mph` : ''}`}</title>
            </circle>
            <text textAnchor="middle" dy={3.5} fontSize={10} fontWeight={800} fill={p.isInPlay || p.isStrike ? '#050505' : '#0a0a0a'} style={{ pointerEvents: 'none' }}>
              {p.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Spray chart with base runners ────────────────────────────────────────── */

const SprayChart: React.FC<{
  coordX: number;
  coordY: number;
  isHomeRun: boolean;
  hrCelebrating: boolean;
  runners: LiveAtBatSnapshot['runners'];
}> = ({ coordX, coordY, isHomeRun, hrCelebrating, runners }) => {
  const runnerList: { base: 1 | 2 | 3; runner: LiveAtBatRunner }[] = [];
  if (runners.first) runnerList.push({ base: 1, runner: runners.first });
  if (runners.second) runnerList.push({ base: 2, runner: runners.second });
  if (runners.third) runnerList.push({ base: 3, runner: runners.third });

  const HOME_X = 125, HOME_Y = 199;

  return (
    <div className={`relative min-w-0 max-w-full ${hrCelebrating ? 've-hr-pulse plasma-shimmer rounded-xl' : ''}`}>
      <svg viewBox="0 15 250 200" width="100%" role="img" aria-label="Batted ball landing spot and base runners" className="block w-full max-w-[200px] min-[380px]:max-w-[220px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] mx-auto h-36 min-[380px]:h-40 sm:h-48 md:h-52 lg:h-56">
        <path d={`M${HOME_X},${HOME_Y} L25,99 Q125,8 225,99 Z`} fill="rgba(0,255,148,0.05)" stroke={FAINT} strokeWidth={1.5} />
        <path d={`M${HOME_X},${HOME_Y} L163,161 L125,123 L87,161 Z`} fill="rgba(255,255,255,0.04)" stroke={FAINT} strokeWidth={1} />
        <path d="M73,147 Q125,95 177,147" fill="none" stroke={FAINT} strokeWidth={0.75} strokeDasharray="3 3" />
        {BASE_COORDS.map(([x, y], i) => (
          <rect key={i} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="rgba(255,255,255,0.35)" transform={`rotate(45 ${x} ${y})`} />
        ))}
        {runnerList.map(({ base, runner }) => {
          const [x, y] = BASE_COORDS[base - 1];
          return (
            <g key={base} transform={`translate(${x},${y - 14})`}>
              <circle r={8} fill={CYAN} fillOpacity={0.9} stroke="#050505" strokeWidth={1.2} />
              <text textAnchor="middle" dy={3.5} fontSize={7} fontWeight={900} fill="#050505" style={{ pointerEvents: 'none' }}>
                {runner.initials}
              </text>
              <title>{`${runner.name} on ${base === 1 ? '1st' : base === 2 ? '2nd' : '3rd'}`}</title>
            </g>
          );
        })}
        <circle cx={coordX} cy={coordY} r={6} fill={isHomeRun ? '#fbbf24' : EMERALD} stroke="#050505" strokeWidth={1.5} />
        <circle cx={coordX} cy={coordY} r={10} fill="none" stroke={isHomeRun ? '#fbbf24' : EMERALD} strokeOpacity={0.5} strokeWidth={1}>
          <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      {isHomeRun && hrCelebrating && (
        <p className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 ve-slide-up">
          Home run
        </p>
      )}
    </div>
  );
};

/* ── Diamond-only base runners (no spray yet) ─────────────────────────────── */

const BaseRunnersDiamond: React.FC<{ runners: LiveAtBatSnapshot['runners'] }> = ({ runners }) => {
  const runnerList: { base: 1 | 2 | 3; runner: LiveAtBatRunner }[] = [];
  if (runners.first) runnerList.push({ base: 1, runner: runners.first });
  if (runners.second) runnerList.push({ base: 2, runner: runners.second });
  if (runners.third) runnerList.push({ base: 3, runner: runners.third });
  if (runnerList.length === 0) return null;

  const HOME_X = 125, HOME_Y = 199;

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Runners on base</p>
      <svg viewBox="0 15 250 200" width="100%" role="img" aria-label="Base runners" className="block w-full max-w-[160px] min-[380px]:max-w-[180px] sm:max-w-[200px] md:max-w-[220px] mx-auto h-32 sm:h-36 md:h-40">
        <path d={`M${HOME_X},${HOME_Y} L163,161 L125,123 L87,161 Z`} fill="rgba(255,255,255,0.04)" stroke={FAINT} strokeWidth={1} />
        {BASE_COORDS.map(([x, y], i) => (
          <rect key={i} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="rgba(255,255,255,0.35)" transform={`rotate(45 ${x} ${y})`} />
        ))}
        {runnerList.map(({ base, runner }) => {
          const [x, y] = BASE_COORDS[base - 1];
          return (
            <g key={base} transform={`translate(${x},${y - 14})`}>
              <circle r={8} fill={CYAN} fillOpacity={0.9} stroke="#050505" strokeWidth={1.2} />
              <text textAnchor="middle" dy={3.5} fontSize={7} fontWeight={900} fill="#050505">{runner.initials}</text>
              <title>{`${runner.name} on ${base === 1 ? '1st' : base === 2 ? '2nd' : '3rd'}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ── Connection status ────────────────────────────────────────────────────── */

function ConnectionBadge({ snap, isFetching, isError }: { snap: LiveAtBatSnapshot | undefined; isFetching: boolean; isError: boolean }) {
  if (isError && !snap) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-400">
        <WifiOff className="h-3 w-3" /> Feed unavailable
      </span>
    );
  }
  if (isFetching && !snap) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase" style={{ color: CYAN }}>
        <Activity className="h-3 w-3 animate-pulse" /> Syncing
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
      <Wifi className="h-3 w-3" /> Live data connected
    </span>
  );
}

/* ── Main view ────────────────────────────────────────────────────────────── */

export const LiveAtBatView: React.FC<{ gamePk: number }> = ({ gamePk }) => {
  const { data: snap, isLoading, isFetching, isError, dataUpdatedAt } = useLiveAtBat(gamePk);
  const prevStrikesRef = useRef<number | null>(null);
  const prevHrKeyRef = useRef<string | null>(null);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const [hrCelebrating, setHrCelebrating] = useState(false);

  const strikes = snap?.count?.strikes ?? null;
  const isHomeRun = isHomeRunPlay(snap?.play?.description);
  const hrKey = isHomeRun ? `${snap?.play?.description ?? ''}-${snap?.updatedAt ?? ''}` : null;

  useEffect(() => {
    if (strikes == null) return;
    const prev = prevStrikesRef.current;
    if (prev != null && strikes > prev) {
      setStrikeFlash(true);
      const id = window.setTimeout(() => setStrikeFlash(false), 500);
      prevStrikesRef.current = strikes;
      return () => window.clearTimeout(id);
    }
    prevStrikesRef.current = strikes;
  }, [strikes]);

  useEffect(() => {
    if (!hrKey || hrKey === prevHrKeyRef.current) return;
    prevHrKeyRef.current = hrKey;
    setHrCelebrating(true);
    const id = window.setTimeout(() => setHrCelebrating(false), 3200);
    return () => window.clearTimeout(id);
  }, [hrKey]);

  if (isLoading && !snap) {
    return (
      <div className="glass-panel glass-border rounded-2xl p-6 text-center text-xs font-semibold min-w-0" style={{ color: MUTED }}>
        Loading live at-bat from the official MLB feed…
      </div>
    );
  }

  if (isError && !snap) {
    return (
      <div className="glass-panel glass-border rounded-2xl p-6 text-center text-xs font-semibold min-w-0" style={{ color: MUTED }}>
        Live at-bat feed unavailable for this game right now.
      </div>
    );
  }

  if (!snap) return null;

  const { play } = snap;
  const pitches = play?.pitches ?? [];
  const hit = play?.hit ?? null;
  const hasSpray = hit?.coordX != null && hit?.coordY != null;
  const runners = snap.runners ?? { first: null, second: null, third: null };
  const pollLabel = liveAtBatPollLabel(snap);
  const updatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="glass-panel glass-border rounded-2xl p-3 sm:p-4 md:p-5 min-w-0 overflow-x-hidden overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs sm:text-sm font-bold text-white/90 min-w-0">
          <span>{snap.away.abbr} {snap.away.runs ?? '–'}</span>
          <span className="text-white/30">@</span>
          <span>{snap.home.abbr} {snap.home.runs ?? '–'}</span>
          {snap.inning != null && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/40">
              {snap.halfInning ?? ''} {snap.inning}{snap.outs != null ? ` · ${snap.outs} out${snap.outs !== 1 ? 's' : ''}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <CountDisplay balls={snap.count?.balls ?? null} strikes={snap.count?.strikes ?? null} strikeFlash={strikeFlash} />
          {snap.winProb && (
            <span className="rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold shrink-0" style={{ background: 'rgba(0,240,255,0.08)', color: CYAN, border: '1px solid rgba(0,240,255,0.25)' }}>
              {snap.winProb.homePct >= 50
                ? `${snap.home.abbr} ${snap.winProb.homePct.toFixed(1)}%`
                : `${snap.away.abbr} ${snap.winProb.awayPct.toFixed(1)}%`} win prob
            </span>
          )}
          <LiveAtBatMatchupCard snapshot={snap} />

          <ConnectionBadge snap={snap} isFetching={isFetching} isError={isError} />
        </div>
      </div>

      {play ? (
        <>
          <div className="mt-3 sm:mt-4 flex items-start gap-2.5 sm:gap-3 min-w-0">
            {play.batter.headshot && (
              <img src={play.batter.headshot} alt={play.batter.name} className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover ring-1 ring-white/10" loading="eager" decoding="async" fetchPriority="high" referrerPolicy="no-referrer" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm sm:text-base font-black text-white line-clamp-2 sm:truncate ${isHomeRun && hrCelebrating ? 'text-amber-300' : ''}`}>
                {play.isComplete && play.description ? play.description : `${play.batter.name} at bat…`}
              </p>
              <p className="mt-0.5 text-[11px] sm:text-xs truncate" style={{ color: MUTED }}>
                {play.batter.name}{play.batter.gameLine ? ` · ${play.batter.gameLine}` : ''}
                <span className="mx-1.5 text-white/20">|</span>
                {play.pitcher.name}{play.pitcher.gameLine ? ` · ${play.pitcher.gameLine}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 min-w-0">
            <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0 order-2 min-[380px]:order-1">
              <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Pitch Sequence</p>
              {pitches.length === 0 && (
                <p className="py-3 sm:py-4 text-xs" style={{ color: MUTED }}>Waiting for the first pitch…</p>
              )}
              {[...pitches].reverse().map((p) => {
                const color = pitchColor(p);
                return (
                  <div key={p.number} className="flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 min-w-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-black" style={{ background: color, color: '#050505' }}>
                      {p.number}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white/90 truncate">{p.result}</span>
                    <span className="ml-auto shrink-0 text-[10px] sm:text-[11px] font-mono" style={{ color: MUTED }}>
                      {p.pitchType ?? '—'}{p.velo != null ? ` · ${p.velo.toFixed(1)} mph` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="min-w-0 order-1 min-[380px]:order-2">
              <p className="mb-1 sm:mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Strike Zone (catcher's view)</p>
              <StrikeZonePlot pitches={pitches} />
            </div>
          </div>

          {!hit && (runners.first || runners.second || runners.third) && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <BaseRunnersDiamond runners={runners} />
            </div>
          )}

          {hit && (
            <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 lg:gap-6 border-t border-white/5 pt-3 sm:pt-4 grid-cols-1 md:grid-cols-2 min-w-0 lg:max-w-4xl lg:mx-auto w-full">
              {hasSpray && (
                <div className="min-w-0">
                  <p className="mb-1 sm:mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Batted Ball</p>
                  <SprayChart
                    coordX={hit.coordX!}
                    coordY={hit.coordY!}
                    isHomeRun={isHomeRun}
                    hrCelebrating={hrCelebrating}
                    runners={runners}
                  />
                </div>
              )}
              <div className={`grid grid-cols-2 md:grid-cols-3 content-center gap-2 min-w-0 ${hasSpray ? '' : 'md:col-span-2 max-w-md mx-auto w-full'}`}>
                {[
                  { label: 'Exit Velo', value: hit.ev != null ? `${hit.ev.toFixed(1)}` : '—', unit: 'mph' },
                  { label: 'Launch', value: hit.la != null ? `${hit.la.toFixed(0)}°` : '—', unit: 'angle' },
                  { label: 'Distance', value: hit.distance != null ? `${hit.distance.toFixed(0)}` : '—', unit: 'feet' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl sm:rounded-2xl px-2 py-2 sm:py-3 min-w-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-lg sm:text-xl font-extrabold tabular-nums" style={{ color: isHomeRun ? '#fbbf24' : EMERALD }}>{s.value}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{s.unit}</span>
                    <span className="text-[7px] sm:text-[8px] uppercase text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 py-4 text-center text-xs" style={{ color: MUTED }}>No at-bat data yet — the game may not have started.</p>
      )}

      <p className="mt-3 text-right text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Official MLB feed · refreshes every {pollLabel}
        {updatedLabel ? ` · updated ${updatedLabel}` : ''}
        {isError && snap ? ' · showing last good snapshot' : ''}
      </p>
    </div>
  );
};

export default LiveAtBatView;
