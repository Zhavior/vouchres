import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Terminal, 
  ChevronRight, 
  X, 
  Copy, 
  Check, 
  Share2, 
  Rss, 
  Clock, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  BookOpen,
  Radio,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { BLOG_POSTS, BlogPost } from '../data/blog/posts';

export default function BlogPage({ slug }: { slug?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [newsletterError, setNewsletterError] = useState('');
  
  // Use slug from URL to initialize active post, otherwise null
  const initialPost = useMemo(() => {
    return slug ? BLOG_POSTS.find(p => p.slug === slug) || null : null;
  }, [slug]);
  
  const [activePost, setActivePost] = useState<BlogPost | null>(initialPost);

  // Sync state if user navigates back/forward
  useEffect(() => {
    if (slug) {
      const post = BLOG_POSTS.find(p => p.slug === slug);
      if (post) setActivePost(post);
    } else {
      setActivePost(null);
    }
  }, [slug]);

  // Update browser URL and Document Title for SEO when post changes
  useEffect(() => {
    if (activePost) {
      document.title = `${activePost.title} | VouchEdge Transmission Log`;
      window.history.pushState({}, '', `/blog/${activePost.slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.title = 'Transmission Log & Knowledge Vault | VouchEdge';
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
      const text = encodeURIComponent(`"${activePost.title}" — Engineering Transmission from @VouchEdge`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterStatus('submitting');
    setNewsletterError('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Subscription failed.');
      }

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

  // Related posts for reader view
  const relatedPosts = useMemo(() => {
    if (!activePost) return [];
    return BLOG_POSTS.filter(p => p.id !== activePost.id).slice(0, 2);
  }, [activePost]);

  const getAccentColor = (accent?: string) => {
    switch (accent) {
      case 'emerald':
        return { border: 'border-emerald-500/40', bg: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(49,181,131,0.2)]' };
      case 'amber':
        return { border: 'border-amber-500/40', bg: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(217,156,74,0.2)]' };
      case 'purple':
        return { border: 'border-purple-500/40', bg: 'bg-purple-500', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.2)]' };
      default:
        return { border: 'border-cyan-500/40', bg: 'bg-cyan-400', text: 'text-cyan-300', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]' };
    }
  };

  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16 relative selection:bg-cyan-500 selection:text-black">
        
        {/* Subtle Cyber Grid Background */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]" 
          style={{ 
            backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} 
        />

        <main className="flex-grow flex flex-col px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full max-w-7xl mx-auto relative z-10">
          
          <AnimatePresence mode="wait">
            {activePost ? (
              /* ============================================================ */
              /* ARTICLE READER DECK                                          */
              /* ============================================================ */
              <motion.div
                key="reader"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl mx-auto"
              >
                {/* Navigation & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-white/10 pb-5">
                  <button 
                    onClick={() => setActivePost(null)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-cyan-300 font-mono text-xs font-bold tracking-widest uppercase transition-colors group"
                  >
                    <span className="group-hover:-translate-x-1.5 transition-transform">←</span> 
                    <span>Back to Transmission Deck</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 border border-white/15 bg-zinc-950 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-300 hover:border-cyan-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShareX}
                      className="flex items-center gap-2 border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share to X</span>
                    </button>
                  </div>
                </div>
                
                {/* Article Header */}
                <header className="mb-12 border-b border-white/10 pb-10">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300 border border-cyan-400/40 px-2.5 py-1 bg-cyan-950/50">
                      {activePost.tag}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">·</span>
                    <time className="font-mono text-xs text-zinc-400 tracking-wider">
                      {activePost.date}
                    </time>
                    <span className="font-mono text-xs text-zinc-500">·</span>
                    <span className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {activePost.readTime}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-8 text-white leading-tight font-mono tracking-tight">
                    {activePost.title}
                  </h1>

                  {/* Author Bio Bar */}
                  <div className="flex items-center justify-between p-4 border border-white/10 bg-zinc-950/80">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 border border-cyan-400/50 bg-cyan-950/60 flex items-center justify-center font-mono font-black text-cyan-300 text-sm">
                        ⚡
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm text-white tracking-wide">{activePost.author}</div>
                        <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">{activePost.authorRole}</div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-zinc-500 font-mono text-[11px] uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Ledger Verified</span>
                    </div>
                  </div>
                </header>

                {/* Sourced Evidence / Key Takeaway Card */}
                {activePost.keyTakeaway && (
                  <div className="mb-12 border-l-4 border-cyan-400 bg-zinc-950/90 border-y border-r border-white/10 p-6 shadow-2xl">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-black uppercase tracking-widest mb-2">
                      <Terminal className="w-4 h-4" />
                      <span>Core Takeaway // Sourced Evidence</span>
                    </div>
                    <p className="text-zinc-200 text-sm sm:text-base leading-relaxed font-mono">
                      "{activePost.keyTakeaway}"
                    </p>
                  </div>
                )}

                {/* Markdown Content Deck */}
                <article className="prose prose-invert prose-p:text-zinc-300 prose-p:text-base prose-p:leading-relaxed prose-headings:font-mono prose-headings:font-black prose-headings:text-white prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3 prose-h2:mt-12 prose-a:text-cyan-400 prose-a:underline hover:prose-a:text-cyan-300 prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-zinc-950 prose-code:px-2 prose-code:py-1 prose-code:border prose-code:border-white/15 prose-blockquote:border-l-cyan-400 prose-blockquote:text-zinc-400 max-w-none pb-16">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activePost.content}
                  </ReactMarkdown>
                </article>

                {/* Post Footer Newsletter Subscription */}
                <section className="border border-cyan-500/40 bg-gradient-to-br from-zinc-950 via-black to-cyan-950/20 p-8 sm:p-10 my-16 relative overflow-hidden shadow-2xl">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-black uppercase tracking-widest mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Direct Intelligence Dispatch</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 font-mono uppercase tracking-tight">
                    Subscribe to Engineering Transmissions
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-xl leading-relaxed">
                    Receive verified architectural teardowns, quantitative MLB probability models, and early beta cohort drops.
                  </p>
                  
                  {newsletterStatus === 'success' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm border border-emerald-500/30 bg-emerald-950/30 p-4">
                      <Check className="w-5 h-5" />
                      <span>Node registration confirmed. Transmission dispatched to your inbox.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-3 max-w-md">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="email" 
                          required
                          placeholder="analyst@vouchedge.xyz"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          className="bg-black border border-white/20 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyan-400 flex-1"
                          disabled={newsletterStatus === 'submitting'}
                        />
                        <button 
                          type="submit"
                          disabled={newsletterStatus === 'submitting'}
                          className="bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors font-black shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                          {newsletterStatus === 'submitting' ? 'Linking...' : 'Subscribe'}
                        </button>
                      </div>
                      {newsletterError && (
                        <p className="text-xs font-mono text-red-400">{newsletterError}</p>
                      )}
                    </form>
                  )}
                </section>

                {/* Related Articles Bento Grid */}
                {relatedPosts.length > 0 && (
                  <div className="border-t border-white/10 pt-12 pb-24">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-mono text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        <span>Adjacent Transmissions</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {relatedPosts.map((post) => {
                        const style = getAccentColor(post.colorAccent);
                        return (
                          <div
                            key={post.id}
                            onClick={() => setActivePost(post)}
                            className="group border border-white/10 bg-zinc-950/80 p-6 hover:border-cyan-400/60 transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-3">
                                <span className={`${style.text} font-bold uppercase tracking-wider`}>{post.tag}</span>
                                <span>{post.readTime}</span>
                              </div>
                              <h4 className="font-mono font-bold text-lg text-white group-hover:text-cyan-300 transition-colors mb-2 leading-snug">
                                {post.title}
                              </h4>
                              <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mt-6 pt-4 border-t border-white/5">
                              <span>Read Log</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ============================================================ */
              /* VAULT LIST / BENTO HUB VIEW                                 */
              /* ============================================================ */
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-12"
              >
                {/* HUD Top Deck Banner */}
                <section className="relative border border-white/15 bg-gradient-to-b from-zinc-950 to-black p-6 sm:p-10 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
                  
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="max-w-3xl space-y-4">
                      <div className="inline-flex items-center gap-2 border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1 font-mono font-black uppercase text-xs text-cyan-300">
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>VOUCHEDGE KNOWLEDGE VAULT & INTELLIGENCE DECK</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white font-mono leading-none">
                        Transmission <span className="text-cyan-400">Log</span>
                      </h1>
                      
                      <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
                        Sourced evidence, quantitative probability distribution breakdowns, and live release notes straight from the core engineering deck.
                      </p>
                    </div>

                    {/* Search Input Box */}
                    <div className="w-full lg:max-w-md">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="text" 
                          placeholder="Search transmissions by keyword..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-black border border-white/20 px-4 py-3.5 pl-11 pr-10 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors shadow-inner"
                        />
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Filter Badges with Post Counters */}
                <section className="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setSelectedTag(null)}
                      className={`font-mono text-xs font-black uppercase tracking-wider px-3.5 py-1.5 border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedTag === null 
                          ? 'border-cyan-400 text-black bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                          : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white bg-zinc-950'
                      }`}
                    >
                      <span>ALL</span>
                      <span className={`text-[10px] px-1 py-0.2 ${selectedTag === null ? 'bg-black text-cyan-300' : 'bg-white/10 text-zinc-400'}`}>
                        {BLOG_POSTS.length}
                      </span>
                    </button>

                    {tagStats.map(({ tag, count }) => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`font-mono text-xs font-black uppercase tracking-wider px-3.5 py-1.5 border transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedTag === tag 
                            ? 'border-cyan-400 text-black bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                            : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white bg-zinc-950'
                        }`}
                      >
                        <span>{tag}</span>
                        <span className={`text-[10px] px-1 py-0.2 ${selectedTag === tag ? 'bg-black text-cyan-300' : 'bg-white/10 text-zinc-400'}`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <a 
                    href="/feed.xml" 
                    target="_blank" 
                    rel="noreferrer"
                    className="border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/50 text-amber-300 px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold"
                  >
                    <Rss className="w-3.5 h-3.5" />
                    <span>RSS Feed</span>
                  </a>
                </section>

                {/* Featured Transmission Bento Spotlight (Only on ALL / unfiltered view) */}
                {!searchQuery && !selectedTag && featuredPost && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-cyan-400">
                      <Zap className="w-4 h-4 fill-cyan-400" />
                      <span>FLAGSHIP TRANSMISSION</span>
                    </div>

                    <div 
                      onClick={() => setActivePost(featuredPost)}
                      className="group border-2 border-cyan-500/40 bg-zinc-950/90 hover:border-cyan-400 transition-all duration-300 cursor-pointer overflow-hidden relative shadow-2xl"
                    >
                      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />
                      
                      <div className="p-6 sm:p-10">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                          <div className="flex items-center gap-2">
                            <span className="border border-cyan-400/50 bg-cyan-950/60 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
                              {featuredPost.tag}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">·</span>
                            <time className="font-mono text-xs text-zinc-400">{featuredPost.date}</time>
                          </div>
                          
                          <span className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {featuredPost.readTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                          <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-2xl sm:text-4xl font-black font-mono text-white group-hover:text-cyan-300 transition-colors leading-tight">
                              {featuredPost.title}
                            </h2>
                            <p className="text-zinc-300 font-mono text-sm sm:text-base leading-relaxed">
                              {featuredPost.excerpt}
                            </p>
                          </div>

                          <div className="border border-white/10 bg-black/60 p-5 space-y-4 flex flex-col justify-between h-full">
                            <div>
                              <div className="font-mono text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-1.5">
                                AUTHOR
                              </div>
                              <div className="font-mono font-bold text-white text-sm">
                                {featuredPost.author}
                              </div>
                              <div className="font-mono text-[11px] text-cyan-400">
                                {featuredPost.authorRole}
                              </div>
                            </div>

                            <button className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-black text-xs uppercase tracking-widest py-3 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4">
                              <span>Open Transmission</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* All Quest Logs / Transmissions Bento Grid */}
                <section className="space-y-6 pt-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-lg sm:text-xl font-black uppercase font-mono tracking-wider text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      <span>Transmissions Archive</span>
                      <span className="border border-white/20 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-400">
                        {filteredPosts.length}
                      </span>
                    </h2>
                  </div>

                  {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPosts.map((post, i) => {
                        const style = getAccentColor(post.colorAccent);
                        return (
                          <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            onClick={() => setActivePost(post)}
                            className="group border border-white/15 bg-zinc-950/90 hover:border-cyan-400/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl"
                          >
                            <div className={`h-1 w-full ${style.bg}`} />
                            
                            <div className="p-6 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-3.5">
                                  <span className={`border ${style.border} bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.text}`}>
                                    {post.tag}
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                    <Clock className="w-3 h-3" />
                                    {post.readTime}
                                  </span>
                                </div>

                                <h3 className="text-xl font-black font-mono text-white group-hover:text-cyan-300 transition-colors leading-snug mb-3 line-clamp-2">
                                  {post.title}
                                </h3>

                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-6 font-mono">
                                  {post.excerpt}
                                </p>
                              </div>

                              <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                                <div>
                                  <p className="font-mono text-xs font-bold text-white leading-none mb-1">
                                    {post.author}
                                  </p>
                                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                                    {post.date}
                                  </p>
                                </div>

                                <div className="flex h-8 w-8 items-center justify-center border border-white/20 bg-black text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-950 transition-all">
                                  <ArrowUpRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-24 text-center border border-white/10 bg-zinc-950/50 border-dashed">
                      <Terminal className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400 font-mono text-sm font-bold uppercase tracking-widest">
                        NO TRANSMISSIONS MATCH YOUR QUERY.
                      </p>
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                        className="mt-4 text-xs font-mono text-cyan-400 hover:underline uppercase"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Only show footer when looking at the list, keep reader clean */}
        {!activePost && <FooterSection />}
      </div>
    </div>
  );
}
