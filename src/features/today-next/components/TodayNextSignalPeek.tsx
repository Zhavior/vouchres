import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Flame,
  Image as ImageIcon,
  Newspaper,
  Plus,
  Radio,
  ShieldAlert,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { useMlbNewsArticle, useMlbNewsWire, type MlbNewsItem } from '../hooks/useMlbNewsWire';
import {
  buildSlateIndex,
  CATEGORY_STYLES,
  classifyTacticalNews,
  getCyberFallbackImage,
  relativeTime,
  resolveMentions,
  type TacticalNewsCategory,
} from './mobile/newsWireFormat';
import type { TodayNextSignalPreview } from '../hooks/useTodayNextHome';

interface TodayNextSignalPeekProps {
  signals: TodayNextSignalPreview[];
  totalRows: number | null;
  isLoading?: boolean;
  isDelayed?: boolean;
  onRetry?: () => void;
  onRoute: (section: string) => void;
  onAddPlayer?: (row: HrWatchRow) => void;
  rawRows?: readonly HrWatchRow[];
}

/**
 * Signal Quick Table & Top Evidence Telemetry
 * Desktop table / mobile card stack showing Player, Matchup, HRPI score, 3-tier gauge values, and one-tap + Add to Slip
 */
export function TodayNextSignalPeek({
  signals,
  totalRows,
  isLoading = false,
  isDelayed = false,
  onRetry,
  onRoute,
  onAddPlayer,
  rawRows = [],
}: TodayNextSignalPeekProps) {
  const rowMap = useMemo(() => {
    const map = new Map<string, HrWatchRow>();
    for (const r of rawRows) {
      map.set(r.stableId, r);
    }
    return map;
  }, [rawRows]);

  return (
    <section
      aria-label="Top research signals"
      className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 font-mono rounded-xl shadow-xl space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F4F4F5]">
            TOP EVIDENCE SIGNALS // QUICK TABLE
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onRoute('hr_board')}
          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-wider text-emerald-400 hover:text-emerald-300 cursor-pointer"
        >
          {totalRows != null ? `ALL ${totalRows} ROWS` : 'OPEN FULL BOARD'} <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {isDelayed ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-5 text-center">
          <ShieldAlert className="mx-auto h-5 w-5 text-amber-300" aria-hidden="true" />
          <p className="mt-2 text-xs font-medium uppercase text-amber-200">Player evidence is delayed</p>
          <p className="mt-1 text-[10px] leading-4 text-zinc-400">
            The rest of Today remains available. No player rows are estimated while the validated board is pending.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-9 rounded-lg border border-amber-400/30 px-3 text-[10px] font-bold uppercase tracking-wider text-amber-200 hover:bg-amber-400/10"
            >
              Retry evidence
            </button>
          ) : null}
        </div>
      ) : isLoading ? (
        <div className="space-y-2" aria-live="polite" aria-label="Research rows are loading">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              aria-hidden="true"
              className="h-[58px] animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.025]"
            />
          ))}
          <p className="text-center text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Verifying player pool in the background
          </p>
        </div>
      ) : signals.length === 0 ? (
        <div className="border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center rounded-lg">
          <p className="text-xs font-medium text-zinc-400 uppercase">NO RESEARCH ROWS PUBLISHED</p>
          <p className="mt-1 text-[10px] text-zinc-500 font-sans">The HR board has not returned an active player pool yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header (Desktop) */}
          <div className="hidden sm:grid grid-cols-[36px_minmax(140px,1.5fr)_minmax(100px,1fr)_120px_70px_90px] items-center gap-3 px-3 py-1.5 border-b border-white/[0.06] text-[9px] font-mono font-medium uppercase tracking-wider text-zinc-500">
            <span>#</span>
            <span>PLAYER</span>
            <span>MATCHUP</span>
            <span className="text-center">POWER / VULN / PARK</span>
            <span className="text-right">HRPI</span>
            <span className="text-right">ACTION</span>
          </div>

          {/* Table Rows */}
          {signals.map((signal, index) => {
            const logo = logoByTeamName(signal.team);
            const matchingRow = rowMap.get(signal.id);
            const power = signal.hitterPower != null ? Math.round(signal.hitterPower) : '—';
            const vuln = signal.pitcherVuln != null ? Math.round(signal.pitcherVuln) : '—';
            const park = signal.parkFactor != null ? Math.round(signal.parkFactor) : '—';

            return (
              <div
                key={signal.id}
                className="group flex flex-col sm:grid sm:grid-cols-[36px_minmax(140px,1.5fr)_minmax(100px,1fr)_120px_70px_90px] items-start sm:items-center gap-2 sm:gap-3 border border-white/[0.06] bg-white/[0.02] p-3 rounded-lg transition-colors hover:border-white/[0.16] hover:bg-white/[0.04]"
              >
                {/* Index / Rank */}
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                  <span className="w-6 shrink-0 font-mono text-xs font-medium text-zinc-500 group-hover:text-zinc-300">
                    0{index + 1}
                  </span>
                  {/* Mobile-only HRPI pill */}
                  <div className="flex sm:hidden items-center gap-2">
                    <span className="text-base font-bold text-emerald-400 tabular-nums">{signal.score}</span>
                    <span className="text-[8px] font-mono font-medium text-zinc-500 uppercase">HRPI</span>
                  </div>
                </div>

                {/* Player Name & Headshot */}
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-white/10 bg-zinc-900">
                    <PlayerHeadshot name={signal.playerName} size={36} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="truncate text-xs font-medium text-[#F4F4F5] group-hover:text-white transition-colors">
                        {signal.playerName}
                      </strong>
                      {signal.confirmed && (
                        <span className="shrink-0 border border-emerald-500/25 bg-emerald-500/10 px-1 py-0.2 text-[7px] font-mono font-medium uppercase text-emerald-300 rounded">
                          CONFIRMED
                        </span>
                      )}
                    </div>
                    <span className="block truncate text-[9px] text-zinc-400">{signal.headline}</span>
                  </div>
                </div>

                {/* Matchup & Opponent */}
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                  {logo ? <img src={logo} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" /> : null}
                  <span className="truncate">
                    {signal.team} vs {signal.opponent}
                  </span>
                </div>

                {/* 3-Tier Metric Badges */}
                <div className="flex items-center justify-center gap-1 text-[9px] font-mono w-full sm:w-auto">
                  <span className="border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 rounded text-zinc-300" title="Hitter Power">
                    P:{power}
                  </span>
                  <span className="border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 rounded text-sky-400" title="Pitcher Vulnerability">
                    V:{vuln}
                  </span>
                  <span className="border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-300" title="Park Factor">
                    K:{park}
                  </span>
                </div>

                {/* Desktop HRPI Score */}
                <div className="hidden sm:block text-right">
                  <span className="text-base font-bold text-emerald-400 tabular-nums block leading-none font-mono">
                    {signal.score}
                  </span>
                  <span className="text-[8px] font-mono font-medium text-zinc-500 uppercase">HRPI</span>
                </div>

                {/* Action button */}
                <div className="flex items-center justify-end w-full sm:w-auto gap-2 pt-1 sm:pt-0 border-t border-white/5 sm:border-0">
                  {onAddPlayer && matchingRow && matchingRow.truthStatus !== 'blocked' ? (
                    <button
                      type="button"
                      onClick={() => onAddPlayer(matchingRow)}
                      className="min-h-[44px] sm:min-h-8 flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white text-black font-semibold px-2.5 py-1 text-[9px] uppercase hover:bg-zinc-200 transition-colors cursor-pointer rounded"
                    >
                      <Plus className="h-3 w-3" /> ADD SLIP
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRoute('hr_board')}
                      className="min-h-[44px] sm:min-h-8 flex-1 sm:flex-initial flex items-center justify-center gap-1 border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium uppercase text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer rounded"
                    >
                      DOSSIER
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   CURATED MLB TACTICAL INTEL WIRE (DESKTOP 1/3 SIDEBAR & BENTO GRID)
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
      <section className="border-2 border-white/15 bg-[#131B1E] p-4 sm:p-5 font-mono" aria-label="MLB News Wire Loading">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#00FF87] animate-pulse" />
            <span className="text-white font-bold text-xs tracking-widest uppercase">
              VOUCHEDGE // TACTICAL INTEL WIRE
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase">SCANNING SENSORS...</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-12 animate-pulse">
          <div className="h-56 border border-white/10 bg-[#0A0D0E] lg:col-span-7" />
          <div className="space-y-2 lg:col-span-5">
            <div className="h-16 border border-white/10 bg-[#0A0D0E]" />
            <div className="h-16 border border-white/10 bg-[#0A0D0E]" />
            <div className="h-16 border border-white/10 bg-[#0A0D0E]" />
          </div>
        </div>
      </section>
    );
  }

  if (error || items.length === 0) {
    return null;
  }

  const [heroStory, ...sideStories] = items;
  const heroCategory = classifyTacticalNews(heroStory);
  const heroStyle = CATEGORY_STYLES[heroCategory];
  const heroMentions = resolveMentions(heroStory, slateIndex, heroStory.paragraphs);

  return (
    <>
      <section
        className="border border-white/[0.08] bg-[#111113] p-4 sm:p-5 font-mono rounded-xl shadow-xl space-y-3.5"
        aria-labelledby="mlb-intel-wire-title"
      >
        {/* TOP INTEL HUD STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <h2 id="mlb-intel-wire-title" className="text-[#F4F4F5] font-bold text-xs sm:text-sm tracking-wider uppercase">
              CURATED MLB TACTICAL INTEL WIRE
            </h2>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-sky-400 text-[10px] font-medium hidden sm:inline font-mono">LINEUP · PITCHER · WEATHER · DEVIATION</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 uppercase tracking-wider rounded">
              {items.length} TACTICAL SIGNALS
            </span>
          </div>
        </div>

        {/* BENTO NEWS GRID (7 COLS HERO + 5 COLS SIDEBAR STREAM) */}
        <div className="grid gap-4 lg:grid-cols-12 items-stretch">
          {/* FEATURED BREAKING HERO STORY (7 COLS) */}
          <div
            className="group relative flex flex-col justify-between border border-white/[0.08] bg-white/[0.02] rounded-lg overflow-hidden hover:border-white/[0.18] transition-all cursor-pointer lg:col-span-7 min-h-[280px]"
            onClick={() => setSelectedStory(heroStory)}
          >
            {/* Editorial Photo Banner */}
            <div className="relative h-44 sm:h-52 w-full bg-zinc-900 border-b border-white/[0.06] tn-hud-frame">
              <img
                src={heroStory.image?.url || getCyberFallbackImage(heroCategory)}
                alt={heroStory.image?.alt || heroStory.headline}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCyberFallbackImage(heroCategory);
                }}
                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90 contrast-105"
                loading="lazy"
              />
              <span className="tn-hud-corner-br" aria-hidden="true" />

              {/* Matte Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-black/30 to-transparent" />

              {/* Tactical Category Badge + Timestamp */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                <span className={`px-2 py-0.5 text-[9px] font-mono font-medium uppercase border tracking-wider rounded ${heroStyle.pill}`}>
                  {heroStyle.label}
                </span>
                <span className="border border-white/20 bg-black/70 px-2 py-0.5 text-[9px] font-mono text-zinc-300 backdrop-blur-md rounded">
                  {relativeTime(heroStory.publishedAt)}
                </span>
              </div>

              {/* Slate Impact Alert */}
              {heroMentions.length > 0 && (
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 border border-emerald-500/30 bg-black/85 px-2 py-1 text-[10px] text-emerald-400 font-medium backdrop-blur-md z-10 rounded">
                  <Flame className="h-3.5 w-3.5 text-emerald-400" />
                  <span>SLATE IMPACT: {heroMentions.length} ACTIVE BAT{heroMentions.length > 1 ? 'S' : ''} DETECTED</span>
                </div>
              )}
            </div>

            {/* Headline & Synopsis */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <h3 className="text-[#F4F4F5] font-bold text-base sm:text-lg leading-snug tracking-tight group-hover:text-white transition-colors font-sans">
                  {heroStory.headline}
                </h3>
                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-sans">
                  {heroStory.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1 group-hover:text-emerald-300">
                  OPEN INTEL DRAWER <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">REF #{heroStory.id.slice(-6)}</span>
              </div>
            </div>
          </div>

          {/* SIDE WIRE STORIES STREAM (5 COLS) */}
          <div className="flex flex-col justify-between gap-2.5 lg:col-span-5">
            {sideStories.slice(0, 3).map((story) => {
              const cat = classifyTacticalNews(story);
              const style = CATEGORY_STYLES[cat];
              const mentions = resolveMentions(story, slateIndex, story.paragraphs);

              return (
                <div
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="group flex gap-2.5 border border-white/[0.06] bg-white/[0.02] p-2.5 rounded-lg hover:border-white/[0.16] hover:bg-white/[0.04] transition-all cursor-pointer flex-1"
                >
                  {/* Thumbnail Photo */}
                  <div className="relative h-[72px] w-20 shrink-0 bg-zinc-900 border border-white/[0.08] rounded overflow-hidden tn-hud-frame">
                    <img
                      src={story.image?.url || getCyberFallbackImage(cat)}
                      alt={story.image?.alt || story.headline}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCyberFallbackImage(cat);
                      }}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-90"
                      loading="lazy"
                    />
                    <span className="tn-hud-corner-br" aria-hidden="true" />
                    <span className={`absolute bottom-0.5 left-0.5 px-1 text-[7px] font-mono font-medium uppercase border rounded z-10 ${style.pill}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Headline & Meta */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-500 mb-0.5 font-mono">
                        <span>{relativeTime(story.publishedAt)}</span>
                        {mentions.length > 0 && (
                          <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                            ● {mentions.length} SLATE
                          </span>
                        )}
                      </div>
                      <h4 className="text-[#F4F4F5] font-medium text-xs leading-snug line-clamp-2 group-hover:text-white transition-colors font-sans">
                        {story.headline}
                      </h4>
                    </div>

                    <span className="text-[9px] text-zinc-400 flex items-center gap-1 group-hover:text-zinc-200 transition-colors mt-0.5">
                      Read Intel <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUICK-READ IN-APP MODAL DRAWER */}
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
  const cat = classifyTacticalNews(story);
  const style = CATEGORY_STYLES[cat];
  const matchedPlayers = resolveMentions(story, slateIndex, paragraphs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/[0.12] bg-[#111113] text-[#F4F4F5] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HUD HEADER */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0A0A0C] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-mono font-medium uppercase border rounded ${style.pill}`}>
              {style.label}
            </span>
            <span className="text-[#F4F4F5] font-medium text-xs tracking-wider">INTEL DISPATCH #{story.id.slice(-8)}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Big Editorial Photo Banner with Fallback */}
          <div className="relative w-full h-48 sm:h-64 border border-white/15 overflow-hidden bg-zinc-950">
            <img
              src={image?.url || story.image?.url || getCyberFallbackImage(cat)}
              alt={image?.alt || story.headline}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getCyberFallbackImage(cat);
              }}
              className="h-full w-full object-cover object-center brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0E] via-transparent to-transparent opacity-80" />
            <span className="absolute bottom-2 right-3 text-[9px] text-zinc-400 bg-black/80 px-2 py-0.5 border border-white/10 font-mono">
              {relativeTime(story.publishedAt)}
            </span>
          </div>

          {/* Headline & Metadata */}
          <div className="space-y-1.5">
            <h2 id="intel-modal-title" className="text-lg sm:text-xl font-black text-white leading-tight font-sans">
              {story.headline}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 border-b border-white/10 pb-2.5">
              <span>PUBLISHED: {story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'LIVE'}</span>
              <span>•</span>
              <span className="text-[#00FF87]">TACTICAL CLASSIFICATION: {cat}</span>
            </div>
          </div>

          {/* ACTIVE SLATE PLAYERS IMPACT DECK */}
          {matchedPlayers.length > 0 && (
            <div className="border-2 border-emerald-400/50 bg-emerald-950/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-[#00FF87]" />
                  ACTIVE SLATE BATS IN THIS STORY ({matchedPlayers.length})
                </span>
                <span className="text-[9px] text-zinc-400">INSTANT RESEARCH BRIDGE</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {matchedPlayers.map((player) => (
                  <div
                    key={player.stableId}
                    className="flex items-center justify-between p-2.5 border border-emerald-400/30 bg-[#0A0D0E] text-xs"
                  >
                    <div>
                      <strong className="text-white block font-bold">{player.playerName}</strong>
                      <span className="text-[10px] text-zinc-400">
                        {player.team} vs {player.opponent}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenPlayer && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenPlayer(player);
                            onClose();
                          }}
                          className="px-2 py-1.5 border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 font-bold text-[9px] hover:bg-cyan-900/50 transition-colors cursor-pointer min-h-[36px]"
                        >
                          DOSSIER
                        </button>
                      )}
                      {onAddPlayer && player.truthStatus !== 'blocked' && (
                        <button
                          type="button"
                          onClick={() => onAddPlayer(player)}
                          className="px-2.5 py-1.5 border border-[#00FF87] bg-[#00FF87] text-[#0A0D0E] font-bold text-[9px] hover:bg-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer min-h-[36px]"
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
          <div className="space-y-3 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
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
        <div className="border-t border-white/15 bg-[#131B1E] px-4 py-3 flex items-center justify-between text-[10px] text-zinc-400">
          <span>PROVENANCE: IMMUTABLE TACTICAL FEED</span>
          <button
            type="button"
            onClick={onClose}
            className="border border-white bg-white text-black px-4 py-2 font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer min-h-[36px]"
          >
            CLOSE DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
}
