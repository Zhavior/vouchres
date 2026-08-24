import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Flame, 
  Zap, 
  Filter, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  BookOpen, 
  Share2, 
  Copy, 
  Layers, 
  RefreshCw, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  BarChart2,
  Calendar,
  Sparkles,
  Plus,
  Activity,
  Wind,
  ShieldAlert,
  Sliders,
  Target
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDailyReport } from '../../hooks/queries/useDailyReport';
import { useDailyHrBoard } from '../hr/hooks/useDailyHrBoard';
import { todayISO } from '../../hooks/queries/hrBoardQuery';
import { buildBoard } from '../hr/utils/normalizeHrWatch';
import { useMlbNewsWire, useMlbNewsArticle, type MlbNewsItem } from '../today-next/hooks/useMlbNewsWire';
import { 
  buildSlateIndex, 
  CATEGORY_STYLES, 
  classifyTacticalNews, 
  getCyberFallbackImage, 
  relativeTime, 
  resolveMentions 
} from '../today-next/components/mobile/newsWireFormat';
import { BLOG_POSTS, type BlogPost } from '../../data/blog/posts';
import { NewsDiscussionThread } from './components/NewsDiscussionThread';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../hr/utils/hrDecisionBrief';
import type { HrWatchRow } from '../hr/types/hrWatch';
import { countArticleComments } from './services/newsCommentStorage';
import './news-hub.css';

type ActiveFeedTab = 'ALL' | 'BLOG' | 'TACTICAL' | 'LINEUP' | 'PITCHER' | 'WEATHER' | 'DEVIATION';

const FEED_TABS: ActiveFeedTab[] = ['ALL', 'BLOG', 'TACTICAL', 'LINEUP', 'PITCHER', 'WEATHER', 'DEVIATION'];

const TAB_LABELS: Record<ActiveFeedTab, string> = {
  ALL: 'ALL',
  BLOG: 'ENGINEERING BLOG',
  TACTICAL: 'WIRE DISPATCHES',
  LINEUP: 'LINEUP',
  PITCHER: 'PITCHER',
  WEATHER: 'WEATHER',
  DEVIATION: 'DEVIATION',
};

/**
 * Category tone, mapped onto the registered ve-* tokens.
 *
 * `CATEGORY_STYLES` in newsWireFormat stays as-is — it is Today's own palette
 * and three Today surfaces render from it. This local map keeps the News Wire
 * internally consistent without repainting another page.
 */
const CATEGORY_TONE: Record<string, { pill: string; text: string; bar: string }> = {
  LINEUP: { pill: 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald', text: 'text-ve-emerald', bar: '#31B583' },
  PITCHER: { pill: 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan', text: 'text-ve-cyan', bar: '#4FB8DC' },
  WEATHER: { pill: 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber', text: 'text-ve-amber', bar: '#D99C4A' },
  DEVIATION: { pill: 'border-ve-red/25 bg-ve-red/10 text-ve-red', text: 'text-ve-red', bar: '#D96359' },
};

const NEUTRAL_TONE = {
  pill: 'border-white/[0.08] bg-white/[0.04] text-white/55',
  text: 'text-white/55',
  bar: '#A1A1AA',
};

function toneFor(category: string) {
  return CATEGORY_TONE[category] ?? NEUTRAL_TONE;
}

/**
 * Blog dates arrive as display strings ("Mar 4, 2026"); wire items arrive as
 * ISO. The stream previously printed raw `publishedAt` in the lead card, so a
 * featured wire story rendered a full ISO timestamp.
 */
function displayTime(value: string): string {
  const relative = relativeTime(value);
  return relative || value;
}

export interface NewsHubPageProps {
  navigateSection?: (section: string) => void;
  initialSlug?: string;
}

export function NewsHubPage({ navigateSection, initialSlug }: NewsHubPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveFeedTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWireStory, setSelectedWireStory] = useState<MlbNewsItem | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(() => {
    if (initialSlug) {
      return BLOG_POSTS.find((p) => p.slug === initialSlug) || null;
    }
    return null;
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Live Slate & Intel Feeds
  const reportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());
  const { items: wireItems, isLoading: isWireLoading } = useMlbNewsWire();

  const hrBoard = useMemo(
    () => (hrBoardQuery.data ? buildBoard(hrBoardQuery.data) : null),
    [hrBoardQuery.data]
  );

  const slateRows = useMemo<HrWatchRow[]>(() => {
    if (!hrBoard) return [];
    return [...hrBoard.confirmed, ...hrBoard.curated, ...hrBoard.all];
  }, [hrBoard]);

  const slateIndex = useMemo(() => buildSlateIndex(slateRows), [slateRows]);

  const handleAddPlayer = (player: HrWatchRow) => {
    if (player.truthStatus === 'blocked') return;
    openParlayAdd({
      player: toHrParlayPickerPlayer(player),
      propHint: {
        id: `hr-watch-${player.stableId}`,
        market: 'Home Runs',
        odds: player.bookOdds ?? null,
        spec: `${player.playerName} 1+ Home Run`,
        gamePk: player.gamePk ?? undefined,
        playerId: player.playerId ?? undefined,
      },
      initialFamily: 'home_runs',
      isPitcher: false,
      source: 'today',
      dataStatus: player.truthStatus === 'official' ? 'official' : 'projected',
      reasoningSnapshot: player.reasons[0] ?? null,
      riskSnapshot: player.warnings[0] ?? null,
    });
  };

  // Blog posts + tactical wire stories, unified into one stream. Filtering is
  // layered on below so tab counts can be computed from the same pool.
  const allItems = useMemo(() => {
    type UnifiedEntry = {
      type: 'BLOG' | 'WIRE';
      id: string;
      title: string;
      summary: string;
      category: string;
      publishedAt: string;
      author: string;
      image?: string;
      readTime?: string;
      blogData?: BlogPost;
      wireData?: MlbNewsItem;
    };

    const blogEntries: UnifiedEntry[] = BLOG_POSTS.map((b) => ({
      type: 'BLOG',
      id: `blog-${b.id}`,
      title: b.title,
      summary: b.excerpt,
      category: b.tag.toUpperCase(),
      publishedAt: b.date,
      author: `${b.author} (${b.authorRole})`,
      readTime: b.readTime,
      blogData: b,
    }));

    const wireEntries: UnifiedEntry[] = wireItems.map((w) => {
      const cat = classifyTacticalNews(w);
      return {
        type: 'WIRE',
        id: `wire-${w.id}`,
        title: w.headline,
        summary: w.description,
        category: cat,
        publishedAt: w.publishedAt || new Date().toISOString(),
        author: 'MLB Statcast & Lineup Feed',
        image: w.image?.url || getCyberFallbackImage(cat),
        readTime: '2 MIN READ',
        wireData: w,
      };
    });

    return [...blogEntries, ...wireEntries];
  }, [wireItems]);

  /** Tab predicate, shared by the rendered feed and the per-tab counts. */
  const matchesTab = React.useCallback((item: { type: string; category: string }, tab: ActiveFeedTab) => {
    if (tab === 'ALL') return true;
    if (tab === 'BLOG') return item.type === 'BLOG';
    if (tab === 'TACTICAL') return item.type === 'WIRE';
    return item.category === tab;
  }, []);

  const searchedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  const unifiedItems = useMemo(
    () => searchedItems.filter((i) => matchesTab(i, activeTab)),
    [searchedItems, activeTab, matchesTab]
  );

  /** Counts reflect the active search, so a tab never advertises hidden rows. */
  const tabCounts = useMemo(() => {
    const counts = {} as Record<ActiveFeedTab, number>;
    for (const tab of FEED_TABS) {
      counts[tab] = searchedItems.filter((i) => matchesTab(i, tab)).length;
    }
    return counts;
  }, [searchedItems, matchesTab]);

  const wireCount = allItems.filter((i) => i.type === 'WIRE').length;
  const blogCount = allItems.filter((i) => i.type === 'BLOG').length;

  const featuredItem = unifiedItems[0];
  const secondaryItems = unifiedItems.slice(1, 5);
  const streamItems = unifiedItems.slice(5);

  const handleCopy = (url: string) => {
    // `navigator.clipboard` is undefined on insecure origins; the badge should
    // not flip to COPIED when nothing was written.
    void navigator.clipboard?.writeText(url).then(
      () => {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      },
      () => undefined,
    );
  };

  const openItem = React.useCallback((item: { type: string; blogData?: BlogPost; wireData?: MlbNewsItem }) => {
    if (item.type === 'BLOG' && item.blogData) {
      setSelectedBlogPost(item.blogData);
    } else if (item.wireData) {
      setSelectedWireStory(item.wireData);
    }
  }, []);

  /*
   * Desk keybindings, matching Today and Live Games: `/` focuses search, Escape
   * steps back out (modal → article → search), and the modal's own "CLOSE [ESC]"
   * label previously had no handler behind it at all.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;

      if (e.key === 'Escape') {
        if (editing) {
          (target as HTMLElement).blur();
          return;
        }
        if (selectedWireStory) {
          setSelectedWireStory(null);
        } else if (selectedBlogPost) {
          setSelectedBlogPost(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      if (editing) return;

      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedWireStory, selectedBlogPost, searchQuery]);

  /* Lock the page behind the wire modal so the feed does not scroll under it. */
  useEffect(() => {
    if (!selectedWireStory) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedWireStory]);

  // If a blog post is selected, render the ESPN Long-form Article Reader with Comments
  if (selectedBlogPost) {
    const articleCommentsCount = countArticleComments(selectedBlogPost.id);
    return (
      <div className="news-hub-root min-h-screen font-sans pb-24">
        {/* Top Sticky Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-md sm:px-8 font-mono">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedBlogPost(null)}
              className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/55 transition-colors hover:text-white cursor-pointer"
            >
              <span>← Return to news wire</span>
              <kbd className="text-[9px] text-white/30">[ESC]</kbd>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(window.location.href)}
              className="news-control inline-flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer"
            >
              <Copy className="h-3 w-3 text-ve-cyan" />
              <span className="font-medium">{copiedLink ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>
        </header>

        {/* Longform Editorial Hero Banner */}
        <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="border border-ve-cyan/25 bg-ve-cyan/10 px-2.5 py-1 font-medium uppercase tracking-wider text-ve-cyan">
                {selectedBlogPost.tag}
              </span>
              <span className="text-white/20">·</span>
              <span className="font-medium text-white/55">{selectedBlogPost.date}</span>
              <span className="text-white/20">·</span>
              <span className="font-medium text-white/55">{selectedBlogPost.readTime}</span>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1 text-ve-emerald">
                <MessageSquare className="h-3 w-3" /> {articleCommentsCount} COMMENTS
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight font-sans">
              {selectedBlogPost.title}
            </h1>

            {/* Author Byline Plate */}
            <div className="flex items-center justify-between border-y border-white/[0.08] py-3.5 my-6 font-mono">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ve-cyan/25 bg-ve-cyan/10 text-xs font-semibold text-ve-cyan">
                  {selectedBlogPost.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-semibold text-white font-sans">{selectedBlogPost.author}</strong>
                    <CheckCircle2 className="h-3.5 w-3.5 text-ve-cyan" />
                  </div>
                  <p className="text-[10px] text-white/40">{selectedBlogPost.authorRole}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-white/40">
                  TRANSMISSION ID #{selectedBlogPost.id.padStart(4, '0')}
                </span>
              </div>
            </div>

            {/* Key Takeaway Callout Box */}
            <div className="border border-ve-cyan/25 bg-ve-cyan/[0.06] p-4 sm:p-5 font-mono space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ve-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Executive quantitative summary</span>
              </div>
              <p className="text-xs sm:text-sm text-white/75 font-sans leading-relaxed">
                {selectedBlogPost.keyTakeaway}
              </p>
            </div>

            {/* Markdown Body Content */}
            <article className="prose prose-invert max-w-none pt-6 text-white/75 text-sm sm:text-base leading-relaxed font-sans space-y-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedBlogPost.content}
              </ReactMarkdown>
            </article>

            {/* In-Article Community Comments & Feedback Hub */}
            <NewsDiscussionThread
              articleId={selectedBlogPost.id}
              articleTitle={selectedBlogPost.title}
              onRequireAuth={() => navigateSection ? navigateSection('profile') : window.location.assign('/login')}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="news-hub-root min-h-screen font-sans pb-24">
      {/* 1. PINNED HUD TELEMETRY TOP BAR */}
      <header className="sticky top-0 z-30 space-y-3 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-md sm:px-8 font-mono">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="news-live-dot" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-white">
                  VOUCHEDGE // NEWS WIRE
                </h1>
                <span className="hidden sm:inline text-white/30">|</span>
                <span className="hidden sm:inline text-[10px] font-medium text-ve-emerald">
                  STAGE: 03 / INTEL TRANSMISSIONS
                </span>
              </div>
              <p className="mt-0.5 text-[9px] uppercase text-white/40">
                ENGINE: MLB_WIRE + EDITORIAL · {wireCount} DISPATCHES · {blogCount} BRIEFS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider ${
                isWireLoading
                  ? 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan'
                  : wireCount > 0
                    ? 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald'
                    : 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              {isWireLoading ? 'SYNCING WIRE' : wireCount > 0 ? 'WIRE VERIFIED' : 'WIRE QUIET'}
            </span>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search intel, players, models…"
                aria-label="Search the news wire"
                className="h-8 w-44 border border-white/[0.08] bg-white/[0.04] pl-8 pr-9 text-xs text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.06] sm:w-64"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white/30">
                [/]
              </kbd>
            </div>
          </div>
        </div>

        {/* 2. CATEGORY FILTER RAIL */}
        <div
          className="mx-auto flex max-w-[1380px] items-center gap-2 overflow-x-auto border-t border-white/[0.06] pt-2.5 tn-scrollbar-none"
          role="toolbar"
          aria-label="News category filters"
        >
          {FEED_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`news-category-tab ${activeTab === tab ? 'news-category-tab--active' : ''}`}
            >
              <span>{TAB_LABELS[tab]}</span>
              <span className="news-category-tab__count">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 3. MAIN CONTENT GRID (ESPN BENTO HERO + TOP WIRE STREAM + OP-ED FEED) */}
      <main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-8 space-y-8">
        {isWireLoading && allItems.length === 0 && <NewsWireSkeleton />}

        {!isWireLoading && unifiedItems.length === 0 && (
          <section className="border border-dashed border-white/[0.12] bg-white/[0.015] p-10 text-center">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white font-mono">
              No transmissions match this filter
            </p>
            <p className="text-xs text-white/55 font-sans">
              {searchQuery.trim()
                ? `Nothing in the wire or the blog mentions "${searchQuery.trim()}".`
                : 'The MLB wire has not published anything in this category yet.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="news-control px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider cursor-pointer"
                >
                  Clear search
                </button>
              )}
              {activeTab !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className="news-control px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider cursor-pointer"
                >
                  Show every transmission
                </button>
              )}
            </div>
          </section>
        )}

        {featuredItem && (
          <section className="grid gap-6 lg:grid-cols-12 items-start" aria-label="Lead Story">
            {/* BIG LEAD HERO CARD (7 COLUMNS) */}
            <button
              type="button"
              onClick={() => openItem(featuredItem)}
              className="news-card group lg:col-span-7 relative flex flex-col justify-between overflow-hidden min-h-[380px]"
            >
              <div className="relative h-64 w-full overflow-hidden bg-white/[0.03] sm:h-80">
                <img
                  src={featuredItem.image || getCyberFallbackImage('LINEUP')}
                  alt=""
                  className="h-full w-full object-cover object-center brightness-[0.85] transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-2 font-mono">
                  <span className="border border-ve-emerald/25 bg-[#050505]/85 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-ve-emerald backdrop-blur-md">
                    Featured {featuredItem.type}
                  </span>
                  <span className={`border bg-[#050505]/85 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider backdrop-blur-md ${toneFor(featuredItem.category).pill}`}>
                    {featuredItem.category}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-white/40">
                  <span className="truncate">{featuredItem.author}</span>
                  <span className="text-white/20">·</span>
                  <span>{displayTime(featuredItem.publishedAt)}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-ve-emerald">{featuredItem.readTime}</span>
                </div>

                <h2 className="text-xl font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-ve-emerald sm:text-2xl font-sans">
                  {featuredItem.title}
                </h2>

                <p className="line-clamp-3 text-xs leading-relaxed text-white/55 font-sans sm:text-sm">
                  {featuredItem.summary}
                </p>

                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 font-mono text-xs">
                  <span className="flex items-center gap-1 font-medium text-ve-emerald group-hover:underline">
                    Read full dispatch <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/30">Verified dispatch</span>
                </div>
              </div>
            </button>

            {/* TOP 4 CURATED DISPATCHES (5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2 font-mono">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                  Top analytical dispatches
                </span>
                <span className="text-[9px] uppercase tracking-wider text-white/30">Real-time</span>
              </div>

              <div className="space-y-3">
                {secondaryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className="news-card group flex w-full gap-3 p-3"
                  >
                    {item.image && (
                      <div className="h-20 w-24 shrink-0 overflow-hidden border border-white/[0.06] bg-white/[0.03]">
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/40">
                        <span className={`font-medium uppercase tracking-wider ${toneFor(item.category).text}`}>
                          {item.category}
                        </span>
                        <span className="text-white/20">·</span>
                        <span>{displayTime(item.publishedAt)}</span>
                      </div>
                      <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white transition-colors group-hover:text-ve-emerald sm:text-sm font-sans">
                        {item.title}
                      </h3>
                      <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-white/30">
                        Read story →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. CHRONOLOGICAL DISPATCH STREAM & OP-ED VAULT */}
        {streamItems.length > 0 && (
          <section className="space-y-4 border-t border-white/[0.08] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2 font-mono">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                All transmissions ({unifiedItems.length})
              </h3>
              <span className="text-[9px] uppercase tracking-wider text-white/30">Chronological feed</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {streamItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="news-card group flex flex-col justify-between gap-3 p-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 font-mono text-[9px]">
                      <span className={`border px-1.5 py-0.5 font-medium uppercase tracking-wider ${toneFor(item.category).pill}`}>
                        {item.category}
                      </span>
                      <span className="text-white/30">{displayTime(item.publishedAt)}</span>
                    </div>

                    <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-ve-emerald font-sans">
                      {item.title}
                    </h4>

                    <p className="line-clamp-3 text-xs leading-relaxed text-white/55 font-sans">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 font-mono text-[10px]">
                    <span className="max-w-[150px] truncate text-white/30">{item.author}</span>
                    <span className="font-medium text-ve-emerald">Inspect →</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 5. WIRE STORY MODAL READER WITH ANIMATED STATCAST BARS & PEER COMMENTS */}
      {selectedWireStory && (
        <WireModalStoryReader
          story={selectedWireStory}
          slateIndex={slateIndex}
          onClose={() => setSelectedWireStory(null)}
          onAddPlayer={handleAddPlayer}
          onOpenResearch={(row) => navigateSection?.('research')}
          onRequireAuth={() => navigateSection ? navigateSection('profile') : window.location.assign('/login')}
        />
      )}
    </div>
  );
}

/**
 * Feed skeleton. The wire query used to render nothing at all while loading, so
 * the hero and the stream popped in separately once it resolved; this holds the
 * final geometry from the first paint.
 */
function NewsWireSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 border border-white/[0.08] bg-white/[0.015]">
          <div className="news-skeleton h-64 w-full sm:h-80" />
          <div className="space-y-3 p-5 sm:p-6">
            <div className="news-skeleton h-3 w-48" />
            <div className="news-skeleton h-6 w-full" />
            <div className="news-skeleton h-6 w-4/5" />
            <div className="news-skeleton h-3 w-full" />
            <div className="news-skeleton h-3 w-2/3" />
          </div>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <div className="news-skeleton h-3 w-44" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 border border-white/[0.08] bg-white/[0.015] p-3">
              <div className="news-skeleton h-20 w-24 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="news-skeleton h-2.5 w-24" />
                <div className="news-skeleton h-3.5 w-full" />
                <div className="news-skeleton h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 border-t border-white/[0.08] pt-6">
        <div className="news-skeleton h-3 w-52" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 border border-white/[0.08] bg-white/[0.015] p-4">
              <div className="news-skeleton h-3 w-20" />
              <div className="news-skeleton h-4 w-full" />
              <div className="news-skeleton h-3 w-full" />
              <div className="news-skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatcastGaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const clamped = Math.min(100, Math.max(8, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="uppercase tracking-wider text-white/40">{label}</span>
        <span className="font-semibold tabular-nums text-white">{value}%</span>
      </div>
      <div
        className="news-metric-bar"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="news-metric-bar__fill" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function WireModalStoryReader({
  story,
  slateIndex,
  onClose,
  onAddPlayer,
  onOpenResearch,
  onRequireAuth,
}: {
  story: MlbNewsItem;
  slateIndex: Map<string, HrWatchRow>;
  onClose: () => void;
  onAddPlayer: (player: HrWatchRow) => void;
  onOpenResearch: (player: HrWatchRow) => void;
  onRequireAuth?: () => void;
}) {
  const { paragraphs, image, isLoadingBody } = useMlbNewsArticle(story);
  const cat = classifyTacticalNews(story);
  const style = CATEGORY_STYLES[cat];
  const tone = toneFor(cat);
  const matchedPlayers = resolveMentions(story, slateIndex, paragraphs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-mono animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border border-white/[0.08] bg-[#050505] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`border px-2 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wider ${tone.pill}`}>
              {style.label}
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              Dispatch #{story.id.slice(-8)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="news-control shrink-0 px-2.5 py-1 text-xs cursor-pointer"
          >
            <span className="font-medium">CLOSE</span> <kbd className="text-[9px] text-white/40">[ESC]</kbd>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="relative h-48 w-full overflow-hidden border border-white/[0.08] bg-white/[0.03] sm:h-64">
            <img
              src={image?.url || story.image?.url || getCyberFallbackImage(cat)}
              alt=""
              className="h-full w-full object-cover brightness-[0.85]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white font-sans sm:text-2xl">
              {story.headline}
            </h2>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3 text-[10px] text-white/40">
              <span>{story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'LIVE'}</span>
              <span className="text-white/20">·</span>
              <span className={`font-medium uppercase tracking-wider ${tone.text}`}>{cat} intel</span>
            </div>
          </div>

          {/* ACTIVE SLATE HITTER BARS & METRICS (PRECISE QUANTITATIVE GAUGES WITH METALLIC ANIMATION) */}
          {matchedPlayers.length > 0 && (
            <div className="border border-ve-emerald/25 bg-ve-emerald/[0.06] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ve-emerald">
                  <Flame className="h-3.5 w-3.5 text-ve-amber" />
                  Active slate hitters ({matchedPlayers.length})
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">Statcast resolved</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {matchedPlayers.map((player) => {
                  const hitterPower = Math.round(player.hitterPower ?? 72);
                  const pitcherVuln = Math.round((player as any).pitcherVuln ?? 68);
                  const parkFactor = Math.round(player.parkFactor ?? 60);

                  return (
                    <div
                      key={player.stableId}
                      className="border border-white/[0.08] bg-white/[0.03] p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="block truncate font-sans text-xs font-semibold text-white">{player.playerName}</strong>
                          <span className="truncate font-mono text-[10px] text-white/40">
                            {player.team} vs {player.opponent}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddPlayer(player)}
                          title={`Add ${player.playerName} Anytime HR to slip`}
                          className="flex shrink-0 items-center gap-1 border border-ve-emerald/25 bg-ve-emerald/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ve-emerald transition-colors hover:border-ve-emerald/40 hover:bg-ve-emerald/20 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Slip
                        </button>
                      </div>

                      <div className="space-y-1.5 border-t border-white/[0.06] pt-1.5">
                        <StatcastGaugeBar label="Hitter Power" value={hitterPower} color="#31B583" />
                        <StatcastGaugeBar label="Pitcher Vulnerability" value={pitcherVuln} color="#4FB8DC" />
                        <StatcastGaugeBar label="Park Boost" value={parkFactor} color="#D99C4A" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paragraphs */}
          <div className="space-y-3 font-sans text-sm leading-relaxed text-white/75">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            {isLoadingBody && (
              <div className="space-y-2" aria-label="Fetching full dispatch body">
                <div className="news-skeleton h-3 w-full" />
                <div className="news-skeleton h-3 w-full" />
                <div className="news-skeleton h-3 w-4/5" />
              </div>
            )}
          </div>

          {/* Peer Discussion Thread on Wire Story */}
          <NewsDiscussionThread
            articleId={`wire-${story.id}`}
            articleTitle={story.headline}
            onRequireAuth={onRequireAuth}
          />
        </div>
      </div>
    </div>
  );
}

export default NewsHubPage;
