/*
  Legacy Home Feed mock modules moved out of active UI.
  These are reference only. Do not import into production HomeFeedPage.
*/



{/* ================= LEGACY MOCK BLOCKS ================= */}

/* ---- vip-live-sharp-stats-grid ---- */
<div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60 shadow-xl space-y-3.5 text-center" id="vip-live-sharp-stats-grid">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="font-mono font-black text-[10px] uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Real-time Premium Indicators
            </span>
            <span className="font-mono text-[9px] font-black text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Live Feed Audit
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" /> AVG PRO ROI
              </span>
              <span className="text-sm font-black text-emerald-400 mt-1 font-mono tracking-wide">+14.2%</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" /> WIN RATIO
              </span>
              <span className="text-sm font-black text-sky-400 mt-1 font-mono tracking-wide">68.4%</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> PRO BACKERS
              </span>
              <span className="text-sm font-black text-amber-400 mt-1 font-mono tracking-wide">4,825</span>
            </div>

            <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-400" /> ACTIVE LUCK
              </span>
              <span className="text-sm font-black text-indigo-400 mt-1 font-mono tracking-wide">HOT🔥</span>
            </div>
          </div>
        </div>

/* ---- sharp-cheat-sheet-props ---- */
<div className="bg-[#0b0f19] p-4 rounded-2xl border border-amber-500/20 shadow-2xl space-y-3 relative overflow-hidden" id="sharp-cheat-sheet-props">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
            <span className="font-extrabold text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              VIP Daily Sharp Cheat Sheet
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Tap target to back prop</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Prop 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Shohei Ohtani
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">Over 1.5 Hits (+120) • backed by 28 Sharp Experts</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Shohei Ohtani Over 1.5 Hits! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>

            {/* Prop 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Paul Skenes
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">Over 7.5 Strikeouts (-115) • Sabermetric Matchup Matchup</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Paul Skenes Over 7.5 Ks! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>

            {/* Prop 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/60 border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all gap-2">
              <div className="space-y-0.5 text-left">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  Aaron Judge
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-mono">MLB</span>
                </span>
                <p className="text-[10px] text-slate-400">To Hit Home Run (+240) • Yankee Stadium Wind Favor</p>
              </div>
              <button
                type="button"
                onClick={() => triggerToast("🎯 Backed Aaron Judge Home Run (+240)! Saved to your session context.")}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-400 rounded-lg text-[10px] font-black uppercase transition-all shrink-0 font-mono tracking-wide"
              >
                + Back Prop
              </button>
            </div>
          </div>
        </div>

        {/* Composer section */}
        <FeedComposer 
          onPostCreated={onPostCreated} 
          savedSlips={savedSlips} 
          profileName={profileName} 
        />

        {/* Premium Ledger audit panel */}
        <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 text-[11px] text-slate-400 leading-normal flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400 animate-pulse" />
          <div>
            <span className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-widest block font-mono">
              VEdge Ledger Integrity Verified
            </span>
            <p className="mt-0.5">
              Browsing the <strong>VouchEdge Premium Ledger Channel</strong>. Real-time community metrics are cryptographically timestamped and matched locally.
            </p>
          </div>
        </div>

        {/* Dynamic Ad Support depending on Subscription Tier */}
        <AdBanner 
          bannerType="feed-top" 
          subscriptionTier={profile?.subscriptionTier || 'BASIC'} 
          activeSponsor={activeAdSponsor} 
          onUpgrade={() => {
            if (onSectionChange) onSectionChange('premium');
          }}
        />

        {/* Dynamic empty state */}
        {activeTab === 'following' && followingList.length === 0 ? (
          <div 
            className="p-10 text-center bg-[#121824] rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-3.5"
            id="empty-following-placeholder-slate"
          >
            <div className="w-12 h-12 bg-indigo-950/40 rounded-full flex items-center justify-center border border-indigo-900/30 text-xl">
              🔑
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-widest">Not tailing anyone yet!</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Go to the <strong>"For You"</strong> feed tab, find verified sports partners, and click <strong>"Follow"</strong> or <strong>"Tail"</strong> to populate your private subscribed ledger deck right here.
              </p>
            </div>
          </div>
        ) : algorithmPosts.length === 0 ? (
          <div 
            className="p-10 text-center bg-[#121824] rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-3.5"
            id="empty-feed-placeholder-slate"
          >
            <AlertTriangle className="w-8 h-8 text-slate-500 animate-pulse" />
            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-300 uppercase">No Matches Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active VouchEdge plays match your "{activeTab}" filter or search query. Create a post above to populate the feed!
              </p>
            </div>
          </div>
        ) : (
          /* List of Posts */
          <div className="space-y-4" id="posts-feed-stream-container">
            {visiblePosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onLike={onLikePost}
                onVouchAction={onVouchPost}
                onRepost={onRepostPost}
                onSaveVouch={onSaveVouch}
                savedVouchIds={savedVouchIds}
                onAddComment={onAddComment}
                onPostCreated={onPostCreated}
              />
            ))}
          </div>
        )}
        {/* Infinite Scroll Loader */}
        <div ref={feedSentinelRef} className="ve-feed-infinite-sentinel" aria-hidden="true" />

        <div className="ve-feed-load-state">
          {isLoadingMorePosts ? (
            <>
              <span className="ve-feed-loader-dot" />
              <strong>Loading more vouches...</strong>
            </>
          ) : hasMorePosts ? (
            <span>Keep scrolling for more picks, slips, and results.</span>
          ) : (
            <span>You're caught up for this stream.</span>
          )}
        </div>


      </div>
    </div>
