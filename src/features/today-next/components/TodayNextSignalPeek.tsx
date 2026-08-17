import { ArrowUpRight, Flame } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { TodayNextSignalPreview } from '../hooks/useTodayNextHome';

interface TodayNextSignalPeekProps {
  signals: TodayNextSignalPreview[];
  totalRows: number | null;
  onRoute: (section: string) => void;
}

/**
 * Deliberately a peek, not a board. Three rows and a way through to HR
 * Intelligence — the ranked workspace stays the one place that owns evidence.
 */
export function TodayNextSignalPeek({ signals, totalRows, onRoute }: TodayNextSignalPeekProps) {
  return (
    <section aria-label="Top research signals">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          <Flame className="h-3 w-3" aria-hidden="true" />
          Top signals today
        </h2>
        <button
          type="button"
          onClick={() => onRoute('hr_board')}
          className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:underline"
        >
          {totalRows != null ? `All ${totalRows}` : 'Open board'} <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-center font-mono">
          <p className="text-[11px] font-bold text-white/50">No research rows published yet</p>
          <p className="mt-1 text-[10px] leading-4 text-white/30">
            The HR board has not returned a player pool for today. Nothing has been substituted in its place.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map((signal, index) => {
            const logo = logoByTeamName(signal.team);
            return (
              <button
                key={signal.id}
                type="button"
                onClick={() => onRoute('hr_board')}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-ve-obsidian/90 p-3 text-left transition-all hover:border-[var(--aurora-max-emerald)]/40 hover:bg-ve-graphite"
              >
                <span className="w-4 shrink-0 text-center font-mono text-[10px] font-black text-white/25 tabular-nums">
                  {index + 1}
                </span>

                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                  <PlayerHeadshot name={signal.playerName} size={40} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-mono text-xs font-black text-white">{signal.playerName}</span>
                    {signal.confirmed && (
                      <span className="shrink-0 rounded border border-[var(--aurora-max-emerald)]/30 bg-[var(--aurora-max-emerald)]/10 px-1.5 py-0.2 font-mono text-[8px] font-black uppercase text-[var(--aurora-max-emerald)]">
                        Confirmed
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-white/45">
                    {logo ? <img src={logo} alt="" className="h-3 w-3 shrink-0 object-contain" /> : null}
                    <span className="truncate">
                      {signal.team} vs {signal.opponent}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] text-white/35">{signal.headline}</span>
                </span>

                <span className="flex shrink-0 flex-col items-end leading-none">
                  <span className="font-mono text-base font-black tabular-nums text-[var(--aurora-max-emerald)] drop-shadow-[0_0_8px_rgba(0,217,160,0.3)]">
                    {signal.score}
                  </span>
                  <span className="mt-0.5 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                    HRPI
                  </span>
                  {signal.oddsLabel && (
                    <span className="mt-1 font-mono text-[9px] font-bold tabular-nums text-white/50">
                      {signal.oddsLabel}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
