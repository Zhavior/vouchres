import React, { useState } from 'react';
import { Share, Twitter, Copy, Check, ExternalLink, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { THEME_REGISTRY } from '../../theme/themeRegistry';
import ProfileAvatarBorder from './ProfileAvatarBorder';

interface ProfileShareCardProps {
  profile: CreatorProofProfile;
  onClose?: () => void;
}

export default function ProfileShareCard({ profile, onClose }: ProfileShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Get active profile theme
  const themeId = profile.profileThemeId || profile.activeTheme || 'cyber-blue';
  const activeTheme = THEME_REGISTRY.find(t => t.id === themeId) || THEME_REGISTRY[0];

  const getThemeVars = () => {
    return {
      '--theme-border-color': activeTheme.borderColor || 'rgba(6,182,212,0.2)',
      '--theme-accent-color': activeTheme.accentText.includes('cyan') ? '#22d3ee' : activeTheme.accentText.includes('orange') ? '#f97316' : activeTheme.accentText.includes('emerald') ? '#10b981' : activeTheme.accentText.includes('rose') ? '#e11d48' : '#eab308',
    };
  };

  const shareText = `🔥 Check out my verified sport outcomes on VouchEdge! \n\n🎯 Win Rate: ${profile.winRate}%\n💰 Net Profit: +${profile.unitsNetProfit} Units\n🛡️ Verified Handle: @${profile.username}\n\nJoin my tailing circle and build transparent edge! #VouchEdge #SportsBetting`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://vouchedge.app/capper/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="bg-[#0b0f19]/90 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl max-w-lg w-full mx-auto shadow-[0_15px_50px_rgba(0,0,0,0.5)] space-y-6 text-slate-100 relative overflow-hidden select-none animate-slide-up">
      {/* Glow Layer matching theme Accent */}
      <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-25 bg-sky-500`} />
      <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-indigo-600`} />

      <div className="flex justify-between items-center relative z-10 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
            <Share className="w-5 h-5 text-sky-400" />
            Social Share Studio
          </h3>
          <p className="text-xs text-slate-400">Flex your transparent track record to X / Twitter</p>
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

      {/* Share Card Outer frame with equipped Theme styling */}
      <div 
        className={`p-1 rounded-2xl relative transition-all duration-500 shadow-2xl ${
          activeTheme.pageBg || 'bg-gradient-to-b from-[#110c27] to-[#03040c]'
        }`}
        style={getThemeVars() as React.CSSProperties}
        id="social-share-card-preview"
      >
        {/* Dynamic theme particles demo symbols */}
        {activeTheme.id !== 'cyber-blue' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 flex justify-between p-4">
            {activeTheme.particleDemo?.slice(0, 3).map((sym, idx) => (
              <span key={idx} className="animate-bounce text-xs" style={{ animationDelay: `${idx * 400}ms` }}>{sym}</span>
            ))}
          </div>
        )}

        <div className={`rounded-[14px] p-6 bg-slate-950/90 border border-white/5 relative z-10 space-y-4`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <ProfileAvatarBorder 
                borderId={profile.profileBorderId}
                displayName={profile.displayName}
                initials={profile.displayName.split(' ').map(n=>n[0]).join('')}
                size="lg"
                winRate={profile.winRate}
                isVerified={profile.verified}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-slate-100 leading-none">{profile.displayName}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/10" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">@{profile.username}</p>
                <div className="mt-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                    activeTheme.id === 'cyber-blue' 
                      ? 'bg-sky-950/40 text-sky-400 border-sky-800/40' 
                      : 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40'
                  }`}>
                    {activeTheme.name} EQUIP
                  </span>
                </div>
              </div>
            </div>

            {/* VouchEdge Watermark badge */}
            <div className="text-right">
              <span className="text-[10px] font-black text-[#FFE81F] font-mono tracking-wider border border-[#FFE81F]/30 px-2 py-0.5 rounded-md bg-[#FFE81F]/5 shadow-[0_0_10px_rgba(255,232,31,0.1)]">
                ★ VOUCH<span className="text-white">EDGE</span>
              </span>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Verified Proof Guard</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="bg-[#0d1321] border border-slate-800/60 rounded-xl p-3 text-center flex flex-col justify-center shadow-md relative group hover:border-slate-700 transition-colors">
              <div className="absolute top-2 right-2 text-[10px] text-emerald-400 opacity-60">🎯</div>
              <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">{profile.winRate}%</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">WIN RATE PROOF</span>
            </div>

            <div className="bg-[#0d1321] border border-slate-800/60 rounded-xl p-3 text-center flex flex-col justify-center shadow-md relative group hover:border-slate-700 transition-colors">
              <div className="absolute top-2 right-2 text-[10px] text-amber-400 opacity-60">💰</div>
              <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">+{profile.unitsNetProfit}U</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">NET LEDGER UNITS</span>
            </div>
          </div>

          {/* Bio quote box */}
          <div className="bg-[#0b0c15] border border-slate-900/60 p-3 rounded-xl text-left">
            <p className="text-xs text-slate-300 italic leading-relaxed font-sans line-clamp-2">
              "{profile.bio}"
            </p>
          </div>

          {/* Security stamp verification footer */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold font-mono border-t border-slate-900 pt-3">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>STREAK: 100% AUDITED</span>
            </div>
            <span>ID: {profile.username.toUpperCase()}_GUARD</span>
          </div>
        </div>
      </div>

      {/* Copy / Action controls */}
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
              <span>Copy X/Twitter Draft</span>
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
              <span>Copy Profile URL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
