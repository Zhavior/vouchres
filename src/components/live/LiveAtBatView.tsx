/**
 * LiveAtBatView — pitch-by-pitch "sweat screen" for one live game.
 *
 * Renders the current at-bat from /api/mlb/live-at-bat/:gamePk: pitch
 * sequence (type + velocity), strike-zone plot scaled to the batter's real
 * zone, and on contact a spray chart with exit velo / launch angle /
 * distance. Every number is real MLB feed data; xBA is Statcast-only and
 * deliberately not shown. Polls every 15s while mounted.
 *
 * Z8 palette: emerald = ball in play (the proof moment), rose = strikes,
 * muted white = balls, cyan = system chrome (live pulse, win prob).
 */
import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { LiveAtBatSnapshot, LiveAtBatPitch } from '../../types/liveAtBat';

const POLL_MS = 15_000;

const EMERALD = '#00FF94';
const CYAN = '#00F0FF';
const ROSE = '#fb7185';
const MUTED = 'rgba(255,255,255,0.4)';
const FAINT = 'rgba(255,255,255,0.12)';

function pitchColor(p: LiveAtBatPitch): string {
  if (p.isInPlay) return EMERALD;
  if (p.isStrike) return ROSE;
  return MUTED;
}

/* ── Strike zone plot ─────────────────────────────────────────────────────── */

const StrikeZonePlot: React.FC<{ pitches: LiveAtBatPitch[] }> = ({ pitches }) => {
  const located = pitches.filter((p) => p.px != null && p.pz != null);
  const szTop = located.find((p) => p.szTop != null)?.szTop ?? 3.4;
  const szBot = located.find((p) => p.szBot != null)?.szBot ?? 1.6;

  // Feet-space window around the zone (catcher's view), y flipped for SVG.
  const X_MIN = -1.7, X_MAX = 1.7;
  const Y_TOP = szTop + 0.8, Y_BOT = Math.max(0, szBot - 0.9);
  const W = 200, H = 230;
  const sx = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
  const sy = (z: number) => ((Y_TOP - z) / (Y_TOP - Y_BOT)) * H;

  const zx = sx(-0.83), zw = sx(0.83) - sx(-0.83);
  const zy = sy(szTop), zh = sy(szBot) - sy(szTop);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Strike zone pitch locations" style={{ display: 'block', maxWidth: 220, margin: '0 auto' }}>
      {/* zone with rule-of-thirds grid */}
      <rect x={zx} y={zy} width={zw} height={zh} fill="rgba(255,255,255,0.03)" stroke={FAINT} strokeWidth={1.5} rx={2} />
      {[1, 2].map((i) => (
        <React.Fragment key={i}>
          <line x1={zx + (zw / 3) * i} y1={zy} x2={zx + (zw / 3) * i} y2={zy + zh} stroke={FAINT} strokeWidth={0.75} />
          <line x1={zx} y1={zy + (zh / 3) * i} x2={zx + zw} y2={zy + (zh / 3) * i} stroke={FAINT} strokeWidth={0.75} />
        </React.Fragment>
      ))}
      {/* home plate hint */}
      <path d={`M${sx(-0.7)},${H - 12} L${sx(0.7)},${H - 12} L${sx(0.45)},${H - 4} L${sx(-0.45)},${H - 4} Z`} fill="none" stroke={FAINT} strokeWidth={1} />
      {/* pitches, in order so later ones sit on top */}
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

/* ── Spray chart ──────────────────────────────────────────────────────────── */
// MLB Gameday hit coordinates live on a ~250x250 grid, home plate at the
// bottom-center (~125, 200), y increasing toward the plate — matches SVG.

const SprayChart: React.FC<{ coordX: number; coordY: number; isHomeRun: boolean }> = ({ coordX, coordY, isHomeRun }) => {
  const HOME_X = 125, HOME_Y = 199;
  return (
    <svg viewBox="0 15 250 200" width="100%" role="img" aria-label="Batted ball landing spot" style={{ display: 'block', maxWidth: 260, margin: '0 auto' }}>
      {/* outfield */}
      <path d={`M${HOME_X},${HOME_Y} L25,99 Q125,8 225,99 Z`} fill="rgba(0,255,148,0.05)" stroke={FAINT} strokeWidth={1.5} />
      {/* infield diamond */}
      <path d={`M${HOME_X},${HOME_Y} L163,161 L125,123 L87,161 Z`} fill="rgba(255,255,255,0.04)" stroke={FAINT} strokeWidth={1} />
      {/* infield arc (grass line) */}
      <path d="M73,147 Q125,95 177,147" fill="none" stroke={FAINT} strokeWidth={0.75} strokeDasharray="3 3" />
      {/* bases */}
      {[[163, 161], [125, 123], [87, 161]].map(([x, y], i) => (
        <rect key={i} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="rgba(255,255,255,0.35)" transform={`rotate(45 ${x} ${y})`} />
      ))}
      {/* landing spot */}
      <circle cx={coordX} cy={coordY} r={6} fill={isHomeRun ? '#fbbf24' : EMERALD} stroke="#050505" strokeWidth={1.5} />
      <circle cx={coordX} cy={coordY} r={10} fill="none" stroke={isHomeRun ? '#fbbf24' : EMERALD} strokeOpacity={0.5} strokeWidth={1}>
        <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

/* ── Main view ────────────────────────────────────────────────────────────── */

export const LiveAtBatView: React.FC<{ gamePk: number }> = ({ gamePk }) => {
  const [snap, setSnap] = useState<LiveAtBatSnapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let alive = true;
    setSnap(null);
    setState('loading');

    const load = async () => {
      try {
        const next = await vouchedgeApi.liveAtBat(gamePk);
        if (!alive) return;
        setSnap(next);
        setState('ready');
      } catch {
        if (!alive) return;
        setState((prev) => (prev === 'ready' ? 'ready' : 'unavailable'));
      }
    };

    load();
    const id = window.setInterval(load, POLL_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, [gamePk]);

  if (state === 'loading') {
    return (
      <div className="glass-panel glass-border rounded-2xl p-6 text-center text-xs font-semibold" style={{ color: MUTED }}>
        Loading live at-bat from the official MLB feed…
      </div>
    );
  }

  if (state === 'unavailable' || !snap) {
    return (
      <div className="glass-panel glass-border rounded-2xl p-6 text-center text-xs font-semibold" style={{ color: MUTED }}>
        Live at-bat feed unavailable for this game right now.
      </div>
    );
  }

  const { play } = snap;
  const pitches = play?.pitches ?? [];
  const hit = play?.hit ?? null;
  const isHomeRun = /homers|home run|grand slam/i.test(play?.description ?? '');
  const hasSpray = hit?.coordX != null && hit?.coordY != null;

  return (
    <div className="glass-panel glass-border rounded-2xl p-4 sm:p-5">
      {/* Header: score · inning · outs · win prob */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-white/90">
          <span>{snap.away.abbr} {snap.away.runs ?? '–'}</span>
          <span className="text-white/30">@</span>
          <span>{snap.home.abbr} {snap.home.runs ?? '–'}</span>
          {snap.inning != null && (
            <span className="ml-1 text-[11px] font-semibold text-white/40">
              {snap.halfInning ?? ''} {snap.inning}{snap.outs != null ? ` · ${snap.outs} out${snap.outs !== 1 ? 's' : ''}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {snap.winProb && (
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: 'rgba(0,240,255,0.08)', color: CYAN, border: '1px solid rgba(0,240,255,0.25)' }}>
              {snap.winProb.homePct >= 50
                ? `${snap.home.abbr} ${snap.winProb.homePct.toFixed(1)}%`
                : `${snap.away.abbr} ${snap.winProb.awayPct.toFixed(1)}%`} win prob
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: CYAN }}>
            <Activity className="h-3 w-3 animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* Play line */}
      {play ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            {play.batter.headshot && (
              <img src={play.batter.headshot} alt={play.batter.name} className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">
                {play.isComplete && play.description ? play.description : `${play.batter.name} at bat…`}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                {play.batter.name}{play.batter.gameLine ? ` · ${play.batter.gameLine}` : ''}
                <span className="mx-1.5 text-white/20">|</span>
                {play.pitcher.name}{play.pitcher.gameLine ? ` · ${play.pitcher.gameLine}` : ''}
              </p>
            </div>
          </div>

          {/* Pitch sequence + zone */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Pitch Sequence</p>
              {pitches.length === 0 && (
                <p className="py-4 text-xs" style={{ color: MUTED }}>Waiting for the first pitch…</p>
              )}
              {[...pitches].reverse().map((p) => {
                const color = pitchColor(p);
                return (
                  <div key={p.number} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style={{ background: color, color: '#050505' }}>
                      {p.number}
                    </span>
                    <span className="text-sm font-bold text-white/90">{p.result}</span>
                    <span className="ml-auto text-[11px] font-mono" style={{ color: MUTED }}>
                      {p.pitchType ?? '—'}{p.velo != null ? ` · ${p.velo.toFixed(1)} mph` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Strike Zone (catcher's view)</p>
              <StrikeZonePlot pitches={pitches} />
            </div>
          </div>

          {/* Batted ball */}
          {hit && (
            <div className="mt-4 grid gap-4 border-t border-white/5 pt-4 sm:grid-cols-2">
              {hasSpray && (
                <div>
                  <p className="mb-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Batted Ball</p>
                  <SprayChart coordX={hit.coordX!} coordY={hit.coordY!} isHomeRun={isHomeRun} />
                </div>
              )}
              <div className="grid grid-cols-3 content-center gap-2">
                {[
                  { label: 'Exit Velo', value: hit.ev != null ? `${hit.ev.toFixed(1)}` : '—', unit: 'mph' },
                  { label: 'Launch', value: hit.la != null ? `${hit.la.toFixed(0)}°` : '—', unit: 'angle' },
                  { label: 'Distance', value: hit.distance != null ? `${hit.distance.toFixed(0)}` : '—', unit: 'feet' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-2xl px-2 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-xl font-extrabold tabular-nums" style={{ color: isHomeRun ? '#fbbf24' : EMERALD }}>{s.value}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{s.unit}</span>
                    <span className="text-[8px] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</span>
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
        Official MLB feed · refreshes every 15s
      </p>
    </div>
  );
};

export default LiveAtBatView;
