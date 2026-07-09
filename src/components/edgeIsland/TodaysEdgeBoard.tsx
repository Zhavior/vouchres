import { ArrowRight, Clock3, ShieldCheck } from 'lucide-react';
import { HrBrandIcon } from '../../features/hr/components/HrBrandIcon';
import { VECard } from '../ui/ve';
import type { EdgeBoardRow, EdgeIslandSectionProps } from './edgeIslandTypes';

interface TodaysEdgeBoardProps extends EdgeIslandSectionProps {
  rows: EdgeBoardRow[];
  loading: boolean;
  error: string | null;
}

function scoreTone(score: number | null): string {
  if (score == null) return 'text-white/45';
  if (score >= 80) return 'text-vouch-emerald';
  if (score >= 65) return 'text-vouch-cyan';
  return 'text-white/70';
}

export function TodaysEdgeBoard({ rows, loading, error, onSectionChange }: TodaysEdgeBoardProps) {
  return (
    <VECard strong className="p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="terminal-text text-vouch-emerald">Today's edge board</div>
          <h2 className="mt-1 text-xl font-black text-white">Strongest opportunities first</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">
            Built from the HR board payload. Confirmed rows require official lineups; preview rows stay marked until lineups post.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSectionChange('hr_board')}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-vouch-emerald transition hover:border-emerald-400/40"
        >
          Open full board
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
          {error}. Edge Island is not showing fake board rows.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5">
          <div className="text-sm font-black text-white">No edge rows from the backend yet</div>
          <p className="mt-1 text-xs text-white/45">
            Check back after the slate, probable pitchers, or safe preview candidates are available.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="hidden grid-cols-[minmax(220px,1.2fr)_120px_160px_minmax(210px,1fr)_130px_120px] gap-3 border-b border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-white/40 lg:grid">
            <div>Matchup / player</div>
            <div>Score</div>
            <div>Market</div>
            <div>Signals</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          <div className="divide-y divide-white/10">
            {rows.map((row) => (
              <article
                key={row.id}
                className="grid min-w-0 gap-3 bg-black/18 px-3 py-3 transition hover:bg-white/[0.035] lg:grid-cols-[minmax(220px,1.2fr)_120px_160px_minmax(210px,1fr)_130px_120px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <HrBrandIcon size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{row.playerName}</div>
                      <div className="truncate text-xs text-white/45">{row.team} vs {row.opponent}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`font-mono text-2xl font-black ${scoreTone(row.score)}`}>{row.score ?? '—'}</div>
                  <div className="terminal-text">confidence</div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black text-white">{row.market}</div>
                  <div className="mt-0.5 truncate text-[11px] text-white/45">{row.angle}</div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {row.signals.slice(0, 3).map((signal) => (
                    <span key={`${row.id}-${signal}`} className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold text-white/55">
                      {signal}
                    </span>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                    row.truthStatus === 'confirmed'
                      ? 'border-emerald-400/25 bg-emerald-400/10 text-vouch-emerald'
                      : 'border-cyan-300/20 bg-cyan-300/10 text-vouch-cyan'
                  }`}>
                    {row.truthStatus === 'confirmed' ? <ShieldCheck className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                    {row.truthStatus === 'confirmed' ? 'Confirmed' : 'Preview'}
                  </div>
                  <div className="text-[10px] font-semibold text-white/40">{row.gameTime || row.status}</div>
                  {row.truthStatus === 'preview' ? (
                    <div className="text-[10px] font-bold text-cyan-100/70">Official lineup not posted yet.</div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onSectionChange('player_edge_lab')}
                  className="ve-touch-target min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/70 transition hover:border-vouch-cyan/30 hover:text-white sm:w-auto"
                >
                  Research
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </VECard>
  );
}
