import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle,
  Shield,
  Lock,
  Layout,
  Eye,
  Grid,
  Laptop,
  DollarSign,
} from 'lucide-react';
import { CreatorProofProfile } from '../types';
import { useTheme } from './theme/ThemeProvider';
import { BORDER_REGISTRY, VisualTheme, ProfileBorder } from '../theme/themeRegistry';
import ProfileAvatarBorder from './profile/ProfileAvatarBorder';
import { allAvailableThemes } from '../lib/themeResolve';

interface ThemeStoreProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updates: Partial<CreatorProofProfile>) => void;
}

export default function ThemeStore({ profile, onUpdateProfile }: ThemeStoreProps) {
  const {
    currentAppTheme,
    currentProfileTheme,
    currentBorder,
    equipThemeEverywhere,
    setBorder,
    unlockedThemes,
    unlockedBorders,
    unlockTheme,
    unlockBorder,
    reduceMotion,
    setReduceMotion,
    userCredits,
    setUserCredits
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'locker' | 'shop'>('shop');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string>(currentAppTheme.id);
  const [previewBorderId, setPreviewBorderId] = useState<string>(currentBorder?.id || 'default-cyber-ring');

  const allThemes = allAvailableThemes();

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4500);
  };

  const handleClaimCredits = () => {
    const newBalance = userCredits + 500;
    setUserCredits(newBalance);
    triggerSuccess("🎉 Claimed +500 FREE theme creation credits from VouchEdge Creator Pool!");
  };

  const handleBuyTheme = (theme: VisualTheme) => {
    if (userCredits < theme.cost) {
      alert("❌ Insufficient store credits! Please click 'Claim Free Credits' to top up your balance instantly.");
      return;
    }

    const nextCredits = userCredits - theme.cost;
    setUserCredits(nextCredits);
    unlockTheme(theme.id);
    equipThemeEverywhere(theme.id);
    setPreviewThemeId(theme.id);
    triggerSuccess(`💎 "${theme.name}" unlocked and equipped — your whole UI just changed. Visitors to your profile will see it too.`);
  };

  const handleBuyBorder = (border: ProfileBorder) => {
    const cost = border.rarity === 'legendary' ? 300 : border.rarity === 'epic' ? 200 : 100;
    if (userCredits < cost) {
      alert("❌ Insufficient store credits! Please click 'Claim Free Credits' to top up your balance instantly.");
      return;
    }

    const nextCredits = userCredits - cost;
    setUserCredits(nextCredits);
    unlockBorder(border.id);
    setBorder(border.id);
    setPreviewBorderId(border.id);
    triggerSuccess(`🛡️ "${border.name}" equipped on your avatar frame.`);
  };

  const handleResetToDefault = () => {
    equipThemeEverywhere('cyber-blue');
    setBorder('default-cyber-ring');
    triggerSuccess("🌿 Reset to baseline Cyber Blue — app and profile theme restored.");
  };

  const selectedPreviewTheme = allThemes.find(t => t.id === previewThemeId) || allThemes[0];
  const selectedPreviewBorder = BORDER_REGISTRY.find(b => b.id === previewBorderId) || BORDER_REGISTRY[0];

  const filteredThemes = activeCategory === 'All' 
    ? allThemes 
    : allThemes.filter(t => t.category === activeCategory);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto min-h-screen bg-transparent" id="theme-store-root">
      
      {/* Visual Header Banners */}
      <div className="bg-ve-storm/30 backdrop-blur-md rounded-2xl border border-white/[0.06] p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl" id="theme-banner">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 text-left z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase leading-none tracking-widest text-white shadow-sm">
              IDENTITY LOCKER & SHOP
            </span>
            <span className="text-white/40 text-[10px]">•</span>
            <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">ANIMATED PRESETS</span>
          </div>
          <h2 className="text-2xl font-black text-white/90 uppercase tracking-tight">
            VouchEdge Theme Store
          </h2>
          <p className="text-xs text-white/45 max-w-2xl leading-relaxed">
            Buy a theme once — it equips across your whole app instantly. When someone visits your profile, they see your theme across the full UI too.
          </p>
        </div>

        {/* User Balance Desk */}
        <div className="bg-black/30 border border-white/[0.08] p-4 rounded-xl flex flex-col items-center gap-2 text-center shrink-0 min-w-[200px] shadow-inner" id="user-balance-desk">
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider font-mono">AVAILABLE REVENUE CREDITS</span>
          <div className="flex items-center gap-1.5 font-mono text-xl font-black text-amber-400">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <span>{userCredits.toLocaleString()} pts</span>
          </div>
          <div
            title="Theme pts are allocated by your plan tier — 250 pts (Basic) or 750 pts (Gold / Seller Pro)"
            className="w-full mt-1.5 py-1.5 px-3 flex items-center justify-center gap-1.5 bg-obsidian-700/60 border border-white/[0.06] text-white/40 font-black text-[10px] rounded-lg tracking-wider uppercase cursor-not-allowed select-none"
          >
            <Lock className="w-3 h-3 shrink-0" />
            Theme Pts Locked
          </div>
        </div>
      </div>

      {/* Success alert message */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-900/60 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Route and Locker Toggles */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="flex bg-black/30 p-1 rounded-xl border border-slate-850 self-start text-xs font-semibold">
          <button
            onClick={() => setActiveTab('locker')}
            className={`px-4 py-2 rounded-lg font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'locker'
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>My Locker</span>
          </button>
          
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-lg font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Theme Store</span>
          </button>
        </div>

        <button
          onClick={handleResetToDefault}
          className="px-3.5 py-2 border border-slate-850 hover:border-white/10 bg-black/25/20 text-white/45 hover:text-white/90 rounded-lg text-xs font-mono transition-all uppercase tracking-wide font-black"
        >
          Reset All to Default
        </button>
      </div>

      {/* Dynamic Tab Body content */}
      {activeTab === 'locker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* LEFT COLUMN: ACTIVE IDENTITY CONFIGURATION */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. VISUAL SETTING CONTROL PANEL */}
            <div className="bg-ve-storm/40 rounded-2xl border border-slate-850 p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white/65 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
                <Laptop className="w-4 h-4 text-cyan-400" />
                Theme Engine Accessibility Options
              </h3>
              <div className="flex items-center justify-between bg-obsidian-900/60 p-4 rounded-xl border border-white/10">
                <div className="space-y-1 pr-4">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wide">Reduce Interface Motion</p>
                  <p className="text-[11px] text-white/45">Disable looping background particles, spinning rings, bounce effects, and custom text waves to optimize CPU & legibility.</p>
                </div>
                <button
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border ${
                    reduceMotion 
                      ? 'bg-rose-950 border-rose-800 text-rose-400' 
                      : 'bg-emerald-950 border-emerald-900 text-emerald-400'
                  }`}
                >
                  {reduceMotion ? 'Enabled (Restricted)' : 'Disabled (Active)'}
                </button>
              </div>
            </div>

            {/* 2. THEMES IN MY CABINET */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white/65 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Layout className="w-4 h-4 text-vouch-cyan" />
                Unlocked Themes ({unlockedThemes.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allThemes.filter(t => unlockedThemes.includes(t.id)).map((theme) => {
                  const isAppTheme = currentAppTheme.id === theme.id;
                  const isProfileTheme = currentProfileTheme.id === theme.id;

                  return (
                    <div 
                      key={theme.id}
                      onClick={() => setPreviewThemeId(theme.id)}
                      className={`group relative overflow-hidden p-5 rounded-3xl border flex flex-col justify-between gap-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                        isAppTheme || isProfileTheme
                          ? 'bg-cyan-950/20 border-cyan-400/40 shadow-[0_0_28px_rgba(34,211,238,0.12)]'
                          : previewThemeId === theme.id 
                            ? 'bg-indigo-950/20 border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.16)]' 
                            : 'bg-ve-storm/35 border-white/[0.08] hover:border-slate-600'
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-cyan-500/[0.04] opacity-70 group-hover:opacity-100 transition-opacity" />
                      {(isAppTheme || isProfileTheme) && (
                        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
                      )}

                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-[9px] font-black uppercase font-mono px-2.5 py-1 bg-black/30 rounded-full border border-white/10 text-white/80">
                            {theme.category}
                          </span>
                          <span className={`text-[9px] font-black font-mono px-2.5 py-1 rounded-full border ${
                            theme.rarity === 'legendary' ? 'text-yellow-200 bg-yellow-400/15 border-yellow-300/35' :
                            theme.rarity === 'epic' ? 'text-purple-200 bg-purple-400/15 border-purple-300/35' :
                            'text-white/65 bg-obsidian-700/70 border-slate-600/40'
                          }`}>
                            {theme.rarity}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-white/90 text-sm flex flex-wrap items-center gap-1.5">
                            {theme.name}
                            {isAppTheme && <span className="text-[8px] bg-sky-400/15 border border-sky-300/25 text-sky-200 px-2 py-0.5 rounded-full font-black font-mono">CURRENT APP</span>}
                            {isProfileTheme && <span className="text-[8px] bg-purple-400/15 border border-purple-300/25 text-purple-200 px-2 py-0.5 rounded-full font-black font-mono">CURRENT PROFILE</span>}
                          </h4>
                          <p className="text-[11px] text-white/65/85 mt-1.5 leading-relaxed font-semibold line-clamp-2">
                            {theme.description}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 shadow-inner">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="h-7 rounded-xl bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                            <span className="h-7 rounded-xl bg-cyan-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                            <span className="h-7 rounded-xl bg-fuchsia-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            equipThemeEverywhere(theme.id);
                            triggerSuccess(`✨ "${theme.name}" equipped across your whole UI and public profile.`);
                          }}
                          disabled={isAppTheme && isProfileTheme}
                          className={`w-full py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border text-center transition-all ${
                            isAppTheme && isProfileTheme
                              ? 'bg-cyan-400/15 border-cyan-300/25 text-cyan-200 cursor-not-allowed'
                              : 'bg-vouch-cyan/15 border-vouch-cyan/35 text-vouch-cyan hover:bg-vouch-cyan hover:text-black hover:scale-[1.02]'
                          }`}
                        >
                          {isAppTheme && isProfileTheme ? 'Equipped Everywhere' : 'Equip Everywhere'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. BORDERS IN MY CABINET */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-white/65 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                Unlocked Profile Borders ({unlockedBorders.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BORDER_REGISTRY.filter(b => unlockedBorders.includes(b.id)).map((border) => {
                  const isActive = currentBorder?.id === border.id;

                  return (
                    <div 
                      key={border.id}
                      onClick={() => setPreviewBorderId(border.id)}
                      className={`group relative overflow-hidden p-4 rounded-3xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                        isActive
                          ? 'bg-emerald-950/20 border-emerald-400/45 shadow-[0_0_24px_rgba(16,185,129,0.13)]'
                          : previewBorderId === border.id 
                            ? 'bg-emerald-950/10 border-emerald-400/55 shadow-[0_0_18px_rgba(16,185,129,0.11)]' 
                            : 'bg-ve-storm/35 border-white/[0.08] hover:border-emerald-400/30'
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-emerald-500/[0.05] opacity-70 group-hover:opacity-100 transition-opacity" />
                      {isActive && (
                        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl" />
                      )}

                      <div className="relative z-10 flex gap-3.5 items-center min-w-0">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-1.5 shadow-inner">
                          <ProfileAvatarBorder 
                            borderId={border.id} 
                            displayName="Initials" 
                            initials="PRO" 
                            size="md" 
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-black text-white/90 text-xs truncate flex items-center gap-1.5">
                            {border.name}
                            {isActive && (
                              <span className="text-[8px] bg-emerald-400/15 border border-emerald-300/25 text-emerald-200 px-2 py-0.5 rounded-full font-black font-mono">
                                EQUIPPED
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-white/65/80 mt-1 leading-snug line-clamp-2">
                            {border.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBorder(border.id);
                          triggerSuccess(`🛡️ Profile picture frame changed successfully to "${border.name}"!`);
                        }}
                        disabled={isActive}
                        className={`relative z-10 px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border text-center shrink-0 transition-all ${
                          isActive 
                            ? 'bg-emerald-400/15 border-emerald-300/25 text-emerald-200 cursor-not-allowed' 
                            : 'bg-white text-slate-950 border-white/80 hover:bg-slate-100 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isActive ? 'Active' : 'Equip'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PREVIEW OF CURRENT SELECTIONS */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="group relative overflow-hidden bg-ve-storm/45 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-5 space-y-5 shadow-2xl sticky top-4">
              
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-cyan-500/[0.04] opacity-80" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl group-hover:bg-cyan-300/20 transition-colors" />

              <div className="relative z-10 border-b border-white/10 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-white/90 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-300" />
                    Visual Identity Preview
                  </h3>
                  <span className="text-[8px] font-black font-mono uppercase rounded-full border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 px-2 py-1">
                    Live Look
                  </span>
                </div>
                <p className="text-[10px] text-white/45 font-semibold mt-1">See how your cards, borders, and typography appear.</p>
              </div>

              {/* LIVE DEMO BLOCK COMPILING SELECTS */}
              <div className={`relative z-10 p-4 rounded-3xl border ${selectedPreviewTheme.cardStyle} space-y-4 shadow-xl`} id="preview-sandbox-card">
                
                {/* Header Row */}
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/45 font-mono">
                  <span>Audit Preview</span>
                  <span className={`${selectedPreviewTheme.accentText} bg-obsidian-900/45 px-2 py-0.5 rounded border ${selectedPreviewTheme.borderColor}`}>
                    {selectedPreviewTheme.badge}
                  </span>
                </div>

                {/* Avatar with selected border */}
                <div className="flex items-center gap-3.5 border-b border-white/[0.04] pb-3">
                  <ProfileAvatarBorder 
                    borderId={selectedPreviewBorder.id}
                    displayName={profile.displayName}
                    initials={profile.displayName.slice(0, 2)}
                    size="lg"
                    isVerified={profile.verified}
                    winRate={profile.winRate}
                  />

                  <div className="min-w-0">
                    <h4 className="font-extrabold text-white/90 text-sm">{profile.displayName}</h4>
                    <p className="text-xs text-white/40">@{profile.username}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-mono font-black text-teal-400 bg-teal-950/40 px-1.5 py-0.2 rounded">
                        {profile.winRate.toFixed(1)}% WR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Vouch Card */}
                <div className={`p-3.5 rounded-xl border ${selectedPreviewTheme.vouchCardStyle} text-xs space-y-2.5`}>
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-white/40">
                    <span>MLB prop MATCHUP</span>
                    <span className="text-emerald-400">🔥 92% CONFIDENCE</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-white/90">Shohei Ohtani Over 1.5 Total Bases</p>
                    <p className="text-[10.5px] text-white/45 leading-normal mt-1">Ohtani matches perfectly under Dodgers stadium lights tonight with massive wind blowing outward.</p>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px] border-t border-white/[0.04] pt-2">
                    <span className="text-white/40">28 local vouches</span>
                    <span className={`font-black ${selectedPreviewTheme.accentText}`}>Odds: -115</span>
                  </div>
                </div>

                {/* Theme Action Button */}
                <button className={`w-full py-2.5 rounded-xl text-center text-xs font-black uppercase ${selectedPreviewTheme.buttonStyle}`}>
                  ✦ Back this VouchEdge slip
                </button>

              </div>

              {/* Status details of the preview theme */}
              <div className="relative z-10 bg-black/30 p-3.5 rounded-2xl border border-white/10 text-xs text-white/45 space-y-2.5 shadow-inner">
                <span className="text-[9.5px] font-mono font-black text-vouch-cyan uppercase tracking-wider block">PREVIEW DETAILS:</span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-white/40">
                    <span>Selected Theme:</span>
                    <span className="text-white/80 font-extrabold">{selectedPreviewTheme.name}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Selected Frame:</span>
                    <span className="text-white/80 font-extrabold">{selectedPreviewBorder.name}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Theme Rarity:</span>
                    <span className={`capitalize font-bold ${
                      selectedPreviewTheme.rarity === 'legendary' ? 'text-yellow-400' :
                      selectedPreviewTheme.rarity === 'epic' ? 'text-purple-400' :
                      'text-white/45'
                    }`}>{selectedPreviewTheme.rarity}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-8">
          
          {/* CATEGORIES FILTERS */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] border-b border-slate-850 pb-3">
            {['All', 'Core', 'Sport', 'Flex', 'Retro', 'Premium', 'Trust', 'Minimal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold uppercase tracking-wide transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-transparent'
                    : 'bg-black/25 border-white/10 text-white/45 hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold text-white/65 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-vouch-cyan" />
              Locked Theme Catalog ({allThemes.filter(t => !unlockedThemes.includes(t.id)).length} Available)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="shop-themes-grid">
              {filteredThemes.map((theme) => {
                const isUnlocked = unlockedThemes.includes(theme.id);
                if (isUnlocked) return null; // Only show locked themes in store

                return (
                  <div 
                    key={theme.id}
                    className="group relative bg-ve-storm/30 backdrop-blur-xl rounded-3xl border border-white/[0.08] flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/35 hover:shadow-cyan-950/30"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-cyan-500/[0.05] opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl group-hover:bg-cyan-300/20 transition-colors" />

                    {/* Theme header with tags */}
                    <div className="relative z-10 p-4 bg-obsidian-900/55 border-b border-white/10 flex justify-between items-center text-[10px] uppercase font-bold text-white/65 font-mono select-none">
                      <span className="rounded-full bg-black/30 border border-white/10 px-2.5 py-1">{theme.category}</span>
                      <span className={`font-black px-2.5 py-1 rounded-full border ${
                        theme.rarity === 'legendary' ? 'text-yellow-200 bg-yellow-400/15 border-yellow-300/35' :
                        theme.rarity === 'epic' ? 'text-purple-200 bg-purple-400/15 border-purple-300/35' :
                        'text-white/65 bg-obsidian-700/70 border-slate-600/40'
                      }`}>
                        {theme.rarity}
                      </span>
                    </div>

                    <div className="relative z-10 p-5 flex-1 flex flex-col justify-between gap-5 text-left">
                      <div className="space-y-3">
                        <h4 className="font-black text-white/90 text-base flex justify-between items-start gap-3">
                          <span className="leading-tight">{theme.name}</span>
                          <span className="shrink-0 text-[10px] text-cyan-300 font-black rounded-full bg-cyan-950/45 border border-cyan-400/20 px-2 py-1">
                            {theme.badge}
                          </span>
                        </h4>

                        <p className="text-[11px] text-white/65/85 leading-relaxed font-semibold line-clamp-2">
                          {theme.description}
                        </p>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 shadow-inner">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="h-8 rounded-xl bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                            <span className="h-8 rounded-xl bg-cyan-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                            <span className="h-8 rounded-xl bg-fuchsia-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <span className="h-1.5 rounded-full bg-white/35" />
                            <span className="h-1.5 rounded-full bg-white/20" />
                            <span className="h-1.5 rounded-full bg-white/10" />
                          </div>
                        </div>
                      </div>

                      {/* Buy Slot */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center text-amber-300 font-mono font-black text-xs gap-1.5 rounded-full bg-black/30 border border-white/10 px-3 py-2">
                          <DollarSign className="w-4 h-4 text-amber-400" />
                          <span>{theme.cost} pts</span>
                        </div>

                        <button
                          onClick={() => handleBuyTheme(theme)}
                          className="px-4 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-[10px] font-black rounded-xl uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                          Unlock & Equip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BORDERS LOCKS CATALOG */}
          <div className="space-y-4 pt-6 text-left border-t border-slate-850">
            <h3 className="text-xs font-bold text-white/65 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Locked Avatar Frames ({BORDER_REGISTRY.filter(b => !unlockedBorders.includes(b.id)).length} Available)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="shop-borders-grid">
              {BORDER_REGISTRY.map((border) => {
                const isUnlocked = unlockedBorders.includes(border.id);
                if (isUnlocked) return null; // Only show locked borders in shop

                const cost = border.rarity === 'legendary' ? 300 : border.rarity === 'epic' ? 200 : 100;

                return (
                  <div 
                    key={border.id}
                    className="bg-ve-storm/20 backdrop-blur-md rounded-2xl border border-slate-850 p-4 flex flex-col justify-between gap-4 shadow-xl hover:border-white/10"
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <ProfileAvatarBorder 
                        borderId={border.id} 
                        displayName="Initials" 
                        initials="PRO" 
                        size="md" 
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white/80 text-xs truncate flex items-center gap-1">
                          {border.name}
                          <span className={`text-[8px] font-black font-mono px-1 py-0.2 rounded uppercase ${
                            border.rarity === 'legendary' ? 'text-yellow-400 bg-yellow-950/40' :
                            border.rarity === 'epic' ? 'text-purple-400 bg-purple-950/40' :
                            'text-white/40'
                          }`}>
                            {border.rarity}
                          </span>
                        </h4>
                        <p className="text-[10px] text-white/45 mt-0.5 leading-snug line-clamp-2">
                          {border.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850/40 flex items-center justify-between">
                      <div className="flex items-center text-amber-400 font-mono font-black text-xs gap-1">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span>{cost} pts</span>
                      </div>

                      <button
                        onClick={() => handleBuyBorder(border)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 text-[9px] font-black rounded-lg uppercase shadow-md transition-all hover:scale-105"
                      >
                        Unlock frame
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}


    </div>
  );
}
