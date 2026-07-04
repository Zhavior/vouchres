import React, { useMemo, useState } from 'react';
import { buildHrWatchV2Board, getRowsForHrWatchMode } from './hrWatchV2Adapter';
import type { HrWatchV2Mode, HrWatchV2Row, HrWatchV2TruthStatus } from './hrWatchV2Types';

interface DailyHrWatchV2Props {
  board: unknown;
  onSelect?: (row: HrWatchV2Row) => void;
  onAddHrLeg?: (row: HrWatchV2Row) => void;
}

const TIERS = [
  { key: 'elite', title: 'Vouch Elite HR Lens', sub: 'Highest HR score, strongest math stack', min: 82, max: 101 },
  { key: 'core', title: 'Core HR Targets', sub: 'Strong board candidates with playable research context', min: 72, max: 82 },
  { key: 'watch', title: 'Watch List', sub: 'Good tools, needs lineup or matchup confirmation', min: 62, max: 72 },
  { key: 'deep', title: 'Deep Research Darts', sub: 'Lower confidence, research-only long shots', min: 0, max: 62 },
] as const;

function formatScore(value: number | null): string {
  return value === null ? '—' : String(Math.round(value));
}

function truthLabel(status: HrWatchV2TruthStatus): string {
  if (status === 'official_lineup') return 'Official lineup';
  if (status === 'projected_unconfirmed') return 'Projected';
  if (status === 'blocked') return 'Blocked';
  return 'Truth TBD';
}

function truthClass(status: HrWatchV2TruthStatus): string {
  if (status === 'official_lineup') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (status === 'projected_unconfirmed') return 'border-amber-300/30 bg-amber-300/10 text-amber-200';
  if (status === 'blocked') return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
  return 'border-slate-400/20 bg-slate-400/10 text-slate-300';
}

function ModeButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-left transition ${
        active
          ? 'border-[hsl(var(--ve-accent-cyan)/0.46)] bg-[hsl(var(--ve-accent-cyan)/0.14)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_26px_hsl(var(--ve-accent-cyan)/0.12)]'
          : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.28)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-border)/0.48)] hover:text-[hsl(var(--ve-text-secondary))]'
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-wide">{label}</div>
      <div className="font-mono text-lg font-black">{count}</div>
    </button>
  );
}

function TeamBanner({ team, opponent }: { team: string; opponent: string }) {
  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.10)_18%,hsl(var(--ve-accent-gold)/0.12)_50%,hsl(var(--ve-accent-cyan)/0.10)_82%,transparent)] px-3 py-2 text-center">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-[linear-gradient(90deg,hsl(var(--ve-surface)/0.86),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-[linear-gradient(270deg,hsl(var(--ve-surface)/0.86),transparent)]" />
      <div className="relative">
        <div className="text-[9px] font-black uppercase tracking-[0.28em] text-[hsl(var(--ve-text-muted))]">
          Team Matchup
        </div>
        <div className="mt-0.5 truncate text-sm font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-primary))]">
          {team} <span className="text-[hsl(var(--ve-accent-gold))]">vs</span> {opponent}
        </div>
      </div>
    </div>
  );
}

function MathChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface-raised)/0.28)] px-2.5 py-2 text-center">
      <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">{label}</div>
      <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{formatScore(value)}</div>
    </div>
  );
}

function HrWatchV2Card({
  row,
  onSelect,
  onAddHrLeg,
}: {
  row: HrWatchV2Row;
  onSelect?: (row: HrWatchV2Row) => void;
  onAddHrLeg?: (row: HrWatchV2Row) => void;
}) {
  const reasons = row.reasons.slice(0, 3);
  const breakdown = row.scoreBreakdown;

  return (
    <article
      onClick={() => onSelect?.(row)}
      className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--ve-border)/0.30)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.84),hsl(var(--ve-surface-raised)/0.42))] p-3.5 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-[hsl(var(--ve-accent-cyan)/0.38)]"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,hsl(var(--ve-accent-cyan)/0.0),hsl(var(--ve-accent-cyan)/0.75),hsl(var(--ve-accent-gold)/0.65),hsl(var(--ve-accent-cyan)/0.0))]" />

      <TeamBanner team={row.team} opponent={row.opponent} />

      <div className="mb-3 flex items-start gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface-raised)/0.50)]">
          {row.headshot ? (
            <img
              src={row.headshot}
              alt={row.playerName}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xs text-[hsl(var(--ve-text-muted))]">
              HR
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">
                <span className="mr-1 font-mono text-[10px] text-[hsl(var(--ve-text-muted))]">#{row.rank ?? '—'}</span>
                {row.playerName}
              </h3>
              <p className="truncate text-[11px] font-medium text-[hsl(var(--ve-text-muted))]">
                {row.team} vs {row.opponent} · {row.pitcherName}
              </p>
              <p className="truncate text-[10px] text-[hsl(var(--ve-text-secondary))]">{row.venue}</p>
            </div>

            <div className="text-right">
              <div className="font-mono text-2xl font-black text-[hsl(var(--ve-accent-gold))]">{row.hrScore}</div>
              <div className="text-[8px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">HR Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${truthClass(row.truthStatus)}`}>
          {truthLabel(row.truthStatus)}
        </span>
        <span className="rounded-full border border-[hsl(var(--ve-accent-gold)/0.28)] bg-[hsl(var(--ve-accent-gold)/0.09)] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[hsl(var(--ve-accent-gold))]">
          {row.riskLabel}
        </span>
        <span className="rounded-full border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-surface-raised)/0.28)] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
          {row.oddsLabel}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        <MathChip label="Hitter" value={breakdown.hitterPower ?? row.recentPower} />
        <MathChip label="Pitcher" value={breakdown.pitcherVulnerability ?? row.pitcherVulnerability} />
        <MathChip label="Park" value={breakdown.parkFactor ?? row.parkFactor} />
        <MathChip label="Vouch" value={breakdown.vouchScore ?? row.vouchScore} />
      </div>

      {reasons.length > 0 && (
        <div className="mb-3 rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-3 py-2">
          <div className="mb-1 text-[9px] font-mono font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
            Research signals
          </div>
          <div className="space-y-1">
            {reasons.map((reason, index) => (
              <p key={`${row.stableId}-reason-${index}`} className="text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]">
                {reason}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 truncate text-[10px] font-mono text-[hsl(var(--ve-text-muted))]">
          {row.formTag} · {row.gamePk ? `Game ${row.gamePk}` : 'Game TBD'}
        </div>

        {onAddHrLeg && row.truthStatus !== 'blocked' && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddHrLeg(row);
            }}
            className="rounded-xl border border-[hsl(var(--ve-accent-cyan)/0.36)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--ve-accent-cyan))] transition hover:bg-[hsl(var(--ve-accent-cyan)/0.10)]"
          >
            Add HR
          </button>
        )}
      </div>
    </article>
  );
}

function TierSection({
  title,
  sub,
  rows,
  onSelect,
  onAddHrLeg,
}: {
  title: string;
  sub: string;
  rows: readonly HrWatchV2Row[];
  onSelect?: (row: HrWatchV2Row) => void;
  onAddHrLeg?: (row: HrWatchV2Row) => void;
}) {
  const [visible, setVisible] = useState(18);
  const visibleRows = rows.slice(0, visible);
  const hidden = Math.max(0, rows.length - visibleRows.length);

  if (!rows.length) return null;

  return (
    <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-surface)/0.34)] p-3">
      <div className="mb-3">
        <h2 className="text-base font-black text-[hsl(var(--ve-text-primary))]">
          {title}{' '}
          <span className="font-mono text-xs text-[hsl(var(--ve-text-muted))]">
            ({visibleRows.length}/{rows.length})
          </span>
        </h2>
        <p className="text-[11px] text-[hsl(var(--ve-text-muted))]">{sub}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRows.map((row) => (
          <HrWatchV2Card key={row.stableId} row={row} onSelect={onSelect} onAddHrLeg={onAddHrLeg} />
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setVisible((current) => Math.min(rows.length, current + 18))}
          className="mt-3 w-full rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-surface-raised)/0.30)] px-3 py-3 text-xs font-black uppercase tracking-wide text-[hsl(var(--ve-text-secondary))] transition hover:border-[hsl(var(--ve-accent-cyan)/0.44)] hover:bg-[hsl(var(--ve-accent-cyan)/0.08)] hover:text-[hsl(var(--ve-accent-cyan))]"
        >
          Load 18 more · {hidden} hidden
        </button>
      )}
    </section>
  );
}

export default function DailyHrWatchV2({ board: rawBoard, onSelect, onAddHrLeg }: DailyHrWatchV2Props) {
  const board = useMemo(() => buildHrWatchV2Board(rawBoard), [rawBoard]);
  const defaultMode: HrWatchV2Mode = board.confirmed.length ? 'confirmed' : board.curated.length ? 'curated' : 'all';
  const [mode, setMode] = useState<HrWatchV2Mode>(defaultMode);
  const [query, setQuery] = useState('');

  const activeRows = useMemo(() => {
    const rows = getRowsForHrWatchMode(board, mode);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      `${row.playerName} ${row.team} ${row.opponent} ${row.pitcherName} ${row.venue}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [board, mode, query]);

  const tieredRows = useMemo(
    () =>
      TIERS.map((tier) => ({
        ...tier,
        rows: activeRows.filter((row) => row.hrScore >= tier.min && row.hrScore < tier.max),
      })),
    [activeRows],
  );

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-[hsl(var(--ve-border)/0.30)] bg-[radial-gradient(circle_at_top_left,hsl(var(--ve-accent-cyan)/0.16),transparent_34%),linear-gradient(145deg,hsl(var(--ve-surface)/0.86),hsl(var(--ve-surface-raised)/0.42))] p-4 shadow-2xl shadow-black/10">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-[hsl(var(--ve-accent-cyan)/0.28)] bg-[hsl(var(--ve-accent-cyan)/0.08)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-accent-cyan))]">
              Daily HR Watch V2
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
              Home Run Truth Lens
            </h1>
            <p className="max-w-2xl text-sm text-[hsl(var(--ve-text-muted))]">
              Fresh board, clean math, source-aware rows, no fake odds, and official/projected truth states.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ModeButton active={mode === 'confirmed'} label="Confirmed" count={board.counts.confirmed} onClick={() => setMode('confirmed')} />
            <ModeButton active={mode === 'curated'} label="Curated" count={board.counts.curated} onClick={() => setMode('curated')} />
            <ModeButton active={mode === 'all'} label="All Projected" count={board.counts.all} onClick={() => setMode('all')} />
            <ModeButton active={mode === 'blocked'} label="Blocked" count={board.counts.blocked} onClick={() => setMode('blocked')} />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player, team, pitcher, venue..."
            className="w-full rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-black/15 px-3 py-3 text-sm text-[hsl(var(--ve-text-primary))] outline-none placeholder:text-[hsl(var(--ve-text-muted))] focus:border-[hsl(var(--ve-accent-cyan)/0.42)]"
          />

          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">
            <span className="rounded-full border border-[hsl(var(--ve-border)/0.24)] px-2.5 py-1">Visible {activeRows.length}</span>
            <span className="rounded-full border border-[hsl(var(--ve-border)/0.24)] px-2.5 py-1">Truth Pool {board.counts.visibleTruthPool}</span>
            <span className="rounded-full border border-[hsl(var(--ve-border)/0.24)] px-2.5 py-1">No Fake Odds</span>
          </div>
        </div>

        {board.warnings.length > 0 && (
          <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            HR Watch payload warning: partial payload was ignored safely.
          </div>
        )}
      </section>

      {activeRows.length === 0 ? (
        <div className="rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.42)] p-6 text-center">
          <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">No rows in this V2 view yet</h2>
          <p className="mt-1 text-sm text-[hsl(var(--ve-text-muted))]">
            Try All Projected, clear search, or wait for lineup confirmation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tieredRows.map((tier) => (
            <TierSection
              key={tier.key}
              title={tier.title}
              sub={tier.sub}
              rows={tier.rows}
              onSelect={onSelect}
              onAddHrLeg={onAddHrLeg}
            />
          ))}
        </div>
      )}
    </div>
  );
}
