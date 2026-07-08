import { Bell, Clock3, Gauge, ShieldCheck, Trophy } from 'lucide-react';
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
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'emerald' | 'cyan' | 'neutral';
}) {
  const toneClass =
    tone === 'cyan' ? 'text-vouch-cyan' : tone === 'emerald' ? 'text-vouch-emerald' : 'text-white';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="terminal-text">{label}</div>
      <div className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-white/42">{detail}</div>
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
    <section className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="terminal-text text-vouch-emerald">Personal edge summary</div>
            <h2 className="mt-1 text-lg font-black text-white">Your current betting environment</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-black text-white/60">
            {loading ? 'Syncing' : 'Ready'}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Today's slate" value={fmt(summary.gameCount)} detail="MLB games loaded" tone="cyan" />
          <Tile label="Edges" value={String(summary.edgeCount)} detail={statusCopy} />
          <Tile label="Saved activity" value={String(summary.pendingSlipCount)} detail={`${summary.settledSlipCount} settled slips`} tone="neutral" />
          <Tile label="Tracked" value={String(summary.favoriteCount)} detail="Players or teams from saved slips" tone="cyan" />
        </div>
      </div>

      <aside className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-2xl">
        <div className="terminal-text text-vouch-cyan">Account signal</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Gauge className="mb-2 h-4 w-4 text-vouch-emerald" />
            <div className="text-xl font-black">{summary.winRate == null ? '—' : `${summary.winRate.toFixed(1)}%`}</div>
            <div className="terminal-text mt-1">Win rate</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Trophy className="mb-2 h-4 w-4 text-vouch-cyan" />
            <div className="text-xl font-black">{summary.tierLabel}</div>
            <div className="terminal-text mt-1">Tier</div>
          </div>
        </div>
        <div className="mt-3 space-y-2 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-vouch-emerald" />
            <span>Confirmed rows only appear after official lineup checks pass.</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-vouch-cyan" />
            <span>Saved picks and tracked players drive the personal strip.</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-white/40" />
            <span>{summary.generatedAt ? `Last backend sync ${new Date(summary.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Waiting for backend sync.'}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}
