import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Flame, Image as ImageIcon, Newspaper, Plus, Radio, ShieldAlert, Sparkles, User, X, Zap } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { useMlbNewsArticle, useMlbNewsWire, type MlbNewsItem } from '../hooks/useMlbNewsWire';
import { buildSlateIndex, CATEGORY_STYLES, relativeTime, resolveMentions } from './mobile/newsWireFormat';
import type { TodayNextSignalPreview } from '../hooks/useTodayNextHome';

interface TodayNextSignalPeekProps {
  signals: TodayNextSignalPreview[];
  totalRows: number | null;
  onRoute: (section: string) => void;
}

/**
 * Top research signals in high-contrast HUD styling.
 */
export function TodayNextSignalPeek({ signals, totalRows, onRoute }: TodayNextSignalPeekProps) {
  return (
    <section aria-label="Top research signals" className="font-mono">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
          <Flame className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
          TOP EVIDENCE SIGNALS TODAY
        </h2>
        <button
          type="button"
          onClick={() => onRoute('hr_board')}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          {totalRows != null ? `ALL ${totalRows} ROWS` : 'OPEN FULL BOARD'} <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="border-2 border-dashed border-white/15 bg-black p-5 text-center">
          <p className="text-xs font-bold text-zinc-400">NO RESEARCH ROWS PUBLISHED</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            The HR board has not returned a player pool for today.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {signals.map((signal, index) => {
            const logo = logoByTeamName(signal.team);
            return (
              <button
                key={signal.id}
                type="button"
                onClick={() => onRoute('hr_board')}
                className="group flex w-full items-center gap-3 border-2 border-white/10 bg-black p-3 text-left transition-all hover:border-cyan-400/80 hover:bg-zinc-950 cursor-pointer"
              >
                <span className="w-5 shrink-0 text-center text-xs font-black text-zinc-600 tabular-nums group-hover:text-white">
                  0{index + 1}
                </span>

                <span className="relative h-10 w-10 shrink-0 overflow-hidden border border-white/20 bg-zinc-900">
                  <PlayerHeadshot name={signal.playerName} size={40} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <strong className="truncate text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                      {signal.playerName}
                    </strong>
                    {signal.confirmed && (
                      <span className="shrink-0 border border-emerald-400/40 bg-emerald-950/40 px-1 py-0.2 text-[8px] font-black uppercase text-emerald-300">
                        CONFIRMED
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-400">
                    {logo ? <img src={logo} alt="" className="h-3 w-3 shrink-0 object-contain" /> : null}
                    <span className="truncate">
                      {signal.team} vs {signal.opponent}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-[9px] text-zinc-500">{signal.headline}</span>
                </div>

                <div className="flex shrink-0 flex-col items-end leading-none">
                  <span className="text-base font-black tabular-nums text-emerald-400">
                    {signal.score}
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                    HRPI
                  </span>
                  {signal.oddsLabel && (
                    <span className="mt-1 text-[9px] font-bold tabular-nums text-zinc-400">
                      {signal.oddsLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   10/10 PHOTO-RICH MLB INTEL & NEWS WIRE COMPONENT (DESKTOP BENTO GRID)
   ========================================================================== */

export interface TodayNextNewsWireProps {
  slateRows?: readonly HrWatchRow[];
  onOpenPlayer?: (row: HrWatchRow) => void;
  onAddPlayer?: (row: HrWatchRow) => void;
}

export function TodayNextNewsWire({
  slateRows = [],
  onOpenPlayer,
  onAddPlayer,
}: TodayNextNewsWireProps) {
  const { items, isLoading, error } = useMlbNewsWire();
  const [selectedStory, setSelectedStory] = useState<MlbNewsItem | null>(null);

  const slateIndex = useMemo(() => buildSlateIndex(slateRows), [slateRows]);

  if (isLoading && items.length === 0) {
    return (
      <section className="border-2 border-white/15 bg-black p-5 font-mono" aria-label="MLB News Wire Loading">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-cyan-400 animate-pulse" />
            <span className="text-white font-bold text-xs tracking-widest uppercase">VOUCHEDGE // MLB INTEL WIRE</span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase">SCANNING WIRE FEEDS...</span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-12 animate-pulse">
          <div className="h-64 border border-white/10 bg-zinc-950 lg:col-span-7" />
          <div className="space-y-3 lg:col-span-5">
            <div className="h-20 border border-white/10 bg-zinc-950" />
            <div className="h-20 border border-white/10 bg-zinc-950" />
            <div className="h-20 border border-white/10 bg-zinc-950" />
          </div>
        </div>
      </section>
    );
  }

  if (error || items.length === 0) {
    return null;
  }

  const [heroStory, ...sideStories] = items;
  const heroStyle = CATEGORY_STYLES[heroStory.category ?? 'NEWS'];
  const heroMentions = resolveMentions(heroStory, slateIndex, heroStory.paragraphs);

  return (
    <>
      <section
        className="border-2 border-white/15 bg-black p-5 sm:p-6 font-mono shadow-2xl space-y-4"
        aria-labelledby="mlb-intel-wire-title"
      >
        {/* TOP INTEL HUD STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-rose-500 animate-ping" />
            <span className="h-2 w-2 bg-rose-400" />
            <h2 id="mlb-intel-wire-title" className="text-white font-black text-xs sm:text-sm tracking-widest uppercase">
              VOUCHEDGE // LIVE MLB INTEL WIRE
            </h2>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-cyan-300 text-[10px] font-bold hidden sm:inline">BREAKING ROSTER &amp; LINEUP TELEMETRY</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">
              FEED: <strong className="text-emerald-400 font-mono">REALTIME_SYNC</strong>
            </span>
            <span className="border border-white/20 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold text-zinc-300 uppercase">
              {items.length} WIRE DISPATCHES
            </span>
          </div>
        </div>

        {/* BENTO NEWS GRID */}
        <div className="grid gap-4 lg:grid-cols-12 items-stretch">
          
          {/* FEATURED BREAKING HERO STORY (7 COLS) */}
          <div
            className="group relative flex flex-col justify-between border-2 border-white/15 bg-zinc-950 overflow-hidden hover:border-cyan-400/80 transition-all cursor-pointer lg:col-span-7"
            onClick={() => setSelectedStory(heroStory)}
          >
            {/* Editorial Photo Banner */}
            <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-zinc-900 border-b border-white/10">
              {heroStory.image?.url ? (
                <img
                  src={heroStory.image.url}
                  alt={heroStory.image.alt || heroStory.headline}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90 contrast-110"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-zinc-600">
                  <ImageIcon className="h-10 w-10 opacity-30" />
                </div>
              )}
              
              {/* Matte Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Category Pill + Timestamp Tag */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase border tracking-wider ${heroStyle.pill}`}>
                  {heroStyle.label}
                </span>
                <span className="border border-white/20 bg-black/80 px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-300 backdrop-blur-md">
                  {relativeTime(heroStory.publishedAt)}
                </span>
              </div>

              {/* Slate Impact Alert */}
              {heroMentions.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 border border-emerald-400/50 bg-black/90 px-2.5 py-1 text-[10px] text-emerald-300 font-bold backdrop-blur-md">
                  <Flame className="h-3.5 w-3.5 text-emerald-400" />
                  <span>SLATE IMPACT: {heroMentions.length} ACTIVE PLAYER{heroMentions.length > 1 ? 'S' : ''} DETECTED</span>
                </div>
              )}
            </div>

            {/* Headline & Synopsis */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h3 className="text-white font-black text-lg sm:text-xl leading-snug tracking-tight group-hover:text-cyan-300 transition-colors font-sans">
                  {heroStory.headline}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 leading-relaxed font-sans">
                  {heroStory.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-bold flex items-center gap-1 group-hover:underline">
                  OPEN FULL DOSSIER <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] text-zinc-500">INTEL REF #{heroStory.id.slice(-6)}</span>
              </div>
            </div>
          </div>

          {/* SIDE WIRE STORIES STREAM (5 COLS) */}
          <div className="flex flex-col justify-between gap-3 lg:col-span-5">
            {sideStories.slice(0, 3).map((story) => {
              const style = CATEGORY_STYLES[story.category ?? 'NEWS'];
              const mentions = resolveMentions(story, slateIndex, story.paragraphs);
              return (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="group flex gap-3 border-2 border-white/10 bg-zinc-950 p-3 hover:border-cyan-400/70 transition-all cursor-pointer flex-1"
                >
                  {/* Thumbnail Photo */}
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden bg-zinc-900 border border-white/10">
                    {story.image?.url ? (
                      <img
                        src={story.image.url}
                        alt={story.image.alt || story.headline}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-black text-zinc-700">
                        <Newspaper className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                    <span className={`absolute bottom-1 left-1 px-1 text-[7px] font-black uppercase border ${style.pill}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Headline & Meta */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-500 mb-1">
                        <span>{relativeTime(story.publishedAt)}</span>
                        {mentions.length > 0 && (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            ● {mentions.length} SLATE
                          </span>
                        )}
                      </div>
                      <h4 className="text-white font-bold text-xs leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors font-sans">
                        {story.headline}
                      </h4>
                    </div>

                    <span className="text-[9px] text-zinc-400 flex items-center gap-1 group-hover:text-white transition-colors mt-1">
                      Read Intel <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FULL-SCREEN INTEL ARTICLE MODAL */}
      {selectedStory && (
        <NewsArticleModal
          story={selectedStory}
          slateIndex={slateIndex}
          onClose={() => setSelectedStory(null)}
          onOpenPlayer={onOpenPlayer}
          onAddPlayer={onAddPlayer}
        />
      )}
    </>
  );
}

interface NewsArticleModalProps {
  story: MlbNewsItem;
  slateIndex: Map<string, HrWatchRow>;
  onClose: () => void;
  onOpenPlayer?: (row: HrWatchRow) => void;
  onAddPlayer?: (row: HrWatchRow) => void;
}

function NewsArticleModal({
  story,
  slateIndex,
  onClose,
  onOpenPlayer,
  onAddPlayer,
}: NewsArticleModalProps) {
  const { paragraphs, image, isLoadingBody } = useMlbNewsArticle(story);
  const style = CATEGORY_STYLES[story.category ?? 'NEWS'];
  const matchedPlayers = resolveMentions(story, slateIndex, paragraphs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-white/30 bg-black text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HUD HEADER */}
        <div className="flex items-center justify-between border-b border-white/15 bg-zinc-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${style.pill}`}>
              {style.label}
            </span>
            <span className="text-white font-bold text-xs tracking-wider">INTEL DISPATCH #{story.id.slice(-8)}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-5">
          
          {/* Big Editorial Photo Banner */}
          {image?.url && (
            <div className="relative w-full h-56 sm:h-72 border border-white/15 overflow-hidden bg-zinc-950">
              <img
                src={image.url}
                alt={image.alt || story.headline}
                className="h-full w-full object-cover object-center brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <span className="absolute bottom-2 right-3 text-[9px] text-zinc-400 bg-black/80 px-2 py-0.5 border border-white/10 font-mono">
                {relativeTime(story.publishedAt)}
              </span>
            </div>
          )}

          {/* Headline & Metadata */}
          <div className="space-y-2">
            <h2 id="intel-modal-title" className="text-xl sm:text-2xl font-black text-white leading-tight font-sans">
              {story.headline}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 border-b border-white/10 pb-3">
              <span>PUBLISHED: {story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'LIVE'}</span>
              <span>•</span>
              <span className="text-cyan-300">SOURCE: MLB / ESPN EDITORIAL WIRE</span>
            </div>
          </div>

          {/* ACTIVE SLATE PLAYERS IMPACT DECK */}
          {matchedPlayers.length > 0 && (
            <div className="border-2 border-emerald-400/50 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-emerald-400" />
                  ACTIVE SLATE PLAYERS IN THIS STORY ({matchedPlayers.length})
                </span>
                <span className="text-[9px] text-zinc-400">INSTANT RESEARCH BRIDGE</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {matchedPlayers.map((player) => (
                  <div
                    key={player.stableId}
                    className="flex items-center justify-between p-2.5 border border-emerald-400/30 bg-black text-xs"
                  >
                    <div>
                      <strong className="text-white block font-bold">{player.playerName}</strong>
                      <span className="text-[10px] text-zinc-400">{player.team} vs {player.opponent}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenPlayer && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenPlayer(player);
                            onClose();
                          }}
                          className="px-2 py-1 border border-cyan-400/40 bg-cyan-950/30 text-cyan-300 font-bold text-[9px] hover:bg-cyan-900/50 transition-colors cursor-pointer"
                        >
                          DOSSIER
                        </button>
                      )}
                      {onAddPlayer && player.truthStatus !== 'blocked' && (
                        <button
                          type="button"
                          onClick={() => onAddPlayer(player)}
                          className="px-2 py-1 border border-emerald-400 bg-emerald-400 text-black font-bold text-[9px] hover:bg-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> SLIP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Text Content */}
          <div className="space-y-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                {p}
              </p>
            ))}
            {isLoadingBody && (
              <p className="text-xs text-zinc-500 font-mono italic animate-pulse">
                Fetching full dispatch body...
              </p>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-white/15 bg-zinc-950 px-5 py-3 flex items-center justify-between text-[10px] text-zinc-400">
          <span>PROVENANCE: IMMUTABLE EDITORIAL PACKET</span>
          <button
            type="button"
            onClick={onClose}
            className="border border-white bg-white text-black px-4 py-1.5 font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            CLOSE DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
}

