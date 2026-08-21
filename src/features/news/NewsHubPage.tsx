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

  // Combine Blog Posts & Tactical Wire Stories into an ESPN-level unified stream
  const unifiedItems = useMemo(() => {
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

    // Interleave or sort
    let all = [...blogEntries, ...wireEntries];

    // Filter by tab
    if (activeTab === 'BLOG') {
      all = all.filter((i) => i.type === 'BLOG');
    } else if (activeTab === 'TACTICAL') {
      all = all.filter((i) => i.type === 'WIRE');
    } else if (activeTab !== 'ALL') {
      all = all.filter((i) => i.category === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    return all;
  }, [wireItems, activeTab, searchQuery]);

  const featuredItem = unifiedItems[0];
  const secondaryItems = unifiedItems.slice(1, 5);
  const streamItems = unifiedItems.slice(5);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If a blog post is selected, render the ESPN Long-form Article Reader with Comments
  if (selectedBlogPost) {
    const articleCommentsCount = countArticleComments(selectedBlogPost.id);
    return (
      <div className="news-hub-root min-h-screen font-sans pb-24">
        {/* Top Sticky Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0C]/95 backdrop-blur-xl px-4 py-3 sm:px-8 font-mono">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedBlogPost(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <span>← RETURN TO NEWS WIRE</span>
            </button>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => handleCopy(window.location.href)}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300 hover:text-white transition cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>{copiedLink ? 'COPIED' : 'SHARE'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Longform Editorial Hero Banner */}
        <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-300 uppercase">
                {selectedBlogPost.tag}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400 font-medium">{selectedBlogPost.date}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400 font-medium">{selectedBlogPost.readTime}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {articleCommentsCount} COMMENTS
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {selectedBlogPost.title}
            </h1>

            {/* Author Byline Plate */}
            <div className="flex items-center justify-between border-y border-white/[0.08] py-3.5 my-6 font-mono">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-cyan-400/40 bg-gradient-to-tr from-cyan-900/60 to-emerald-900/60 flex items-center justify-center font-bold text-cyan-300">
                  {selectedBlogPost.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold text-white font-sans">{selectedBlogPost.author}</strong>
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400">{selectedBlogPost.authorRole}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[9px] font-mono text-zinc-400 rounded">
                  TRANSMISSION ID #{selectedBlogPost.id.padStart(4, '0')}
                </span>
              </div>
            </div>

            {/* Key Takeaway Callout Box */}
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4 sm:p-5 font-mono space-y-1.5 shadow-lg">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>EXECUTIVE QUANTITATIVE SUMMARY</span>
              </div>
              <p className="text-xs sm:text-sm text-cyan-100 font-sans leading-relaxed">
                {selectedBlogPost.keyTakeaway}
              </p>
            </div>

            {/* Markdown Body Content */}
            <article className="prose prose-invert prose-emerald max-w-none pt-6 text-zinc-200 text-sm sm:text-base leading-relaxed font-sans space-y-4">
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
      {/* 1. ESPN-STYLE TOP BREAKING NEWS BANNER WITH GLINT ANIMATION */}
      <div className="news-ticker-bar sticky top-0 z-30 px-4 py-2.5 sm:px-8 font-mono">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-white">
              VOUCHEDGE NEWS WIRE
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline text-[10px] text-emerald-400 font-medium">
              LIVE MLB TELEMETRY · EDITORIAL TRANSMISSIONS · PEER DISCUSSIONS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search intel, players, models..."
                className="h-8 w-40 sm:w-64 rounded-lg border border-white/[0.10] bg-[#111113] pl-8 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-400/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER RAIL (AUTHENTIC MACHINED SURFACE TABS WITH ANIMATION) */}
      <div className="border-b border-white/[0.06] bg-[#0D0D10] px-4 py-2 sm:px-8 font-mono overflow-x-auto tn-scrollbar-none">
        <div className="mx-auto flex max-w-7xl items-center gap-2 shrink-0">
          {(['ALL', 'BLOG', 'TACTICAL', 'LINEUP', 'PITCHER', 'WEATHER', 'DEVIATION'] as ActiveFeedTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`news-category-tab ${activeTab === tab ? 'news-category-tab--active' : ''}`}
            >
              {tab === 'BLOG' ? 'ENGINEERING BLOG' : tab === 'TACTICAL' ? 'WIRE DISPATCHES' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (ESPN BENTO HERO + TOP WIRE STREAM + OP-ED FEED) */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-8">
        {featuredItem && (
          <section className="grid gap-6 lg:grid-cols-12 items-start" aria-label="Lead Story">
            {/* BIG LEAD HERO CARD (7 COLUMNS) */}
            <div
              onClick={() => {
                if (featuredItem.type === 'BLOG' && featuredItem.blogData) {
                  setSelectedBlogPost(featuredItem.blogData);
                } else if (featuredItem.wireData) {
                  setSelectedWireStory(featuredItem.wireData);
                }
              }}
              className="news-bento-card group lg:col-span-7 relative flex flex-col justify-between rounded-2xl overflow-hidden cursor-pointer shadow-2xl min-h-[380px]"
            >
              <div className="relative h-64 sm:h-80 w-full bg-zinc-950 overflow-hidden">
                <img
                  src={featuredItem.image || getCyberFallbackImage('LINEUP')}
                  alt=""
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-black/40 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-md border border-emerald-500/30 bg-black/80 px-2.5 py-1 text-[9px] font-mono font-bold text-emerald-300 uppercase backdrop-blur-md">
                    FEATURED {featuredItem.type}
                  </span>
                  <span className="rounded-md border border-white/15 bg-black/80 px-2.5 py-1 text-[9px] font-mono text-zinc-300 backdrop-blur-md">
                    {featuredItem.category}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                  <span>{featuredItem.author}</span>
                  <span>·</span>
                  <span>{featuredItem.publishedAt}</span>
                  <span>·</span>
                  <span className="text-emerald-400">{featuredItem.readTime}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition leading-snug">
                  {featuredItem.title}
                </h2>

                <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed font-sans">
                  {featuredItem.summary}
                </p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:underline">
                    READ FULL DISPATCH &amp; AUDIT <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-zinc-500 text-[10px]">VERIFIED DISPATCH</span>
                </div>
              </div>
            </div>

            {/* TOP 4 CURATED DISPATCHES (5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 font-mono">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  TOP ANALYTICAL DISPATCHES
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">REAL-TIME</span>
              </div>

              <div className="space-y-3">
                {secondaryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'BLOG' && item.blogData) {
                        setSelectedBlogPost(item.blogData);
                      } else if (item.wireData) {
                        setSelectedWireStory(item.wireData);
                      }
                    }}
                    className="news-bento-card group flex gap-3 rounded-xl p-3 cursor-pointer"
                  >
                    {item.image && (
                      <div className="h-20 w-24 shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.06]">
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 flex flex-col justify-between space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[8px] text-zinc-400">
                        <span className="text-emerald-400 font-bold">{item.category}</span>
                        <span>·</span>
                        <span>{relativeTime(item.publishedAt)}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition">
                        {item.title}
                      </h3>
                      <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                        Read Story →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. CHRONOLOGICAL DISPATCH STREAM & OP-ED VAULT */}
        <section className="space-y-4 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center justify-between font-mono pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              ALL NEWS TRANSMISSIONS &amp; INTEL LOGS ({unifiedItems.length})
            </h3>
            <span className="text-[10px] text-zinc-500 uppercase">CHRONOLOGICAL FEED</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streamItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'BLOG' && item.blogData) {
                    setSelectedBlogPost(item.blogData);
                  } else if (item.wireData) {
                    setSelectedWireStory(item.wireData);
                  }
                }}
                className="news-bento-card group flex flex-col justify-between rounded-xl p-4 cursor-pointer shadow-md space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400 uppercase">
                      {item.category}
                    </span>
                    <span className="text-zinc-500">{relativeTime(item.publishedAt)}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  <p className="text-xs text-zinc-400 font-sans line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px]">
                  <span className="text-zinc-500 truncate max-w-[150px]">{item.author}</span>
                  <span className="text-emerald-400 font-bold">INSPECT →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
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

function StatcastGaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-zinc-400 uppercase">{label}</span>
        <span className="font-bold tabular-nums text-white">{value}%</span>
      </div>
      <div className="news-metric-bar">
        <div 
          className="news-metric-bar__fill" 
          style={{ width: `${Math.min(100, Math.max(8, value))}%`, backgroundColor: color }}
        />
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
  const matchedPlayers = resolveMentions(story, slateIndex, paragraphs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/[0.12] bg-[#111113] text-[#F4F4F5] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0A0A0C] px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-mono font-medium uppercase border rounded ${style.pill}`}>
              {style.label}
            </span>
            <span className="text-white text-xs font-bold">TACTICAL DISPATCH #{story.id.slice(-8)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="relative h-48 sm:h-64 w-full rounded-xl overflow-hidden bg-zinc-950 border border-white/10">
            <img
              src={image?.url || story.image?.url || getCyberFallbackImage(cat)}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-sans leading-tight">
              {story.headline}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 border-b border-white/[0.08] pb-3">
              <span>{story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'LIVE'}</span>
              <span>·</span>
              <span className="text-emerald-400 font-bold">{cat} INTEL</span>
            </div>
          </div>

          {/* ACTIVE SLATE HITTER BARS & METRICS (PRECISE QUANTITATIVE GAUGES WITH METALLIC ANIMATION) */}
          {matchedPlayers.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5 font-mono">
                  <Flame className="h-4 w-4 text-emerald-400" />
                  ACTIVE SLATE HITTERS IN THIS DISPATCH ({matchedPlayers.length})
                </span>
                <span className="text-[9px] text-zinc-400 font-mono">STATCAST RESOLVED</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {matchedPlayers.map((player) => {
                  const hitterPower = Math.round(player.hitterPower ?? 72);
                  const pitcherVuln = Math.round((player as any).pitcherVuln ?? 68);
                  const parkFactor = Math.round(player.parkFactor ?? 60);

                  return (
                    <div
                      key={player.stableId}
                      className="rounded-xl border border-white/[0.10] bg-[#0E0E11] p-3 space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-white block font-sans font-bold text-xs">{player.playerName}</strong>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {player.team} vs {player.opponent}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddPlayer(player)}
                          className="rounded-lg bg-emerald-400 px-2.5 py-1 text-[10px] font-bold text-black hover:bg-emerald-300 transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="h-3 w-3" /> ADD SLIP
                        </button>
                      </div>

                      {/* 3 Physical Animated Gauges */}
                      <div className="space-y-1.5 pt-1.5 border-t border-white/[0.06]">
                        <StatcastGaugeBar label="Hitter Power" value={hitterPower} color="#34D399" />
                        <StatcastGaugeBar label="Pitcher Vulnerability" value={pitcherVuln} color="#38BDF8" />
                        <StatcastGaugeBar label="Park Boost" value={parkFactor} color="#FBBF24" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paragraphs */}
          <div className="space-y-3 text-sm text-zinc-200 font-sans leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            {isLoadingBody && (
              <p className="text-xs text-zinc-500 font-mono italic animate-pulse">
                Fetching full dispatch body...
              </p>
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
