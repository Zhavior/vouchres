import { ArrowRight, Star } from 'lucide-react';
import type { EdgeIslandSectionProps, FavoriteSignal } from './edgeIslandTypes';

interface FavoriteStripProps extends EdgeIslandSectionProps {
  favorites: FavoriteSignal[];
}

export function FavoriteStrip({ favorites, onSectionChange }: FavoriteStripProps) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 backdrop-blur-2xl">
      <div className="border-b border-white/8 px-4 py-3.5 sm:px-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="terminal-text text-vouch-emerald">Watch strip</div>
            <h2 className="mt-1 text-base font-black text-white">Tracked from saved activity</h2>
          </div>
          <button
            type="button"
            onClick={() => onSectionChange('player_edge_lab')}
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-black text-vouch-cyan transition hover:border-vouch-cyan/30 sm:inline-flex"
          >
            Player lab
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {favorites.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:grid xl:grid-cols-1 xl:gap-2 xl:overflow-visible xl:pb-0 [&::-webkit-scrollbar]:hidden">
            {favorites.map((favorite) => (
              <button
                key={favorite.id}
                type="button"
                onClick={() => onSectionChange('player_edge_lab')}
                className="group min-w-[220px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:-translate-y-0.5 hover:border-vouch-emerald/30 xl:min-w-0"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-vouch-emerald">
                    <Star className="h-4 w-4" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-white/45">
                    {favorite.status}
                  </span>
                </div>
                <div className="truncate text-sm font-black text-white">{favorite.label}</div>
                <div className="mt-1 truncate text-xs font-semibold text-white/48">{favorite.context}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-[11px] font-bold text-vouch-emerald">{favorite.edgeSummary}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-vouch-cyan" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSectionChange('hr_board')}
            className="w-full rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-left transition hover:border-vouch-cyan/30"
          >
            <div className="text-sm font-black text-white">No tracked favorites yet</div>
            <p className="mt-1 text-xs leading-5 text-white/45">
              Save picks or open the HR board to start building a personal watch strip.
            </p>
          </button>
        )}
      </div>
    </section>
  );
}
