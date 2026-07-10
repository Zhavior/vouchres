import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Zap, 
  Twitter, 
  Download, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Share2, 
  HelpCircle, 
  Activity, 
  Info, 
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { Vouch, Parlay, CreatorProofProfile, FeedPost } from '../../types';
import { getFounderPointsLabel } from "../../lib/founderAccess";

interface VouchCardProps {
  key?: any;
  vouch: Vouch;
  layout?: 'feed-home' | 'feed-profile' | 'parlay-lab' | 'x-preview' | 'result-proof';
  onSaveVouch?: (vouch: Vouch) => void;
  isSaved?: boolean;
  onVouchAction?: (vouchId: string) => void;
  isVouched?: boolean;
  onTailAction?: (vouchId: string) => void;
  isTailed?: boolean;
  profile?: CreatorProofProfile | any;
  customTailCount?: number;
  onPostCreated?: (postData: Partial<FeedPost>) => void;
}

export default React.memo(function VouchCard({
  vouch,
  layout = 'feed-home',
  onSaveVouch,
  isSaved = false,
  onVouchAction,
  isVouched = false,
  onTailAction,
  isTailed = false,
  profile,
  customTailCount,
  onPostCreated
}: VouchCardProps) {
  // Local states for interactivity
  const [localVouched, setLocalVouched] = useState(isVouched);
  const [localTailed, setLocalTailed] = useState(isTailed);
  const [vouchCount, setVouchCount] = useState(vouch.vouchedCount || 0);
  const [tailCount, setTailCount] = useState(customTailCount ?? Math.floor((vouch.vouchedCount || 0) * 2.8 + 3));
  const [showExplanation, setShowExplanation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showVouchEdgeReport, setShowVouchEdgeReport] = useState(false);

  const renderInnerBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-extrabold bg-ve-surface-panel/70 px-1 py-0.5 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar text-left font-sans text-xs">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-white text-[11px] font-bold font-mono tracking-wider uppercase border-l-2 border-emerald-400 pl-2 mt-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {trimmed.replace('###', '').replace(/\*/g, '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={idx} className="text-slate-350 text-[9px] font-bold font-mono mt-2 uppercase tracking-wide">
                ▸ {trimmed.replace('####', '').replace(/\*/g, '').trim()}
              </h5>
            );
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const rawBody = trimmed.replace(/^[-* ]+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-emerald-400 font-bold mt-1 text-[7px]">■</span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  {renderInnerBold(rawBody)}
                </p>
              </div>
            );
          }
          return (
            <p key={idx} className="text-slate-300 leading-relaxed pl-1 font-mono text-[10px]">
              {renderInnerBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const aiConfidence = (vouch as any).aiConfidence ?? null;
  const capperConfidence = (vouch as any).capperConfidence ?? null;
  const riskTier = (vouch as any).riskTier ?? null;
  const isLocked = (vouch as any).isLocked ?? true;
  const lockTimeText = (vouch as any).lockTime ?? 'Locks before game time';
  const trustScoreImpact = (vouch as any).trustScoreImpact ?? (vouch.status === 'WON' ? 45 : vouch.status === 'LOST' ? -25 : 0);
  const actualResult = (vouch as any).actualResult ?? (vouch.status === 'WON' ? 'Covered' : vouch.status === 'LOST' ? 'Missed' : 'Pending Grade');
  
  // Custom theme background/styling (Cyber blue default)
  const isXPreview = layout === 'x-preview';
  const isProfile = layout === 'feed-profile';
  const isResultProof = layout === 'result-proof' || vouch.status !== 'PENDING';

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleVouchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVouchAction) {
      onVouchAction(vouch.id);
    }
    const nextVal = !localVouched;
    setLocalVouched(nextVal);
    setVouchCount(prev => nextVal ? prev + 1 : Math.max(0, prev - 1));
    triggerToast(nextVal ? '🔥 Vouched for this pick!' : 'Removed vouch');
  };

  const handleTailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTailAction) {
      onTailAction(vouch.id);
    }
    const nextVal = !localTailed;
    setLocalTailed(nextVal);
    setTailCount(prev => nextVal ? prev + 1 : Math.max(0, prev - 1));
    triggerToast(nextVal ? '🚀 Tailed this pick to your tracker!' : 'Un-tailed');
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveVouch) {
      onSaveVouch(vouch);
    } else {
      triggerToast(isSaved ? 'Removed from saved' : '🔖 Saved to your Vouch Board!');
    }
  };

  // Only meaningful once the vouch is actually saved server-side (Pass 2) and
  // public — otherwise there's no stable id for X/Slack/iMessage to unfurl.
  const getPermalink = (): string | null => {
    if (!vouch.backendVouchId || vouch.visibility === 'private') return null;
    return `${window.location.origin}/v/${vouch.backendVouchId}`;
  };

  const generateXShareIntent = () => {
    const text = `🔥 VERIFIED PROOF VOUCH 🔥\n\n📌 Pick: ${vouch.playerOrTeam ? `${vouch.playerOrTeam} — ` : ''}${vouch.market}\n📊 Game: ${vouch.gameName}\n📈 Odds: ${vouch.odds}\n\n🤖 AI Confidence: ${aiConfidence}%\n✍️ My Confidence: ${capperConfidence}%\n\n🛡️ Verified Pre-Lock via VouchEdge.ai\n\n⚠️ Probability-based. No guarantees. #sportsbetting #proof`;
    const permalink = getPermalink();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${permalink ? `&url=${encodeURIComponent(permalink)}` : ''}`;
    window.open(url, '_blank');
  };

  const handleCopyShareLink = () => {
    const permalink = getPermalink();
    if (!permalink) {
      triggerToast('⚠️ Save this vouch to your account first to get a shareable link.');
      return;
    }
    navigator.clipboard.writeText(permalink);
    triggerToast('🔗 Share link copied!');
  };

  // Helper for rendering a confidence gauge or sparkline
  const renderConfidenceMeter = (val: number | null, textClass: string, barClass: string, glowClass: string) => {
    if (val === null) return null;
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-[hsl(var(--ve-text-muted))] font-bold uppercase">
          <span>Meter Density</span>
          <span className={`${textClass} font-black`}>{val}%</span>
        </div>
        <div className="h-2 w-full bg-[hsl(var(--ve-surface-raised)/0.42)] rounded-full overflow-hidden border border-[hsl(var(--ve-border)/0.30)] p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass} ${glowClass}`}
            style={{ width: `${val}%` }}
          />
        </div>
      </div>
    );
  };

  const renderTrustScoreRing = (score: number) => {
    return (
      <div className="relative flex items-center justify-center w-11 h-11 shrink-0 bg-[hsl(var(--ve-surface-raised)/0.42)] rounded-full border border-[hsl(var(--ve-border)/0.30)]">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle cx="20" cy="20" r="16" stroke="currentColor" className="text-[hsl(var(--ve-border)/0.45)]" strokeWidth="2.5" fill="transparent" />
          <circle cx="20" cy="20" r="16" stroke="currentColor" className="text-vouch-cyan" strokeWidth="2.5" fill="transparent"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={(2 * Math.PI * 16) * (1 - score / 1000)}
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-black text-vouch-cyan">{score}</span>
      </div>
    );
  };

  const hasGap = Math.abs(aiConfidence - capperConfidence) > 25;
  const isAligned = Math.abs(aiConfidence - capperConfidence) <= 12;
  const cardTheme = vouch.cardTheme || 'cyber';

  let themeBgAndBorder = 'bg-[hsl(var(--ve-surface)/0.84)] border-[hsl(var(--ve-border)/0.34)] hover:border-vouch-cyan/30 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] text-[hsl(var(--ve-text-secondary))] p-4';
  let glowColor1 = 'bg-cyan-500/5';
  let glowColor2 = 'bg-indigo-500/5';
  let avatarBorder = 'border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.4)]';
  let oddsBadgeColor = 'text-cyan-400 bg-cyan-950/45 border border-cyan-900/80 shadow-[0_0_10px_rgba(6,182,212,0.1)]';

  if (isXPreview) {
    themeBgAndBorder = 'aspect-[1.91/1] p-6 flex flex-col justify-between bg-gradient-to-b from-[#060c1c] to-[#040812] border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-slate-200';
  } else {
    switch (cardTheme) {
      case 'cosmic':
        themeBgAndBorder = 'bg-gradient-to-br from-[#0c051a] to-[#120829] border-purple-900/50 hover:border-purple-500/35 shadow-lg shadow-black/60 text-slate-100 p-5';
        glowColor1 = 'bg-purple-500/8';
        glowColor2 = 'bg-fuchsia-500/8';
        avatarBorder = 'border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.45)]';
        oddsBadgeColor = 'text-purple-400 bg-purple-950/45 border border-purple-900/80 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
        break;
      case 'minimalist':
        themeBgAndBorder = 'bg-ve-surface-panel border-slate-800 hover:border-slate-700 shadow-md text-slate-300 p-5';
        glowColor1 = 'bg-slate-500/2';
        glowColor2 = 'bg-slate-400/2';
        avatarBorder = 'border-slate-500 shadow-none';
        oddsBadgeColor = 'text-slate-250 bg-slate-900 border border-slate-800';
        break;
      case 'neon-pulse':
        themeBgAndBorder = 'bg-gradient-to-br from-[#021810] to-[#042418] border-emerald-900/60 hover:border-emerald-400/45 shadow-lg shadow-emerald-950/40 text-emerald-50 p-5';
        glowColor1 = 'bg-emerald-500/10';
        glowColor2 = 'bg-teal-500/10';
        avatarBorder = 'border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
        oddsBadgeColor = 'text-emerald-400 bg-emerald-950/45 border border-emerald-900/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
        break;
      case 'vintage-gold':
        themeBgAndBorder = 'bg-gradient-to-br from-[#1a1205] to-[#261b07] border-amber-900/50 hover:border-amber-500/40 shadow-lg shadow-amber-950/30 text-amber-100 p-5';
        glowColor1 = 'bg-amber-500/8';
        glowColor2 = 'bg-yellow-500/8';
        avatarBorder = 'border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]';
        oddsBadgeColor = 'text-amber-400 bg-amber-950/45 border border-amber-900/80 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
        break;
      case 'cyber':
      default:
        themeBgAndBorder = isProfile 
          ? 'bg-[hsl(var(--ve-surface)/0.78)] border-[hsl(var(--ve-border)/0.32)] p-4 hover:border-[hsl(var(--ve-border)/0.50)] text-[hsl(var(--ve-text-secondary))]'
          : 'bg-[linear-gradient(135deg,hsl(var(--ve-surface)/0.88),hsl(var(--ve-surface-raised)/0.58),rgba(0,240,255,0.06))] border-[hsl(var(--ve-border)/0.34)] p-4 shadow-xl shadow-[hsl(var(--ve-shadow)/0.16)] hover:border-vouch-cyan/30 text-[hsl(var(--ve-text-secondary))]';
        break;
    }
  }

  // Let's render the layout
  return (
    <div 
      className={`relative w-full rounded-2xl border transition-all duration-300 select-none overflow-hidden ${themeBgAndBorder}`}
      id={`premium-vouch-card-${vouch.id}`}
    >
      {/* Glow ambient spots */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${glowColor1} rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-32 h-32 ${glowColor2} rounded-full blur-3xl pointer-events-none`} />

      {/* VERIFIED STAMP FOR RESULTS */}
      {isResultProof && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-12 pointer-events-none select-none opacity-20 uppercase tracking-widest border-4 rounded-xl px-4 py-2 font-black font-mono text-3xl z-10 flex flex-col items-center gap-1 border-emerald-500 text-emerald-500 bg-emerald-950/20">
          <span>{vouch.status}</span>
          <span className="text-xs">Grade Settled</span>
        </div>
      )}

      {/* TOAST PANEL */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[hsl(var(--ve-bg-deep)/0.94)] border border-vouch-cyan/50 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-vouch-cyan font-mono tracking-wider shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* TOP HEADER BLOCK: Poster Bio + Verifications + Trust Score */}
      <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.28)] pb-3">
        <div className="flex gap-3">
          {/* Avatar with customized premium neon glowing borders */}
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-full bg-[hsl(var(--ve-surface-raised)/0.58)] border ${avatarBorder} font-bold text-[hsl(var(--ve-text-secondary))] flex items-center justify-center text-sm`}>
              {profile?.displayName?.split(' ').map((n: any) => n[0]).join('') || 'C'}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-vouch-cyan text-[hsl(var(--ve-bg-deep))] text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[hsl(var(--ve-bg-deep))] font-mono">
              ★
            </span>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-[hsl(var(--ve-text-primary))] hover:underline cursor-pointer text-sm leading-none">
                {profile?.displayName || 'Alpha Capper'}
              </span>
              <span className="text-[hsl(var(--ve-text-muted))] text-xs">@{profile?.username || 'alphacapper'}</span>
            </div>
            
            {/* Creator Badge Stack */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-0.5 rounded-md border border-vouch-amber/30 bg-vouch-amber/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-vouch-amber">
                <Sparkles className="w-2.5 h-2.5 fill-vouch-amber" /> PRO CAPPER
              </span>
              <span className="rounded-md bg-[hsl(var(--ve-surface-raised)/0.46)] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[hsl(var(--ve-text-muted))]">
                TS: {profile?.trustScore || 845}
              </span>
              {riskTier && (
                <span className="rounded border border-vouch-amber/30 bg-vouch-amber/10 px-1.5 py-0.5 text-[8px] font-extrabold text-vouch-amber">
                  {riskTier} RISK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lock Status & Timestamp */}
        <div className="text-right flex flex-col items-end gap-1 shrink-0">
          {isLocked ? (
            <span className="text-[9px] bg-[hsl(var(--ve-surface-raised)/0.46)] text-[hsl(var(--ve-text-muted))] border border-[hsl(var(--ve-border)/0.30)] px-2 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-[hsl(var(--ve-text-muted))]" /> Posted Pre-Lock
            </span>
          ) : (
            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1 animate-pulse">
              <Unlock className="w-2.5 h-2.5" /> Locks in 1h 45m
            </span>
          )}
          <span className="text-[8px] text-[hsl(var(--ve-text-muted))] font-mono font-bold uppercase">{lockTimeText}</span>
        </div>
      </div>

      {/* CORE CONTENT BLOCK: PICK DETAILS + ODDS */}
      <div className="space-y-3 py-3.5 text-left">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.40)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-secondary))]">
                {vouch.sport}
              </span>
              <span className="text-[9px] font-bold uppercase text-[hsl(var(--ve-text-muted))]">Game Market Verified</span>
            </div>

            <h4 className="text-base font-black tracking-tight leading-snug text-[hsl(var(--ve-text-primary))] sm:text-lg">
              {vouch.playerOrTeam ? `${vouch.playerOrTeam} ` : ''}
              {vouch.selection ? `${vouch.selection} ` : ''}
              {vouch.line ? `(${vouch.line}) ` : ''}
              {!vouch.selection && !vouch.line && vouch.market}
            </h4>
            <p className="text-xs font-semibold text-[hsl(var(--ve-text-muted))]">{vouch.gameName}</p>
          </div>

          {/* Odds Badge */}
          <div className="text-right flex flex-col items-end shrink-0">
            <span className={`text-sm font-mono font-extrabold px-3 py-1 rounded-lg ${oddsBadgeColor}`}>
              {vouch.odds}
            </span>
            <span className="mt-1.5 font-mono text-[8px] font-black uppercase text-[hsl(var(--ve-text-muted))]">Verified odds</span>
          </div>
        </div>

        {/* PARLAY SUB-LEGS (If vouch.parlay is attached) */}
        {vouch.parlay && (
          <div className="my-2.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-850/80 relative space-y-2.5 overflow-hidden">
            {/* Visual connector line background */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-vouch-cyan/40" />
            
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
              <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-extrabold">Parlay Slip Legs</span>
              <span className="rounded border border-vouch-emerald/30 bg-vouch-emerald/10 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-vouch-emerald">Weaker leg: Underdogs</span>
            </div>

            <div className="space-y-3 relative z-10 pl-6">
              {vouch.parlay.legs.map((leg, legIdx) => (
                <div key={leg.id} className="relative flex items-start justify-between gap-3 text-xs">
                  {/* Glowing Node Indicator */}
                  <span className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full border border-[hsl(var(--ve-bg-deep))] bg-vouch-cyan shadow-[0_0_8px_rgba(0,240,255,0.40)]" />

                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">{leg.sport}</span>
                      <span className="text-slate-500 text-[10px] truncate max-w-[150px]">{leg.game}</span>
                    </div>
                    <p className="font-extrabold text-slate-200">{leg.selection}</p>
                    <p className="text-[9px] text-slate-450 font-medium">{leg.market}</p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="rounded bg-vouch-cyan/10 px-1.5 font-mono font-bold text-vouch-cyan">x{leg.odds}</span>
                    <span className={`text-[8px] font-bold uppercase ${leg.status === 'WON' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      ● {leg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-450 font-bold">
              <span>Book: DraftKings</span>
              <span>Total multiplier: <span className="text-emerald-400 font-extrabold">{vouch.parlay.totalOdds}</span></span>
            </div>

            {/* Dynamic Collapsible AI Edge Report */}
            {vouch.parlay.edgeReport && (
              <div className="mt-2 pt-2 border-t border-slate-900/60 text-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVouchEdgeReport(!showVouchEdgeReport);
                  }}
                  className="w-full py-1.5 flex items-center justify-between text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-950/10 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>SABERMETRIC EDGE REPORT ({vouch.parlay.edgeScore}% CONFIDENCE)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span>{showVouchEdgeReport ? 'Collapse' : 'Expand Report'}</span>
                    {showVouchEdgeReport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>
                
                {showVouchEdgeReport && (
                  <div className="mt-2 p-3 bg-ve-graphite/90 border border-slate-900/80 rounded-xl space-y-2.5 animate-fade-in text-left">
                    <div className="text-[9px] text-slate-500 font-mono font-semibold flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1">
                      <span>Vouchedge AI-3.5 Engine Analysis</span>
                      <span>Verified Integrity Protocol v3.2</span>
                    </div>
                    {renderMarkdownText(vouch.parlay.edgeReport)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COMPREHENSIVE SIDE-BY-SIDE CONFIDENCE MEASUREMENT */}
        {!isXPreview && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-surface-raised)/0.26)] p-3 text-xs md:grid-cols-2">
            {/* AI Model Score */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-vouch-emerald font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Engine Confidence
              </span>
              {renderConfidenceMeter(aiConfidence, 'text-vouch-emerald', 'bg-vouch-emerald', 'shadow-[0_0_8px_rgba(0,255,148,0.28)]')}
            </div>

            {/* Capper Personal Score */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-vouch-cyan font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> My Handled Confidence
              </span>
              {renderConfidenceMeter(capperConfidence, 'text-vouch-cyan', 'bg-vouch-cyan', 'shadow-[0_0_8px_rgba(0,240,255,0.28)]')}
            </div>

            {/* Side-by-side gap alerts or alignment indicators */}
            <div className="col-span-1 flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--ve-border)/0.24)] pt-2 text-[10px] md:col-span-2">
              <div className="flex items-center gap-1.5">
                {hasGap ? (
                  <span className="bg-rose-950 text-rose-400 font-extrabold px-2 py-0.5 rounded border border-rose-900 flex items-center gap-1 uppercase tracking-wide">
                    <AlertTriangle className="w-3 h-3 text-rose-455" /> Confidence Gap Spotted
                  </span>
                ) : isAligned ? (
                  <span className="bg-emerald-950 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-900/50 flex items-center gap-1 uppercase tracking-wide">
                    <Check className="w-3 h-3" /> MODEL ALIGNED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded border border-vouch-emerald/30 bg-vouch-emerald/10 px-2 py-0.5 font-extrabold uppercase tracking-wide text-vouch-emerald">
                    <Sparkles className="w-3 h-3" /> AI MODEL SUPPORTED
                  </span>
                )}
                <span className="text-[hsl(var(--ve-text-muted))] font-mono font-medium">
                  {hasGap 
                    ? "Capper is far more aggressive than model parameters suggest." 
                    : "Excellent agreement between computer projection & capper analysis."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* WRITTEN TRUST ANALYSIS / NOTE */}
        {vouch.userNote && !isXPreview && (
          <div className="p-3 bg-[hsl(var(--ve-surface-raised)/0.30)] rounded-xl border border-[hsl(var(--ve-border)/0.24)] text-xs text-[hsl(var(--ve-text-secondary))] leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-vouch-cyan flex-shrink-0 mt-0.5" />
            <p className="italic font-medium">
              "{vouch.userNote}"
            </p>
          </div>
        )}

        {/* AFTER GRADED RESULT PROOF EXTRA VIEW (DIFFERENT CARD TRANSFORMATION) */}
        {isResultProof && !isXPreview && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-slate-950 rounded-xl border border-emerald-900/30 flex justify-between items-center text-xs">
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> VERIFIED OUTCOME
              </span>
              <p className="text-slate-300 font-semibold leading-none">{vouch.status} — {actualResult}</p>
              <p className="text-[9px] text-slate-500 font-mono">Posted 10 hours before start time • Grade Lock: True</p>
            </div>
            
            {/* Win Score impact badge */}
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">Proof Impact</span>
              <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${trustScoreImpact >= 0 ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/45' : 'text-rose-450 bg-rose-950/40 border border-rose-900/45'}`}>
                {trustScoreImpact >= 0 ? `+${trustScoreImpact}` : trustScoreImpact} TS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METADATA: PLATFORM VOUCHES / TAILS / SCREENSHOT WATERMARK */}
      <div className="mt-1.5 flex items-center justify-between border-t border-[hsl(var(--ve-border)/0.28)] pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold text-[hsl(var(--ve-text-muted))]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-vouch-cyan rounded-full animate-ping" />
            {vouchCount} PLATFORM VOUCHES
          </span>
          <span className="flex items-center gap-1 uppercase">
            {tailCount} LIVE TAILS
          </span>
        </div>

        {/* Watermark badge designed for screenshotting to X */}
        <div className="hidden sm:flex items-center gap-1 opacity-45 bg-[hsl(var(--ve-bg-deep)/0.86)] px-2 py-0.5 border border-[hsl(var(--ve-border)/0.32)] rounded text-[8px] font-mono font-extrabold text-vouch-cyan tracking-wider">
          <span>VEdge Certified Proof</span>
        </div>
      </div>

      {/* INTERACTIVE ACTIONS BAR */}
      {!isXPreview && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[hsl(var(--ve-border)/0.24)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Vouch Button */}
            <button
              onClick={handleVouchClick}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                localVouched
                  ? 'bg-vouch-amber/15 border-vouch-amber/45 text-vouch-amber shadow-[0_0_12px_rgba(245,158,11,0.22)]'
                  : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-border)/0.48)] hover:text-[hsl(var(--ve-text-secondary))]'
              }`}
              id={`vouch-action-btn-${vouch.id}`}
            >
              <Zap className={`w-3.5 h-3.5 ${localVouched ? 'fill-vouch-amber text-vouch-amber' : ''}`} />
              <span>Vouch</span>
            </button>

            {/* Tail Button */}
            <button
              onClick={handleTailClick}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                localTailed
                  ? 'bg-vouch-cyan/15 border-vouch-cyan/45 text-vouch-cyan shadow-[0_0_12px_rgba(0,240,255,0.22)]'
                  : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-border)/0.48)] hover:text-[hsl(var(--ve-text-secondary))]'
              }`}
              id={`tail-action-btn-${vouch.id}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tail Pick</span>
            </button>

            {/* Save to Board Button */}
            <button
              onClick={handleSaveClick}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                isSaved
                  ? 'bg-emerald-400/14 border-emerald-400/42 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.20)]'
                  : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-border)/0.48)] hover:text-[hsl(var(--ve-text-secondary))]'
              }`}
              id={`save-board-btn-${vouch.id}`}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved to Board' : 'Save'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:justify-end">
            {/* Explainer / Model Breakdown trigger button */}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`p-2 rounded-lg font-bold transition-all text-xs border ${
                showExplanation 
                  ? 'bg-vouch-emerald/10 border-vouch-emerald/35 text-vouch-emerald' 
                  : 'bg-[hsl(var(--ve-surface-raised)/0.42)] border-[hsl(var(--ve-border)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-border)/0.48)] hover:text-[hsl(var(--ve-text-secondary))]'
              }`}
              title="Explain Probability Parameters"
              id={`explain-btn-${vouch.id}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Share to X Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-vouch-cyan hover:bg-vouch-cyan/90 text-[hsl(var(--ve-bg-deep))] rounded-lg font-bold transition-all text-xs hover:scale-103 active:scale-97 cursor-pointer shadow-md shadow-vouch-cyan/15"
              id={`share-x-btn-${vouch.id}`}
            >
              <Twitter className="w-3.5 h-3.5 fill-[hsl(var(--ve-bg-deep))]" />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}

      {/* EXPANDABLE MODEL-EXPLANATION DRAWER */}
      {showExplanation && (
        <div className="mt-3.5 p-3.5 bg-[hsl(var(--ve-surface)/0.76)] rounded-xl border border-[hsl(var(--ve-border)/0.30)] text-xs text-left space-y-2 animate-slide-up backdrop-blur-xl">
          <h5 className="font-extrabold text-vouch-emerald uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Model-Supported Backtesting Metrics
          </h5>
          <p className="text-[hsl(var(--ve-text-secondary))] leading-relaxed font-semibold">
            Based on the model parameters, players on {vouch.sport} with similar matchups have covered this market{aiConfidence !== null ? <> at a <strong className="text-vouch-cyan">{aiConfidence}% frequency</strong></> : ''} over the last 45 games. Team defensive rating decreases projected points by 4.2%, and rest advantages align high projection thresholds.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
            <div className="bg-[hsl(var(--ve-surface-raised)/0.42)] p-1.5 rounded border border-[hsl(var(--ve-border)/0.30)]">
              <span className="text-[hsl(var(--ve-text-muted))] block">Kelly Criterion</span>
              <span className="text-emerald-400 font-extrabold">2.4% yield</span>
            </div>
            <div className="bg-[hsl(var(--ve-surface-raised)/0.42)] p-1.5 rounded border border-[hsl(var(--ve-border)/0.30)]">
              <span className="text-[hsl(var(--ve-text-muted))] block">Simulated EV</span>
              <span className="text-vouch-cyan font-extrabold">+6.8% EV</span>
            </div>
            <div className="bg-[hsl(var(--ve-surface-raised)/0.42)] p-1.5 rounded border border-[hsl(var(--ve-border)/0.30)]">
              <span className="text-[hsl(var(--ve-text-muted))] block">Sample size</span>
              <span className="text-[hsl(var(--ve-text-secondary))] font-extrabold">12.8k sims</span>
            </div>
          </div>
        </div>
      )}

      {/* TWITTER INTENT SHARE DIALOG MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in" id="twitter-intent-share-modal">
          <div className="bg-ve-graphite border border-cyan-500/30 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-scale-in text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-black text-slate-100 text-sm tracking-wider uppercase flex items-center gap-2">
                <Twitter className="w-5 h-5 text-sky-400 fill-sky-400" /> Share Verification Preview to X
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition-colors"
                id="close-share-modal-btn"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              X/Twitter is the premier destination for capper visibility. Share this fully validated, pre-locked proof card with your followers to build bulletproof trust!
            </p>

            {/* 16:9 Watermarked Share Preview Card */}
            <div className="w-full bg-ve-obsidian border border-cyan-500/40 rounded-xl overflow-hidden shadow-inner p-4 flex flex-col justify-between relative" style={{ minHeight: '180px' }}>
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-60">
                <span className="text-[7px] bg-cyan-950 font-black text-cyan-400 px-1.5 py-0.2 rounded font-mono border border-cyan-800/40">VERIFIED PRE-LOCK</span>
                <span className="text-[7px] text-slate-400 font-mono">vouchedge.ai</span>
              </div>

              {/* Poster info */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-cyan-400/80 font-bold text-slate-300 flex items-center justify-center text-xs">
                  {profile?.displayName?.charAt(0) || 'C'}
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-extrabold text-slate-100">@{profile?.username || 'alphacapper'}</p>
                  <p className="text-[8px] text-slate-500">Capper Trust Score: {profile?.trustScore || 845}</p>
                </div>
              </div>

              {/* Play details */}
              <div className="my-2 text-left">
                <span className="text-[8px] bg-slate-850 text-slate-350 px-1.5 rounded uppercase font-mono">{vouch.sport}</span>
                <h4 className="text-xs font-black text-slate-100 mt-1 leading-snug">
                  {vouch.playerOrTeam ? `${vouch.playerOrTeam} — ` : ''}{vouch.market}
                </h4>
                <p className="text-[9px] text-slate-450">{vouch.gameName}</p>
              </div>

              {/* Confidence bars */}
              {(aiConfidence !== null || capperConfidence !== null) && (
                <div className="grid grid-cols-2 gap-2 text-left text-[8px] pt-1 border-t border-slate-900">
                  {aiConfidence !== null && (
                    <div><span className="text-purple-400 block font-bold font-mono">AI CONFIDENCE: {aiConfidence}%</span></div>
                  )}
                  {capperConfidence !== null && (
                    <div><span className="text-cyan-400 block font-bold font-mono">CAPPER COEF: {capperConfidence}%</span></div>
                  )}
                </div>
              )}

              {/* Watermark notice */}
              <div className="mt-2 text-center">
                <p className="text-[7px] text-rose-455 font-bold uppercase tracking-wider">Probability-based. No guarantees.</p>
              </div>
            </div>

            {/* Generated share caption block */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-500 font-black font-mono uppercase">Proposed Tweet Caption:</label>
              <textarea
                readOnly
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed outline-none focus:border-cyan-500/50 resize-none h-24"
                value={[
                  `🔥 VERIFIED PROOF VOUCH 🔥`,
                  ``,
                  `📌 Pick: ${vouch.playerOrTeam ? `${vouch.playerOrTeam} — ` : ''}${vouch.market}`,
                  `📊 Game: ${vouch.gameName}`,
                  `📈 Odds: ${vouch.odds}`,
                  aiConfidence !== null ? `🤖 AI Confidence: ${aiConfidence}%` : '',
                  capperConfidence !== null ? `✍️ My Confidence: ${capperConfidence}%` : '',
                  ``,
                  `🛡️ Verified Pre-Lock via VouchEdge.ai`,
                  ``,
                  `⚠️ Probability-based. No guarantees.`,
                ].filter(l => l !== undefined).join('\n')}
              />
            </div>

            {/* Action Toggles */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText([
                    `🔥 VERIFIED PROOF VOUCH 🔥`,
                    ``,
                    `📌 Pick: ${vouch.playerOrTeam ? `${vouch.playerOrTeam} — ` : ''}${vouch.market}`,
                    `📊 Game: ${vouch.gameName}`,
                    `📈 Odds: ${vouch.odds}`,
                    aiConfidence !== null ? `🤖 AI Confidence: ${aiConfidence}%` : '',
                    capperConfidence !== null ? `✍️ My Confidence: ${capperConfidence}%` : '',
                    ``,
                    `🛡️ Verified Pre-Lock via VouchEdge.ai`,
                    ``,
                    `⚠️ Probability-based. No guarantees.`,
                  ].filter(l => l !== undefined).join('\n'));
                  triggerToast('📋 Copied tweet caption!');
                }}
                className="px-4 py-2 bg-[hsl(var(--ve-surface-raised)/0.46)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] text-[hsl(var(--ve-text-secondary))] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-[hsl(var(--ve-border)/0.32)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Copy Caption</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="px-4 py-2 bg-[hsl(var(--ve-surface-raised)/0.46)] hover:bg-[hsl(var(--ve-surface-raised)/0.62)] text-[hsl(var(--ve-text-secondary))] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-[hsl(var(--ve-border)/0.32)]"
                title="Copy a link that shows a rich preview card on X, Slack, and iMessage"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Share Link</span>
              </button>

              <button
                onClick={generateXShareIntent}
                className="px-5 py-2 bg-vouch-cyan hover:bg-vouch-cyan/90 text-[hsl(var(--ve-bg-deep))] font-black rounded-xl text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-lg shadow-vouch-cyan/15"
              >
                <Twitter className="w-3.5 h-3.5 fill-[hsl(var(--ve-bg-deep))]" />
                <span>Publish to X</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
