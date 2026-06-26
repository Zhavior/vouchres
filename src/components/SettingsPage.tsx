import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  Info, 
  Video, 
  Volume2, 
  DollarSign, 
  Eye, 
  MousePointerClick, 
  Server, 
  Activity, 
  Maximize, 
  Sparkles, 
  ShieldCheck, 
  Share2,
  Tv
} from 'lucide-react';
import { CreatorProofProfile } from '../types';
import { PREMIUM_THEMES } from '../data/themesData';

interface SettingsPageProps {
  onResetDatabase: () => void;
  profileName: string;
  profile: CreatorProofProfile & {
    twitter?: string;
    discord?: string;
    telegram?: string;
    twitch?: string;
    themeAccent?: string;
    customTitle?: string;
  };
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
}

export default function SettingsPage({ 
  onResetDatabase, 
  profileName, 
  profile, 
  onUpdateProfile 
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'profile-theme' | 'streaming' | 'admin-ads'>('profile-theme');

  // --- Profile Customization / Theme / Socials states ---
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [customTitle, setCustomTitle] = useState(profile.customTitle || 'Maestro Capper');
  const [bio, setBio] = useState(profile.bio || '');
  const [twitter, setTwitter] = useState(profile.twitter || 'vouchedge_pro');
  const [discord, setDiscord] = useState(profile.discord || 'vouchedge-room');
  const [telegram, setTelegram] = useState(profile.telegram || 'vouchedge_signals');
  const [twitch, setTwitch] = useState(profile.twitch || 'vouchedge_live');
  const [themeAccent, setThemeAccent] = useState(profile.themeAccent || 'cosmic');
  const [activeTheme, setActiveTheme] = useState(profile.activeTheme || 'default');

  // --- Professional Livestreaming setting states ---
  const [streamServer, setStreamServer] = useState(() => localStorage.getItem('vEdge_streamServer') || 'twitch');
  const [streamKey, setStreamKey] = useState(() => localStorage.getItem('vEdge_streamKey') || 'live_sk_vouchedge_7bd288e34f89ac9920');
  const [resolution, setResolution] = useState(() => localStorage.getItem('vEdge_resolution') || '1080p');
  const [bitrate, setBitrate] = useState(() => localStorage.getItem('vEdge_bitrate') || '6000');
  const [encoder, setEncoder] = useState(() => localStorage.getItem('vEdge_encoder') || 'nvenc');
  const [noiseGate, setNoiseGate] = useState(() => Number(localStorage.getItem('vEdge_noiseGate')) || -45);
  const [compressor, setCompressor] = useState(() => localStorage.getItem('vEdge_compressor') || 'medium');
  const [latencyMode, setLatencyMode] = useState(() => localStorage.getItem('vEdge_latencyMode') || 'ultra');
  const [enableOverlayWidgets, setEnableOverlayWidgets] = useState(() => localStorage.getItem('vEdge_enableOverlayWidgets') !== 'false');

  // --- Admin Ad configuration & revenue dashboard states ---
  const [activeAdSponsor, setActiveAdSponsor] = useState(() => localStorage.getItem('vEdge_adSponsor') || 'DraftKings');
  const [adIntensity, setAdIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(() => (localStorage.getItem('vEdge_adIntensity') as any) || 'MEDIUM');
  const [cpmRate, setCpmRate] = useState(() => Number(localStorage.getItem('vEdge_cpmRate')) || 12.50);
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);

  // Simulated metrics
  const [simClicks, setSimClicks] = useState(0);
  const [simViews, setSimViews] = useState(0);
  const [simRevenue, setSimRevenue] = useState(0);

  // Load streaming params into localStorage
  useEffect(() => {
    localStorage.setItem('vEdge_streamServer', streamServer);
    localStorage.setItem('vEdge_streamKey', streamKey);
    localStorage.setItem('vEdge_resolution', resolution);
    localStorage.setItem('vEdge_bitrate', bitrate);
    localStorage.setItem('vEdge_encoder', encoder);
    localStorage.setItem('vEdge_noiseGate', String(noiseGate));
    localStorage.setItem('vEdge_compressor', compressor);
    localStorage.setItem('vEdge_latencyMode', latencyMode);
    localStorage.setItem('vEdge_enableOverlayWidgets', String(enableOverlayWidgets));
  }, [streamServer, streamKey, resolution, bitrate, encoder, noiseGate, compressor, latencyMode, enableOverlayWidgets]);

  // Load ad settings into localStorage
  useEffect(() => {
    localStorage.setItem('vEdge_adSponsor', activeAdSponsor);
    localStorage.setItem('vEdge_adIntensity', adIntensity);
    localStorage.setItem('vEdge_cpmRate', String(cpmRate));
  }, [activeAdSponsor, adIntensity, cpmRate]);

  // Simulate dynamic traffic increments for revenue tracking
  useEffect(() => {
    // Generate initial realistic seed
    const viewsMultiplier = adIntensity === 'HIGH' ? 1.6 : adIntensity === 'LOW' ? 0.7 : 1.1;
    const clicksMultiplier = adIntensity === 'HIGH' ? 2.4 : adIntensity === 'LOW' ? 0.5 : 1.2;

    const seedViews = Math.round(185400 * viewsMultiplier);
    const seedClicks = Math.round(seedViews * 0.035 * clicksMultiplier); // 3.5% CTR avg
    const seedRev = (seedViews / 1000) * cpmRate;

    setSimViews(seedViews);
    setSimClicks(seedClicks);
    setSimRevenue(seedRev);

    const interval = setInterval(() => {
      setSimViews(prev => {
        const increment = Math.floor(Math.random() * 85) + 15;
        const clickIncrement = Math.round(increment * (0.02 + Math.random() * 0.035) * clicksMultiplier);
        
        setSimClicks(c => c + clickIncrement);
        setSimRevenue(r => r + (increment / 1000) * cpmRate);
        return prev + increment;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [adIntensity, cpmRate]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      twitter: twitter.trim(),
      discord: discord.trim(),
      telegram: telegram.trim(),
      twitch: twitch.trim(),
      themeAccent: themeAccent,
      customTitle: customTitle.trim(),
      activeTheme: activeTheme,
    } as any);
    
    // Notify application of profile setting update
    const event = new CustomEvent('vouchedge-profile-meta-updated', {
      detail: { themeAccent, twitter, discord, telegram, twitch, customTitle, activeTheme }
    });
    window.dispatchEvent(event);

    alert("✨ PROFILE DETAILS & THEME STYLE SUCCESSFULLY UPDATED IN CLOUD DATABASE!");
  };

  const handleResetClick = () => {
    if (confirm("Are you sure you want to reset the local VouchEdge database? This will restore the preloaded verified posts and empty any currently unsaved local tickets.")) {
      onResetDatabase();
      alert("Database reset successful. Preloaded posts restored!");
    }
  };

  // Quick helper to change subscription tier from settings to see ads change instantly
  const handleUpgradeTier = (tier: 'BASIC' | 'GOLD' | 'SELLER_PRO') => {
    onUpdateProfile({
      subscriptionTier: tier
    });
    alert(`🎉 SUBSCRIPTION EMULATOR: Swapped to "${tier}" tier successfully.\n\n` + 
      (tier === 'BASIC' ? 'Free user rules apply: Many Sponsor ads will be visible across the feed/streams.' :
       tier === 'GOLD' ? 'Pro limits apply: Subtle Ads enabled. Sidebar banners hidden.' :
       'Upper Sub level active: 100% ad-free experience. Advertisements completely suppressed.'));
  };

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto min-h-screen bg-transparent space-y-6 text-left" id="settings-master-workstation">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-5" id="settings-view-header">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
            VouchEdge Suite Controls & Admin Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure social identities, tweak low-latency streaming encoders, and audit site ad revenue margins.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 self-start text-xs font-semibold" id="settings-tab-dock">
          <button
            onClick={() => setActiveTab('profile-theme')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
              activeTab === 'profile-theme'
                ? 'bg-gradient-to-tr from-sky-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Edge profile
          </button>
          
          <button
            onClick={() => setActiveTab('streaming')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'streaming'
                ? 'bg-gradient-to-tr from-sky-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-455" />
            Stream Configs
          </button>

          <button
            onClick={() => setActiveTab('admin-ads')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'admin-ads'
                ? 'bg-gradient-to-tr from-amber-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Admin Ads & eCPM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE SCREEN PANEL */}
        <div className="lg:col-span-8">
          
          {/* PROFILE STYLE AND THEME CUSTOMIZER */}
          {activeTab === 'profile-theme' && (
            <div className="bg-[#121824] rounded-2xl border border-slate-850 p-6 space-y-6 animate-fade-in" id="settings-profile-theme-panel">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest font-mono">
                  🎨 Profile Identity, Custom Themes, & Bio Toggles
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Customise your public bio branding assets and select theme colors applied to your shared cards.</p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Display Handle Style</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2.5 outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Public Custom Title / Nickname</label>
                    <input 
                      type="text" 
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Master Prophet"
                      className="w-full text-xs bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2.5 outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Biographical Overview statement</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full text-xs bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2.5 outline-none text-slate-200 focus:border-indigo-500 h-16 resize-none font-medium"
                      maxLength={180}
                    />
                  </div>
                </div>

                {/* THEME SELECTORS */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Select Profile Visual Palette</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeAccent('cosmic')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        themeAccent === 'cosmic' 
                          ? 'bg-indigo-950/40 border-indigo-505 text-indigo-300 ring-2 ring-indigo-500/20' 
                          : 'bg-[#0b0f19] border-slate-850 text-slate-450 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1">🌌 Cosmic</span>
                      <span className="text-[9px] font-mono block text-slate-500 leading-none">Indigo Canvas (Free)</span>
                    </button>

                    {profile.boughtThemes?.includes('cyberpunk') && (
                      <button
                        type="button"
                        onClick={() => setThemeAccent('cyberpunk')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          themeAccent === 'cyberpunk' 
                            ? 'bg-rose-950/40 border-rose-550 text-rose-300 ring-2 ring-rose-500/20' 
                            : 'bg-[#0b0f19] border-slate-850 text-slate-450 hover:border-slate-705'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-1">⚡ Cyberpunk</span>
                        <span className="text-[9px] font-mono block text-slate-500 leading-none">Teal & Pink</span>
                      </button>
                    )}

                    {profile.boughtThemes?.includes('emerald') && (
                      <button
                        type="button"
                        onClick={() => setThemeAccent('emerald')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          themeAccent === 'emerald' 
                            ? 'bg-[#082f1d]/30 border-emerald-505 text-emerald-400 ring-2 ring-emerald-500/20' 
                            : 'bg-[#0b0f19] border-slate-850 text-slate-450 hover:border-slate-705'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-1">🌿 Pitch Green</span>
                        <span className="text-[9px] font-mono block text-slate-500 leading-none">Sports Turf</span>
                      </button>
                    )}

                    {profile.boughtThemes?.includes('luxury') && (
                      <button
                        type="button"
                        onClick={() => setThemeAccent('luxury')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          themeAccent === 'luxury' 
                            ? 'bg-amber-950/40 border-amber-505 text-amber-300 ring-2 ring-amber-500/20' 
                            : 'bg-[#0b0f19] border-slate-850 text-slate-450 hover:border-slate-705'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-1">👑 Luxury Gold</span>
                        <span className="text-[9px] font-mono block text-slate-500 leading-none">Prestige Gold</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* PREMIUM THEMES YOU BOUGHT */}
                <div className="space-y-3 pt-3" id="settings-bought-themes-container">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                      ✨ Equip Premium Themes (Only Owned Themes Visible)
                    </h4>
                    <span className="text-[9px] bg-slate-950 border border-slate-850 text-sky-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                      Owned count: {profile.boughtThemes?.length || 0}
                    </span>
                  </div>

                  {(() => {
                    const ownedPremiumThemes = PREMIUM_THEMES.filter(theme => 
                      profile.boughtThemes && profile.boughtThemes.includes(theme.id)
                    );

                    let customMintedThemes: any[] = [];
                    try {
                      const stored = localStorage.getItem('vouchedge_market_themes');
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                          customMintedThemes = parsed.filter((theme: any) => 
                            profile.boughtThemes && profile.boughtThemes.includes(theme.id)
                          );
                        }
                      }
                    } catch (e) {}

                    const allOwnedThemes = [
                      {
                        id: 'default',
                        name: 'Standard Dark Sapphire',
                        badge: '🧊 STANDARD',
                        glowColor: 'from-sky-400 to-indigo-505',
                        particleDemo: ['🧊', '✨'],
                        description: 'The clean default premium layout with blue highlights and subtle cosmic neon matrices.',
                      },
                      ...ownedPremiumThemes,
                      ...customMintedThemes
                    ];

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="settings-bought-themes-grid">
                          {allOwnedThemes.map((thm) => {
                            const isEquipped = activeTheme === thm.id;
                            return (
                              <div
                                key={thm.id}
                                onClick={() => setActiveTheme(thm.id)}
                                className={`p-4 rounded-xl border relative transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
                                  isEquipped
                                    ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                    : 'bg-[#0b0f19]/60 border-slate-850 hover:border-slate-800'
                                }`}
                                id={`equip-bought-theme-${thm.id}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                                      {thm.particleDemo?.slice(0, 2).join(' ')} {thm.name}
                                    </span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono border border-slate-850">
                                      {thm.badge}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                    {thm.description}
                                  </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-900/60 pt-2.5">
                                  <div className="flex gap-1">
                                    {thm.particleDemo?.map((p: string, idx: number) => (
                                      <span key={idx} className="text-xs">{p}</span>
                                    ))}
                                  </div>
                                  
                                  {isEquipped ? (
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                      <Check className="w-3 h-3 text-indigo-400" />
                                      Equipped
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-extrabold text-slate-500 hover:text-slate-350 uppercase tracking-widest">
                                      Equip Theme
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {(!profile.boughtThemes || profile.boughtThemes.length === 0) && (
                          <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-2.5 animate-pulse" id="no-bought-themes-notice">
                            <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                            <div className="text-[10px] text-slate-400 leading-normal font-medium">
                              <span className="font-extrabold text-[#94a3b8] block mb-0.5">🎨 Unlock Premium Aesthetic Skins</span>
                              You haven't bought any premium themes from the Theme Store yet! Currently, only the Standard Theme is active. Go to the Theme Store tab to buy Neon Pulse Beat Lines, 8-Bit Retro or cute anime styles using credits.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* SOCIAL ACCOUNTS */}
                <div className="space-y-3 pt-3">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider border-b border-slate-850 pb-1.5">
                    Connect Sports Social Handles
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Twitter/X handle</span>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs select-none">@</span>
                        <input 
                          type="text" 
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Discord Community Code</span>
                      <input 
                        type="text" 
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Telegram signals feed</span>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs select-none">t.me/</span>
                        <input 
                          type="text" 
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl pl-12 pr-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Twitch/YouTube streaming</span>
                      <input 
                        type="text" 
                        value={twitch}
                        onChange={(e) => setTwitch(e.target.value)}
                        className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
                  >
                    Save profile Visual Assets
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COMPREHENSIVE STREAMING CONFIGURATIONS */}
          {activeTab === 'streaming' && (
            <div className="bg-[#121824] rounded-2xl border border-slate-850 p-6 space-y-6 animate-fade-in" id="settings-streaming-panel">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Video className="w-5 h-5 text-rose-500" />
                    Professional Twitch/OBS Streaming Settings
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Control ingest servers, video encoding bitrates, hardware audio filters, and widgets overlays.</p>
                </div>
                <span className="text-[10px] font-mono text-rose-450 bg-rose-955/35 border border-rose-900/30 px-2 py-0.5 rounded uppercase font-semibold">
                  ENCODER: LIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Server selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Core Ingest Server Target</label>
                  <select
                    value={streamServer}
                    onChange={(e) => setStreamServer(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-250 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="twitch">Twitch Stream Ingest (rtmp://live.twitch.tv/app)</option>
                    <option value="youtube">YouTube RTVS Live Ingest (rtmp://a.rtmp.youtube.com)</option>
                    <option value="kick">Kick API Server Ingest (rtmps://stream.kick.com/app)</option>
                    <option value="custom">Private Custom RTMP Node Engine...</option>
                  </select>
                </div>

                {/* Secret Key */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Stream Key (Secured)</label>
                  <input
                    type="password"
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-250 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Resolution selections */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Webcam Output Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['720p', '1080p', '1440p'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResolution(r)}
                        className={`py-2 rounded-lg border font-bold uppercase transition-all tracking-wide text-center ${
                          resolution === r 
                            ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 font-extrabold' 
                            : 'bg-[#0b0f19] border-slate-850 text-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bitrate selections */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono flex items-center justify-between">
                    <span>Target Video Bitrate</span>
                    <span className="text-[9px] text-indigo-400 font-mono">Requires high upload bandwidth</span>
                  </label>
                  <select
                    value={bitrate}
                    onChange={(e) => setBitrate(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-250 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="3000">3,000 Kbps (720p Standard speed)</option>
                    <option value="4500">4,500 Kbps (1080p Web default)</option>
                    <option value="6000">6,000 Kbps (1080p Pro Twitch recommended)</option>
                    <option value="8000">8,000 Kbps (1440p Extreme HD)</option>
                  </select>
                </div>

                {/* Encoder */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Hardware Encoding Chipset</label>
                  <select
                    value={encoder}
                    onChange={(e) => setEncoder(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-250 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-semibold font-mono"
                  >
                    <option value="nvenc">NVIDIA NVENC H264 Accelerated (GPU Core)</option>
                    <option value="x264">Software x264 (Strict CPU cycle)</option>
                    <option value="webrtc">WebRTC Direct Low-Latency Media stream</option>
                  </select>
                </div>

                {/* Noise gate filters */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono flex items-center justify-between">
                    <span>Obs Mic Noise Gate threshold</span>
                    <span className="text-slate-500 text-[9px] font-mono">{noiseGate} dB</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="-60"
                      max="-25"
                      step="1"
                      value={noiseGate}
                      onChange={(e) => setNoiseGate(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Low Latency modes */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Ingest Buffering Mode</label>
                  <select
                    value={latencyMode}
                    onChange={(e) => setLatencyMode(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-250 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono uppercase font-bold"
                  >
                    <option value="ultra">Ultra-Low delay (0.5s Real-Time chat sync)</option>
                    <option value="low">Low Latency (2.5s Sports sync)</option>
                    <option value="normal">Normal latency (10s Buffered High-Resolution HD)</option>
                  </select>
                </div>

                {/* Overlay widgets toggle */}
                <div className="p-4 bg-[#0b0f19] border border-slate-850 rounded-xl text-left flex items-center justify-between col-span-1 md:col-span-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-300">Display Active Parlay HUD inside Livestream Video</h5>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Let viewers immediately click, tail, and vouch your actual parlay ticket as an interactive overlay overlay.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableOverlayWidgets}
                    onChange={(e) => setEnableOverlayWidgets(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                  />
                </div>

              </div>
              
              <div className="p-3 bg-indigo-950/25 border border-indigo-900/30 rounded-xl flex items-center gap-2.5 text-[11px] text-indigo-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>OBS & stream integrations are fully emulated. Saving these properties carries directly to the <strong>Live Streams 🔴</strong> Broadcaster Desk feed.</span>
              </div>
            </div>
          )}

          {/* ADMIN ADS MANAGEMENT & NET REVENUE HQ */}
          {activeTab === 'admin-ads' && (
            <div className="bg-[#121824] rounded-2xl border border-slate-850 p-6 space-y-6 animate-fade-in" id="settings-admin-ads-panel">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <DollarSign className="w-5 h-5 text-amber-500 animate-pulse" />
                    Admin Ad-Revenue Hub & CPM Grids
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Configure target sponsor placements and analyze simulated impressions yield relative to user levels.</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-450 bg-emerald-955/35 border border-emerald-900/40 px-2.5 py-0.5 rounded uppercase font-black animate-pulse">
                  Ledger CPM Active
                </span>
              </div>

              {/* Dynamic Revenue Simulator Widget */}
              <div className="bg-gradient-to-tr from-[#1b263b] via-[#121824] to-[#0d131f] border-2 border-slate-800 p-4.5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono uppercase">
                  <span>Simulated Platform Earnings</span>
                  <span className="text-emerald-400">Syncing live clicks</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 text-center relative overflow-hidden group">
                    <Eye className="w-4 h-4 text-sky-400 absolute top-2 right-2 opacity-35" />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono block">Impressions</span>
                    <strong className="text-base text-slate-100 font-mono block mt-1">{simViews.toLocaleString()}</strong>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-890 text-center relative overflow-hidden group">
                    <MousePointerClick className="w-4 h-4 text-teal-400 absolute top-2 right-2 opacity-35" />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono block">Clicks</span>
                    <strong className="text-base text-slate-100 font-mono block mt-1">{simClicks.toLocaleString()}</strong>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-890 text-center relative overflow-hidden group">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute top-2 right-2 opacity-35" />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono block">Ledger revenue</span>
                    <strong className="text-base text-emerald-400 font-mono font-black block mt-1">${simRevenue.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Calculations info */}
                <div className="text-[10px] text-slate-400 leading-normal font-medium flex justify-between items-center">
                  <span>Current eCPM value: <strong>${cpmRate.toFixed(2)}</strong></span>
                  <span>Estimated CTR: <strong>{((simClicks / simViews) * 100).toFixed(2)}%</strong> (From Free Users)</span>
                </div>
              </div>

              {/* Admin Form options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Sponsor selector */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">Active Target Sponsor Campaign</label>
                  <select
                    value={activeAdSponsor}
                    onChange={(e) => setActiveAdSponsor(e.target.value)}
                    className="w-full text-xs bg-[#0b0f19] text-slate-200 border border-slate-805 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="DraftKings">DraftKings Match Special ($5 bet to $200 bonuses)</option>
                    <option value="FanDuel">FanDuel No-Sweat Multibets (Up to $1k insurance)</option>
                    <option value="PrizePicks">PrizePicks 100x Multi-Pass (pitcher Ks selection)</option>
                    <option value="VouchEdge Premium Upgrade">VouchEdge Premium Seller Pro (Self-Platform Ad)</option>
                  </select>
                </div>

                {/* CPM slider */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono flex justify-between">
                    <span>Target eCPM Rate</span>
                    <span className="text-emerald-400 font-mono">${cpmRate.toFixed(2)} per 1k views</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="0.5"
                    value={cpmRate}
                    onChange={(e) => setCpmRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 py-1"
                  />
                </div>

                {/* Intensity selector */}
                <div className="space-y-1.5 text-left md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono">Ad Intensity & frequency for free users</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'LOW', label: 'Low intensity', detail: 'Less ads' },
                      { id: 'MEDIUM', label: 'Medium intensity', detail: 'Default layout' },
                      { id: 'HIGH', label: 'High intensity', detail: 'Spam free feed!' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setAdIntensity(mode.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          adIntensity === mode.id 
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-black' 
                            : 'bg-[#0b0f19] border-slate-850 text-slate-500'
                        }`}
                      >
                        <span className="text-xs font-bold block mb-0.5">{mode.label}</span>
                        <span className="text-[9px] font-mono block text-slate-500 leading-none">{mode.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Educational disclaimer on how ads map to subscriptions */}
              <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Dynamic Subscription Mapping Matrix</span>
                <div className="grid grid-cols-3 gap-2 text-[10.5px] text-slate-400 leading-relaxed font-mono font-medium">
                  <div className="p-2 bg-slate-900 rounded">
                    <strong className="text-slate-300 block mb-0.5">🎮 BASIC USER (FREE)</strong>
                    <span>High Ad Frequency: Inline feed cards, top banner promos, sidebar blocks, and stream overlays active.</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <strong className="text-slate-350 block mb-0.5">✨ GOLD USER (PRO)</strong>
                    <span>Subtle Ad Frequency: Sidebar blocks suppressed. Banner ads shown only at top of feeds.</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <strong className="text-amber-400 block mb-0.5">💎 SELLER PRO (ELITE)</strong>
                    <span>Zero Ads: 100% ad-free experience. Ads completely blocked and filtered.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: TESTING CONTROLS & DATABASE CLEANUP */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* SUBSCRIPTION TESTING TRIGGER SWITCH */}
          <div className="bg-[#121824] rounded-2xl border border-slate-850 p-5 space-y-4">
            <h4 className="font-extrabold text-[#cbd5e1] text-xs uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Upgrade subscription simulator
            </h4>

            <p className="text-[11px] text-slate-500 leading-normal">
              Toggle subscription level instantly as the Admin to see how the platform adds/removes ads across pages in real-time.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleUpgradeTier('BASIC')}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono transition-all text-left flex justify-between items-center cursor-pointer ${
                  profile.subscriptionTier === 'BASIC' || !profile.subscriptionTier
                    ? 'bg-[#0f172a] text-sky-400 border-sky-505/35 font-extrabold'
                    : 'bg-[#0b0f19] text-slate-400 border-slate-850 hover:border-slate-700'
                }`}
              >
                <span>🛡️ Free Tier (BASIC)</span>
                {profile.subscriptionTier === 'BASIC' || !profile.subscriptionTier ? (
                  <span className="text-[9px] font-bold text-sky-450 uppercase animate-pulse">Many Ads Placed</span>
                ) : (
                  <span className="text-[9px] text-slate-500">Upgrade</span>
                )}
              </button>

              <button
                onClick={() => handleUpgradeTier('GOLD')}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono transition-all text-left flex justify-between items-center cursor-pointer ${
                  profile.subscriptionTier === 'GOLD'
                    ? 'bg-amber-950/20 text-amber-400 border-amber-950/40 font-extrabold'
                    : 'bg-[#0b0f19] text-slate-400 border-slate-850 hover:border-slate-700'
                }`}
              >
                <span>✨ Pro Tier (VEDGE GOLD)</span>
                {profile.subscriptionTier === 'GOLD' ? (
                  <span className="text-[9px] font-bold text-amber-400 uppercase animate-pulse">Subtle Ads Shown</span>
                ) : (
                  <span className="text-[9px] text-slate-505">Upgrade</span>
                )}
              </button>

              <button
                onClick={() => handleUpgradeTier('SELLER_PRO')}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono transition-all text-left flex justify-between items-center cursor-pointer ${
                  profile.subscriptionTier === 'SELLER_PRO'
                    ? 'bg-[#082f1d]/20 text-emerald-450 border-emerald-950/40 font-extrabold'
                    : 'bg-[#0b0f19] text-slate-400 border-slate-850 hover:border-slate-700'
                }`}
              >
                <span>💎 Elite Tier (SELLER PRO)</span>
                {profile.subscriptionTier === 'SELLER_PRO' ? (
                  <span className="text-[9px] font-bold text-emerald-400 uppercase">Blocked (Ad-Free)</span>
                ) : (
                  <span className="text-[9px] text-slate-500">Upgrade</span>
                )}
              </button>
            </div>
          </div>

          {/* ACTIVE UTILITIES */}
          <div className="bg-[#121824] rounded-2xl border border-slate-850 p-5 space-y-4" id="database-utilities">
            <h4 className="font-extrabold text-[#cbd5e1] text-xs uppercase tracking-widest font-mono flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-rose-455 animate-spin" />
              Dev Database Options
            </h4>

            <div className="space-y-4" id="reset-feed-tool-inside-settings">
              <p className="text-[11px] text-slate-500 leading-normal">
                Clicking this restores VouchEdge database records to core baseline stats (ideal for clean ledger testing).
              </p>

              <button
                onClick={handleResetClick}
                className="w-full py-2.5 bg-rose-955/20 text-rose-405 hover:bg-rose-950/50 transition-colors rounded-xl border border-rose-900 border-dashed text-xs font-bold flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-rose-500/20 active:scale-95"
                id="reset-db-btn-inside-settings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Verified Database</span>
              </button>
            </div>
          </div>

          {/* ACCREDITED AUDIT FOOTNOTE */}
          <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-850/60 text-[10.5px] text-slate-450 leading-relaxed font-semibold">
            🛡️ <strong>Ledger Assurance Notice</strong>: Dynamic earnings metrics, clicks tracking, and CPM scales represent verified sandbox simulations. Ads are bound with precise React props to the profile object context.
          </div>

        </div>

      </div>

    </div>
  );
}
