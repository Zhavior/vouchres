import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from 'motion/react';
import { Search, X, Copy, Check, Share2, Rss, ArrowRight, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { BLOG_POSTS, BlogPost } from '../data/blog/posts';
import { apiClient } from '../lib/apiClient';
import Navbar from '../components/landing-v4/Navbar';
import PublicFooter from '../components/landing-v4/PublicFooter';

/**
 * /blog — "The Record".
 *
 * Positioning inside the public family: LANDING is cinematic intelligence, DEV is
 * technical editorial engineering, CONTACT is a communications console. This page
 * is the published archive — an index, not a card wall. Every entry is a numbered
 * row on a hairline register, titles set in the V4 display face, all metadata in
 * mono. One accent (ve-emerald) carries the whole page; the previous per-tag
 * cyan/emerald/amber/purple coding was decoration that encoded nothing the tag
 * label did not already say, and its amber collided with --ve-warning.
 */

const META_CLASS = 'font-mono text-[10px] uppercase tracking-[0.24em] text-white/40';
const RULE = 'border-white/[0.08]';

const FIELD_CLASS =
  'w-full rounded-none border border-white/10 bg-obsidian-950 px-4 py-3 font-sans text-sm text-white ' +
  'placeholder-white/25 transition-colors focus:border-ve-emerald focus:outline-none focus:ring-1 focus:ring-ve-emerald ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

/** Meta separator. Rendered as a hairline dot so the row reads as one line. */
function Dot({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`h-[3px] w-[3px] shrink-0 rounded-full bg-white/20 ${className}`} />
  );
}

function PostMeta({ post, className = '' }: { post: BlogPost; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${META_CLASS} ${className}`}>
      {/* The tag takes the whole first line on narrow viewports so the row never
          wraps mid-list and strands a separator dot at the end of a line. */}
      <span className="w-full text-ve-emerald sm:w-auto">{post.tag}</span>
      <Dot className="hidden sm:block" />
      <time>{post.date}</time>
      <Dot />
      <span>{post.readTime}</span>
    </div>
  );
}

/**
 * One entry in the register. Used by the archive and by the adjacent-records
 * block in the reader so both read as the same object.
 */
function IndexRow({
  post,
  index,
  onOpen,
  compact = false,
}: {
  post: BlogPost;
  index: number;
  onOpen: (post: BlogPost) => void;
  /**
   * Stacked variant. The reader column is max-w-3xl, so the wide row's third
   * column would eat the title's measure and wrap it to six lines; inside a
   * narrow container the meta belongs under the title at every width.
   */
  compact?: boolean;
}) {
  return (
    <li className={`border-b ${RULE}`}>
      <button
        type="button"
        onClick={() => onOpen(post)}
        className={`group grid w-full grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-3 px-1 py-7 text-left transition-colors hover:bg-white/[0.02] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald sm:gap-x-8 ${
          compact ? 'sm:py-8' : 'sm:py-9 lg:grid-cols-[auto_1fr_auto]'
        }`}
      >
        <span className={`${META_CLASS} pt-1.5 tabular-nums transition-colors group-hover:text-ve-emerald`}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="min-w-0">
          <span
            className={`block font-bold italic leading-[1.15] tracking-tighter text-white transition-colors group-hover:text-ve-emerald ${
              compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {post.title}
          </span>
          <span className="mt-3 block max-w-2xl font-sans text-sm font-light leading-relaxed text-white/45 line-clamp-2">
            {post.excerpt}
          </span>
          <PostMeta post={post} className={`mt-4 ${compact ? '' : 'lg:hidden'}`} />
        </span>

        {!compact && (
          <span className="col-start-2 hidden items-center gap-6 lg:col-start-3 lg:flex">
            <PostMeta post={post} className="justify-end" />
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ve-emerald"
            />
          </span>
        )}
      </button>
    </li>
  );
}

/** Shared subscribe block. Same field language as /contact's transmission form. */
function SubscribeBlock({
  email,
  status,
  error,
  onEmailChange,
  onSubmit,
  id,
  stacked = false,
}: {
  email: string;
  status: 'idle' | 'submitting' | 'success';
  error: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  id: string;
  /** Single column. The reader's measure is too narrow for the 5/7 split. */
  stacked?: boolean;
}) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className={`border-t ${RULE} pt-14`}>
      <div className={`grid gap-10 ${stacked ? '' : 'lg:grid-cols-12 lg:gap-16'}`}>
        <div className={stacked ? '' : 'lg:col-span-5'}>
          <span className={`${META_CLASS} text-ve-emerald`}>Dispatch</span>
          <h2
            id={headingId}
            className="mt-5 text-3xl font-bold italic leading-[0.95] tracking-tighter text-white sm:text-4xl"
          >
            New entries,
            <br />
            <span className="text-white/25">as they land.</span>
          </h2>
        </div>

        <div className={stacked ? '' : 'lg:col-span-7'}>
          <p className="max-w-md font-sans text-base font-light leading-relaxed text-white/55">
            Architectural teardowns, quantitative model notes, and release logs. No cadence
            promised — the list only moves when something is published.
          </p>

          <p aria-live="polite" className="sr-only">
            {status === 'submitting' && 'Submitting your address.'}
            {status === 'success' && 'Subscription confirmed.'}
          </p>

          {status === 'success' ? (
            <div className="mt-8 flex items-center gap-3 border border-ve-emerald/30 bg-ve-emerald/[0.06] px-4 py-4">
              <Check className="h-4 w-4 shrink-0 text-ve-emerald" aria-hidden="true" />
              <span className="font-sans text-sm text-white/75">
                Confirmed. You are on the dispatch list.
              </span>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 max-w-lg">
              <label htmlFor={`${id}-email`} className={`block ${META_CLASS}`}>
                Return address
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id={`${id}-email`}
                  type="email"
                  required
                  placeholder="analyst@domain.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className={`${FIELD_CLASS} sm:flex-1`}
                  disabled={status === 'submitting'}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-ve-emerald px-8 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ve-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black"
                      />
                      Sending
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p id={`${id}-error`} className="mt-3 font-mono text-[11px] text-ve-red">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/** Scroll-scrubbed rule under the navbar. Transform only — no layout cost. */
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-px origin-left bg-ve-emerald"
    />
  );
}

export default function BlogPage({ slug }: { slug?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [newsletterError, setNewsletterError] = useState('');

  const reduceMotion = useReducedMotion();

  // Use slug from URL to initialize active post, otherwise null
  const initialPost = useMemo(() => {
    return slug ? BLOG_POSTS.find(p => p.slug === slug) || null : null;
  }, [slug]);

  const [activePost, setActivePost] = useState<BlogPost | null>(initialPost);

  // Sync state if the deep-linked slug changes.
  useEffect(() => {
    if (slug) {
      const post = BLOG_POSTS.find(p => p.slug === slug);
      if (post) setActivePost(post);
    } else {
      setActivePost(null);
    }
  }, [slug]);

  // Back/forward. The `slug` prop only reflects the URL as it was at mount:
  // App.tsx reads window.location once and has no state, so it never re-renders
  // on a history change, and this page sits on the document branch where
  // useSectionNavigation's popstate handler is not mounted. Without this
  // listener, Back out of an article left the article on screen under a /blog
  // URL and only a manual reload recovered.
  useEffect(() => {
    const syncFromLocation = () => {
      const path = window.location.pathname;
      const current = path.toLowerCase().startsWith('/blog/')
        ? path.slice('/blog/'.length).replace(/\/+$/, '')
        : '';
      setActivePost(current ? BLOG_POSTS.find(p => p.slug === current) ?? null : null);
    };
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  // Update browser URL and Document Title for SEO when post changes
  useEffect(() => {
    if (activePost) {
      document.title = `${activePost.title} | The VouchEdge Record`;
      // Only push when the URL is not already the article — arriving by deep
      // link would otherwise stack an identical entry and cost two Backs.
      const target = `/blog/${activePost.slug}`;
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.title = 'The Record — Research & Engineering Log | VouchEdge';
      if (window.location.pathname !== '/blog') {
        window.history.pushState({}, '', '/blog');
      }
    }
  }, [activePost]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && activePost) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareX = () => {
    if (activePost) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`"${activePost.title}" — from the VouchEdge Record`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterStatus('submitting');
    setNewsletterError('');

    try {
      await apiClient.post('/api/newsletter/subscribe', { email: newsletterEmail });

      setNewsletterStatus('success');
    } catch (err: any) {
      console.error('[newsletter] subscribe error:', err);
      setNewsletterError(err?.message || 'Failed to subscribe.');
      setNewsletterStatus('idle');
    }
  };

  // Tag list with counts
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOG_POSTS.forEach(p => {
      counts[p.tag] = (counts[p.tag] || 0) + 1;
    });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
  }, []);

  // Filter posts based on search and tags
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? post.tag === selectedTag : true;
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  // Find featured post
  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find(p => p.featured) || BLOG_POSTS[0];
  }, []);

  const isUnfiltered = !searchQuery && !selectedTag;

  // Unfiltered, entry 01 is pulled out as the lead, so the register carries the
  // remainder and keeps counting from 02 — one continuous numbering, no entry
  // printed twice. Under a filter there is no lead and every match is listed.
  const registerPosts = useMemo(() => {
    if (isUnfiltered && featuredPost) {
      return filteredPosts.filter(p => p.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, isUnfiltered, featuredPost]);

  // Related posts for reader view
  const relatedPosts = useMemo(() => {
    if (!activePost) return [];
    return BLOG_POSTS.filter(p => p.id !== activePost.id).slice(0, 2);
  }, [activePost]);

  const filterButtonClass = (active: boolean) =>
    `inline-flex items-center gap-2 border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald ${
      active
        ? 'border-ve-emerald bg-ve-emerald text-black'
        : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
    }`;

  return (
    <div
      className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 selection:bg-ve-emerald/30 ${AURORA_MAX_SHELL}`}
      data-scroll-owner="document"
    >
      <Navbar />

      <div className="flex min-h-screen flex-col bg-black pt-16 text-white">
        {activePost && <ReadingProgress />}

        <main id="main" className="flex-grow">
          <AnimatePresence mode="wait">
            {activePost ? (
              /* ============================================================ */
              /* READER                                                       */
              /* ============================================================ */
              <motion.div
                key="reader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="px-6 py-16 sm:py-20"
              >
                <div className="mx-auto w-full max-w-3xl">
                  {/* Action rail */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 border-b ${RULE} pb-5`}>
                    <button
                      type="button"
                      onClick={() => setActivePost(null)}
                      className={`group inline-flex items-center gap-2.5 ${META_CLASS} transition-colors hover:text-white`}
                    >
                      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
                        ←
                      </span>
                      <span>The Record</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-ve-emerald" aria-hidden="true" />
                            <span className="text-ve-emerald">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleShareX}
                        className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:border-white/30 hover:text-white"
                      >
                        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Article header */}
                  <header className="pt-14">
                    <PostMeta post={activePost} />

                    <h1 className="mt-7 text-4xl font-bold italic leading-[0.95] tracking-tighter text-white sm:text-5xl lg:text-6xl">
                      {activePost.title}
                    </h1>

                    <p className="mt-8 max-w-2xl font-sans text-lg font-light leading-relaxed text-white/55">
                      {activePost.excerpt}
                    </p>

                    <div className={`mt-10 flex flex-wrap items-center justify-between gap-4 border-y ${RULE} py-5`}>
                      <div className="min-w-0">
                        <div className="font-sans text-sm font-medium text-white">{activePost.author}</div>
                        <div className={`mt-1 ${META_CLASS}`}>{activePost.authorRole}</div>
                      </div>
                      <div className={`${META_CLASS} inline-flex items-center gap-2`}>
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ve-emerald" />
                        <span>Published</span>
                      </div>
                    </div>
                  </header>

                  {/* Key takeaway */}
                  {activePost.keyTakeaway && (
                    <aside className="mt-12 border-l-2 border-ve-emerald bg-obsidian-950 py-6 pl-6 pr-5 sm:pl-8">
                      <span className={`${META_CLASS} text-ve-emerald`}>Key takeaway</span>
                      <p className="mt-3 font-sans text-base font-light leading-relaxed text-white/75 sm:text-lg">
                        {activePost.keyTakeaway}
                      </p>
                    </aside>
                  )}

                  {/* Body */}
                  <article className="ve-article mt-14">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activePost.content}</ReactMarkdown>
                  </article>

                  <div className="mt-24">
                    <SubscribeBlock
                      id="reader-subscribe"
                      stacked
                      email={newsletterEmail}
                      status={newsletterStatus}
                      error={newsletterError}
                      onEmailChange={setNewsletterEmail}
                      onSubmit={handleNewsletterSubmit}
                    />
                  </div>

                  {relatedPosts.length > 0 && (
                    <section aria-labelledby="adjacent-heading" className={`mt-24 border-t ${RULE} pt-14 pb-8`}>
                      <h2 id="adjacent-heading" className={`${META_CLASS} text-ve-emerald`}>
                        Adjacent entries
                      </h2>
                      <ul className={`mt-6 border-t ${RULE}`}>
                        {relatedPosts.map((post, i) => (
                          <IndexRow key={post.id} post={post} index={i} onOpen={setActivePost} compact />
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ============================================================ */
              /* THE RECORD — INDEX                                           */
              /* ============================================================ */
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Masthead */}
                <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
                  <div className="mx-auto w-full max-w-7xl">
                    <motion.div
                      initial={reduceMotion ? false : { x: -12 }}
                      animate={{ x: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                      <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b ${RULE} pb-5`}>
                        <span className={`${META_CLASS} text-ve-emerald`}>06 / Published Record</span>
                        <span className={META_CLASS}>
                          {BLOG_POSTS.length} {BLOG_POSTS.length === 1 ? 'Entry' : 'Entries'}
                        </span>
                      </div>

                      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
                        <h1 className="text-5xl font-bold italic leading-[0.9] tracking-tighter text-white sm:text-7xl lg:col-span-7 lg:text-8xl">
                          Research
                          <br />
                          <span className="text-white/25">Record</span>
                        </h1>

                        <p className="max-w-md font-sans text-lg font-light leading-relaxed text-white/55 lg:col-span-5">
                          Everything we have published: quantitative method, architecture teardowns,
                          and release notes. Sourced, dated, and kept on the record.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </section>

                {/* Controls */}
                <section
                  aria-label="Filter the record"
                  /* Sticky only where it costs little: on a phone the chips wrap to
                     three rows and a pinned bar would eat a third of the viewport. */
                  className={`z-30 border-y ${RULE} bg-black/80 px-6 py-4 backdrop-blur-md lg:sticky lg:top-16`}
                >
                  <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        aria-pressed={selectedTag === null}
                        className={filterButtonClass(selectedTag === null)}
                      >
                        <span>All</span>
                        <span className={selectedTag === null ? 'text-black/50' : 'text-white/30'}>
                          {BLOG_POSTS.length}
                        </span>
                      </button>

                      {tagStats.map(({ tag, count }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          aria-pressed={selectedTag === tag}
                          className={filterButtonClass(selectedTag === tag)}
                        >
                          <span>{tag}</span>
                          <span className={selectedTag === tag ? 'text-black/50' : 'text-white/30'}>
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 lg:shrink-0">
                      <div className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
                        <Search
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
                        />
                        <label htmlFor="record-search" className="sr-only">
                          Search the record
                        </label>
                        <input
                          id="record-search"
                          type="search"
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-b border-white/10 bg-transparent py-2 pl-6 pr-7 font-mono text-xs text-white placeholder:text-white/30 transition-colors focus:border-ve-emerald focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <a
                        href="/feed.xml"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="RSS feed"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 text-white/40 transition-colors hover:border-white/30 hover:text-white"
                      >
                        <Rss className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </section>

                <div className="px-6 pb-32 sm:pb-40">
                  <div className="mx-auto w-full max-w-7xl">
                    {/* Lead entry */}
                    {isUnfiltered && featuredPost && (
                      <section aria-labelledby="lead-heading" className={`border-b ${RULE} py-16 sm:py-24`}>
                        <div className="flex items-center gap-3">
                          <span className={`${META_CLASS} tabular-nums`}>01</span>
                          <span className={`${META_CLASS} text-ve-emerald`}>Lead entry</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActivePost(featuredPost)}
                          className="group mt-8 block w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald"
                        >
                          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                            <h2
                              id="lead-heading"
                              className="text-4xl font-bold italic leading-[0.95] tracking-tighter text-white transition-colors group-hover:text-ve-emerald sm:text-5xl lg:col-span-7 lg:text-6xl"
                            >
                              {featuredPost.title}
                            </h2>

                            <div className="lg:col-span-5">
                              <PostMeta post={featuredPost} />
                              <p className="mt-6 font-sans text-base font-light leading-relaxed text-white/55">
                                {featuredPost.excerpt}
                              </p>
                              <div className={`mt-8 flex items-center justify-between border-t ${RULE} pt-5`}>
                                <div className="min-w-0">
                                  <div className="font-sans text-sm font-medium text-white">
                                    {featuredPost.author}
                                  </div>
                                  <div className={`mt-1 ${META_CLASS}`}>{featuredPost.authorRole}</div>
                                </div>
                                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ve-emerald">
                                  Read
                                  <ArrowUpRight
                                    aria-hidden="true"
                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  />
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </section>
                    )}

                    {/* Register */}
                    <section aria-labelledby="register-heading" className="pt-16 sm:pt-20">
                      <div className={`flex items-center justify-between border-b ${RULE} pb-4`}>
                        <h2 id="register-heading" className={META_CLASS}>
                          {isUnfiltered ? 'Archive' : 'Results'}
                        </h2>
                        <span className={`${META_CLASS} tabular-nums`}>
                          {isUnfiltered
                            ? `${registerPosts.length} more`
                            : `${filteredPosts.length} of ${BLOG_POSTS.length}`}
                        </span>
                      </div>

                      {filteredPosts.length === 0 ? (
                        <div className="py-24 text-center sm:py-32">
                          <p className={META_CLASS}>No entries match that query</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedTag(null);
                            }}
                            className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ve-emerald underline underline-offset-4 transition-colors hover:text-white"
                          >
                            Reset filters
                          </button>
                        </div>
                      ) : registerPosts.length === 0 ? (
                        <p className={`${META_CLASS} py-16 text-center`}>
                          The lead entry above is the whole record.
                        </p>
                      ) : (
                        <ul>
                          {registerPosts.map((post, i) => (
                            <IndexRow
                              key={post.id}
                              post={post}
                              index={isUnfiltered ? i + 1 : i}
                              onOpen={setActivePost}
                            />
                          ))}
                        </ul>
                      )}
                    </section>

                    <div className="mt-28 sm:mt-36">
                      <SubscribeBlock
                        id="record-subscribe"
                        email={newsletterEmail}
                        status={newsletterStatus}
                        error={newsletterError}
                        onEmailChange={setNewsletterEmail}
                        onSubmit={handleNewsletterSubmit}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Always display footer for consistent navigation and SEO across all views */}
        <PublicFooter />
      </div>
    </div>
  );
}
