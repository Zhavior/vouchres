import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from '../../lib/motion';
import { Activity, BarChart3, Crosshair, Plus, RefreshCw, Sparkles, TrendingUp, X } from 'lucide-react';
import type { MLBPlayer, Vouch } from '../../types';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import { resolveParlayPlayerRole } from '../../lib/parlays/parlayMarketCatalog';
import {
  AuroraMaxControl,
  AuroraMaxEyebrow,
  AuroraMaxFallback,
  AuroraMaxPanel,
  AuroraMaxTruthBadge,
} from '../aurora-max/AuroraMaxPrimitives';
import { usePlayerEdgeResearch, type PlayerEdgeResearchPayload } from '../../pages/pro/usePlayerEdgeResearch';
import {
  UNKNOWN,
  applyEdgeResearchToPlayer,
  formatPct,
  formatRate,
  formatVelo,
} from './applyEdgeResearch';
import { AURORA_DISPLAY, AURORA_LABEL } from '../../theme/auroraTokens';

export type DetailTab = 'overview' | 'statcast' | 'gamelog' | 'matchup' | 'ai' | 'markets';

type DossierProps = {
  player: MLBPlayer;
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onAddLeg: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; truthLabel?: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  aiReport?: string;
  researching: boolean;
  onRunAI: (research: PlayerEdgeResearchPayload | null) => void;
  onDossierReady: (player: MLBPlayer) => void;
};

export function AuroraMaxPlayerDossier({
  player,
  tab,
  onTabChange,
  onClose,
  onAddLeg,
  onSaveVouch: _onSaveVouch,
  aiReport,
  researching,
  onRunAI,
  onDossierReady,
}: DossierProps) {
  const edge = usePlayerEdgeResearch(player.id);
  const dossier = useMemo(() => applyEdgeResearchToPlayer(player, edge.data), [player, edge.data]);
  const notifiedKey = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();
  const enterY = reduceMotion ? 0 : 12;
  const enterMs = reduceMotion ? 0 : 0.22;

  useEffect(() => {
    if (!edge.data) return;
    const key = `${edge.data.playerId}:${edge.data.updatedAt}`;
    if (notifiedKey.current === key) return;
    notifiedKey.current = key;
    onDossierReady(applyEdgeResearchToPlayer(player, edge.data));
  }, [edge.data, player, onDossierReady]);

  const openParlayPicker = (initialFamily: 'home_runs' | 'hits' | 'rbi' | 'stolen_base' | 'pitcher' = 'home_runs') => {
    const hrProp = dossier.propositions.find((prop) => /home run|\bhr\b/i.test(`${prop.market} ${prop.spec}`));
    const isPitcher = resolveParlayPlayerRole({ position: dossier.position }) === 'pitcher';
    openParlayAdd({
      player: dossier,
      propHint: hrProp
        ? {
            id: hrProp.id,
            market: hrProp.market,
            odds: hrProp.odds,
            spec: hrProp.spec,
            playerId: dossier.id,
          }
        : undefined,
      initialFamily,
      isPitcher,
      source: isPitcher ? 'pitcher_research' : 'player_research',
      dataStatus: edge.data ? 'official' : 'unknown',
    });
  };

  const tabs: { id: DetailTab; label: string; icon: typeof Activity }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'statcast', label: 'Statcast', icon: BarChart3 },
    { id: 'gamelog', label: 'Game log', icon: TrendingUp },
    { id: 'matchup', label: 'Matchup', icon: Crosshair },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'markets', label: 'Markets', icon: Plus },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: enterMs, ease: [0.22, 1, 0.36, 1] }}
        className="pr-max-dossier-scrim"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: enterY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: enterY }}
          transition={{ duration: enterMs, ease: [0.22, 1, 0.36, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="pr-max-dossier flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aurora-max-player-name"
        >
          <div className="flex items-center gap-4 border-b border-[var(--aurora-max-line)] p-5">
            <img src={dossier.headshot} alt="" className="h-16 w-16 rounded-md object-cover" loading="lazy" decoding="async" />
            <div className="min-w-0 flex-1">
              <AuroraMaxEyebrow>Official MLB evidence</AuroraMaxEyebrow>
              <h2 id="aurora-max-player-name" className={`${AURORA_DISPLAY} text-xl text-[var(--aurora-max-paper)]`}>{dossier.name}</h2>
              <p className="truncate text-xs text-[var(--aurora-max-muted)]">
                {dossier.team} · {dossier.position} · B/T {dossier.bats}/{dossier.throws}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AuroraMaxTruthBadge state={edge.loading ? 'projected' : edge.data ? 'live' : 'warning'}>
                  {edge.loading ? 'Loading stats' : edge.data ? 'Edge research live' : edge.error || 'Stats unavailable'}
                </AuroraMaxTruthBadge>
                <span className="text-[10px] text-[var(--aurora-max-muted)]">{dossier.injuryStatus}</span>
              </div>
            </div>
            <AuroraMaxControl tone="primary" onClick={() => openParlayPicker('home_runs')} className="px-3 py-2 text-[10px]">
              <Plus className="h-3.5 w-3.5" /> ParlayOS
            </AuroraMaxControl>
            <AuroraMaxControl onClick={onClose} className="h-9 w-9 p-0" aria-label="Close player desk">
              <X className="h-5 w-5" />
            </AuroraMaxControl>
          </div>

          <div className="flex flex-wrap border-b border-[var(--aurora-max-line)] px-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`pr-max-dossier-tab flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider ${
                  tab === item.id
                    ? 'border-[var(--aurora-max-emerald)] text-[var(--aurora-max-emerald)]'
                    : 'border-transparent text-[var(--aurora-max-muted)]'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" /> {item.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div key={tab} className="pr-max-tab-pane">
              {tab === 'overview' && <OverviewTab player={dossier} research={edge.data} loading={edge.loading} onOpenParlay={() => openParlayPicker('home_runs')} />}
              {tab === 'statcast' && <StatcastTab research={edge.data} loading={edge.loading} />}
              {tab === 'gamelog' && <GameLogTab player={dossier} loading={edge.loading} />}
              {tab === 'matchup' && <MatchupTab research={edge.data} loading={edge.loading} />}
              {tab === 'ai' && <AITab player={dossier} report={aiReport} researching={researching} onRun={() => onRunAI(edge.data)} />}
              {tab === 'markets' && <MarketsTab player={dossier} onAddLeg={onAddLeg} />}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="pr-max-stat rounded-md p-3 text-center">
      <div className={`${AURORA_LABEL} text-[var(--aurora-max-muted)]`}>{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold text-[var(--aurora-max-paper)]">{value}</div>
    </div>
  );
}

function OverviewTab({
  player,
  research,
  loading,
  onOpenParlay,
}: {
  player: MLBPlayer;
  research: PlayerEdgeResearchPayload | null;
  loading: boolean;
  onOpenParlay: () => void;
}) {
  const season = research?.season;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-xs text-[var(--aurora-max-muted)]">
          Season line from MLB Stats API. RBI is not in this feed. Open ParlayOS to add a prop.
        </p>
        <AuroraMaxControl tone="primary" onClick={onOpenParlay} className="px-3 py-2 text-[10px]">
          <Plus className="h-3.5 w-3.5" /> Home runs & props
        </AuroraMaxControl>
      </div>
      {loading && !season ? (
        <AuroraMaxFallback compact title="Loading season line" detail="Reading official MLB hitting stats." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCell label="AVG" value={player.seasonStats.avg || UNKNOWN} />
          <StatCell label="HR" value={player.seasonStats.hr || UNKNOWN} />
          <StatCell label="OBP" value={player.seasonStats.obp || UNKNOWN} />
          <StatCell label="OPS" value={player.seasonStats.ops || UNKNOWN} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="SLG" value={player.seasonStats.slg || UNKNOWN} />
        <StatCell label="PA" value={season ? String(season.plateAppearances) : UNKNOWN} />
        <StatCell label="SB" value={season ? String(season.stolenBases) : UNKNOWN} />
        <StatCell label="RBI" value={UNKNOWN} />
      </div>
      {research?.rolling14Day ? (
        <AuroraMaxPanel className="p-3">
          <AuroraMaxEyebrow>Last 14 days</AuroraMaxEyebrow>
          <p className="mt-2 font-mono text-sm text-[var(--aurora-max-paper)]">
            {research.rolling14Day.games} G · {research.rolling14Day.homeRuns} HR · {research.rolling14Day.hits} H · {research.rolling14Day.atBats} AB
          </p>
        </AuroraMaxPanel>
      ) : null}
      {research?.warnings.length ? (
        <ul className="space-y-1 text-[11px] text-[var(--aurora-max-muted)]">
          {research.warnings.slice(0, 4).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatcastTab({ research, loading }: { research: PlayerEdgeResearchPayload | null; loading: boolean }) {
  const sc = research?.statcast;
  const disc = research?.plateDiscipline;
  const spray = research?.sprayProfile;
  if (loading && !sc) {
    return <AuroraMaxFallback compact title="Loading Statcast" detail="Season quality from Baseball Savant. Players under the PA threshold stay blank." />;
  }
  if (!sc && !disc && !spray) {
    return <AuroraMaxFallback title="Statcast unavailable" detail="No Savant season row for this batter. Nothing is estimated." />;
  }
  const rows = [
    { label: 'Barrel %', value: formatPct(sc?.barrelPct) },
    { label: 'Hard-hit %', value: formatPct(sc?.hardHitPct) },
    { label: 'Exit velo', value: formatVelo(sc?.avgExitVelo) },
    { label: 'Launch angle', value: sc?.avgLaunchAngle == null ? UNKNOWN : `${sc.avgLaunchAngle.toFixed(1)}°` },
    { label: 'xwOBA', value: formatRate(sc?.xwoba) },
    { label: 'xSLG', value: formatRate(sc?.xslg) },
    { label: 'xBA', value: formatRate(sc?.xba) },
    { label: 'Sweet spot', value: formatPct(sc?.sweetSpotPct) },
    { label: 'Chase %', value: formatPct(disc?.chasePct) },
    { label: 'Whiff %', value: formatPct(disc?.whiffPct) },
    { label: 'Pull %', value: formatPct(spray?.pullPct) },
    { label: 'FB %', value: formatPct(spray?.fbPct) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="pr-max-stat rounded-md p-3">
          <div className={`${AURORA_LABEL} text-[var(--aurora-max-muted)]`}>{row.label}</div>
          <div className="mt-1 font-mono text-lg font-bold">{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function GameLogTab({ player, loading }: { player: MLBPlayer; loading: boolean }) {
  if (loading && player.gameLogs.length === 0) {
    return <AuroraMaxFallback compact title="Loading game log" detail="Season games from MLB Stats API." />;
  }
  if (player.gameLogs.length === 0) {
    return <AuroraMaxFallback title="No game log" detail="The official season log has not returned rows for this player." />;
  }
  return (
    <div className="flex flex-col gap-2">
      {player.gameLogs.slice(0, 25).map((game, index) => (
        <div key={`${game.date}-${game.opponent}-${index}`} className="pr-max-stat flex flex-wrap items-center gap-3 rounded-md p-3">
          <div className="w-20 font-mono text-[10px] text-[var(--aurora-max-muted)]">{game.date}</div>
          <div className="min-w-0 flex-1 text-xs">vs {game.opponent}</div>
          <div className="flex gap-2 font-mono text-xs">
            <span>{game.ab} AB</span>
            <span>{game.h} H</span>
            <span className={game.hr > 0 ? 'text-[var(--aurora-max-emerald)]' : ''}>{game.hr} HR</span>
            <span>{game.rbi} RBI</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchupTab({ research, loading }: { research: PlayerEdgeResearchPayload | null; loading: boolean }) {
  if (loading && !research) {
    return <AuroraMaxFallback compact title="Loading matchup" detail="BvP needs today's probable pitcher. Pitch mix is season-level Savant." />;
  }
  const bvp = research?.batterVsPitcher;
  const mix = research?.pitchMix ?? [];
  return (
    <div className="flex flex-col gap-4">
      <AuroraMaxPanel className="p-3">
        <AuroraMaxEyebrow>Batter vs pitcher</AuroraMaxEyebrow>
        {bvp?.ab ? (
          <p className="mt-2 font-mono text-sm">
            {bvp.ab} AB · {bvp.hr} HR · {formatRate(bvp.avg)} AVG · {formatRate(bvp.ops)} OPS
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--aurora-max-muted)]">UNKNOWN — needs today's probable pitcher ID.</p>
        )}
      </AuroraMaxPanel>
      {mix.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[var(--aurora-max-line)]">
                {['Pitch', 'Usage', 'xwOBA', 'Whiff', 'Hard-hit'].map((h) => (
                  <th key={h} className="px-2 py-2 text-left font-mono text-[9px] uppercase text-[var(--aurora-max-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mix.slice(0, 8).map((row) => (
                <tr key={row.pitchType} className="border-b border-[var(--aurora-max-line)]">
                  <td className="px-2 py-2 text-xs">{row.pitchName || row.pitchType}</td>
                  <td className="px-2 py-2 font-mono text-xs">{formatPct(row.pitchUsage)}</td>
                  <td className="px-2 py-2 font-mono text-xs">{formatRate(row.xwoba)}</td>
                  <td className="px-2 py-2 font-mono text-xs">{formatPct(row.whiffPct)}</td>
                  <td className="px-2 py-2 font-mono text-xs">{formatPct(row.hardHitPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AuroraMaxFallback compact title="Pitch mix unavailable" detail="No Savant pitch-type rows for this batter." />
      )}
    </div>
  );
}

function AITab({ player, report, researching, onRun }: { player: MLBPlayer; report?: string; researching: boolean; onRun: () => void }) {
  if (report) {
    return (
      <div className="flex flex-col gap-3">
        <AuroraMaxTruthBadge state="projected">Model brief · not a guarantee</AuroraMaxTruthBadge>
        <AuroraMaxPanel className="whitespace-pre-wrap p-4 text-sm leading-6 text-[var(--aurora-max-paper)]/80">{report}</AuroraMaxPanel>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Sparkles className="h-8 w-8 text-[var(--aurora-max-emerald)]/50" />
      <p className="text-sm text-[var(--aurora-max-muted)]">Write a brief from the official stats already loaded for {player.name}.</p>
      <AuroraMaxControl tone="primary" onClick={onRun} disabled={researching} className="px-4 py-2">
        {researching ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Researching</> : <><Sparkles className="h-3.5 w-3.5" /> Generate report</>}
      </AuroraMaxControl>
    </div>
  );
}

function MarketsTab({ player, onAddLeg }: { player: MLBPlayer; onAddLeg: DossierProps['onAddLeg'] }) {
  return (
    <div className="flex flex-col gap-2">
      {player.propositions.map((prop) => (
        <div key={prop.id} className="pr-max-stat flex items-center justify-between gap-3 rounded-md p-3">
          <div className="min-w-0">
            <div className="text-sm font-bold">{prop.market}</div>
            <div className="text-[10px] text-[var(--aurora-max-muted)]">{prop.spec} · {prop.truthLabel}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-sm text-[var(--aurora-max-emerald)]">{prop.odds == null ? 'Odds TBD' : prop.odds.toFixed(2)}</span>
            <AuroraMaxControl tone="primary" onClick={() => onAddLeg(player, prop)} className="px-3 py-1.5 text-[10px]">Add</AuroraMaxControl>
          </div>
        </div>
      ))}
    </div>
  );
}
