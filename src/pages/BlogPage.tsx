import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Terminal, ChevronRight, X, Copy, Check, Share2, Rss, Clock, Mail, Sparkles } from 'lucide-react';
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
    } else {
      document.title = 'Transmission Log | VouchEdge';
      if (window.location.pathname !== '/blog') {
        window.history.pushState({}, '', '/blog');
      }
    }
  }, [activePost]);

  // Reading time estimate (200 words/min)
  const readingTime = useMemo(() => {
    if (!activePost) return '1 MIN READ';
    const words = activePost.content.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} MIN READ`;
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('submitting');
    setTimeout(() => {
      setNewsletterStatus('success');
    }, 1000);
  };

  // Extract unique tags
  const allTags = useMemo(() => {
    const tags = new Set(BLOG_POSTS.map(post => post.tag));
    return Array.from(tags);
  }, []);

  // Filter posts based on search and tags
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? post.tag === selectedTag : true;
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16 relative">
        <main className="flex-grow flex flex-col px-6 py-24 sm:py-32 w-full max-w-5xl mx-auto relative z-10">
          
          <AnimatePresence mode="wait">
            {activePost ? (
              <motion.div
                key="reader"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-3xl mx-auto"
              >
                <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-4">
                  <button 
                    onClick={() => setActivePost(null)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono text-xs tracking-widest uppercase transition-colors group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Log
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 border border-white/10 bg-zinc-950 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Copy article link"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShareX}
                      className="flex items-center gap-1.5 border border-white/10 bg-zinc-950 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Share to X"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
                
                <header className="mb-12 border-b border-white/10 pb-8">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 border border-cyan-500/30 px-2 py-0.5 bg-cyan-950/30">
                      {activePost.tag}
                    </span>
                    <time className="font-mono text-xs text-zinc-500 tracking-wider">
                      {activePost.date}
                    </time>
                    <span className="text-zinc-600 font-mono text-xs">·</span>
                    <span className="flex items-center gap-1.5 text-zinc-500 font-mono text-xs tracking-wider">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {readingTime}
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                    {activePost.title}
                  </h1>
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                    <Terminal className="w-4 h-4 text-cyan-500" />
                    AUTHOR: <span className="text-zinc-200 font-bold">{activePost.author}</span>
                  </div>
                </header>

                <article className="prose prose-invert prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-cyan-400 prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-zinc-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-white/10 max-w-none pb-16">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activePost.content}
                  </ReactMarkdown>
                </article>

                {/* Post-Article Beta Capture Widget */}
                <section className="border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black p-8 sm:p-10 mb-20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Next Transmission Direct to Inbox</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-mono">Subscribe to Engineering Logs</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-xl">
                    Get deep-dive architectural breakdowns, probability models, and early beta access notices directly from the deck.
                  </p>
                  
                  {newsletterStatus === 'success' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                      <Check className="w-4 h-4" />
                      <span>Node subscription confirmed. You are on the dispatch list.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <input 
                        type="email" 
                        required
                        placeholder="analyst@domain.com"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyan-400 flex-1"
                        disabled={newsletterStatus === 'submitting'}
                      />
                      <button 
                        type="submit"
                        disabled={newsletterStatus === 'submitting'}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-mono text-xs uppercase tracking-widest px-6 py-2.5 transition-colors font-bold shrink-0 flex items-center justify-center gap-2"
                      >
                        {newsletterStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    </form>
                  )}
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-16 md:flex justify-between items-end gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-4">
                        Transmission <span className="text-cyan-500">Log</span>
                      </h1>
                      <a 
                        href="/feed.xml" 
                        target="_blank" 
                        rel="noreferrer"
                        className="border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 p-2 transition-colors inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"
                        title="RSS / Atom Feed"
                      >
                        <Rss className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RSS</span>
                      </a>
                    </div>
                    <p className="text-zinc-400 text-lg max-w-xl">
                      System updates, methodology breakdowns, and release notes straight from the engineering deck.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="mt-8 md:mt-0 flex-1 max-w-sm w-full relative"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Search transmissions..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-none pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-wrap gap-2 mb-12">
                  <button 
                    onClick={() => setSelectedTag(null)}
                    className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${selectedTag === null ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/30'}`}
                  >
                    ALL
                  </button>
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${selectedTag === tag ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/30'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, i) => (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        onClick={() => setActivePost(post)}
                        className="group relative border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/50 p-6 hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 border border-cyan-500/30 px-2 py-0.5 bg-cyan-950/30">
                              {post.tag}
                            </span>
                            <time className="font-mono text-xs text-zinc-500 tracking-wider">
                              {post.date}
                            </time>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">
                            {post.title}
                          </h2>
                          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/30 transition-all shrink-0">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
                        </div>
                      </motion.article>
                    ))
                  ) : (
                    <div className="py-20 text-center border border-white/5 bg-zinc-900/20 border-dashed">
                      <Terminal className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-500 font-mono text-sm">NO TRANSMISSIONS MATCH YOUR QUERY.</p>
                    </div>
                  )}
                </div>
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
