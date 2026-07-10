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

function scoreRingClass(score: number | null): string {
  if (score == null) return 'border-white/15 bg-white/[0.03]';
  if (score >= 80) return 'border-emerald-400/35 bg-emerald-400/10 shadow-[0_0_24px_rgba(0,255,148,0.12)]';
  if (score >= 65) return 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(0,240,255,0.1)]';
  return 'border-white/15 bg-white/[0.03]';
}

function EdgeRowCard({
  row,
  rank,
  onSectionChange,
}: {
  row: EdgeBoardRow;
  rank: number;
  onSectionChange: (section: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3.5 transition hover:border-white/18 hover:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border font-mono text-[10px] font-black uppercase ${scoreRingClass(row.score)}`}
        >
          <span className="text-[9px] text-white/35">#{rank}</span>
          <span className={`text-sm leading-none ${scoreTone(row.score)}`}>{row.score ?? '—'}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{row.playerName}</div>
              <div className="truncate text-xs text-white/45">
                {row.team} vs {row.opponent}
              </div>
            </div>
            <div
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${
                row.truthStatus === 'confirmed'
                  ? 'border-emerald-400/25 bg-emerald-400/10 text-vouch-emerald'
                  : 'border-cyan-300/20 bg-cyan-300/10 text-vouch-cyan'
              }`}
            >
              {row.truthStatus === 'confirmed' ? <ShieldCheck className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
              {row.truthStatus === 'confirmed' ? 'Confirmed' : 'Preview'}
            </div>
          </div>

          <div className="mt-2 text-[11px] font-semibold text-white/50">{row.market}</div>
          <div className="mt-0.5 text-[10px] text-white/38">{row.angle}</div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {row.signals.slice(0, 2).map((signal) => (
              <span
                key={`${row.id}-${signal}`}
                className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[10px] font-bold text-white/55"
              >
                {signal}
              </span>
            ))}
          </div>

          {row.truthStatus === 'preview' ? (
            <p className="mt-2 text-[10px] font-bold text-cyan-100/70">Official lineup not posted yet.</p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-white/38">{row.gameTime || row.status}</span>
            <button
              type="button"
              onClick={() => onSectionChange('player_edge_lab')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-black text-white/75 transition hover:border-vouch-cyan/30 hover:text-white"
            >
              Research
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TodaysEdgeBoard({ rows, loading, error, onSectionChange }: TodaysEdgeBoardProps) {
  return (
    <VECard strong className="overflow-hidden p-0">
      <div className="border-b border-white/8 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="terminal-text text-vouch-emerald">Today&apos;s edge board</div>
            <h2 className="mt-1 text-xl font-black text-white">Strongest opportunities first</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">
              Built from the HR board payload. Confirmed rows require official lineups; preview rows stay marked until lineups post.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSectionChange('hr_board')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black text-vouch-emerald transition hover:border-emerald-400/45 hover:bg-emerald-400/15"
          >
            Open full board
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
            {error}. Edge Island is not showing fake board rows.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5 text-center sm:text-left">
            <div className="text-sm font-black text-white">No edge rows from the backend yet</div>
            <p className="mt-1 text-xs text-white/45">
              Check back after the slate, probable pitchers, or safe preview candidates are available.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 lg:hidden">
              {rows.map((row, index) => (
                <EdgeRowCard key={row.id} row={row} rank={index + 1} onSectionChange={onSectionChange} />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
              <div className="grid grid-cols-[minmax(220px,1.2fr)_88px_140px_minmax(180px,1fr)_120px_108px] gap-3 border-b border-white/10 bg-white/[0.035] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-white/40">
                <div>Matchup / player</div>
                <div>Score</div>
                <div>Market</div>
                <div>Signals</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              <div className="divide-y divide-white/10">
                {rows.map((row, index) => (
                  <article
                    key={row.id}
                    className="grid grid-cols-[minmax(220px,1.2fr)_88px_140px_minmax(180px,1fr)_120px_108px] items-center gap-3 bg-black/18 px-3 py-3 transition hover:bg-white/[0.035]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black text-white/25">#{index + 1}</span>
                        <HrBrandIcon size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">{row.playerName}</div>
                          <div className="truncate text-xs text-white/45">
                            {row.team} vs {row.opponent}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div
                        className={`inline-flex min-w-[3rem] items-center justify-center rounded-xl border px-2 py-1 font-mono text-xl font-black ${scoreRingClass(row.score)} ${scoreTone(row.score)}`}
                      >
                        {row.score ?? '—'}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-black text-white">{row.market}</div>
                      <div className="mt-0.5 truncate text-[11px] text-white/45">{row.angle}</div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {row.signals.slice(0, 3).map((signal) => (
                        <span
                          key={`${row.id}-${signal}`}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[10px] font-bold text-white/55"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          row.truthStatus === 'confirmed'
                            ? 'border-emerald-400/25 bg-emerald-400/10 text-vouch-emerald'
                            : 'border-cyan-300/20 bg-cyan-300/10 text-vouch-cyan'
                        }`}
                      >
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
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/70 transition hover:border-vouch-cyan/30 hover:text-white"
                    >
                      Research
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </VECard>
  );
}
