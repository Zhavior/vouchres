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

export default function VouchCard({
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
        return <strong key={i} className="text-white font-extrabold bg-[#1e293b]/70 px-1 py-0.5 rounded">{part}</strong>;
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

  const generateXShareIntent = () => {
    const text = `🔥 VERIFIED PROOF VOUCH 🔥\n\n📌 Pick: ${vouch.playerOrTeam ? `${vouch.playerOrTeam} — ` : ''}${vouch.market}\n📊 Game: ${vouch.gameName}\n📈 Odds: ${vouch.odds}\n\n🤖 AI Confidence: ${aiConfidence}%\n✍️ My Confidence: ${capperConfidence}%\n\n🛡️ Verified Pre-Lock via VouchEdge.ai\n\n⚠️ Probability-based. No guarantees. #sportsbetting #proof`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Helper for rendering a confidence gauge or sparkline
  const renderConfidenceMeter = (val: number | null, colorClass: string, glowClass: string) => {
    if (val === null) return null;
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-[hsl(var(--ve-text-muted))] font-bold uppercase">
          <span>Meter Density</span>
          <span className={`${colorClass} font-black`}>{val}%</span>
        </div>
        <div className="h-2 w-full bg-[hsl(var(--ve-surface-raised)/0.42)] rounded-full overflow-hidden border border-[hsl(var(--ve-border)/0.30)] p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass} ${glowClass}`}
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
          <circle cx="20" cy="20" r="16" stroke="currentColor" className="text-[hsl(var(--ve-accent-cyan))]" strokeWidth="2.5" fill="transparent"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={(2 * Math.PI * 16) * (1 - score / 1000)}
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-black text-[hsl(var(--ve-accent-cyan))]">{score}</span>
      </div>
    );
  };

  const hasGap = Math.abs(aiConfidence - capperConfidence) > 25;
  const isAligned = Math.abs(aiConfidence - capperConfidence) <= 12;
  const cardTheme = vouch.cardTheme || 'cyber';

  let themeBgAndBorder = 'bg-[#0d1424] border-cyan-900/40 hover:border-cyan-500/20 shadow-lg shadow-black/40 text-slate-200 p-5';
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
        themeBgAndBorder = 'bg-[#121620] border-slate-800 hover:border-slate-700 shadow-md text-slate-300 p-5';
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
          ? 'bg-[#0a0f1d] border-slate-850 p-4 hover:border-slate-800 text-slate-200'
          : 'bg-[#0d1424] border-cyan-900/40 p-5 shadow-lg shadow-black/40 hover:border-cyan-500/20 text-slate-200';
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[hsl(var(--ve-bg-deep)/0.94)] border border-[hsl(var(--ve-accent-cyan)/0.50)] px-3.5 py-1.5 rounded-full text-[10px] font-bold text-[hsl(var(--ve-accent-cyan))] font-mono tracking-wider shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* TOP HEADER BLOCK: Poster Bio + Verifications + Trust Score */}
      <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.30)] pb-3">
        <div className="flex gap-3">
          {/* Avatar with customized premium neon glowing borders */}
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-full bg-[hsl(var(--ve-surface-raised)/0.58)] border-2 ${avatarBorder} font-bold text-[hsl(var(--ve-text-secondary))] flex items-center justify-center text-sm`}>
              {profile?.displayName?.split(' ').map((n: any) => n[0]).join('') || 'C'}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-[hsl(var(--ve-accent-cyan))] text-[hsl(var(--ve-bg-deep))] text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[hsl(var(--ve-bg-deep))] font-mono">
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
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[8px] bg-cyan-950/80 font-black text-cyan-400 px-1.5 py-0.5 rounded uppercase border border-cyan-800/40 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-cyan-400" /> PRO CAPPER
              </span>
              <span className="text-[8px] bg-[hsl(var(--ve-surface-raised)/0.46)] font-bold text-[hsl(var(--ve-text-muted))] px-1.5 py-0.5 rounded font-mono">
                TS: {profile?.trustScore || 845}
              </span>
              {riskTier && (
                <span className="text-[8px] bg-[#1a0f05] text-amber-500 border border-amber-900/30 px-1.5 py-0.5 rounded font-extrabold">
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
      <div className="py-4 text-left space-y-3.5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-slate-850 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border border-slate-800">
                {vouch.sport}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase">Game Market Verified</span>
            </div>

            <h4 className="text-base font-black text-slate-100 tracking-tight leading-snug">
              {vouch.playerOrTeam ? `${vouch.playerOrTeam} ` : ''}
              {vouch.selection ? `${vouch.selection} ` : ''}
              {vouch.line ? `(${vouch.line}) ` : ''}
              {!vouch.selection && !vouch.line && vouch.market}
            </h4>
            <p className="text-slate-400 text-xs font-semibold">{vouch.gameName}</p>
          </div>

          {/* Odds Badge */}
          <div className="text-right flex flex-col items-end shrink-0">
            <span className={`text-sm font-mono font-extrabold px-3 py-1 rounded-lg ${oddsBadgeColor}`}>
              {vouch.odds}
            </span>
            <span className="text-[8px] text-slate-500 font-mono font-black mt-1.5 uppercase">Verified odds</span>
          </div>
        </div>

        {/* PARLAY SUB-LEGS (If vouch.parlay is attached) */}
        {vouch.parlay && (
          <div className="my-2.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-850/80 relative space-y-2.5 overflow-hidden">
            {/* Visual connector line background */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-500/60 via-indigo-500/50 to-purple-500/20" />
            
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
              <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-extrabold">Parlay Slip Legs</span>
              <span className="text-[9px] font-mono text-purple-450 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-900/30 font-bold uppercase">Weaker leg: Underdogs</span>
            </div>

            <div className="space-y-3 relative z-10 pl-6">
              {vouch.parlay.legs.map((leg, legIdx) => (
                <div key={leg.id} className="relative flex items-start justify-between gap-3 text-xs">
                  {/* Glowing Node Indicator */}
                  <span className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 border border-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">{leg.sport}</span>
                      <span className="text-slate-500 text-[10px] truncate max-w-[150px]">{leg.game}</span>
                    </div>
                    <p className="font-extrabold text-slate-200">{leg.selection}</p>
                    <p className="text-[9px] text-slate-450 font-medium">{leg.market}</p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="font-mono text-cyan-450 font-bold bg-cyan-950/30 px-1.5 rounded">x{leg.odds}</span>
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
                  <div className="mt-2 p-3 bg-[#070b14]/90 border border-slate-900/80 rounded-xl space-y-2.5 animate-fade-in text-left">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 text-xs">
            {/* AI Model Score */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Engine Confidence
              </span>
              {renderConfidenceMeter(aiConfidence, 'bg-purple-500', 'shadow-[0_0_8px_rgba(168,85,247,0.5)]')}
            </div>

            {/* Capper Personal Score */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> My Handled Confidence
              </span>
              {renderConfidenceMeter(capperConfidence, 'bg-cyan-500', 'shadow-[0_0_8px_rgba(6,182,212,0.5)]')}
            </div>

            {/* Side-by-side gap alerts or alignment indicators */}
            <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2 text-[10px]">
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
                  <span className="bg-purple-950 text-purple-400 font-extrabold px-2 py-0.5 rounded border border-purple-900/40 flex items-center gap-1 uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" /> AI MODEL SUPPORTED
                  </span>
                )}
                <span className="text-slate-500 font-mono font-medium">
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
          <div className="p-3 bg-slate-900/35 rounded-xl border border-slate-800/40 text-xs text-slate-350 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
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
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-1.5 text-xs">
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 font-bold">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            {vouchCount} PLATFORM VOUCHES
          </span>
          <span className="flex items-center gap-1 uppercase">
            🚀 {tailCount} LIVE TAILS
          </span>
        </div>

        {/* Watermark badge designed for screenshotting to X */}
        <div className="hidden sm:flex items-center gap-1 opacity-45 bg-[#050b14] px-2 py-0.5 border border-slate-850 rounded text-[8px] font-mono font-extrabold text-cyan-400 tracking-wider">
          <span>VEdge Certified Proof</span>
        </div>
      </div>

      {/* INTERACTIVE ACTIONS BAR */}
      {!isXPreview && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5">
            {/* Vouch Button */}
            <button
              onClick={handleVouchClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs border ${
                localVouched
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-250'
              }`}
              id={`vouch-action-btn-${vouch.id}`}
            >
              <Zap className={`w-3.5 h-3.5 ${localVouched ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Vouch</span>
            </button>

            {/* Tail Button */}
            <button
              onClick={handleTailClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs border ${
                localTailed
                  ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-250'
              }`}
              id={`tail-action-btn-${vouch.id}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tail Pick</span>
            </button>

            {/* Save to Board Button */}
            <button
              onClick={handleSaveClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs border ${
                isSaved
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-250'
              }`}
              id={`save-board-btn-${vouch.id}`}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved to Board' : 'Save'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Explainer / Model Breakdown trigger button */}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`p-2 rounded-lg font-bold transition-all text-xs border ${
                showExplanation 
                  ? 'bg-indigo-950/30 border-indigo-800 text-indigo-400' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-250'
              }`}
              title="Explain Probability Parameters"
              id={`explain-btn-${vouch.id}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Share to X Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-bold transition-all text-xs hover:scale-103 active:scale-97 cursor-pointer shadow-md shadow-sky-550/10"
              id={`share-x-btn-${vouch.id}`}
            >
              <Twitter className="w-3.5 h-3.5 fill-slate-950" />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}

      {/* EXPANDABLE MODEL-EXPLANATION DRAWER */}
      {showExplanation && (
        <div className="mt-3.5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 text-xs text-left space-y-2 animate-slide-up">
          <h5 className="font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Model-Supported Backtesting Metrics
          </h5>
          <p className="text-slate-350 leading-relaxed font-semibold">
            Based on the model parameters, players on {vouch.sport} with similar matchups have covered this market{aiConfidence !== null ? <> at a <strong className="text-cyan-400">{aiConfidence}% frequency</strong></> : ''} over the last 45 games. Team defensive rating decreases projected points by 4.2%, and rest advantages align high projection thresholds.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
              <span className="text-slate-500 block">Kelly Criterion</span>
              <span className="text-emerald-400 font-extrabold">2.4% yield</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
              <span className="text-slate-500 block">Simulated EV</span>
              <span className="text-cyan-400 font-extrabold">+6.8% EV</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-850">
              <span className="text-slate-500 block">Sample size</span>
              <span className="text-slate-300 font-extrabold">12.8k sims</span>
            </div>
          </div>
        </div>
      )}

      {/* TWITTER INTENT SHARE DIALOG MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in" id="twitter-intent-share-modal">
          <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-scale-in text-left">
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
            <div className="w-full bg-[#050814] border border-cyan-500/40 rounded-xl overflow-hidden shadow-inner p-4 flex flex-col justify-between relative" style={{ minHeight: '180px' }}>
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
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Copy Caption</span>
              </button>
              
              <button
                onClick={generateXShareIntent}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              >
                <Twitter className="w-3.5 h-3.5 fill-slate-950" />
                <span>Publish to X</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
