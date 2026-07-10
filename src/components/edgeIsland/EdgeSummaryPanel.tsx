import { Bell, Clock3, Gauge, ShieldCheck, Trophy, TrendingUp } from 'lucide-react';
import type { EdgeIslandSummary } from './edgeIslandTypes';

interface EdgeSummaryPanelProps {
  summary: EdgeIslandSummary;
  loading: boolean;
}

function fmt(value: number | null, fallback = '—'): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : fallback;
}

function Tile({
  label,
  value,
  detail,
  tone = 'emerald',
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'emerald' | 'cyan' | 'neutral';
  icon?: typeof Gauge;
}) {
  const toneClass =
    tone === 'cyan' ? 'text-vouch-cyan' : tone === 'emerald' ? 'text-vouch-emerald' : 'text-white';

  const iconTone =
    tone === 'cyan'
      ? 'border-cyan-400/20 bg-cyan-400/10 text-vouch-cyan'
      : tone === 'emerald'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-vouch-emerald'
        : 'border-white/10 bg-white/[0.04] text-white/60';

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 transition hover:border-white/18 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-2">
        <div className="terminal-text text-white/40">{label}</div>
        {Icon ? (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconTone}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className={`mt-2 text-2xl font-black tabular-nums ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold leading-5 text-white/42">{detail}</div>
    </div>
  );
}

function LineupHealthBar({ confirmed, preview }: { confirmed: number; preview: number }) {
  const total = confirmed + preview;
  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-3 py-2.5 text-xs text-white/45">
        No edge rows loaded yet — waiting on the HR board feed.
      </div>
    );
  }

  const confirmedPct = Math.round((confirmed / total) * 100);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="text-vouch-emerald">{confirmed} confirmed</span>
        <span className="text-vouch-cyan">{preview} preview</span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="bg-gradient-to-r from-vouch-emerald to-emerald-400/80 transition-all"
          style={{ width: `${confirmedPct}%` }}
        />
        <div className="flex-1 bg-cyan-400/35" />
      </div>
      <p className="mt-2 text-[10px] font-semibold text-white/40">
        {confirmed > 0
          ? `${confirmedPct}% of visible edges passed official lineup checks.`
          : 'Preview-only until official lineups post.'}
      </p>
    </div>
  );
}

export function EdgeSummaryPanel({ summary, loading }: EdgeSummaryPanelProps) {
  const statusCopy =
    summary.confirmedCount > 0
      ? `${summary.confirmedCount} official lineup edge${summary.confirmedCount === 1 ? '' : 's'} ready.`
      : summary.previewCount > 0
        ? 'Official lineups are not posted yet; preview edges are marked clearly.'
        : 'No edge rows available from the backend yet.';

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-vouch-emerald/10 blur-2xl" aria-hidden />

        <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="terminal-text text-vouch-emerald">Morning pulse</div>
            <h2 className="mt-1 text-lg font-black text-white sm:text-xl">Your current betting environment</h2>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
              loading
                ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                : 'border-emerald-400/25 bg-emerald-400/10 text-vouch-emerald'
            }`}
          >
            {loading ? 'Syncing' : 'Ready'}
          </div>
        </div>

        <div className="relative mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Today's slate" value={fmt(summary.gameCount)} detail="MLB games loaded" tone="cyan" icon={TrendingUp} />
          <Tile label="Edges" value={String(summary.edgeCount)} detail={statusCopy} tone="emerald" icon={ShieldCheck} />
          <Tile
            label="Saved activity"
            value={String(summary.pendingSlipCount)}
            detail={`${summary.settledSlipCount} settled slips`}
            tone="neutral"
            icon={Bell}
          />
          <Tile
            label="Tracked"
            value={String(summary.favoriteCount)}
            detail="Players from saved slips"
            tone="cyan"
            icon={Gauge}
          />
        </div>

        <LineupHealthBar confirmed={summary.confirmedCount} preview={summary.previewCount} />
      </div>

      <aside className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-2xl sm:p-5">
        <div className="terminal-text text-vouch-cyan">Account signal</div>
        <h3 className="mt-1 text-base font-black text-white">Proof & plan</h3>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3">
            <Gauge className="mb-2 h-4 w-4 text-vouch-emerald" />
            <div className="text-2xl font-black tabular-nums">
              {summary.winRate == null ? '—' : `${summary.winRate.toFixed(1)}%`}
            </div>
            <div className="terminal-text mt-1">Win rate</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3">
            <Trophy className="mb-2 h-4 w-4 text-vouch-cyan" />
            <div className="truncate text-xl font-black">{summary.tierLabel}</div>
            <div className="terminal-text mt-1">Tier</div>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5 text-xs leading-5 text-white/50">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" />
            <span>Confirmed rows only appear after official lineup checks pass.</span>
          </li>
          <li className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-vouch-cyan" />
            <span>Saved picks and tracked players drive the personal strip.</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <span>
              {summary.generatedAt
                ? `Last sync ${new Date(summary.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'Waiting for backend sync.'}
            </span>
          </li>
        </ul>
      </aside>
    </section>
  );
}
