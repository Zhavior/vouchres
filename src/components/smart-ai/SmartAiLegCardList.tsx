import type { SmartAiDynamicLeg, SmartAiDynamicDisplayPlayer } from './smartAiEngine.logic';

interface SmartAiLegCardListProps {
  legs: SmartAiDynamicLeg[];
  players: SmartAiDynamicDisplayPlayer[];
}

export function SmartAiLegCardList({ legs, players }: SmartAiLegCardListProps) {
  return (
    <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1" id="dynamic-parlay-legs-scroller">
      {legs.map((leg, idx) => {
        const playerObj = players.find((p) => p.id === leg.playerId);
        return (
          <div key={idx} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 p-3.5 space-y-3 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-slate-950/85">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative flex gap-3 items-center">
              <div className="relative flex-shrink-0">
                {playerObj?.headshot ? (
                  <img
                    src={playerObj.headshot}
                    alt={leg.playerName}
                    className="h-11 w-11 rounded-2xl border border-cyan-300/20 bg-slate-950 object-cover shadow-md shadow-cyan-950/25"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-xs font-black text-cyan-200">
                    {String(leg.playerName || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-slate-950 bg-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2 items-start">
                  <span className="text-sm font-black text-white truncate block leading-tight">{leg.playerName}</span>
                  <span className="shrink-0 rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-mono text-sky-200 font-black">
                    {typeof leg.odds === 'number' ? `+${leg.odds.toFixed(2)}` : 'Odds TBD'}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] text-slate-400 block truncate uppercase tracking-[0.14em] font-mono">
                  {playerObj?.team || 'MLB'} · {leg.marketName}
                </span>
              </div>
            </div>

            {/* Real historical validation proof list */}
            <div className="relative rounded-2xl border border-emerald-300/10 bg-emerald-400/5 p-3 text-[10px] text-slate-400 leading-relaxed font-mono">
              <span className="mb-1 block text-[9px] text-emerald-300 font-black uppercase tracking-[0.2em]">✓ Logs Verified</span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed tracking-tight">{leg.justification}</p>
            </div>

            {leg.researchProfile && (
              <div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.035] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-cyan-300">
                    Pitcher / Park Context
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-[9px] font-mono font-black text-slate-400">
                    Board Rank #{leg.researchProfile.boardRank}
                  </span>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-2">
                    <span className="block text-[8px] font-mono uppercase tracking-[0.18em] text-slate-500">
                      Opponent Pitcher
                    </span>
                    <span className="mt-0.5 block text-[11px] font-black text-slate-200">
                      {leg.researchProfile.opponentPitcherName || 'Missing probable pitcher'}
                      {leg.researchProfile.pitcherHand ? ` · ${leg.researchProfile.pitcherHand}` : ''}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-2">
                    <span className="block text-[8px] font-mono uppercase tracking-[0.18em] text-slate-500">
                      Pitcher Vulnerability
                    </span>
                    <span className="mt-0.5 block text-[11px] font-black text-slate-200">
                      {typeof leg.researchProfile.pitcherVulnerability === 'number'
                        ? `${leg.researchProfile.pitcherVulnerability}`
                        : 'Missing pitcher weakness profile'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-2">
                    <span className="block text-[8px] font-mono uppercase tracking-[0.18em] text-slate-500">
                      Venue / Park
                    </span>
                    <span className="mt-0.5 block text-[11px] font-black text-slate-200">
                      {leg.researchProfile.venue || 'Missing venue'}
                      {typeof leg.researchProfile.parkFactor === 'number'
                        ? ` · Park ${leg.researchProfile.parkFactor}`
                        : ''}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-2">
                    <span className="block text-[8px] font-mono uppercase tracking-[0.18em] text-slate-500">
                      Lineup Status
                    </span>
                    <span className="mt-0.5 block text-[11px] font-black text-slate-200">
                      {leg.researchProfile.lineupStatus || 'Missing confirmed lineup'}
                    </span>
                  </div>
                </div>

                {Array.isArray(leg.researchProfile.dataWarnings) && leg.researchProfile.dataWarnings.length > 0 && (
                  <div className="mt-2 rounded-xl border border-amber-300/10 bg-amber-400/5 p-2">
                    <span className="block text-[8px] font-mono font-black uppercase tracking-[0.18em] text-amber-300">
                      Data Warnings
                    </span>
                    <ul className="mt-1 space-y-1 text-[10px] leading-4 text-slate-400">
                      {leg.researchProfile.dataWarnings.slice(0, 4).map((warning: string) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(leg.researchProfile.researcherNotes) && leg.researchProfile.researcherNotes.length > 0 && (
                  <div className="mt-2 rounded-xl border border-violet-300/10 bg-violet-400/5 p-2">
                    <span className="block text-[8px] font-mono font-black uppercase tracking-[0.18em] text-violet-300">
                      Research Notes
                    </span>
                    <ul className="mt-1 space-y-1 text-[10px] leading-4 text-slate-400">
                      {leg.researchProfile.researcherNotes.slice(0, 3).map((note: string) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
