import type { HrWatchRow } from '../types/hrWatch';

const badgeClasses = {
  official: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  projected: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  blocked: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  unknown: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
} as const;

function scoreText(value: number | null) {
  return value === null ? '—' : String(Math.round(value));
}

function TeamBanner({ row }: { row: HrWatchRow }) {
  const timeLabel = row.gameTime ? row.gameTime : 'TBD';

  return (
    <div className="grid gap-2 rounded-2xl border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-surface-raised)/0.16)] p-3 text-[11px] text-[hsl(var(--ve-text-secondary))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-[10px] font-black uppercase text-[hsl(var(--ve-text-muted))]">
            {row.teamLogoUrl ? (
              <img src={row.teamLogoUrl} alt={`${row.team} logo`} className="h-6 w-6 object-contain" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
            ) : (
              <span>{row.team.slice(0, 3).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--ve-text-muted))]">Matchup</p>
            <p className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">{row.team} vs {row.opponent}</p>
          </div>
        </div>
        <div className="min-w-[72px] text-right">
          <p className="text-[9px] uppercase tracking-[0.24em] text-[hsl(var(--ve-text-muted))]">Start</p>
          <p className="font-mono text-xs font-black text-[hsl(var(--ve-text-primary))]">{timeLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
        <div>
          <div className="font-black">Pitcher</div>
          <div className="mt-1 truncate font-semibold text-[hsl(var(--ve-text-primary))]">{row.pitcherName || 'TBD'}</div>
        </div>
        <div className="text-right">
          <div className="font-black">Mode</div>
          <div className="mt-1 truncate font-semibold text-[hsl(var(--ve-text-primary))]">{row.sourceMode}</div>
        </div>
      </div>
    </div>
  );
}

export function HrWatchCard({ row, onAddHrLeg }: { row: HrWatchRow; onAddHrLeg?: (row: HrWatchRow, target: 1 | 2) => void }) {
  const truthLabel =
    row.truthStatus === 'official'
      ? 'Official lineup'
      : row.truthStatus === 'projected'
        ? 'Projected'
        : row.truthStatus === 'blocked'
          ? 'Blocked'
          : 'Truth TBD';
  const isPreview = row.truthStatus === 'projected';

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--ve-border)/0.30)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.88),hsl(var(--ve-surface-raised)/0.44))] p-4 shadow-xl shadow-black/10 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.012] hover:border-[hsl(var(--ve-accent-cyan)/0.46)] hover:shadow-[0_18px_46px_rgba(34,211,238,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,hsl(var(--ve-accent-cyan)/0),hsl(var(--ve-accent-cyan)/0.72),hsl(var(--ve-accent-gold)/0.62),hsl(var(--ve-accent-cyan)/0))]" />

      <TeamBanner row={row} />

      <div className="mt-3 grid gap-3 border-b border-[hsl(var(--ve-border)/0.16)] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-black/20 shadow-inner">
            {row.headshotUrl ? (
              <img src={row.headshotUrl} alt={row.playerName} className="h-full w-full object-cover [image-rendering:auto]" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" />
            ) : (
              <span className="font-mono text-xs text-[hsl(var(--ve-text-muted))]">HR</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">{row.playerName}</h3>
            <p className="truncate text-[10px] font-semibold text-[hsl(var(--ve-text-muted))]">{row.team} · {row.opponent}</p>
            <p className="truncate text-[10px] text-[hsl(var(--ve-text-secondary))]">{row.pitcherName} · {row.venue}</p>
          </div>

          <div className="shrink-0 rounded-2xl border border-[hsl(var(--ve-accent-gold)/0.30)] bg-[linear-gradient(145deg,hsl(var(--ve-accent-gold)/0.13),rgba(0,0,0,0.24))] px-3 py-2 text-center shadow-[0_0_24px_rgba(245,158,11,0.10)]">
            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">HR</div>
            <div className="font-mono text-2xl font-black leading-none text-[hsl(var(--ve-accent-gold))]">{row.hrScore}</div>
            <div className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
          <div>
            <div className="font-black">Rank</div>
            <div className="mt-1 text-[11px] font-semibold text-[hsl(var(--ve-text-primary))]">{row.rank != null ? `#${row.rank}` : '—'}</div>
          </div>
          <div>
            <div className="font-black">Form</div>
            <div className="mt-1 text-[11px] font-semibold text-[hsl(var(--ve-text-primary))]">{row.recentForm != null ? String(row.recentForm) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[hsl(var(--ve-border)/0.14)] py-3 text-[9px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
        <span className={`rounded-2xl border px-2 py-1 ${badgeClasses[row.truthStatus]}`}>{truthLabel}</span>
        <span className="rounded-2xl border border-[hsl(var(--ve-accent-gold)/0.28)] bg-[hsl(var(--ve-accent-gold)/0.09)] px-2 py-1 text-[hsl(var(--ve-accent-gold))]">{row.riskTier}</span>
        <span className="rounded-2xl border border-[hsl(var(--ve-border)/0.24)] bg-black/10 px-2 py-1 text-[hsl(var(--ve-text-muted))]">{row.oddsLabel}</span>
      </div>

      {isPreview ? (
        <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[11px] font-semibold leading-snug text-amber-100">Official lineup not posted yet. Projection preview only; this player is not confirmed.</div>
      ) : null}

      {row.truthStatus === 'blocked' ? (
        <div className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[11px] font-semibold leading-snug text-rose-100">Blocked reason: Team mismatch / stale roster assignment</div>
      ) : null}

      <div className="py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted))]">Model split</span>
          <span className="ml-3 h-px flex-1 bg-[linear-gradient(90deg,hsl(var(--ve-border)/0.30),transparent)]" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-2 py-2 text-center">
            <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Hitter</div>
            <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{scoreText(row.hitterPower)}</div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-2 py-2 text-center">
            <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Pitcher</div>
            <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{scoreText(row.pitcherVulnerability)}</div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-2 py-2 text-center">
            <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Park</div>
            <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{scoreText(row.parkFactor)}</div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-2 py-2 text-center">
            <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Vouch</div>
            <div className="font-mono text-sm font-black text-[hsl(var(--ve-text-primary))]">{scoreText(row.vouchScore)}</div>
          </div>
        </div>
      </div>

      {row.reasons.length > 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,rgba(0,0,0,0.18),hsl(var(--ve-surface-raised)/0.20))] px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-muted))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--ve-accent-cyan))]" />
            Research signals
          </div>
          <div className="space-y-1.5">
            {row.reasons.slice(0, 3).map((reason) => (
              <p key={`${row.stableId}-${reason}`} className="border-l border-[hsl(var(--ve-accent-cyan)/0.30)] pl-2 text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]">{reason}</p>
            ))}
          </div>
        </div>
      ) : null}

      {row.warnings.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-2">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200/80">Safety notes</div>
          {row.warnings.map((warning) => (
            <p key={`${row.stableId}-${warning}`} className="text-[11px] leading-snug text-amber-100/85">{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-[hsl(var(--ve-border)/0.14)] pt-3">
        <details className="group">
          <summary className="list-none cursor-pointer rounded-2xl border border-[hsl(var(--ve-accent-cyan)/0.34)] bg-[linear-gradient(145deg,hsl(var(--ve-accent-cyan)/0.12),rgba(0,0,0,0.18))] px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:-translate-y-0.5 hover:border-[hsl(var(--ve-accent-cyan)/0.58)] hover:bg-[hsl(var(--ve-accent-cyan)/0.18)]">
            Parlay
          </summary>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onAddHrLeg?.(row, 1)} disabled={!onAddHrLeg} className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface)/0.96)] px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-primary))] transition hover:bg-[hsl(var(--ve-accent-cyan)/0.10)] disabled:cursor-not-allowed disabled:opacity-45">1 HR</button>
            <button type="button" onClick={() => onAddHrLeg?.(row, 2)} disabled={!onAddHrLeg} className="rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface)/0.96)] px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-primary))] transition hover:bg-[hsl(var(--ve-accent-gold)/0.10)] disabled:cursor-not-allowed disabled:opacity-45">2 HR</button>
          </div>
        </details>
      </div>
    </article>
  );
}
