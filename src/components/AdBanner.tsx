import React from 'react';
import { Sparkles, ShieldCheck, Heart, TrendingUp, X, Award, Percent } from 'lucide-react';

interface AdBannerProps {
  bannerType: 'feed-top' | 'feed-sidebar' | 'inline-slip' | 'live-stream';
  subscriptionTier: 'BASIC' | 'GOLD' | 'SELLER_PRO';
  activeSponsor?: string;
  onUpgrade?: () => void;
}

export default function AdBanner({ 
  bannerType, 
  subscriptionTier, 
  activeSponsor = 'DraftKings',
  onUpgrade 
}: AdBannerProps) {
  // SELLER_PRO users get absolutely 0 ads!
  if (subscriptionTier === 'SELLER_PRO') {
    return null;
  }

  // GOLD users (Pro Users) get less ads.
  // We can choose to suppress certain types of ads for Gold.
  if (subscriptionTier === 'GOLD' && (bannerType === 'feed-sidebar' || bannerType === 'inline-slip')) {
    return null; // hide sidebar and inline slip ads for Pro!
  }

  const ADS_DATABASE = {
    'VouchEdge Premium Upgrade': {
      title: 'VouchEdge Seller Pro',
      promo: 'Monetize your parlay slips & sell verified tails completely ad-free!',
      badge: 'UNLIMITED PROOF',
      tagline: 'Upgrade above GOLD to get 100% ad-free experience with ledger certificates.',
      bgColor: 'from-violet-950/40 to-indigo-950/30',
      borderColor: 'border-violet-500/30',
      actionText: 'Go Premium Ad-Free ✨',
      link: '#',
      logoChar: '💎'
    }
  } as const;

  const ad = ADS_DATABASE['VouchEdge Premium Upgrade'];

  // Render styles depending on type
  if (bannerType === 'feed-top') {
    return (
      <div 
        className={`bg-gradient-to-r ${ad.bgColor} border ${ad.borderColor} p-4 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 select-none group text-left`}
        id="ad-banner-feed-top"
      >
        <div className="absolute top-0 right-0 bg-ve-graphite text-slate-500 text-[8px] font-mono px-2 py-0.5 rounded-bl uppercase tracking-widest font-black leading-none border-b border-l border-slate-850/60">
          SPONSORED AD
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-500 font-mono shrink-0 shadow-lg">
            {ad.logoChar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-200 text-xs tracking-wider uppercase">{ad.title}</h4>
              <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-900/40 font-mono px-1.5 py-0.2 rounded uppercase tracking-wide">
                ● {ad.badge}
              </span>
            </div>
            <p className="text-sm font-black text-white leading-snug mt-1">{ad.promo}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ad.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {subscriptionTier === 'BASIC' && onUpgrade && (
            <button 
              onClick={onUpgrade}
              className="text-[10px] text-slate-450 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg font-mono font-bold transition-all"
            >
              Hide Ads ✨
            </button>
          )}
          <a
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-950 bg-amber-400 hover:bg-amber-350 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-950/10 hover:scale-105"
          >
            {ad.actionText}
          </a>
        </div>
      </div>
    );
  }

  if (bannerType === 'feed-sidebar') {
    return (
      <div 
        className={`bg-gradient-to-b ${ad.bgColor} border ${ad.borderColor} p-4 rounded-2xl relative overflow-hidden space-y-3.5 select-none text-left`}
        id="ad-banner-sidebar"
      >
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-2">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-black">SPONSOR PROMOTION</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center font-bold text-xs text-amber-500 font-mono shrink-0">
              {ad.logoChar}
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">{ad.title}</span>
          </div>
          <h5 className="font-extrabold text-sm text-slate-100 leading-snug">
            {ad.promo}
          </h5>
          <p className="text-[10px] text-slate-400 leading-normal">
            {ad.tagline}
          </p>
        </div>

        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-center bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest block transition-colors"
        >
          {ad.actionText}
        </a>

        <div className="text-center">
          <button 
            onClick={onUpgrade}
            className="text-[9px] text-slate-550 hover:text-sky-400 transition-colors bg-transparent border-none font-mono tracking-tight"
          >
            Upgrading to GOLD removes sidebar banners
          </button>
        </div>
      </div>
    );
  }

  if (bannerType === 'inline-slip') {
    return (
      <div 
        className={`p-3 bg-[#0d121f] border border-dashed ${ad.borderColor} rounded-xl relative select-none flex items-center justify-between text-left`}
        id="ad-banner-inline-slip"
      >
        <div className="space-y-0.5">
          <span className="text-[8px] uppercase font-mono bg-purple-950/50 text-purple-400 px-1.5 py-0.2 rounded border border-purple-900/30">
            Ad Slip Booster
          </span>
          <p className="text-xs font-black text-slate-200 mt-1">{ad.title}</p>
          <p className="text-[10px] text-slate-450 leading-none">{ad.promo}</p>
        </div>
        
        <a 
          href={ad.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all shadow shrink-0"
        >
          Claim ⚡
        </a>
      </div>
    );
  }

  if (bannerType === 'live-stream') {
    return (
      <div 
        className="bg-[#0c0f17] border border-amber-500/25 p-3 rounded-xl flex items-center justify-between relative select-none animate-pulse text-left"
        id="ad-banner-live-stream-overlay"
      >
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-bold px-1.5 rounded-bl uppercase tracking-widest leading-none">
          Live Partner Ad
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber-400 text-base font-bold font-mono">⚡</span>
          <div className="min-w-0">
            <p className="text-xs font-black text-[#e2e8f0] uppercase tracking-wide truncate">{ad.title}</p>
            <p className="text-[10px] text-slate-400 truncate leading-none">{ad.promo}</p>
          </div>
        </div>

        <a 
          href={ad.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-amber-400 text-slate-955 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded transition-colors shrink-0"
        >
          Tail Code
        </a>
      </div>
    );
  }

  return null;
}
