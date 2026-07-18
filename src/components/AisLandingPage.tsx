import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  UserPlus,
  ChevronRight,
  Monitor,
  CheckCircle,
  Sliders,
  Sparkle,
  ArrowRight,
  Flame,
  RefreshCw,
  Crown,
  Play,
  RotateCcw,
  Volume2,
  Tv,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/motion';
import { loadDecorativeFonts } from '../lib/loadDecorativeFonts';
import { CreatorProofProfile } from '../types';

function BaunkAnimatedTitle({ onSectionChange }: { onSectionChange: (sec: string) => void }) {
  return (
    <div
      className="flex flex-col items-center select-none cursor-pointer group py-12 px-6 sm:px-12 my-6 relative overflow-visible w-full max-w-4xl mx-auto rounded-3xl bg-obsidian-900/80 border border-white/[0.08] backdrop-blur-xl transition-all hover:border-white/[0.08] active:scale-98 duration-300 shadow-[0_32px_90px_rgba(0,0,0,0.85)]"
      onClick={() => {
        const el = document.getElementById('how-it-works-strip');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      {/* Premium ambient background accents (no clunky astronaut, pure luxury glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[130px] bg-gradient-to-r from-emerald-500/10 via-yellow-500/5 to-indigo-500/15 rounded-full blur-[70px] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-1000" />
      
      {/* Decorative top badge line */}
      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/30 rounded-full border border-white/[0.085] mb-6 group-hover:border-emerald-500/30 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/45 font-extrabold font-mono font-sans">
          FREE • NO REAL MONEY • PICK TRACKING FOR CAPPERS
        </span>
      </div>

      {/* Main Title Typography: VOUCH EDGE */}
      <div className="relative flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-sans font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 select-none text-center leading-none">
          VOUCH<span className="text-[#FFE81F] group-hover:text-emerald-400 transition-colors duration-500">EDGE</span>
        </h1>

        {/* Decorative architectural layout frames */}
        <div className="absolute -inset-x-6 sm:-inset-x-12 -inset-y-4 border border-emerald-500/5 rounded-2xl pointer-events-none group-hover:border-emerald-500/15 transition-colors duration-500" />
      </div>

      {/* Clear, plain-English subtitle explaining what the product actually is */}
      <p className="mt-8 text-sm sm:text-base text-slate-400 font-sans tracking-normal normal-case text-center max-w-xl group-hover:text-white/80 transition-colors duration-300 leading-relaxed">
        Track your sports picks in public, build a verifiable win-rate history, and let people follow your record — not just your word.
      </p>

      {/* Interaction prompt badge */}
      <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-[#FFE81F] group-hover:text-emerald-400 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span>SEE HOW IT WORKS</span>
        <ArrowRight className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </div>
  );
}

interface AisLandingPageProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
  onSectionChange: (section: string) => void;
}

/* =========================================================================
   CINEMATIC FEATURES VIDEO & SCREENCAST SIMULATOR Component
   Renders a simulated active screen capture with live interactive timelines,
   mouse tracking actions, and state cycles representing platform usage.
========================================================================= */
function FeaturePreviewVideo({ featureId, accentColor }: { featureId: string; accentColor: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulationStep, setSimulationStep] = useState(0);
  const [timelineSecs, setTimelineSecs] = useState(1.4);

  // Auto-advance simulated video step to represent user interacting with the app
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimulationStep((prev) => (prev + 1) % 4);
    }, 3200);

    const secondsInterval = setInterval(() => {
      setTimelineSecs((prev) => {
        if (prev >= 12) return 0.0;
        return parseFloat((prev + 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(secondsInterval);
    };
  }, [isPlaying]);

  const handleRestart = () => {
    setSimulationStep(0);
    setTimelineSecs(0.0);
    setIsPlaying(true);
  };

  // Render screencast based on feature
  const renderScreencastSimulation = () => {
    switch (featureId) {
      case 'feed':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-obsidian-900 p-3 text-[10px] font-mono leading-tight">
            {/* Simulation Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LEDGER_REC_ACTIVE</span>
              <span>UTC ID: 8F2B1</span>
            </div>

            {/* Simulated Action Canvas */}
            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 min-h-[90px] relative">
              
              {/* Fake Interactive Cursor */}
              {simulationStep === 0 && (
                <div className="absolute right-12 top-6 flex items-center gap-1 text-yellow-400 z-20 pointer-events-none transition-all duration-1000 animate-bounce">
                  <MousePointer2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                  <span className="bg-black/95 border border-sky-400/30 text-[7px] px-1.5 py-0.5 rounded text-sky-300 font-bold uppercase">Click "Publish Slip"</span>
                </div>
              )}

              {/* Step representations */}
              {simulationStep === 0 ? (
                <div className="space-y-1 bg-storm p-2 rounded-lg border border-white/10">
                  <div className="text-white/45 text-[8px] flex justify-between">
                    <span>CAPPER HANDLE: @vouch_skywalker</span>
                    <span className="text-vouch-cyan">DRAFT</span>
                  </div>
                  <div className="text-white/65 font-sans font-bold">New Parlay Selection: LAD ML + NYY -1.5</div>
                  <div className="text-[8px] text-white/40 mt-1 block">Tapping verification cryptography...</div>
                </div>
              ) : simulationStep === 1 ? (
                <div className="space-y-1 bg-yellow-950/20 p-2 rounded-lg border border-yellow-500/20 animate-pulse">
                  <div className="text-yellow-400 text-[8px]">⚡ CRITICAL PROTOCOL ACTION IN PROGRESS</div>
                  <div className="text-white/80 text-[9px] font-bold">PROVING PROBABILITY COEFFICIENTS...</div>
                  <div className="w-full bg-black/25 h-1 rounded overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full w-2/3" />
                  </div>
                </div>
              ) : simulationStep === 2 ? (
                <div className="space-y-1 bg-obsidian-900 p-2 rounded-lg border border-teal-500/30">
                  <div className="text-emerald-400 text-[8px] font-bold flex items-center gap-1">
                    <span>✓ LEDGER SECURED</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="text-white text-[11px] font-black">SLIP SEALED UNDER BLOCK #72109</div>
                  <p className="text-[7px] text-white/40">Un-deletable ROI & win-rate variables calculated instantly.</p>
                </div>
              ) : (
                <div className="space-y-1 bg-storm p-2 rounded-lg border border-white/10">
                  <div className="flex justify-between text-white/45 text-[8px]">
                    <span className="text-emerald-400 uppercase font-black bg-emerald-950/80 px-1 rounded">VERIFIED WON</span>
                    <span>1 min ago</span>
                  </div>
                  <div className="text-white font-bold font-sans">LAD vs NYY Multi-Slip Ledger Entry</div>
                  <div className="flex justify-between text-[8px] text-white/40 font-mono">
                    <span>Expected Return: +310%</span>
                    <span className="text-emerald-400 font-bold">+15.2 U</span>
                  </div>
                </div>
              )}
            </div>

            {/* Video footer stat display */}
            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>ACTION STAGED: USER PUBLISHING SLIP LOOP</span>
              <span className="text-yellow-400 uppercase font-bold">STATUS: RESEARCH PREVIEW</span>
            </div>
          </div>
        );

      case 'ai_engine':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-obsidian-900 p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" /> V.A.I PREDICTION MATRIX v3.0</span>
              <span className="text-cyan-400">LOCAL_GPU: LOADED</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 relative min-h-[90px]">
              {simulationStep === 0 ? (
                <div className="space-y-1 bg-obsidian-900 p-2 rounded-lg border border-white/10">
                  <div className="text-[8px] text-white/45 font-bold uppercase tracking-wider">Step 1: Selecting Research Matchups</div>
                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                    <div className="bg-cyan-950/30 border border-cyan-800/40 p-1 rounded font-bold text-cyan-300">✓ OHTANI (TOTAL BASES)</div>
                    <div className="bg-black/25 text-white/40 p-1 rounded">PENDING SELECTION</div>
                  </div>
                </div>
              ) : simulationStep === 1 ? (
                <div className="space-y-1">
                  <div className="text-[8px] text-cyan-300">Step 2: Processing 10,000 Sabermetric Simulations</div>
                  <div className="text-[10px] text-white/65 animate-pulse flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span>COMPUTING SABERMETRIC VECTORS...</span>
                  </div>
                  <div className="bg-storm p-1.5 rounded text-[8px] text-white/40">
                    Confidence threshold set at: 85% Variance limit
                  </div>
                </div>
              ) : simulationStep === 2 ? (
                <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-cyan-500/30">
                  <div className="text-cyan-400 text-[8px] font-bold">Step 3: Calculating Edge Index Potential</div>
                  <div className="flex justify-between items-center bg-obsidian-900 p-1.5 rounded">
                    <span className="text-white/90 font-bold">BETTOR EDGE FOUND</span>
                    <span className="text-[#FFE81F] font-black text-xs">+14.86% EDGE</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/40">
                  <div className="text-[8px] text-[#FFE81F] font-black uppercase">V.A.I CERTIFIED SMART SLIP RECOMMENDED</div>
                  <div className="text-white/80 text-[9px] leading-tight font-sans">
                    Weigh confidence score: <span className="text-cyan-400 font-bold">94.2%</span> based on historical ballpark altitude adjustments.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>ACTIVE MODEL PROCESSOR LOOP</span>
              <span className="text-cyan-400 font-bold">RUNNING MATRIX</span>
            </div>
          </div>
        );

      case 'build':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-obsidian-900 p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1">🎛️ MULTI-LEG ODDS COUNTER</span>
              <span>SLIP BUILDER CODES</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center space-y-1.5 relative min-h-[90px]">
              
              {/* Virtual calculator widget */}
              <div className="bg-obsidian-900 p-2 rounded-lg border border-purple-900/20 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-white/40 uppercase">Interactive Stake</span>
                  {simulationStep === 0 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$50.00</span>
                  ) : simulationStep === 1 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$100.00</span>
                  ) : simulationStep === 2 ? (
                    <span className="text-[#FFE81F] font-bold font-mono">$250.00</span>
                  ) : (
                    <span className="text-[#FFE81F] font-bold font-mono">$500.00</span>
                  )}
                </div>

                <div className="w-full bg-black/25 h-1.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-700" 
                    style={{ 
                      width: simulationStep === 0 ? '20%' : simulationStep === 1 ? '40%' : simulationStep === 2 ? '70%' : '100%' 
                    }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[8px] text-white/45">
                  <div className="bg-black/25 p-1 rounded">
                    <div>MULTIPLIER</div>
                    <div className="text-white font-bold font-mono">
                      {simulationStep === 0 ? 'x1.90' : simulationStep === 1 ? 'x3.40' : simulationStep === 2 ? 'x7.80' : 'x17.40'}
                    </div>
                  </div>
                  <div className="bg-black/25 p-1 rounded">
                    <div>EST. PAYOUT</div>
                    <div className="text-emerald-400 font-bold font-mono">
                      {simulationStep === 0 ? '$95.00' : simulationStep === 1 ? '$340.00' : simulationStep === 2 ? '$1,950.00' : '$8,700.00'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>REALTIME COMPOUND CALCULATIONS</span>
              <span className="text-purple-400 font-bold">COMPOUND OK</span>
            </div>
          </div>
        );

      case 'live_games':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-obsidian-900 p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> LIVE STREAMING STAGE</span>
              <span className="text-red-400">FPS: 60.0_DIRECT</span>
            </div>

            <div className="flex-1 my-2 grid grid-cols-12 gap-2 min-h-[90px]">
              {/* Virtual Webcam Viewer box (Grid Left) */}
              <div className="col-span-7 bg-storm border border-white/10 rounded-lg p-1.5 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-slate-900/10 via-black/80 to-black pointer-events-none" />
                
                {/* Simulated Floating Fire emoji cards */}
                <div className="absolute top-1 right-1 bg-yellow-950/80 border border-yellow-500/40 text-[#FFE81F] text-[6px] font-black px-1 rounded flex items-center gap-0.5 animate-pulse">
                  <Flame className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                  <span>TAILING OUT_NOW</span>
                </div>

                <div className="my-auto text-center space-y-1">
                  <Tv className="w-5 h-5 mx-auto text-white/35 animate-bounce" />
                  <span className="text-[7px] text-white/45 block font-sans">Capper Streaming Live...</span>
                </div>

                <div className="flex justify-between items-center text-[6px] text-white/40 font-sans">
                  <span>🔴 OVERLAY_ON</span>
                  <span className="text-emerald-400 font-bold">148 TAILING SLIP</span>
                </div>
              </div>

              {/* Chat Viewport (Grid Right) */}
              <div className="col-span-5 bg-graphite p-1 rounded-lg border border-white/10 flex flex-col justify-between space-y-1 overflow-hidden">
                <span className="text-white/35 text-[6px] font-bold tracking-wider uppercase border-b border-white/10 pb-0.5 text-center">LOBBY_CHAT</span>
                
                <div className="flex-1 flex flex-col justify-end space-y-1 select-none">
                  <div className="text-[6px] text-white/45 scale-[0.95] origin-bottom-left leading-tight">
                    <span className="text-sky-400 font-bold">@v_capper:</span> Let's go MLB !
                  </div>
                  <div className="text-[6px] text-white/45 scale-[0.95] origin-bottom-left leading-tight">
                    <span className="text-pink-400 font-bold">@bet_babe:</span> Tailed +10U
                  </div>
                  <div className="text-[6px] text-yellow-400 scale-[0.95] origin-bottom-left leading-tight animate-pulse font-bold bg-yellow-950/30 rounded px-0.5">
                    🚀 VOUCH APPROVED
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>COMMUNITY LIVECHAT MODERATOR STREAM</span>
              <span className="text-emerald-400 font-bold text-[6px] bg-emerald-950 px-1 rounded uppercase">PRO_STREAM</span>
            </div>
          </div>
        );

      case 'board':
        return (
          <div className="w-full h-full flex flex-col justify-between bg-obsidian-900 p-3 text-[10px] font-mono leading-tight">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-white/40 text-[8px]">
              <span className="flex items-center gap-1">🎨 CUSTOM NEON CARD LAB</span>
              <span>RENDER ENGINE v2</span>
            </div>

            <div className="flex-1 my-2 flex flex-col justify-center items-center space-y-1 bg-obsidian-900 p-2 rounded-lg border border-white/10 min-h-[90px] relative">
              
              {/* Star Wars card deck editor simulation */}
              <div className="w-3/4 bg-storm rounded-lg border border-pink-500/50 p-1.5 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-700 select-none text-center transform rotate-1">
                <span className="text-[6px] uppercase font-black text-rose-400 tracking-widest block font-sans">VERIFIED PUBLIC CONTRACT</span>
                <span className="text-[10px] text-white/90 font-black block leading-none uppercase my-1 font-mono tracking-widest text-[#FFE81F]">VOUCHEDGE HERO DECK</span>
                
                <div className="w-full bg-graphite p-1 rounded text-[5px] text-white/45 flex justify-between uppercase">
                  <span>GLOW: 45PX</span>
                  <span className="text-pink-400 font-bold">SATURATION: MAX</span>
                </div>
              </div>

              {/* Cursor moving automatically */}
              {simulationStep === 2 && (
                <div className="absolute bottom-1 right-8 flex items-center gap-1 text-pink-400 z-10 pointer-events-none transition-all duration-700 animate-pulse">
                  <MousePointer2 className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span className="bg-black/25 text-[5px] px-1 rounded border border-pink-500/20 uppercase font-sans">Adjust Neon</span>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between text-white/35 text-[7px] pt-1 border-t border-white/10 font-sans">
              <span>COLOR SECTOR COLOR SCHEME PREVIEW</span>
              <span className="text-pink-400 font-bold text-[6px]">DECK COMPILER READY</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-4 border border-slate-800 bg-obsidian-900 rounded-2xl overflow-hidden shadow-2xl relative select-none group/player">
      
      {/* Video Player Header Chrome */}
      <div className="bg-graphite border-b border-white/10 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-white/45">
        
        {/* Left Side: Video source badge */}
        <div className="flex items-center gap-2">
          {/* Fake camera red record light */}
          {isPlaying ? (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse block" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600 block" />
          )}
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-white/65">
             VOUCHEDGE_WALKTHROUGH_LOOP.MP4
          </span>
        </div>

        {/* Right Side: Quality tag */}
        <div className="flex items-center gap-1.5 text-[8px] text-white/40">
          <span className="text-yellow-400 font-bold bg-yellow-950/40 px-1 py-0.2 rounded border border-yellow-800/30">720P FPS:60</span>
          <span>MUTED</span>
          <Volume2 className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Screen Canvas Render Viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {renderScreencastSimulation()}

        {/* Big play pause layout indicators */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2 z-10"
            >
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-12 h-12 rounded-full bg-yellow-300 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,232,31,0.5)] outline-none"
              >
                <Play className="w-6 h-6 fill-slate-950 ml-1" />
              </button>
              <span className="text-[9px] font-bold font-mono text-white/65 uppercase tracking-widest bg-black/25 px-2 py-0.5 rounded">
                SIMULATION PAUSED
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Player Bottom Timeline Scrubbed Console */}
      <div className="bg-graphite px-3.5 py-2.5 flex items-center gap-3 border-t border-white/10 text-white/45 text-[10px] font-mono">
        
        {/* Play/Pause Button */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs font-black uppercase text-white/65 hover:text-white transition-colors flex-shrink-0 cursor-pointer outline-none"
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        {/* Progress Timeline bar */}
        <div className="flex-1 bg-black/25 h-1.5 rounded-full overflow-hidden relative cursor-pointer" onClick={handleRestart}>
          <div 
            className="bg-yellow-400 h-full relative" 
            style={{ width: `${(timelineSecs / 12) * 100}%` }}
          />
        </div>

        {/* Timeline timer indicator */}
        <div className="text-[9px] text-white/40 font-mono flex-shrink-0">
          <span>00:{timelineSecs < 10 ? `0${timelineSecs.toFixed(0)}` : timelineSecs.toFixed(0)}</span>
          <span className="mx-1">/</span>
          <span>00:12</span>
        </div>

        {/* Refresh loop trigger */}
        <button 
          onClick={handleRestart}
          className="text-white/40 hover:text-yellow-400 hover:scale-105 transition-all duration-200 outline-none flex-shrink-0"
          title="Restart screencast clip"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}

export default function AisLandingPage({ profile, onUpdateProfile, onSectionChange }: AisLandingPageProps) {
  // Animated signup form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    tierPreference: 'GOLD',
    agreedToTerms: true,
  });

  const [signupStep, setSignupStep] = useState<number>(1); // 1 = Registration Form; 2 = Done
  const [isActivating, setIsActivating] = useState(false);

  // Cinematic Trust Crawl Theater state variables
  const [theaterPaused, setTheaterPaused] = useState(false);
  const [isSpaceCruise, setIsSpaceCruise] = useState(true);

  // Detect if verified account is already established
  const isRegistered = profile.username && profile.username !== 'anonymous_capper' && profile.username !== '';

  useEffect(() => {
    loadDecorativeFonts();
  }, []);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.username.trim()) {
      alert('Please initialize display traits correctly.');
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setSignupStep(2);
      
      onUpdateProfile({
        displayName: formData.displayName,
        username: formData.username.replace(/\s+/g, '_').toLowerCase(),
        subscriptionTier: formData.tierPreference as 'GOLD' | 'SELLER_PRO' | 'BASIC',
        verified: true,
      });
    }, 1800);
  };

  const handleResetForNewAccount = () => {
    // Allows user to sign up a new account/overwrite cache
    onUpdateProfile({
      displayName: 'Anonymous Capper',
      username: 'anonymous_capper',
      subscriptionTier: 'BASIC',
      verified: false,
    });
    setSignupStep(1);
    setFormData({
      username: '',
      displayName: '',
      tierPreference: 'GOLD',
      agreedToTerms: true,
    });
  };

  // Middle timeline dataset
  const FEATURES = [
    {
      id: 'feed',
      title: 'Public Pick History',
      description: 'Post your picks and they\'re locked in with a timestamp — no quiet edits, no deleting losses. Your win-rate and ROI are calculated automatically and shown on your public profile.',
      tag: 'PICK TRACKING',
      icon: ShieldCheck,
      color: 'from-amber-400 to-yellow-500',
      accentHexColor: '#FFE81F',
      actionText: 'See the feed',
    },
    {
      id: 'ai_engine',
      title: 'Research Model',
      description: 'Get data-driven estimates for matchups based on historical stats, so you\'re not just going on gut feel. Useful as a second opinion before you post a pick.',
      tag: 'RESEARCH TOOL',
      icon: Sparkles,
      color: 'from-cyan-400 to-sky-500',
      accentHexColor: '#38bdf8',
      actionText: 'Try the research model',
    },
    {
      id: 'build',
      title: 'Parlay Calculator',
      description: 'Build multi-leg parlays and see combined odds and payout instantly. Switch between decimal and American odds as you go.',
      tag: 'CALCULATOR',
      icon: Sliders,
      color: 'from-indigo-400 to-purple-500',
      accentHexColor: '#818cf8',
      actionText: 'Open the calculator',
    },
    {
      id: 'live_games',
      title: 'Live Streams',
      description: 'Watch other cappers stream their picks live, chat with the community, and follow along with active parlays in real time.',
      tag: 'LIVE',
      icon: Monitor,
      color: 'from-emerald-400 to-teal-500',
      accentHexColor: '#34d399',
      actionText: 'Browse live streams',
    },
    {
      id: 'board',
      title: 'Pick Card Designer',
      description: 'Turn your picks into shareable graphics — custom colors, glow effects, and templates you can post to social media.',
      tag: 'DESIGN TOOL',
      icon: Sparkle,
      color: 'from-rose-400 to-pink-500',
      accentHexColor: '#f43f5e',
      actionText: 'Design a card',
    },
  ];

  return (
    <div id="landing-page-elite-root" className="bg-transparent text-white/90 min-h-screen relative overflow-y-auto overflow-x-hidden font-sans pb-24">
      
      {/* Landing Navigation Header Header */}
      <header className="sticky top-0 w-full z-50 bg-graphite/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-4 flex items-center justify-between select-none max-w-7xl mx-auto rounded-b-2xl" id="vouchedge-main-nav-header">
        <div 
          onClick={() => onSectionChange('welcome')} 
          className="flex items-center gap-3 cursor-pointer group transition-all"
          id="vouchedge-nav-brand-logo-trigger"
        >
          <div className="w-9 h-9 rounded-xl bg-obsidian-900 border border-[#FFE81F]/70 flex items-center justify-center text-[#FFE81F] font-bold text-sm shadow-[0_0_15px_rgba(255,232,31,0.25)] group-hover:scale-110 transition-transform">
            ★
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-widest text-white uppercase group-hover:text-yellow-400 transition-colors">
              VOUCH<span className="text-[#FFE81F]">EDGE</span>
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#FFE81F] uppercase mt-px scale-[0.85] origin-left">
              Trust Network
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono tracking-wider text-white/45" id="vouchedge-navbar-navlinks">
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('features-chronicle-timeline-tree');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="hover:text-[#FFE81F] transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-features-scroller"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-yellow-300 transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('ai_engine')} 
            className="hover:text-[#38bdf8] transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-smart-models"
          >
            Smart Models
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-sky-400 transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('board')} 
            className="hover:text-rose-400 transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-vouch-studio"
          >
            Vouch Studio
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-rose-400 transition-all group-hover:w-full" />
          </button>
          <button 
            type="button"
            onClick={() => onSectionChange('leaderboard')} 
            className="hover:text-emerald-400 transition-colors uppercase font-bold relative group cursor-pointer bg-transparent border-none outline-none"
            id="navlink-leaderboard"
          >
            Leaderboard
            <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-emerald-400 transition-all group-hover:w-full" />
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSectionChange('feed')}
            className="hidden sm:inline-block px-4 py-2 bg-black/30 hover:bg-slate-800 hover:text-white text-white/45 border border-white/10 hover:border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none"
            id="nav-guest-entrance-btn"
          >
            Browse as Guest
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRegistered) {
                onSectionChange('feed');
              } else {
                const el = document.getElementById('security-identity-gateway-root');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black font-mono text-[10px] uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,232,31,0.25)] transition-all active:scale-95 cursor-pointer outline-none"
            id="nav-establish-proof-btn"
          >
            {isRegistered ? 'Go to Feed' : 'Sign Up Free'}
          </button>
        </div>
      </header>

      {/* Background Matrix & Celestial Nebulas */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c152e_1px,transparent_1px),linear-gradient(to_bottom,#0c152e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none z-0" />
      
      {/* Soft Glow Nebulas */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-yellow-300/[0.04] via-amber-500/[0.02] to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-400/[0.04] via-purple-600/[0.02] to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Cinematic Star Wars Header Container */}
      <section className="relative pt-16 pb-12 px-4 max-w-5xl mx-auto text-center z-10">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Trust Shield Badge - Luxurious Platinum Silver & Gold style */}
          <span className="inline-flex items-center gap-1.5 bg-obsidian-900/60 border border-white/10 rounded-full px-4 py-1 text-[10px] text-indigo-400 font-mono font-black uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(99,102,241,0.12)]">
            <ShieldCheck className="w-3.5 h-3.5 text-vouch-cyan" />
            YOUR PICKS, YOUR RECORD, PUBLICLY VERIFIED
          </span>

          {/* Spaced Cinematic Editorial Title with Baunk styled experimental stencil typography */}
          <BaunkAnimatedTitle onSectionChange={onSectionChange} />

          <p className="text-white/45 text-xs sm:text-sm font-sans text-center max-w-2xl mx-auto mt-4 leading-relaxed">
            Every pick you post is timestamped and locked. <span className="text-vouch-cyan">No editing after the fact</span> <span className="text-vouch-cyan">•</span> No deleting losses <span className="text-vouch-cyan">•</span> Your win-rate speaks for itself
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-6" />
        </motion.div>
      </section>

      {/* HOW IT WORKS: 3-step explainer so visitors understand the product before being asked to sign up */}
      <section id="how-it-works-strip" className="max-w-4xl mx-auto px-4 pb-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Post your pick', body: 'Add your pick before the game locks — team, line, and stake.' },
            { step: '2', title: 'It gets timestamped', body: "Once posted, it can't be quietly edited or deleted. Wins and losses both stay on the record." },
            { step: '3', title: 'Your record builds itself', body: 'Win-rate and ROI update automatically on your public profile — no self-reporting.' },
          ].map((item) => (
            <div key={item.step} className="bg-black/25 border border-white/10 rounded-2xl p-5 text-left">
              <span className="w-7 h-7 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 font-mono font-black text-xs flex items-center justify-center mb-3">
                {item.step}
              </span>
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">{item.title}</h3>
              <p className="text-white/45 text-xs mt-1.5 leading-relaxed font-sans">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECURE IDENTITY GATEWAY: CONTINUE / SIGN IN / SIGN UP (TRUST PORTAL WITH CONTINUOUS BYPASS OPTION) */}
      <section id="security-identity-gateway-root" className="max-w-4xl mx-auto px-4 pb-16 relative z-10">
        <div className="bg-gradient-to-b from-[#111625] to-[#0a0c14] border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Glowing accent border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-500/20 via-yellow-400/80 to-yellow-500/20" />
          
          <AnimatePresence mode="wait">
            {isRegistered ? (
              /* Already Signed In: Quick Commander clearance launch option */
              <motion.div
                key="cleared_user"
                initial={{ scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4 font-mono"
              >
                <div className="w-16 h-16 bg-yellow-950/40 border border-[#FFE81F]/40 rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFE81F] shadow-[0_0_15px_rgba(255,232,31,0.2)]">
                  <Crown className="w-8 h-8 animate-pulse" />
                </div>

                <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest bg-yellow-950/60 px-3 py-1 rounded border border-[#FFE81F]/30">
                  YOU'RE SIGNED IN
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white mt-4 uppercase">
                  WELCOME BACK, <span className="text-[#FFE81F]">@{profile.username}</span>
                </h3>

                <p className="text-white/45 text-xs mt-2 max-w-md mx-auto leading-relaxed font-sans">
                  Your profile is saved. Active theme: <span className="text-sky-400 font-bold uppercase">{profile.activeTheme || 'Default'}</span>.
                </p>

                <div className="my-8 max-w-md mx-auto grid grid-cols-2 gap-3.5 text-left text-xs bg-black/30 p-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-white/40 block uppercase text-[10px]">Display name:</span>
                    <span className="text-white/80 font-bold block mt-0.5">{profile.displayName}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block uppercase text-[10px]">Plan:</span>
                    <span className="text-yellow-400 font-bold block mt-0.5 uppercase">✨ {profile.subscriptionTier}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 mt-2">
                  <button
                    onClick={() => onSectionChange('feed')}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,232,31,0.25)]"
                  >
                    <span>GO TO YOUR FEED</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <button
                    onClick={handleResetForNewAccount}
                    className="text-[10px] text-white/40 hover:text-yellow-400 font-bold uppercase tracking-wider underline mt-3 sm:mt-0 cursor-pointer"
                  >
                    Sign in as someone else
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Not Signed In: Show 2-Column Gateway Option: Continue without account VS Create account */
              <motion.div
                key="authentication_gateways"
                initial={false}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
              >
                {/* Column Left: Continue without account (Bypass) */}
                <div className="lg:col-span-5 flex flex-col justify-between p-5 bg-black/25 rounded-2xl border border-white/10 text-left">
                  <div className="space-y-3 font-mono">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest bg-black/25 px-2.5 py-0.5 rounded border border-slate-800">
                      NO ACCOUNT NEEDED
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      BROWSE AS A GUEST
                    </h3>
                    <p className="text-white/45 text-xs leading-relaxed font-sans mt-2">
                      Skip sign-up and jump straight into the feed. You'll be assigned a temporary anonymous name to follow and vouch for picks.
                    </p>
                  </div>

                  <button
                    onClick={() => onSectionChange('feed')}
                    className="mt-6 w-full py-4 bg-black/25 hover:bg-slate-800 text-white/80 hover:text-white border border-white/10 hover:border-white/10 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>CONTINUE AS GUEST</span>
                    <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
                  </button>
                </div>

                {/* Splitting divider */}
                <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
                  <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent" />
                </div>

                {/* Column Right: Sign Up/Sign In (Active user creation) */}
                <div className="lg:col-span-6 text-left">
                  {signupStep === 1 ? (
                    <div className="space-y-4">
                      <div className="font-mono">
                        <span className="text-[9px] font-bold text-[#FFE81F] uppercase tracking-widest bg-yellow-950/30 px-2.5 py-0.5 rounded border border-yellow-900/30">
                          CREATE A FREE ACCOUNT
                        </span>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider mt-2.5">
                          SIGN UP
                        </h3>
                        <p className="text-white/45 text-xs font-sans mt-1">
                          Save your pick history, build a public win-rate, and unlock a verified badge on your profile.
                        </p>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4 font-mono text-xs">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">Public Display Name</label>
                          <input
                            required
                            type="text"
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="e.g. Captain Vouch Walker"
                            className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">Unique Handle Username</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">@</span>
                            <input
                              required
                              type="text"
                              value={formData.username}
                              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                              placeholder="vouch_skywalker"
                              className="w-full bg-obsidian-900 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
                            />
                          </div>
                        </div>

                        {/* Subscription Tier Choice */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider">Badge preference <span className="normal-case font-normal text-white/30">(you can change this later)</span></label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div 
                              onClick={() => setFormData({ ...formData, tierPreference: 'GOLD' })}
                              className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                formData.tierPreference === 'GOLD' 
                                  ? 'bg-yellow-950/30 border-[#FFE81F] text-yellow-300' 
                                  : 'bg-obsidian-900 border-white/10 text-white/40'
                              }`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span>✨ GOLD VERIFIED</span>
                              </div>
                              <p className="text-[9px] text-white/45 mt-1 font-sans">Receive permanent gold check badge.</p>
                            </div>

                            <div 
                              onClick={() => setFormData({ ...formData, tierPreference: 'SELLER_PRO' })}
                              className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                formData.tierPreference === 'SELLER_PRO' 
                                  ? 'bg-indigo-950/35 border-indigo-500 text-vouch-cyan/80' 
                                  : 'bg-obsidian-900 border-white/10 text-white/40'
                              }`}
                            >
                              <div className="flex justify-between items-center font-bold">
                                <span>💎 SELLER PRO</span>
                              </div>
                              <p className="text-[9px] text-white/45 mt-1 font-sans">Unlock storefront indicators.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <input
                            required
                            type="checkbox"
                            id="agreed_check"
                            checked={formData.agreedToTerms}
                            onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                            className="mt-0.5 rounded border-white/10 bg-obsidian-900 text-yellow-400 focus:ring-transparent"
                          />
                          <label htmlFor="agreed_check" className="text-white/40 text-[10px] leading-tight font-sans">
                            I confirm the picks I post will be my own and accurately recorded.
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isActivating}
                          className="w-full py-3.5 bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          {isActivating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>CREATING YOUR ACCOUNT...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                              <span>SIGN UP FREE</span>
                            </>
                          )}
                        </button>
                        <p className="text-center text-white/30 text-[10px] font-sans normal-case tracking-normal">
                          Takes about 15 seconds. No card, no real money, ever.
                        </p>
                      </form>
                    </div>
                  ) : (
                    /* Account generated animation frame */
                    <div className="text-center py-6 font-mono">
                      <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-6 h-6 animate-pulse" />
                      </div>

                      <h4 className="text-emerald-400 font-extrabold uppercase text-sm">YOU'RE ALL SET</h4>
                      <p className="text-white/45 text-xs mt-2 leading-relaxed font-sans">
                        Account created. <span className="text-yellow-400 font-bold">@{formData.username}</span> is on the <span className="text-sky-400 font-bold">{formData.tierPreference}</span> plan.
                      </p>

                      <button
                        onClick={() => onSectionChange('feed')}
                        className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 mx-auto active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
                      >
                        <span>GO TO YOUR FEED</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* EPIC MIDDLE TIMELINE FEATURES TREE */}
      <section className="max-w-5xl mx-auto px-4 py-8 relative z-10 text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <span className="text-[#FFE81F] font-mono text-[10px] font-bold tracking-widest uppercase">WHAT YOU GET</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-wider mt-1">
            EVERYTHING YOU NEED TO TRACK YOUR PICKS
          </h2>
          <p className="text-white/45 text-xs sm:text-sm mt-3 leading-relaxed font-sans">
            Five tools that work together: a public pick history you can't quietly edit, a research model for finding value, a parlay calculator, live streams, and a card designer for sharing your picks.
          </p>
        </div>

        {/* Tree Container */}
        <div className="relative before:absolute before:left-[26px] md:before:left-1/2 before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-yellow-400 before:via-[#FFE81F] before:to-purple-500 before:shadow-[0_0_15px_rgba(255,232,31,0.5)] space-y-24 py-6" id="features-chronicle-timeline-tree">
          {FEATURES.map((feat, idx) => {
            const IconComponent = feat.icon;
            const isLeft = idx % 2 === 0;

            return (
              <div key={feat.id} className="relative grid grid-cols-1 md:grid-cols-9 items-start gap-0" id={`feature-timeline-segment-${feat.id}`}>
                
                {/* Left Card - Desktop only, on Left index */}
                <div className={`hidden md:block md:col-span-4 text-right pr-10 ${isLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {isLeft && (
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="bg-storm/90 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(255,232,31,0.15)] transition-all flex flex-col justify-between group text-left"
                    >
                      <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${feat.color}`} />
                      <div>
                        {/* Video Screencast Label badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-mono tracking-widest text-[#FFE81F] bg-yellow-950/40 border border-yellow-800/40 px-2 py-0.5 rounded font-black">
                            {feat.tag}
                          </span>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            ⏯️ INTERACTIVE WALKTHROUGH VIDEO
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-[#FFE81F] transition-colors uppercase tracking-wider">
                          {feat.title}
                        </h3>
                        
                        <p className="text-white/45 text-xs mt-2.5 leading-relaxed font-sans">
                          {feat.description}
                        </p>

                        {/* Interactive Simulated Video Component embedded inside card */}
                        <FeaturePreviewVideo featureId={feat.id} accentColor={feat.accentHexColor} />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center text-[9px] font-mono">
                         <span className="text-white/40 font-bold uppercase tracking-wider">HASH VERIFIED ✓</span>
                         <button
                           onClick={() => onSectionChange(feat.id)}
                           className="text-[#FFE81F] font-black uppercase tracking-wider flex items-center gap-1 hover:underline active:scale-95 transition-all outline-none cursor-pointer"
                         >
                           <span>{feat.actionText}</span>
                           <ChevronRight className="w-3.5 h-3.5 text-[#FFE81F]" />
                         </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Center Pin Column */}
                <div className="absolute left-[12px] md:relative md:left-0 md:col-span-1 flex md:justify-center items-start pt-8 h-full z-20">
                  <div className="w-8 h-8 rounded-full bg-obsidian-900 border-2 border-[#FFE81F] flex items-center justify-center text-[#FFE81F] timeline-dot-pulse shadow-[0_0_12px_rgba(255,232,31,0.8)]">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                {/* Right Card - On mobile, always show here. On Desktop, show here if idx is odd (!isLeft) */}
                <div className="col-span-1 md:col-span-4 pl-12 md:pl-10">
                  {/* Render on right if mobile, or if desktop and idx is odd */}
                  <div className={`${isLeft ? 'md:hidden' : 'block'}`}>
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="bg-storm/90 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(255,232,31,0.15)] transition-all flex flex-col justify-between group text-left"
                    >
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${feat.color}`} />
                      <div>
                        {/* Video Screencast Label badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-mono tracking-widest text-[#FFE81F] bg-yellow-950/40 border border-yellow-800/40 px-2 py-0.5 rounded font-black">
                            {feat.tag}
                          </span>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            ⏯️ INTERACTIVE WALKTHROUGH VIDEO
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-[#FFE81F] transition-colors uppercase tracking-wider">
                          {feat.title}
                        </h3>
                        
                        <p className="text-white/45 text-xs mt-2.5 leading-relaxed font-sans">
                          {feat.description}
                        </p>

                        {/* Interactive Simulated Video Component embedded inside card */}
                        <FeaturePreviewVideo featureId={feat.id} accentColor={feat.accentHexColor} />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center text-[9px] font-mono">
                         <span className="text-white/40 font-bold uppercase tracking-wider">HASH VERIFIED ✓</span>
                         <button
                           onClick={() => onSectionChange(feat.id)}
                           className="text-[#FFE81F] font-black uppercase tracking-wider flex items-center gap-1 hover:underline active:scale-95 transition-all outline-none cursor-pointer"
                         >
                           <span>{feat.actionText}</span>
                           <ChevronRight className="w-3.5 h-3.5 text-[#FFE81F]" />
                         </button>
                      </div>
                    </motion.div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-24 py-12 px-4 bg-obsidian-900 relative z-10 text-center font-mono text-[10px] text-white/40">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="tracking-widest uppercase text-yellow-400">
            © 2026 VouchEdge. All rights reserved.
          </p>
          <p className="max-w-lg mx-auto leading-relaxed text-slate-500 font-sans normal-case tracking-normal">
            VouchEdge is a free pick-tracking tool for entertainment purposes. No real money is wagered or exchanged on this platform.
          </p>
        </div>
      </footer>

    </div>
  );
}
