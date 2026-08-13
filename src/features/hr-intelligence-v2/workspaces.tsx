import { AuroraMaxControl, AuroraMaxFallback, AuroraMaxRankedWorkspace, AuroraMaxTruthBadge } from '../../components/aurora-max/AuroraMaxPrimitives';
import { modelEdgePct, oddsDisplay } from '../hr/engine/signalScore';
import type { HrWatchRow } from '../hr/types/hrWatch';
import { WORKSPACES, type HrWorkspaceId } from './contracts';
import { finite, truthLabel, truthState } from './truth';
import { formatPct, formatSignedPct } from './format';

interface WorkspaceNavProps {
  active: HrWorkspaceId;
  onChange: (id: HrWorkspaceId) => void;
}

export function WorkspaceNav({ active, onChange }: WorkspaceNavProps) {
  return (
    <div className="hr-intel-v2-tabs" role="tablist" aria-label="HR Intelligence workspaces">
      {WORKSPACES.map((workspace) => (
        <AuroraMaxControl
          key={workspace.id}
          role="tab"
          aria-selected={active === workspace.id}
          aria-pressed={active === workspace.id}
          title={workspace.description}
          onClick={() => onChange(workspace.id)}
        >
          {workspace.label}
        </AuroraMaxControl>
      ))}
    </div>
  );
}

export function EdgeWorkspace({ rows, onSelect }: { rows: readonly HrWatchRow[]; onSelect: (row: HrWatchRow) => void }) {
  const priced = rows
    .map((row) => ({ row, edge: modelEdgePct(row), odds: oddsDisplay(row) }))
    .filter((entry) => entry.edge != null)
    .sort((left, right) => (right.edge ?? -Infinity) - (left.edge ?? -Infinity));

  if (priced.length === 0) {
    return (
      <AuroraMaxFallback
        title="Market unavailable"
        detail="Edge Desk stays closed unless both model probability and book implied probability are present. Missing prices are not treated as zero edge."
      />
    );
  }

  return (
    <AuroraMaxRankedWorkspace title="Edge Desk" subtitle="Model HR probability minus book implied probability. Negative edges stay negative.">
      <div role="list" aria-label="Priced HR edges">
        {priced.map(({ row, edge, odds }, index) => {
          const tone = (edge ?? 0) >= 0 ? 'confirmed' : 'warning';
          return (
            <button
              key={row.stableId}
              type="button"
              className="hr-intel-v2-row"
              onClick={() => onSelect(row)}
            >
              <span className="font-mono text-[10px] text-white/28">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <strong className="block truncate text-xs font-black">{row.playerName}</strong>
                <span className="block truncate text-[10px] text-white/42">{odds ?? 'Odds posted'} · model {formatPct(row.hrProbability)} vs book {formatPct(row.impliedProbability)}</span>
              </span>
              <AuroraMaxTruthBadge state={tone === 'confirmed' ? 'confirmed' : 'warning'}>{formatSignedPct(edge)}</AuroraMaxTruthBadge>
            </button>
          );
        })}
      </div>
    </AuroraMaxRankedWorkspace>
  );
}

interface TeamStack {
  team: string;
  opponent: string;
  pitcherName: string | null;
  players: HrWatchRow[];
  totalHrScore: number;
  avgPower: number | null;
}

export function StacksWorkspace({ rows, onSelect }: { rows: readonly HrWatchRow[]; onSelect: (row: HrWatchRow) => void }) {
  const stacks = buildStacks(rows);
  if (stacks.length === 0) {
    return <AuroraMaxFallback title="No team stacks" detail="Stacks require at least two scored bats on the same team in the current filter." />;
  }

  return (
    <AuroraMaxRankedWorkspace title="Slate Stacks" subtitle="Team combinations ranked by combined HRPI. Missing power is omitted from averages.">
      <div className="space-y-2" role="list" aria-label="Team HR stacks">
        {stacks.map((stack, index) => (
          <article key={stack.team} className="aurora-max-panel p-3" role="listitem">
            <header className="flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] text-white/32">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-sm font-black">{stack.team} vs {stack.opponent}</h3>
                <p className="text-[10px] text-white/45">{stack.pitcherName ?? 'Pitcher TBD'} · {stack.players.length} bats · combined {Math.round(stack.totalHrScore)}</p>
              </div>
              <AuroraMaxTruthBadge state="confirmed">{stack.avgPower == null ? 'Power n/a' : `Power ${Math.round(stack.avgPower)}`}</AuroraMaxTruthBadge>
            </header>
            <ul className="mt-2">
              {stack.players.map((player) => (
                <li key={player.stableId}>
                  <button type="button" className="hr-intel-v2-row" onClick={() => onSelect(player)}>
                    <span className="font-mono text-[10px] text-white/28">{Math.round(player.hrScore)}</span>
                    <span className="min-w-0 truncate text-xs font-bold">{player.playerName}</span>
                    <AuroraMaxTruthBadge state={truthState(player.truthStatus)}>{truthLabel(player.truthStatus)}</AuroraMaxTruthBadge>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </AuroraMaxRankedWorkspace>
  );
}

const MATRIX_AXES = [
  { id: 'hitterPower', label: 'Hitter power' },
  { id: 'pitcherVulnerability', label: 'Pitcher vulnerability' },
  { id: 'hrScore', label: 'HRPI' },
  { id: 'recentForm', label: 'Recent form' },
  { id: 'parkFactor', label: 'Park' },
  { id: 'vouchScore', label: 'Vouch' },
] as const;

type MatrixAxis = (typeof MATRIX_AXES)[number]['id'];

export function MatrixWorkspace({
  rows,
  xAxis,
  yAxis,
  onXAxis,
  onYAxis,
  selectedId,
  onSelect,
}: {
  rows: readonly HrWatchRow[];
  xAxis: MatrixAxis;
  yAxis: MatrixAxis;
  onXAxis: (axis: MatrixAxis) => void;
  onYAxis: (axis: MatrixAxis) => void;
  selectedId: string | null;
  onSelect: (row: HrWatchRow) => void;
}) {
  const plotted = rows
    .map((row) => {
      const x = axisValue(row, xAxis);
      const y = axisValue(row, yAxis);
      return x == null || y == null ? null : { row, x, y };
    })
    .filter((point): point is { row: HrWatchRow; x: number; y: number } => point != null);
  const omitted = rows.length - plotted.length;

  return (
    <AuroraMaxRankedWorkspace
      title="Projection Matrix"
      subtitle="Points are omitted when either axis is missing. Missing metrics are never filled with 50."
      controls={
        <>
          <AxisSelect label="X axis" value={xAxis} onChange={onXAxis} />
          <AxisSelect label="Y axis" value={yAxis} onChange={onYAxis} />
        </>
      }
    >
      {omitted > 0 ? (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/38">{omitted} rows omitted for missing axis values</p>
      ) : null}
      {plotted.length === 0 ? (
        <AuroraMaxFallback title="Nothing to plot" detail="The selected axes do not have real values on this slate." />
      ) : (
        <div className="hr-intel-v2-plot" role="img" aria-label="HR projection scatter">
          {plotted.map(({ row, x, y }) => (
            <button
              key={row.stableId}
              type="button"
              className="hr-intel-v2-plot-point"
              style={{ left: `${x}%`, bottom: `${y}%` }}
              aria-label={`${row.playerName}, ${xAxis} ${Math.round(x)}, ${yAxis} ${Math.round(y)}`}
              aria-pressed={selectedId === row.stableId}
              title={row.playerName}
              onClick={() => onSelect(row)}
            />
          ))}
        </div>
      )}
    </AuroraMaxRankedWorkspace>
  );
}

const EXTREMES = [
  { id: 'highest-hr-score', label: 'Highest HRPI', metric: 'hrScore', direction: 'highest' },
  { id: 'strongest-power', label: 'Strongest power', metric: 'hitterPower', direction: 'highest' },
  { id: 'pitcher-exposure', label: 'Pitcher exposure', metric: 'pitcherVulnerability', direction: 'highest' },
  { id: 'best-park', label: 'Best park', metric: 'parkFactor', direction: 'highest' },
  { id: 'hottest-form', label: 'Hottest form', metric: 'recentForm', direction: 'highest' },
  { id: 'highest-confidence', label: 'Highest confidence', metric: 'dataConfidence', direction: 'highest' },
  { id: 'lowest-confidence', label: 'Lowest confidence', metric: 'dataConfidence', direction: 'lowest' },
  { id: 'lowest-hr-score', label: 'Lowest HRPI', metric: 'hrScore', direction: 'lowest' },
] as const;

type ExtremeMetric = (typeof EXTREMES)[number]['metric'];

export function ExtremesWorkspace({ rows, onSelect }: { rows: readonly HrWatchRow[]; onSelect: (row: HrWatchRow) => void }) {
  return (
    <AuroraMaxRankedWorkspace title="Matchup Extremes" subtitle="Outliers only. A metric with no real value cannot win its category.">
      <div className="grid gap-2 sm:grid-cols-2">
        {EXTREMES.map((extreme) => {
          const winner = pickExtreme(rows, extreme.metric, extreme.direction);
          return (
            <article key={extreme.id} className="aurora-max-panel p-3">
              <p className="aurora-max-eyebrow">{extreme.label}</p>
              {winner ? (
                <button type="button" className="mt-2 w-full text-left" onClick={() => onSelect(winner.row)}>
                  <strong className="block text-sm">{winner.row.playerName}</strong>
                  <span className="font-mono text-xs text-[var(--aurora-max-emerald)]">{Math.round(winner.value)}</span>
                </button>
              ) : (
                <p className="mt-2 text-[11px] text-white/40">No real {extreme.metric} values on this slate.</p>
              )}
            </article>
          );
        })}
      </div>
    </AuroraMaxRankedWorkspace>
  );
}

function AxisSelect({ label, value, onChange }: { label: string; value: MatrixAxis; onChange: (axis: MatrixAxis) => void }) {
  return (
    <label className="inline-flex min-h-9 items-center gap-2 border border-[var(--aurora-max-line)] px-3 text-[10px] font-bold">
      <span className="text-white/40">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as MatrixAxis)}
        aria-label={label}
        className="bg-transparent outline-none"
      >
        {MATRIX_AXES.map((axis) => (
          <option key={axis.id} value={axis.id}>{axis.label}</option>
        ))}
      </select>
    </label>
  );
}

function axisValue(row: HrWatchRow, axis: MatrixAxis): number | null {
  return finite(row[axis]);
}

function pickExtreme(rows: readonly HrWatchRow[], metric: ExtremeMetric, direction: 'highest' | 'lowest') {
  let winner: { row: HrWatchRow; value: number } | null = null;
  for (const row of rows) {
    const value = finite(row[metric]);
    if (value == null) continue;
    if (
      winner == null
      || (direction === 'highest' && value > winner.value)
      || (direction === 'lowest' && value < winner.value)
    ) {
      winner = { row, value };
    }
  }
  return winner;
}

function buildStacks(rows: readonly HrWatchRow[]): TeamStack[] {
  const byTeam = new Map<string, HrWatchRow[]>();
  for (const row of rows) {
    const team = row.team.trim().toUpperCase();
    if (!team) continue;
    const list = byTeam.get(team);
    if (list) list.push(row);
    else byTeam.set(team, [row]);
  }

  const stacks: TeamStack[] = [];
  for (const [team, players] of byTeam) {
    if (players.length < 2) continue;
    const ranked = [...players].sort((left, right) => right.hrScore - left.hrScore);
    const powerValues = ranked.map((row) => finite(row.hitterPower)).filter((value): value is number => value != null);
    stacks.push({
      team,
      opponent: ranked[0].opponent,
      pitcherName: ranked[0].pitcherName ?? null,
      players: ranked,
      totalHrScore: ranked.reduce((sum, row) => sum + row.hrScore, 0),
      avgPower: powerValues.length > 0 ? powerValues.reduce((sum, value) => sum + value, 0) / powerValues.length : null,
    });
  }

  return stacks.sort((left, right) => right.totalHrScore - left.totalHrScore);
}

export type { MatrixAxis };
