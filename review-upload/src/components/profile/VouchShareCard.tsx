import React, { useState } from 'react';
import { Share, Twitter, Copy, Check, Calendar, ArrowUpRight, Zap, Target } from 'lucide-react';
import { FeedPost, CreatorProofProfile } from '../../types';
import { THEME_REGISTRY } from '../../theme/themeRegistry';
import ProfileAvatarBorder from './ProfileAvatarBorder';

interface VouchShareCardProps {
  post: FeedPost;
  profile: CreatorProofProfile;
  onClose?: () => void;
}

export default function VouchShareCard({ post, profile, onClose }: VouchShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Get active profile theme
  const themeId = post.profileThemeId || profile.profileThemeId || profile.activeTheme || 'cyber-blue';
  const activeTheme = THEME_REGISTRY.find(t => t.id === themeId) || THEME_REGISTRY[0];

  const getThemeVars = () => {
    return {
      '--theme-border-color': activeTheme.borderColor || 'rgba(6,182,212,0.2)',
      '--theme-accent-color': activeTheme.accentText.includes('cyan') ? '#22d3ee' : activeTheme.accentText.includes('orange') ? '#f97316' : activeTheme.accentText.includes('emerald') ? '#10b981' : activeTheme.accentText.includes('rose') ? '#e11d48' : '#eab308',
    };
  };

  const getLegCount = () => {
    if (post.parlay) return post.parlay.legs.length;
    return 1;
  };

  const shareText = `🎯 New transparent sports pick locked on VouchEdge! \n\n🔥 Selection: ${
    post.vouch ? `${post.vouch.playerOrTeam || ''} ${post.vouch.market} (${post.vouch.odds})` : 'Multi-Leg Parlay Slip'
  }\n🛡️ Verified Capper: @${profile.username}\n⭐ Ledger Odds: ${
    post.parlay ? post.parlay.totalOdds : (post.vouch ? post.vouch.odds : 'Props')
  }\n\nJoin my tailing circle to lock in the edge! #VouchEdge #SportsModel`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://vouchedge.app/pick/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="bg-ve-graphite/90 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl max-w-lg w-full mx-auto shadow-[0_15px_50px_rgba(0,0,0,0.5)] space-y-6 text-slate-100 relative overflow-hidden select-none animate-slide-up">
      {/* Dynamic colored ambient backdrop light */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-emerald-600`} />
      <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-25 bg-indigo-600`} />

      <div className="flex justify-between items-center relative z-10 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            Slip Share Studio
          </h3>
          <p className="text-xs text-slate-400">Export premium visual ticket to social channels</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all uppercase"
          >
            Close
          </button>
        )}
      </div>

      {/* Share card wrapper container applying active theme variables */}
      <div 
        className={`p-1 rounded-2xl relative transition-all duration-500 shadow-2xl ${
          activeTheme.pageBg || 'bg-gradient-to-b from-[#110c27] to-[#03040c]'
        }`}
        style={getThemeVars() as React.CSSProperties}
        id="vouch-slip-share-card-preview"
      >
        <div className="rounded-[14px] p-6 bg-slate-950/92 border border-white/5 relative z-10 space-y-4">
          
          {/* Header row: creator details */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <ProfileAvatarBorder 
                borderId={post.profileBorderId || profile.profileBorderId}
                displayName={post.displayName}
                initials={post.displayName.split(' ').map(n=>n[0]).join('')}
                size="md"
                winRate={profile.winRate}
                isVerified={post.isVerified}
              />
              <div className="text-left ml-1">
                <h4 className="font-extrabold text-sm text-slate-100 leading-none">{post.displayName}</h4>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">@{post.username}</p>
              </div>
            </div>

            {/* Odds Badge */}
            <div className="text-right">
              <span className="text-xs font-black text-amber-400 font-mono tracking-wider border border-amber-400/30 px-2.5 py-1 rounded-lg bg-amber-400/5 shadow-[0_0_12px_rgba(250,204,21,0.15)] uppercase">
                {post.parlay ? post.parlay.totalOdds : (post.vouch ? post.vouch.odds : 'PRO VIEW')}
              </span>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 tracking-wider">Verified Odds Ticket</p>
            </div>
          </div>

          {/* Core Content: Render Parlay Legs or Vouch prop */}
          <div className="space-y-3 pt-1">
            {post.parlay ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">
                  <span>PARLAY CONTEXT ({getLegCount()} LEGS)</span>
                  <span className="text-indigo-400">{post.parlay.bookie}</span>
                </div>
                <div className="space-y-2">
                  {post.parlay.legs.map((leg, i) => (
                    <div key={leg.id || i} className="bg-ve-graphite border border-slate-850 p-2.5 rounded-xl flex items-center justify-between text-left">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-slate-900 border border-slate-800 font-bold text-slate-400 px-1 py-0.2 rounded font-mono uppercase shrink-0">
                            {leg.sport}
                          </span>
                          <h5 className="text-[11px] font-extrabold text-slate-200 line-clamp-1">{leg.selection}</h5>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5 line-clamp-1">{leg.game}</p>
                      </div>
                      <span className="text-[11px] font-black text-slate-300 font-mono shrink-0">
                        {leg.odds > 0 ? `+${Math.round((leg.odds - 1) * 100)}` : Math.round(leg.odds)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : post.vouch ? (
              <div className="bg-ve-graphite border border-slate-850 p-3.5 rounded-xl text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-amber-950/40 border border-amber-900/40 text-amber-400 font-extrabold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Prop Vouch
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">{post.sportBadge}</span>
                </div>
                <h4 className="text-[13px] font-extrabold text-slate-100 leading-snug">
                  {post.vouch.playerOrTeam ? `${post.vouch.playerOrTeam} — ` : ''}{post.vouch.market}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {post.vouch.userNote}
                </p>
              </div>
            ) : (
              <div className="bg-ve-graphite border border-slate-850 p-4 rounded-xl text-left">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {post.content}
                </p>
              </div>
            )}
          </div>

          {/* Social Proof stamp */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold font-mono border-t border-slate-900 pt-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>LOCK: {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500 font-bold uppercase tracking-wider">
              <span>LEDGER GUARD</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

        </div>
      </div>

      {/* Action triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 pt-2">
        <button
          onClick={handleCopyDraft}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 transition-all text-xs font-bold uppercase tracking-wider"
        >
          {copiedDraft ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Draft Copied!</span>
            </>
          ) : (
            <>
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>Copy Tweet Draft</span>
            </>
          )}
        </button>

        <button
          onClick={handleCopyLink}
          className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 transition-all text-xs font-bold uppercase tracking-wider shadow-md"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-100" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Slip Link</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
