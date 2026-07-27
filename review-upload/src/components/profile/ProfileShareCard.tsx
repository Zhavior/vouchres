import React, { useState } from 'react';
import { Share, Twitter, Copy, Check, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { CreatorProofProfile } from '../../types';
import { THEME_REGISTRY } from '../../theme/themeRegistry';
import ProfileAvatarBorder from './ProfileAvatarBorder';
import { profileHasGradedPicks } from '../../lib/profileWinRateDisplay';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_STAT_CHIP } from '../../theme/z8Tokens';

interface ProfileShareCardProps {
  profile: CreatorProofProfile;
  onClose?: () => void;
}

export default function ProfileShareCard({ profile, onClose }: ProfileShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const themeId = profile.profileThemeId || profile.activeTheme || 'cyber-blue';
  const activeTheme = THEME_REGISTRY.find(t => t.id === themeId) || THEME_REGISTRY[0];

  const winRateLabel = profileHasGradedPicks(profile)
    ? `${profile.winRate}%`
    : 'No graded picks yet';

  const shareText = `Check out my verified sport outcomes on VouchEdge.\n\nWin Rate: ${winRateLabel}\nNet Profit: +${profile.unitsNetProfit} Units\nHandle: @${profile.username}\n\n#VouchEdge #SportsBetting`;

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
    <div className={`${Z8_PANEL_PREMIUM} max-w-lg w-full mx-auto p-6 space-y-6 text-white relative overflow-hidden select-none`}>
      <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
            <Share className="w-5 h-5 text-vouch-cyan" />
            Social Share Studio
          </h3>
          <p className="text-xs text-white/45 mt-0.5">Share your verified track record</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${Z8_LABEL} text-white/45 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 bg-black/30 hover:bg-white/5 transition-all`}
          >
            Close
          </button>
        )}
      </div>

      <div
        className={`rounded-2xl p-1 ${activeTheme.pageBg || 'bg-gradient-to-b from-[#110c27] to-[#03040c]'}`}
        id="social-share-card-preview"
      >
        <div className="rounded-xl p-6 bg-black/50 border border-white/8 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <ProfileAvatarBorder
                borderId={profile.profileBorderId}
                avatarUrl={profile.avatarUrl}
                displayName={profile.displayName}
                initials={profile.displayName.split(' ').map(n => n[0]).join('')}
                size="lg"
                winRate={profile.winRate}
                isVerified={profile.verified}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white leading-none truncate">{profile.displayName}</h4>
                  {profile.verified && (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-vouch-emerald fill-vouch-emerald/10" />
                  )}
                </div>
                <p className="text-xs text-white/45 mt-0.5 font-mono">@{profile.username}</p>
                <span className={`mt-1.5 inline-block ${Z8_LABEL} text-[10px] px-2 py-0.5 rounded-full border border-vouch-cyan/25 bg-vouch-cyan/10 text-vouch-cyan`}>
                  {activeTheme.name}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`${Z8_LABEL} text-[10px] text-vouch-cyan border border-vouch-cyan/30 px-2 py-0.5 rounded-md bg-vouch-cyan/10`}>
                VOUCH<span className="text-white">EDGE</span>
              </span>
              <p className={`${Z8_LABEL} text-[10px] text-white/35 mt-1`}>Verified proof</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className={`${Z8_STAT_CHIP} text-center flex flex-col justify-center py-3`}>
              <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-vouch-emerald/70" aria-hidden />
              <span className="text-2xl font-black text-white tracking-tight font-mono z8-tabular-nums">
                {profileHasGradedPicks(profile) ? `${profile.winRate}%` : '—'}
              </span>
              <span className={`${Z8_LABEL} text-[10px] text-white/40 mt-1`}>
                {profileHasGradedPicks(profile) ? 'Win rate' : 'No graded picks yet'}
              </span>
            </div>
            <div className={`${Z8_STAT_CHIP} text-center flex flex-col justify-center py-3`}>
              <BarChart3 className="w-3.5 h-3.5 mx-auto mb-1 text-vouch-amber/70" aria-hidden />
              <span className="text-2xl font-black text-vouch-amber tracking-tight font-mono z8-tabular-nums">
                {profile.unitsNetProfit >= 0 ? '+' : ''}{profile.unitsNetProfit}u
              </span>
              <span className={`${Z8_LABEL} text-[10px] text-white/40 mt-1`}>Net ledger units</span>
            </div>
          </div>

          {profile.bio && (
            <div className="border border-white/8 bg-black/30 p-3 rounded-xl text-left">
              <p className="text-xs text-white/65 italic leading-relaxed line-clamp-2">&ldquo;{profile.bio}&rdquo;</p>
            </div>
          )}

          <div className={`flex items-center justify-between ${Z8_LABEL} text-[10px] text-white/35 border-t border-white/8 pt-3`}>
            <span>Graded picks only</span>
            <span>@{profile.username}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        <button
          onClick={handleCopyDraft}
          className={`${Z8_LABEL} border border-white/10 bg-black/35 hover:bg-white/5 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 transition-all text-[11px] tracking-wider text-white/70 hover:text-white`}
        >
          {copiedDraft ? (
            <>
              <Check className="w-4 h-4 text-vouch-emerald" />
              <span>Draft copied</span>
            </>
          ) : (
            <>
              <Twitter className="w-4 h-4 text-vouch-cyan" />
              <span>Copy X draft</span>
            </>
          )}
        </button>
        <button
          onClick={handleCopyLink}
          className={`${Z8_LABEL} border border-vouch-cyan/35 bg-vouch-cyan/15 hover:bg-vouch-cyan/25 rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 transition-all text-[11px] tracking-wider text-white`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-vouch-emerald" />
              <span>Link copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy profile URL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
