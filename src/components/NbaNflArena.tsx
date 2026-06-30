import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  ArrowLeft, 
  Play, 
  Pause, 
  Tv, 
  Flame, 
  Target, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Compass, 
  Eye, 
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NbaNflArenaProps {
  onSectionChange: (section: string) => void;
}

export default function NbaNflArena({ onSectionChange }: NbaNflArenaProps) {
  const [hoveredSide, setHoveredSide] = useState<'none' | 'nba' | 'nfl'>('none');
  const [activeNbaVid, setActiveNbaVid] = useState<1 | 2>(1);
  const [activeNflVid, setActiveNflVid] = useState<1 | 2>(1);
  const [isNbaPlaying, setIsNbaPlaying] = useState(true);
  const [isNflPlaying, setIsNflPlaying] = useState(true);
  const [liveNbaTime, setLiveNbaTime] = useState('00:14.82');
  const [liveNflTime, setLiveNflTime] = useState('00:04.15');

  const nbaVideo1Ref = React.useRef<HTMLVideoElement>(null);
  const nbaVideo2Ref = React.useRef<HTMLVideoElement>(null);
  const nflVideo1Ref = React.useRef<HTMLVideoElement>(null);
  const nflVideo2Ref = React.useRef<HTMLVideoElement>(null);

  // Synchronize playing states for NBA
  useEffect(() => {
    [nbaVideo1Ref, nbaVideo2Ref].forEach((ref) => {
      if (ref.current) {
        if (isNbaPlaying) {
          ref.current.play().catch(() => {});
        } else {
          ref.current.pause();
        }
      }
    });
  }, [isNbaPlaying]);

  // Synchronize playing states for NFL
  useEffect(() => {
    [nflVideo1Ref, nflVideo2Ref].forEach((ref) => {
      if (ref.current) {
        if (isNflPlaying) {
          ref.current.play().catch(() => {});
        } else {
          ref.current.pause();
        }
      }
    });
  }, [isNflPlaying]);

  // Simulate active running frames / timer for cinematic video feel
  useEffect(() => {
    let interval: any;
    if (isNbaPlaying) {
      interval = setInterval(() => {
        const ms = Math.floor(Math.random() * 100);
        const sec = Math.floor(Math.random() * 60);
        setLiveNbaTime(`00:${sec < 10 ? '0' + sec : sec}.${ms < 10 ? '0' + ms : ms}`);
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isNbaPlaying]);

  useEffect(() => {
    let interval: any;
    if (isNflPlaying) {
      interval = setInterval(() => {
        const ms = Math.floor(Math.random() * 100);
        const sec = Math.floor(Math.random() * 60);
        setLiveNflTime(`00:${sec < 10 ? '0' + sec : sec}.${ms < 10 ? '0' + ms : ms}`);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isNflPlaying]);

  // Cinematic royalty-free stock sports video loops from Mixkit (original sources)
  const nbaVideos = {
    1: 'https://assets.mixkit.co/videos/preview/mixkit-basketball-player-dribbling-the-ball-in-a-court-4770-large.mp4',
    2: 'https://assets.mixkit.co/videos/preview/mixkit-basketball-ball-hitting-the-net-slow-motion-4773-large.mp4'
  };

  const nflVideos = {
    1: 'https://assets.mixkit.co/videos/preview/mixkit-american-football-player-jumping-to-catch-a-pass-31368-large.mp4',
    2: 'https://assets.mixkit.co/videos/preview/mixkit-american-football-field-with-goals-at-sunset-31365-large.mp4'
  };

  return (
    <div className="relative min-h-screen bg-[#02040a] overflow-hidden text-slate-100 flex flex-col font-sans select-none" id="epic-arena-comingsoon-page">
      {/* Cinematic grid lines in the background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1526_1px,transparent_1px),linear-gradient(to_bottom,#0e1526_1px,transparent_1px)] bg-[size:40px_40px] opacity-35 z-0 pointer-events-none" />
      
      {/* Dynamic Ambient Atmos Glimmer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-650/5 blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[150px]" />
      </div>

      {/* Top Header Controls with Home button */}
      <header className="relative z-50 px-6 py-4 border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
        <button
          onClick={() => onSectionChange('feed')}
          className="flex items-center gap-2 px-4 py-2 bg-[#060913] hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-slate-800/80 transition-all cursor-pointer shadow-md hover:border-amber-400/30 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)] active:scale-95 animate-fade-in"
          id="arena-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Exit Arena</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-rose-950/80 px-3.5 py-1.5 rounded-full border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-mono font-black text-rose-300 tracking-widest uppercase">
              Coming soon 🏀🏈
            </span>
          </div>
        </div>
      </header>

      {/* Split Interactive Container */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10 w-full min-h-[calc(100vh-68px)]">
        
        {/* Left Hand: NBA Side */}
        <motion.div 
          layout
          onMouseEnter={() => setHoveredSide('nba')}
          onMouseLeave={() => setHoveredSide('none')}
          animate={{
            flex: hoveredSide === 'nba' ? 3 : hoveredSide === 'nfl' ? 0.35 : 1,
            opacity: hoveredSide === 'nfl' ? 0.35 : 1,
            filter: hoveredSide === 'nfl' ? 'grayscale(40%) brightness(70%)' : 'grayscale(0%) brightness(100%)'
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            mass: 0.8
          }}
          className="relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-900/80 flex flex-col justify-between p-6 md:p-8 cursor-pointer transition-colors duration-500"
          style={{
            background: hoveredSide === 'nba' 
              ? 'linear-gradient(180deg, rgba(16,22,46,0.98) 0%, rgba(5,7,16,0.99) 100%)'
              : 'linear-gradient(180deg, rgba(10,13,26,0.95) 0%, rgba(3,4,9,0.98) 100%)'
          }}
          id="split-side-nba"
        >
          {/* Active hover neon light beam on dividing edge */}
          {hoveredSide === 'nba' && (
            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-orange-400 via-amber-500 to-indigo-600 shadow-[0_0_15px_#f97316] z-30" />
          )}

          {/* Background overlay glows */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-transparent pointer-events-none transition-opacity duration-700 ${
            hoveredSide === 'nba' ? 'opacity-100' : 'opacity-20'
          }`} />

          {/* Header element */}
          <div className="relative z-20 flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ 
                  scale: hoveredSide === 'nba' ? 1.1 : 1,
                  rotate: hoveredSide === 'nba' ? 360 : 0
                }}
                transition={{ type: "spring", stiffness: 120 }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold shadow-lg shrink-0 border ${
                  hoveredSide === 'nba' 
                    ? 'bg-orange-950/80 border-orange-400 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 shadow-none'
                }`}
              >
                🏀
              </motion.div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-mono tracking-widest uppercase font-bold transition-colors duration-300 ${
                  hoveredSide === 'nba' ? 'text-orange-400' : 'text-slate-500'
                }`}>
                  COURT TELEMETRIES
                </span>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">NBA Analytics</h4>
              </div>
            </div>

            {/* Quick stats indicator visible when expanded */}
            <div className={`flex items-center gap-4 transition-all duration-500 ${
              hoveredSide === 'nba' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-90 pointer-events-none hidden md:flex'
            }`}>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Engine Trust</span>
                <span className="text-orange-400 font-black">98.4% Acc</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Sim Rate</span>
                <span className="text-slate-300 font-black">15K sim/m</span>
              </div>
            </div>
          </div>

          {/* Inactive Sleek Vertical Title (Displays when other side is focused) */}
          {hoveredSide === 'nfl' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fade-in">
              <span className="text-[11px] font-black tracking-[0.4em] text-slate-600 uppercase transform -rotate-90 origin-center whitespace-nowrap">
                🏀 HARDWOOD INSIGHTS
              </span>
            </div>
          )}

          {/* Center Main cinematic showcase */}
          <div className={`relative z-20 my-auto py-4 space-y-6 max-w-2xl transition-all duration-500 ${
            hoveredSide === 'nfl' ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100'
          }`}>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-orange-950/80 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-md">
                  🚀 VouchEdge Hardwood
                </span>
                <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-rose-950/90 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  ⚠️ COMING SOON
                </span>
                {hoveredSide === 'nba' && (
                  <span className="text-[9px] font-mono font-extrabold text-[#fbbf24] animate-pulse">
                    ★ HOVERED FOCUS ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
                NBA PROPS ENGINE <br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                  & COURT TRACKING
                </span>
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium max-w-xl">
                Synthesizing court floor pacing, physical stress indexes, load management markers, and dynamic shot trajectory curves to deliver high-probability edge outcomes on player props.
              </p>
            </div>

            {/* Cinematic Video Container with Zoom effects */}
            <motion.div 
              animate={{
                scale: hoveredSide === 'nba' ? 1.02 : 1,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className={`relative rounded-2xl border transition-all duration-500 ${
                hoveredSide === 'nba' 
                  ? 'border-orange-500/40 shadow-[0_0_35px_rgba(249,115,22,0.18)] bg-orange-950/10' 
                  : 'border-slate-800/80 bg-slate-950/40'
              }`} 
              id="nba-cinematic-video-frame"
            >
              {/* Image element resembling video feed */}
              <div className="relative aspect-video w-full rounded-[14px] overflow-hidden bg-slate-950">
                {/* Dual Video Elements for Perfect Preloading and Hardware Cross-fading */}
                <video 
                  ref={nbaVideo1Ref}
                  src={nbaVideos[1]}
                  muted
                  loop
                  playsInline
                  autoPlay={isNbaPlaying}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    activeNbaVid === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  } ${
                    isNbaPlaying ? 'scale-[1.08] saturate-[1.15] filter brightness-95' : 'scale-100 saturate-[0.8] filter brightness-70'
                  }`}
                />
                <video 
                  ref={nbaVideo2Ref}
                  src={nbaVideos[2]}
                  muted
                  loop
                  playsInline
                  autoPlay={isNbaPlaying}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    activeNbaVid === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  } ${
                    isNbaPlaying ? 'scale-[1.08] saturate-[1.15] filter brightness-95' : 'scale-100 saturate-[0.8] filter brightness-70'
                  }`}
                />

                {/* Cyber Scanner HUD Lines */}
                {isNbaPlaying && hoveredSide === 'nba' && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/80 to-transparent animate-bounce shadow-[0_0_8px_#f97316]" style={{ animationDuration: '3.5s' }} />
                    {/* Reticle grid marks */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-orange-400/70" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-orange-400/70" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-orange-400/70" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-orange-400/70" />
                  </div>
                )}

                {/* Immersive Glassmorphic Coming Soon overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[1px] z-10 pointer-events-none">
                  <div className="bg-slate-950/90 backdrop-blur-md border border-rose-500/30 px-5 py-3 rounded-2xl flex flex-col items-center gap-1 shadow-[0_0_25px_rgba(244,63,94,0.15)] transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-mono tracking-[0.25em] font-black text-rose-400 uppercase animate-pulse">🏀 COMING SOON</span>
                    <span className="text-[12px] font-black uppercase text-slate-200 tracking-wider">NBA HARDWOOD INSIGHTS</span>
                  </div>
                </div>

                {/* Video controls / telemetries */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/30 p-4 flex flex-col justify-between z-20">
                  {/* Top bar with telemetry */}
                  <div className="flex flex-col gap-2 font-mono text-[9px] w-full">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isNbaPlaying ? 'animate-pulse' : ''}`} />
                        <span className="text-slate-300 uppercase font-bold">
                          FEED: LIVE MODEL CAM-0{activeNbaVid}
                        </span>
                      </div>
                      <span className="text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded border border-orange-900/50 uppercase font-black">4K ANALYSIS LOCK</span>
                    </div>
                  </div>

                  {/* Dynamic tracking visualizer overlay */}
                  {isNbaPlaying && hoveredSide === 'nba' && (
                    <div className="absolute inset-x-8 top-1/3 bottom-1/3 flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-full h-px bg-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.8)] relative animate-pulse" />
                      <div className="mt-2 flex gap-2">
                        <span className="px-1.5 py-0.5 bg-orange-950/90 text-orange-400 text-[8px] font-mono font-bold uppercase rounded border border-orange-500/40">
                          PROBABILITY VECTORS ACQUIRED
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-950/90 text-indigo-400 text-[8px] font-mono font-bold uppercase rounded border border-indigo-500/40">
                          EST. MARGIN: +5.5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bottom bar */}
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNbaPlaying(!isNbaPlaying);
                        }}
                        className="w-8 h-8 rounded-full bg-orange-500 text-slate-950 hover:bg-orange-400 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-90"
                        title={isNbaPlaying ? "Pause Video Stream" : "Play Video Stream"}
                      >
                        {isNbaPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                      </button>

                      {/* Image selector toggles representing video presets */}
                      <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur p-1 rounded-lg border border-white/5 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNbaVid(1);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase font-mono transition-all ${
                            activeNbaVid === 1 ? 'bg-orange-950 text-orange-400 border border-orange-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Real Game
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNbaVid(2);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase font-mono transition-all ${
                            activeNbaVid === 2 ? 'bg-orange-950 text-orange-400 border border-orange-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Hoop Angle
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[9px] text-slate-300">
                      <span className="text-slate-500 uppercase mr-1">RUNNING:</span>
                      <span className="font-extrabold text-orange-400">{liveNbaTime}</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Expanded telemetry stats block with staggered animation effect */}
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 transition-all duration-505 ${
              hoveredSide === 'nba' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none hidden md:grid'
            }`}>
              <div className="bg-[#0b0e1a]/80 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 hover:border-orange-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-orange-400" />
                  Hardwood Fatigue Map
                </span>
                <p className="text-xs font-black text-slate-200">Zone Load Metrics</p>
                <p className="text-[10px] text-slate-400 leading-tight">Weighing stamina drain on back-to-back schedules.</p>
              </div>

              <div className="bg-[#0b0e1a]/80 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 hover:border-indigo-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <Target className="w-3 h-3 text-indigo-400" />
                  Prop Shot Grid
                </span>
                <p className="text-xs font-black text-slate-200">Matchup Spacing</p>
                <p className="text-[10px] text-slate-400 leading-tight">Mapping high-precision scoring vectors live.</p>
              </div>

              <div className="bg-[#0b0e1a]/80 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 col-span-2 md:col-span-1 hover:border-emerald-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  V.A.I Smart Overlay
                </span>
                <p className="text-xs font-black text-slate-200">Outcome Predictor</p>
                <p className="text-[10px] text-slate-400 leading-tight">Real-time basketball modeling running natively.</p>
              </div>
            </div>
          </div>

          {/* Footer stats line */}
          <div className={`relative z-20 border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2 transition-all duration-500 ${
            hoveredSide === 'nfl' ? 'opacity-0' : 'opacity-100'
          }`}>
            <span>AUDITED SYSTEM STATE: READY_TO_CODE</span>
            <span className="text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all">
              <span>EXPLORE COURT PRODUCER</span>
              <span>→</span>
            </span>
          </div>

        </motion.div>

        {/* Right Hand: NFL Side */}
        <motion.div 
          layout
          onMouseEnter={() => setHoveredSide('nfl')}
          onMouseLeave={() => setHoveredSide('none')}
          animate={{
            flex: hoveredSide === 'nfl' ? 3 : hoveredSide === 'nba' ? 0.35 : 1,
            opacity: hoveredSide === 'nba' ? 0.35 : 1,
            filter: hoveredSide === 'nba' ? 'grayscale(40%) brightness(70%)' : 'grayscale(0%) brightness(100%)'
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            mass: 0.8
          }}
          className="relative overflow-hidden flex flex-col justify-between p-6 md:p-8 cursor-pointer transition-colors duration-500"
          style={{
            background: hoveredSide === 'nfl' 
              ? 'linear-gradient(180deg, rgba(12,25,27,0.98) 0%, rgba(4,8,16,0.99) 100%)'
              : 'linear-gradient(180deg, rgba(8,15,16,0.95) 0%, rgba(3,5,10,0.98) 100%)'
          }}
          id="split-side-nfl"
        >
          {/* Active hover neon light beam on dividing edge */}
          {hoveredSide === 'nfl' && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-400 via-teal-500 to-indigo-600 shadow-[0_0_15px_#10b981] z-30" />
          )}

          {/* Background overlay glows */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600/10 via-transparent to-transparent pointer-events-none transition-opacity duration-700 ${
            hoveredSide === 'nfl' ? 'opacity-100' : 'opacity-20'
          }`} />

          {/* Header element */}
          <div className="relative z-20 flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ 
                  scale: hoveredSide === 'nfl' ? 1.1 : 1,
                  rotate: hoveredSide === 'nfl' ? -360 : 0
                }}
                transition={{ type: "spring", stiffness: 120 }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold shadow-lg shrink-0 border ${
                  hoveredSide === 'nfl' 
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 shadow-none'
                }`}
              >
                🏈
              </motion.div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-mono tracking-widest uppercase font-bold transition-colors duration-300 ${
                  hoveredSide === 'nfl' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  GRIDIRON TELEMETRY
                </span>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">NFL Analytics</h4>
              </div>
            </div>

            {/* Quick stats indicator visible when expanded */}
            <div className={`flex items-center gap-4 transition-all duration-500 ${
              hoveredSide === 'nfl' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-90 pointer-events-none hidden md:flex'
            }`}>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Engine Trust</span>
                <span className="text-emerald-400 font-black">99.1% Confidence</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-right font-mono text-xs">
                <span className="text-slate-300 font-black">22K sim/m</span>
              </div>
            </div>
          </div>

          {/* Inactive Sleek Vertical Title (Displays when other side is focused) */}
          {hoveredSide === 'nba' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fade-in">
              <span className="text-[11px] font-black tracking-[0.4em] text-slate-600 uppercase transform -rotate-90 origin-center whitespace-nowrap">
                🏈 GRIDIRON INSIGHTS
              </span>
            </div>
          )}

          {/* Center Main cinematic showcase */}
          <div className={`relative z-20 my-auto py-4 space-y-6 max-w-2xl transition-all duration-500 ${
            hoveredSide === 'nba' ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100'
          }`}>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                  ⚡ VouchEdge Turf
                </span>
                <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-rose-950/90 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  ⚠️ COMING SOON
                </span>
                {hoveredSide === 'nfl' && (
                  <span className="text-[9px] font-mono font-extrabold text-[#fbbf24] animate-pulse">
                    ★ HOVERED FOCUS ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
                NFL GRIDIRON HUB <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  & REDZONE MODELER
                </span>
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium max-w-xl">
                Predict red-zone touchdowns before the ball is snapped. Integrating turf friction calculations, receiver vs CB sprint ratios, and gameflow pacing metrics.
              </p>
            </div>

            {/* Cinematic Video Container */}
            <motion.div 
              animate={{
                scale: hoveredSide === 'nfl' ? 1.02 : 1,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className={`relative rounded-2xl border transition-all duration-500 ${
                hoveredSide === 'nfl' 
                  ? 'border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.18)] bg-emerald-950/10' 
                  : 'border-slate-880 bg-slate-950/40'
              }`} 
              id="nfl-cinematic-video-frame"
            >
              {/* Image element resembling video feed */}
              <div className="relative aspect-video w-full rounded-[14px] overflow-hidden bg-slate-950">
                {/* Dual Video Elements for Perfect Preloading and Hardware Cross-fading */}
                <video 
                  ref={nflVideo1Ref}
                  src={nflVideos[1]}
                  muted
                  loop
                  playsInline
                  autoPlay={isNflPlaying}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    activeNflVid === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  } ${
                    isNflPlaying ? 'scale-[1.08] saturate-[1.15] filter brightness-95' : 'scale-100 saturate-[0.8] filter brightness-70'
                  }`}
                />
                <video 
                  ref={nflVideo2Ref}
                  src={nflVideos[2]}
                  muted
                  loop
                  playsInline
                  autoPlay={isNflPlaying}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    activeNflVid === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  } ${
                    isNflPlaying ? 'scale-[1.08] saturate-[1.15] filter brightness-95' : 'scale-100 saturate-[0.8] filter brightness-70'
                  }`}
                />

                {/* Cyber Scanner HUD Lines */}
                {isNflPlaying && hoveredSide === 'nfl' && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-450/80 to-transparent animate-bounce shadow-[0_0_8px_#10b981]" style={{ animationDuration: '4s' }} />
                    {/* Reticle grid marks */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/70" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/70" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/70" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/70" />
                  </div>
                )}

                {/* Immersive Glassmorphic Coming Soon overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[1px] z-10 pointer-events-none">
                  <div className="bg-slate-950/90 backdrop-blur-md border border-rose-500/30 px-5 py-3 rounded-2xl flex flex-col items-center gap-1 shadow-[0_0_25px_rgba(244,63,94,0.15)] transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-mono tracking-[0.25em] font-black text-rose-400 uppercase animate-pulse">🏈 COMING SOON</span>
                    <span className="text-[12px] font-black uppercase text-slate-200 tracking-wider">NFL GRIDIRON INSIGHTS</span>
                  </div>
                </div>

                {/* Video controls / telemetries */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/30 p-4 flex flex-col justify-between z-20">
                  {/* Top bar with telemetry */}
                  <div className="flex flex-col gap-2 font-mono text-[9px] w-full">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isNflPlaying ? 'animate-pulse' : ''}`} />
                        <span className="text-slate-300 uppercase font-bold">
                          FEED: LIVE MODEL CAM-0{activeNflVid}
                        </span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/50 uppercase font-black">TOUCHDOWN VERIFICATION</span>
                    </div>
                  </div>

                  {/* Dynamic tracking visualizer overlay */}
                  {isNflPlaying && hoveredSide === 'nfl' && (
                    <div className="absolute inset-x-8 top-1/3 bottom-1/3 flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-full h-px bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.8)] relative animate-pulse" />
                      <div className="mt-2 flex gap-2">
                        <span className="px-1.5 py-0.5 bg-emerald-950/90 text-emerald-400 text-[8px] font-mono font-bold uppercase rounded border border-emerald-500/40">
                          SEPARATION THRESHOLD GAINED
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-950/90 text-indigo-400 text-[8px] font-mono font-bold uppercase rounded border border-indigo-500/40">
                          TD CONVERSION CONFIDENCE: 92%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bottom bar */}
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNflPlaying(!isNflPlaying);
                        }}
                        className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-90"
                        title={isNflPlaying ? "Pause Video Stream" : "Play Video Stream"}
                      >
                        {isNflPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                      </button>

                      {/* Video selector toggles representing video presets */}
                      <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur p-1 rounded-lg border border-white/5 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNflVid(1);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase font-mono transition-all ${
                            activeNflVid === 1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Catch Clip
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNflVid(2);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase font-mono transition-all ${
                            activeNflVid === 2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Sunset Turf
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[9px] text-slate-300">
                      <span className="text-slate-500 uppercase mr-1">RUNNING:</span>
                      <span className="font-extrabold text-emerald-400">{liveNflTime}</span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Expanded telemetry stats block */}
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 transition-all duration-505 ${
              hoveredSide === 'nfl' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none hidden md:grid'
            }`}>
              <div className="bg-[#080d12]/85 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 hover:border-emerald-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-400" />
                  Redzone Target Heat
                </span>
                <p className="text-xs font-black text-slate-200">Convert Probability</p>
                <p className="text-[10px] text-slate-400 leading-tight">Predict snaps in the 20yd line using defensive scheme weights.</p>
              </div>

              <div className="bg-[#080d12]/85 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 hover:border-amber-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Sprint Acceleration
                </span>
                <p className="text-xs font-black text-slate-200">Sprinting Vectors</p>
                <p className="text-[10px] text-slate-400 leading-tight">Matching receiver burst speeds against CB coverage margins.</p>
              </div>

              <div className="bg-[#080d12]/85 border border-slate-900/80 rounded-xl p-3 text-left space-y-1 col-span-2 md:col-span-1 hover:border-indigo-500/20 transition-all">
                <span className="text-[8px] font-bold font-mono uppercase text-slate-500 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-indigo-400" />
                  Endzone Camera
                </span>
                <p className="text-xs font-black text-slate-200">Interactive Focus</p>
                <p className="text-[10px] text-slate-400 leading-tight">Tracking playbounds with precision zoom algorithms.</p>
              </div>
            </div>
          </div>

          {/* Footer stats line */}
          <div className={`relative z-20 border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2 transition-all duration-500 ${
            hoveredSide === 'nba' ? 'opacity-0' : 'opacity-100'
          }`}>
            <span>AUDITED SYSTEM STATE: READY_TO_CODE</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all">
              <span>EXPLORE TURF PRODUCER</span>
              <span>→</span>
            </span>
          </div>

        </motion.div>

      </div>

    </div>
  );
}
