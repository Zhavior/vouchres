import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { AlertTriangle, BarChart3, Database, History, ListOrdered, RotateCcw, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import PlayerHeadshot from '../parlays/PlayerHeadshot';
import { apiUrl } from '../../lib/apiBase';
import { apiClient } from '../../lib/apiClient';

type BatterSide = 'L' | 'R' | 'S' | 'U';
type PitcherHand = 'L' | 'R' | 'U';

interface BvpStats {
  ab: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  bb: number;
  k: number;
  avg: number | null;
  slg: number | null;
  ops: number | null;
  avgText?: string | null;
  slgText?: string | null;
  opsText?: string | null;
  sampleSize: number;
}

interface BatterRow {
  id: number;
  name: string;
  bats: BatterSide;
  position: string;
  lineupSpot: number | null;
  headshotUrl?: string | null;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: BvpStats | null;
  tags: string[];
}

interface PitcherMatchupResponse {
  gamePk: number;
  pitcher: {
    id: number;
    name: string;
    team: string;
    throws: PitcherHand;
    headshotUrl?: string | null;
    seasonStats: Record<string, unknown> | null;
    recentStarts: Array<Record<string, unknown>>;
  };
  opponent: {
    team: string;
    projectedLineup: BatterRow[];
  };
  warnings: string[];
}

interface Props {
  open: boolean;
  gamePk: number | null;
  pitcherId: number | null;
  date: string;
  matchupScore?: number | null;
  matchupLabel?: string | null;
  team?: string;
  opponent?: string;
  pitcherName?: string;
  pitcherHand?: PitcherHand;
  onClose: () => void;
}

type TabKey = 'lineup' | 'bvp' | 'recent' | 'splits';

interface ScheduleTeam {
  teamId?: number;
  id?: number;
  name?: string;
  abbreviation?: string;
  abbrev?: string;
}

interface SchedulePitcher {
  pitcherId?: number;
  id?: number;
  pitcherName?: string;
  name?: string;
  throws?: PitcherHand | string;
}

interface ScheduleGame {
  gamePk: number;
  gameDate?: string;
  gameTime?: string;
  awayTeam?: ScheduleTeam;
  homeTeam?: ScheduleTeam;
  away?: { teamId?: number; id?: number; name?: string; abbreviation?: string; abbrev?: string; probablePitcher?: SchedulePitcher | null };
  home?: { teamId?: number; id?: number; name?: string; abbreviation?: string; abbrev?: string; probablePitcher?: SchedulePitcher | null };
  probablePitchers?: {
    away?: SchedulePitcher | null;
    home?: SchedulePitcher | null;
  };
}

const tabs: Array<{ key: TabKey; label: string; icon: ComponentType<{ className?: string }> }> = [
  { key: 'lineup', label: 'Lineup Matchups', icon: ListOrdered },
  { key: 'bvp', label: 'Batter vs Pitcher', icon: History },
  { key: 'recent', label: 'Recent Box Score', icon: BarChart3 },
  { key: 'splits', label: 'Pitch Mix / Splits', icon: SlidersHorizontal },
];

function display(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'No data yet';
  return String(value);
}

function decimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  return value.toFixed(3).replace(/^0/, '');
}

function shortDate(value: unknown): string {
  if (typeof value !== 'string') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function StatPill({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1.5 font-mono text-base font-black text-slate-100">{display(value)}</div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.065] via-slate-950/70 to-emerald-950/15 p-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/45 to-transparent" />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
        <Database className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-black text-slate-100">{title}</div>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{detail}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-xl bg-white/10" />
        <div className="h-16 animate-pulse rounded-xl bg-white/10" />
        <div className="h-16 animate-pulse rounded-xl bg-white/10" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white/10" />
    </div>
  );
}

function tagClass(tag: string): string {
  if (tag === 'Power history' || tag === 'Contact history' || tag === 'Platoon edge') {
    return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
  }
  if (tag === 'K risk' || tag === 'Same-side challenge') {
    return 'border-orange-300/25 bg-orange-400/10 text-orange-100';
  }
  return 'border-slate-300/15 bg-slate-700/30 text-slate-300';
}

function LineupTable({ rows }: { rows: BatterRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="Lineup board pending" detail="The drawer is ready, but the trusted lineup feed has not returned opponent hitters yet. No batter rows are guessed by name." />;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/55 shadow-[0_18px_70px_rgba(2,6,23,0.35)]">
      <table className="min-w-[920px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-500">
            {['Headshot', 'Batter', 'Bats', 'Position', 'Lineup spot', 'AB vs pitcher', 'H', 'HR', 'BB', 'K', 'AVG', 'OPS', 'Tags'].map((heading) => (
              <th key={heading} className="border-b border-white/10 bg-slate-950/95 px-3 py-3 font-black">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((batter) => {
            const bvp = batter.vsPitcher;
            return (
              <tr key={batter.id} className="transition hover:bg-white/[0.035]">
                <td className="border-b border-white/10 px-3 py-3">
                  <PlayerHeadshot name={batter.name} playerId={batter.id} headshotUrl={batter.headshotUrl} size={42} />
                </td>
                <td className="border-b border-white/10 px-3 py-3">
                  <div className="font-black text-white">{batter.name}</div>
                  {batter.recentForm ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Last {batter.recentForm.games}: {batter.recentForm.hits}/{batter.recentForm.atBats}, {batter.recentForm.hr} HR, {batter.recentForm.strikeOuts} K
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-slate-500">No recent form yet</div>
                  )}
                </td>
                <td className="border-b border-white/10 px-3 py-3 font-mono font-black text-slate-200">{batter.bats}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{batter.position}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{batter.lineupSpot ?? 'Projected'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{bvp?.ab ?? '—'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{bvp?.h ?? '—'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{bvp?.hr ?? '—'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{bvp?.bb ?? '—'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{bvp?.k ?? '—'}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{decimal(bvp?.avgText ?? bvp?.avg)}</td>
                <td className="border-b border-white/10 px-3 py-3 font-mono text-slate-300">{decimal(bvp?.opsText ?? bvp?.ops)}</td>
                <td className="border-b border-white/10 px-3 py-3">
                  <div className="flex max-w-72 flex-wrap gap-1.5">
                    {batter.tags.length > 0 ? batter.tags.map((tag) => (
                      <span key={tag} className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${tagClass(tag)}`}>{tag}</span>
                    )) : <span className="text-xs text-slate-500">No data yet</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecentStarts({ starts }: { starts: Array<Record<string, unknown>> }) {
  if (!starts || starts.length === 0) {
    return <EmptyState title="Recent form pending" detail="Recent pitcher game logs are unavailable from the trusted MLB feed for this drawer." />;
  }

  return (
    <div className="grid gap-2">
      {starts.map((start, index) => (
        <div key={`${String(start.date ?? index)}-${index}`} className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.045] p-3 sm:grid-cols-5">
          <StatPill label="Date" value={shortDate(start.date)} />
          <StatPill label="IP" value={start.inningsPitched as string | number | null | undefined} />
          <StatPill label="K" value={start.strikeOuts as string | number | null | undefined} />
          <StatPill label="ER" value={start.earnedRuns as string | number | null | undefined} />
          <StatPill label="BB" value={start.baseOnBalls as string | number | null | undefined} />
        </div>
      ))}
    </div>
  );
}

function fallbackPayload({
  gamePk,
  pitcherId,
  pitcherName,
  pitcherHand,
  team,
  opponent,
}: {
  gamePk: number;
  pitcherId: number;
  pitcherName?: string;
  pitcherHand?: PitcherHand;
  team?: string;
  opponent?: string;
}): PitcherMatchupResponse {
  return {
    gamePk,
    pitcher: {
      id: pitcherId,
      name: pitcherName || `Pitcher ${pitcherId}`,
      team: team || 'Team',
      throws: pitcherHand || 'U',
      seasonStats: null,
      recentStarts: [],
    },
    opponent: {
      team: opponent || 'Opponent',
      projectedLineup: [],
    },
    warnings: [
      'Pitcher detail endpoint unavailable',
      'No data yet',
    ],
  };
}

function pitcherIdOf(pitcher?: SchedulePitcher | null): number | null {
  const id = pitcher?.pitcherId ?? pitcher?.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}

function teamIdOf(team?: ScheduleTeam | ScheduleGame['away'] | ScheduleGame['home'] | null): number | null {
  const id = team?.teamId ?? team?.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}

function teamNameOf(team?: ScheduleTeam | ScheduleGame['away'] | ScheduleGame['home'] | null): string {
  return team?.name ?? team?.abbreviation ?? team?.abbrev ?? 'Opponent';
}

function tagsForRosterFallback(bats: BatterSide, throws: PitcherHand): string[] {
  const tags = ['No history'];
  if (bats === 'S') tags.push('Platoon edge');
  else if ((bats === 'L' || bats === 'R') && (throws === 'L' || throws === 'R')) {
    tags.push(bats !== throws ? 'Platoon edge' : 'Same-side challenge');
  }
  return tags;
}

async function activeRosterFallback({
  gamePk,
  pitcherId,
  date,
  pitcherName,
  pitcherHand,
  team,
  opponent,
}: {
  gamePk: number;
  pitcherId: number;
  date: string;
  pitcherName?: string;
  pitcherHand?: PitcherHand;
  team?: string;
  opponent?: string;
}): Promise<PitcherMatchupResponse> {
  const schedulePath = date === new Date().toISOString().slice(0, 10)
    ? '/api/mlb/games/today'
    : `/api/mlb/games/date/${encodeURIComponent(date)}`;
  const schedule = await apiClient.get<{ games?: ScheduleGame[]; matchups?: ScheduleGame[] }>(schedulePath);
  const games: ScheduleGame[] = schedule.games ?? schedule.matchups ?? [];
  const game = games.find((g) => Number(g.gamePk) === gamePk);
  if (!game) throw new Error('Game fallback unavailable');

  const awayPitcher = game.probablePitchers?.away ?? game.away?.probablePitcher ?? null;
  const homePitcher = game.probablePitchers?.home ?? game.home?.probablePitcher ?? null;
  const awayTeam = game.awayTeam ?? game.away ?? null;
  const homeTeam = game.homeTeam ?? game.home ?? null;
  const isAwayPitcher = pitcherIdOf(awayPitcher) === pitcherId;
  const isHomePitcher = pitcherIdOf(homePitcher) === pitcherId;
  const opponentTeam = isAwayPitcher ? homeTeam : isHomePitcher ? awayTeam : null;
  const pitcherTeam = isAwayPitcher ? awayTeam : isHomePitcher ? homeTeam : null;
  const opponentTeamId = teamIdOf(opponentTeam);
  if (!opponentTeamId) throw new Error('Opponent roster unavailable');

  const rosterRes = await fetch(`https://statsapi.mlb.com/api/v1/teams/${opponentTeamId}/roster?rosterType=active`, {
    headers: { accept: 'application/json' },
  });
  if (!rosterRes.ok) throw new Error('Active roster unavailable');
  const rosterJson = await rosterRes.json();
  const roster = (rosterJson.roster ?? [])
    .filter((entry: any) => entry?.person?.id && entry?.position?.abbreviation && entry.position.abbreviation !== 'P');

  const ids = roster.map((entry: any) => entry.person.id as number);
  const people = new Map<number, any>();
  if (ids.length > 0) {
    const peopleRes = await fetch(`https://statsapi.mlb.com/api/v1/people?personIds=${ids.join(',')}`, {
      headers: { accept: 'application/json' },
    }).catch(() => null);
    if (peopleRes?.ok) {
      const peopleJson = await peopleRes.json();
      for (const person of peopleJson.people ?? []) {
        if (person?.id) people.set(person.id, person);
      }
    }
  }

  const throws = pitcherHand || 'U';
  const projectedLineup: BatterRow[] = roster.map((entry: any, index: number) => {
    const id = entry.person.id as number;
    const person = people.get(id);
    const bats = person?.batSide?.code === 'L' || person?.batSide?.code === 'R' || person?.batSide?.code === 'S'
      ? person.batSide.code
      : 'U';
    return {
      id,
      name: person?.fullName ?? entry.person.fullName ?? `Player ${id}`,
      bats,
      position: entry.position?.abbreviation ?? person?.primaryPosition?.abbreviation ?? '—',
      lineupSpot: null,
      recentForm: null,
      vsPitcher: null,
      tags: tagsForRosterFallback(bats, throws),
    };
  });

  return {
    gamePk,
    pitcher: {
      id: pitcherId,
      name: pitcherName || `Pitcher ${pitcherId}`,
      team: teamNameOf(pitcherTeam) || team || 'Team',
      throws,
      seasonStats: null,
      recentStarts: [],
    },
    opponent: {
      team: teamNameOf(opponentTeam) || opponent || 'Opponent',
      projectedLineup,
    },
    warnings: [
      'Active roster fallback',
      'Projected lineup may change',
      'BvP can be small sample',
    ],
  };
}

export default function PitcherMatchupDrawer({
  open,
  gamePk,
  pitcherId,
  date,
  matchupScore,
  matchupLabel,
  team,
  opponent,
  pitcherName,
  pitcherHand,
  onClose,
}: Props) {
  const [tab, setTab] = useState<TabKey>('lineup');
  const [data, setData] = useState<PitcherMatchupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open || !gamePk || !pitcherId) return;
    const controller = new AbortController();
    setTab('lineup');
    setData(null);
    setError(null);
    setLoading(true);

    apiClient
      .get<PitcherMatchupResponse>(
        `/api/mlb/matchup-matrix/${gamePk}/pitcher/${pitcherId}`,
        { date },
        controller.signal,
      )
      .then(async (payload) => {
        if ((payload.opponent?.projectedLineup?.length ?? 0) > 0) {
          if (!controller.signal.aborted) setData(payload);
          return;
        }
        try {
          const roster = await activeRosterFallback({
            gamePk,
            pitcherId,
            date,
            pitcherName: pitcherName || payload.pitcher?.name,
            pitcherHand: pitcherHand || payload.pitcher?.throws,
            team: team || payload.pitcher?.team,
            opponent: opponent || payload.opponent?.team,
          });
          if (!controller.signal.aborted) {
            setData({
              ...payload,
              opponent: {
                team: payload.opponent?.team || roster.opponent.team,
                projectedLineup: roster.opponent.projectedLineup,
              },
              warnings: Array.from(new Set([
                ...(payload.warnings ?? []),
                ...(roster.warnings ?? []),
                'Live lineup empty — recovered active roster hitters',
              ])),
            });
          }
        } catch {
          if (!controller.signal.aborted) setData(payload);
        }
      })
      .catch(async (err) => {
        if (err.name !== 'AbortError') {
          try {
            setData(await activeRosterFallback({ gamePk, pitcherId, date, pitcherName, pitcherHand, team, opponent }));
          } catch {
            setData(fallbackPayload({ gamePk, pitcherId, pitcherName, pitcherHand, team, opponent }));
          }
          setError(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date, gamePk, open, opponent, pitcherHand, pitcherId, pitcherName, retryKey, team]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  const lineup = data?.opponent.projectedLineup ?? [];
  const bvpRows = useMemo(() => lineup.filter((row) => row.vsPitcher && row.vsPitcher.ab > 0), [lineup]);
  const season = data?.pitcher.seasonStats ?? null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/82 backdrop-blur-md"
        aria-label="Close pitcher matchup drawer"
        onClick={onClose}
      />

      <aside
        className="absolute inset-0 flex flex-col overflow-hidden border-white/15 bg-ve-obsidian text-slate-100 shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[min(820px,calc(100vw-2rem))] sm:rounded-[2rem] sm:border"
        role="dialog"
        aria-modal="true"
        aria-label="Pitcher matchup drawer"
      >
        <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(52,211,153,0.18),transparent_34%),radial-gradient(circle_at_92%_6%,rgba(56,189,248,0.14),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(7,7,19,0.98)_52%,rgba(20,12,44,0.96))] p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/55 to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative rounded-full bg-gradient-to-br from-emerald-300/40 via-sky-300/25 to-violet-300/20 p-1 shadow-[0_0_45px_rgba(52,211,153,0.18)]">
                <PlayerHeadshot
                  name={data?.pitcher.name ?? pitcherName ?? 'Pitcher'}
                  playerId={pitcherId}
                  headshotUrl={data?.pitcher.headshotUrl}
                  size={82}
                />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pro Pitcher Matchup
                </div>
                <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-white">{data?.pitcher.name ?? pitcherName ?? 'Loading pitcher...'}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{data?.pitcher.throws ? `${data.pitcher.throws}HP` : pitcherHand ? `${pitcherHand}HP` : 'Hand loading'}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{data?.pitcher.team ?? team ?? 'Team'} vs {data?.opponent.team ?? opponent ?? 'Opponent'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/25 hover:text-white"
              aria-label="Close drawer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            <StatPill label="Matchup score" value={matchupScore ?? null} />
            <StatPill label="Label" value={matchupLabel ?? null} />
            <StatPill label="ERA" value={season?.era as string | number | null | undefined} />
            <StatPill label="WHIP" value={season?.whip as string | number | null | undefined} />
          </div>

          <div className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-xs font-bold leading-relaxed text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            Batter-vs-pitcher history is context only. Small samples can mislead. Research/entertainment only, not betting advice.
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-ve-graphite/95 px-3 py-3 sm:px-5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                tab === key
                  ? 'border-emerald-300/45 bg-emerald-300/15 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.10)]'
                  : 'border-white/10 bg-white/[0.045] text-slate-400 hover:border-white/25 hover:bg-white/[0.07] hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.08),transparent_32%),linear-gradient(180deg,rgba(16,13,38,0.84),rgba(7,7,19,0.98)_42%)] p-3 sm:p-5">
          {loading && <LoadingSkeleton />}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-5">
              <div className="flex items-center gap-2 font-black text-rose-100">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm font-black text-rose-100"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-4">
              {data.warnings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.warnings.map((warning) => (
                    <span key={warning} className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-sky-100">
                      {warning}
                    </span>
                  ))}
                </div>
              )}

              {tab === 'lineup' && <LineupTable rows={lineup} />}
              {tab === 'bvp' && (
                bvpRows.length > 0
                  ? <LineupTable rows={bvpRows} />
                  : <EmptyState title="No BvP history yet" detail="No recorded batter-vs-pitcher plate appearances were returned for this matchup." />
              )}
              {tab === 'recent' && <RecentStarts starts={data.pitcher.recentStarts} />}
              {tab === 'splits' && (
                <EmptyState
                  title="No pitch mix or split data yet"
                  detail="The current trusted services do not expose pitch mix, whiff split, or platoon split data for this drawer."
                />
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
