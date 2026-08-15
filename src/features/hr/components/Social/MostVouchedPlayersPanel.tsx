import React from 'react';
import { Flame, Heart, ArrowRight, Plus, Search } from 'lucide-react';
import type { PlayerVouchSummary } from '../../../../hooks/queries/usePlayerVouchLayer';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../../lib/teamLogos';
import {
  AuroraMaxEyebrow,
  AuroraMaxControl,
} from '../../../../components/aurora-max/AuroraMaxPrimitives';

export interface MostVouchedPlayersPanelProps {
  title?: string;
  subtitle?: string;
  players: PlayerVouchSummary[];
  emptyLabel?: string;
  limit?: number;
  onSelectPlayer?: (playerId: string) => void;
  onTogglePlayerVouch?: (player: PlayerVouchSummary) => void;
  onAddToSlip?: (player: PlayerVouchSummary) => void;
  onOpenBoard?: () => void;
  onViewFullPage?: () => void;
  vouchPendingId?: string | null;
}

export function MostVouchedPlayersPanel({
  title = 'Most Vouched Today',
  subtitle = 'Community heat · Real bettor consensus cross-referenced with 12-layer model conviction.',
  players,
  emptyLabel = 'No one has vouched a player yet on this slate. Be the first to vouch a candidate!',
  limit = 4,
  onSelectPlayer,
  onTogglePlayerVouch,
  onAddToSlip,
  onOpenBoard: _onOpenBoard,
  onViewFullPage,
  vouchPendingId,
}: MostVouchedPlayersPanelProps) {
  const visiblePlayers = players.slice(0, limit);

  return (
    <section className="aurora-max-panel relative border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] shadow-[var(--aurora-max-shadow)] backdrop-blur-[18px]">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--aurora-max-line)] bg-[rgba(8,16,15,0.7)] px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-6 w-6 place-items-center border border-[rgba(217,156,74,0.35)] bg-[rgba(217,156,74,0.12)] text-[var(--aurora-max-amber)]">
            <Flame className="h-3.5 w-3.5 fill-current" />
          </span>
          <div className="min-w-0">
            <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.2em] text-[var(--aurora-max-amber)]">
              COMMUNITY CONSENSUS · LIVE BETTOR CONVICTION
            </AuroraMaxEyebrow>
            <h2 className="font-z8 text-sm sm:text-base font-black uppercase tracking-tight text-[var(--aurora-max-paper)] truncate">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewFullPage ? (
            <AuroraMaxControl
              onClick={onViewFullPage}
              className="!min-h-8 !px-3 !text-[10px] font-bold"
            >
              <span>View Leaderboard</span>
              <ArrowRight className="h-3 w-3 text-[var(--aurora-max-emerald)]" />
            </AuroraMaxControl>
          ) : null}
        </div>
      </div>

      {/* ── Candidate Rail ─────────────────────────────────────────── */}
      <div className="p-3 sm:p-4">
        {visiblePlayers.length === 0 ? (
          <div className="border border-dashed border-[var(--aurora-max-line)] bg-black/20 p-6 text-center text-xs text-[var(--aurora-max-muted)] font-mono">
            <p>{emptyLabel}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visiblePlayers.map((player, index) => {
              const isFirst = index === 0;
              const logo = logoByTeamName(player.team);

              return (
                <article
                  key={`${player.playerId}-${index}`}
                  className={`group relative flex flex-col justify-between border p-3 transition duration-150 ${
                    isFirst
                      ? 'border-[var(--aurora-max-line-strong)] bg-[rgba(0,217,160,0.04)] shadow-[0_0_20px_rgba(0,217,160,0.08)]'
                      : 'border-[var(--aurora-max-line)] bg-[rgba(3,8,10,0.65)] hover:border-[var(--aurora-max-line-strong)]'
                  }`}
                >
                  {/* Top: Rank + Team */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--aurora-max-line)] pb-2 font-mono text-[10px]">
                    <span className={`font-black tracking-wider ${isFirst ? 'text-[var(--aurora-max-emerald)]' : 'text-[var(--aurora-max-muted)]'}`}>
                      [{String(index + 1).padStart(2, '0')}]
                    </span>

                    <div className="flex items-center gap-1.5 min-w-0 font-bold text-[var(--aurora-max-muted)] truncate">
                      {logo && <img src={logo} alt="" className="h-3 w-3 object-contain inline" />}
                      <span className="text-[var(--aurora-max-paper)]">{player.team ?? 'MLB'}</span>
                      {player.opponent ? <span>vs {player.opponent}</span> : null}
                    </div>
                  </div>

                  {/* Center: Headshot + Player Identity */}
                  <div
                    className="mt-2.5 flex items-center gap-2.5 cursor-pointer min-w-0"
                    onClick={() => onSelectPlayer?.(player.playerId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectPlayer?.(player.playerId); }}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-end justify-center border border-[var(--aurora-max-line)] bg-black/40 overflow-hidden group-hover:border-[var(--aurora-max-emerald)] transition">
                        <PlayerHeadshot name={player.playerName} playerId={player.playerId} size={40} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-z8 text-xs sm:text-sm font-black uppercase text-[var(--aurora-max-paper)] group-hover:text-[var(--aurora-max-emerald)] transition">
                        {player.playerName}
                      </h3>
                      <p className="font-mono text-[9px] text-[var(--aurora-max-emerald)] font-bold uppercase mt-0.5">
                        Inspect Dossier
                      </p>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-[var(--aurora-max-line)] pt-2 font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlayerVouch?.(player);
                      }}
                      disabled={vouchPendingId === String(player.playerId) || !onTogglePlayerVouch}
                      className={`flex h-7 items-center gap-1.5 border px-2 text-[10px] font-black uppercase tracking-wider transition ${
                        player.viewerHasVouched
                          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] text-[var(--aurora-max-emerald)]'
                          : 'border-[var(--aurora-max-line)] bg-black/30 text-[var(--aurora-max-muted)] hover:border-[var(--aurora-max-line-strong)] hover:text-[var(--aurora-max-paper)]'
                      } disabled:opacity-40`}
                      title="Vouch for player"
                    >
                      <Heart className={`h-3 w-3 ${player.viewerHasVouched ? 'fill-current' : ''}`} />
                      <span>{player.totalVouches}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {onAddToSlip && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToSlip(player);
                          }}
                          className="flex h-7 items-center gap-1 border border-[rgba(0,217,160,0.3)] bg-[rgba(0,217,160,0.08)] px-2 text-[10px] font-bold text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)] hover:text-[#02100d]"
                          title="Add to Parlay Slip"
                        >
                          <Plus className="h-3 w-3" /> Slip
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer?.(player.playerId);
                        }}
                        className="flex h-7 w-7 items-center justify-center border border-[var(--aurora-max-line)] bg-black/30 text-[var(--aurora-max-muted)] hover:border-[var(--aurora-max-line-strong)] hover:text-[var(--aurora-max-paper)] transition"
                        title="View Research Dossier"
                      >
                        <Search className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default MostVouchedPlayersPanel;
