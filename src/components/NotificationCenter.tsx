import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Sparkles, 
  Tv, 
  TrendingUp, 
  Trophy, 
  Flame, 
  CheckCircle, 
  X, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Plus,
  PlayCircle,
  Sliders,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Parlay, MLBPlayer } from '../types';

interface LiveNotification {
  id: string;
  type: 'NORMAL' | 'HYPE';
  title: string;
  description: string;
  timestamp: string;
  metricType?: 'Homerun' | 'Run' | 'Hit' | 'RBI';
  playerName?: string;
  odds?: string;
  teamLogoCode?: string;
  isRead: boolean;
}

interface NotificationCenterProps {
  savedSlips?: Parlay[];
}

export default function NotificationCenter({ savedSlips = [] }: NotificationCenterProps) {
  // Notification States
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'universal' | 'parlays'>('universal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Choice controls / toggles
  const [notifyHomeruns, setNotifyHomeruns] = useState<boolean>(true);
  const [notifyRuns, setNotifyRuns] = useState<boolean>(true);
  const [notifyHits, setNotifyHits] = useState<boolean>(true);
  const [notifyRBIs, setNotifyRBIs] = useState<boolean>(true);
  const [notifyParlays, setNotifyParlays] = useState<boolean>(true);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);

  // Active floating notifications in the top-left corner
  const [activeAlerts, setActiveAlerts] = useState<LiveNotification[]>([]);
  
  // Archived notifications shown inside the scrollable drawer list
  const [notifications, setNotifications] = useState<LiveNotification[]>([
    {
      id: 'n-1',
      type: 'NORMAL',
      title: '⚾ HOMERUN HIT',
      description: 'Shohei Ohtani launches a 435ft rocket to dead center in the 3rd inning!',
      timestamp: 'Just now',
      metricType: 'Homerun',
      playerName: 'Shohei Ohtani',
      isRead: false
    },
    {
      id: 'n-2',
      type: 'HYPE',
      title: '🏆 PARLAY COMPLETED',
      description: 'Your 3-Leg "Dodger Run & HR Combo" just hit at live +620 odds! Win confirmed.',
      timestamp: '4 mins ago',
      odds: '+620',
      isRead: false
    },
    {
      id: 'n-3',
      type: 'NORMAL',
      title: '🏃 RUN SCORED',
      description: 'Mookie Betts bats a lead-off run from a double error in Washington.',
      timestamp: '15 mins ago',
      metricType: 'Run',
      playerName: 'Mookie Betts',
      isRead: true
    }
  ]);

  // Audio helper API to play a beautiful chime on notification
  const playAlertSound = (isHype: boolean) => {
    if (!soundEnabled) return;
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (isHype) {
        // High-octane winning multi-synth chime
        const now = context.currentTime;
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, idx) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(context.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.55);
        });
      } else {
        // Elegant clean bell sound
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, context.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        osc.stop(context.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context beep blocked by browser gesture constraints.", e);
    }
  };

  // Trigger notification utility helper
  const triggerNotification = (type: 'NORMAL' | 'HYPE', title: string, desc: string, metric?: 'Homerun' | 'Run' | 'Hit' | 'RBI', player?: string, odds?: string) => {
    const newNotif: LiveNotification = {
      id: `live-alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      description: desc,
      timestamp: 'Just now',
      metricType: metric,
      playerName: player,
      odds,
      isRead: false
    };

    // Add to active float top-left stack
    setActiveAlerts((prev) => [newNotif, ...prev]);

    // Archive in drawer list
    setNotifications((prev) => [newNotif, ...prev]);

    playAlertSound(type === 'HYPE');

    // Auto dismiss float card after 6 seconds
    setTimeout(() => {
      setActiveAlerts((prev) => prev.filter(al => al.id !== newNotif.id));
    }, 6500);
  };

  // Simulator Triggers
  const simulateHomerun = () => {
    if (!notifyHomeruns) return;
    const players = ['Aaron Judge', 'Shohei Ohtani', 'Juan Soto', 'Bryce Harper'];
    const selectedPlayer = players[Math.floor(Math.random() * players.length)];
    const dist = 390 + Math.floor(Math.random() * 65);
    triggerNotification(
      'NORMAL',
      '⚾ LIVE HOMERUN ALERT',
      `${selectedPlayer} hits a crushing ${dist}ft homerun into the upper deck bleachers!`,
      'Homerun',
      selectedPlayer
    );
  };

  const simulateRunScored = () => {
    if (!notifyRuns) return;
    const players = ['Mookie Betts', 'Ronald Acuña Jr.', 'Corbin Carroll', 'Bobby Witt Jr.'];
    const selectedPlayer = players[Math.floor(Math.random() * players.length)];
    triggerNotification(
      'NORMAL',
      '🏃 LIVE RUN SCORED',
      `${selectedPlayer} sprints home safely on a wild pitch slide!`,
      'Run',
      selectedPlayer
    );
  };

  const simulateHitLine = () => {
    if (!notifyHits) return;
    const players = ['Luis Arraez', 'Freddie Freeman', 'Bo Bichette', 'Yordan Alvarez'];
    const selectedPlayer = players[Math.floor(Math.random() * players.length)];
    triggerNotification(
      'NORMAL',
      '⚾ BASE HIT CONFIRMED',
      `${selectedPlayer} lasers a solid line-drive single into right field!`,
      'Hit',
      selectedPlayer
    );
  };

  const simulateParlayWin = () => {
    if (!notifyParlays) return;
    const randomSlipId = savedSlips.length > 0 ? savedSlips[Math.floor(Math.random() * savedSlips.length)].id : 'Slip #8410';
    const comboNames = ['Apex MLB Sweep Multi', 'Midnight Triple Play', 'Vouch Core Heavy Slump Buster', 'Ohtani/Judge Launch Stack'];
    const comboStr = comboNames[Math.floor(Math.random() * comboNames.length)];
    const multipliers = ['+380', '+640', '+950', '+1480'];
    const pickedOdds = multipliers[Math.floor(Math.random() * multipliers.length)];
    
    triggerNotification(
      'HYPE',
      '🏆 PARLAY WIN EXTRAVAGANZA!',
      `All legs on "${comboStr}" (${randomSlipId}) have successfully hit! Units updated (+${(parseFloat(pickedOdds)/100 || 5).toFixed(1)} units)`,
      undefined,
      undefined,
      pickedOdds
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setActiveAlerts([]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* =======================================================
          TOP-LEFT FLOATING ALERTS COMPONENT (pops & fades here)
         ======================================================= */}
      <div 
        className="fixed top-4 left-4 z-50 flex flex-col gap-3 w-80 pointer-events-none" 
        id="top-left-alerts-hud-container"
      >
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl relative overflow-hidden transition-all duration-500 transform translate-x-0 ${
              alert.type === 'HYPE'
                ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-[#150d2e] border-2 border-amber-400 text-amber-100 ring-4 ring-amber-400/20 animate-pulse'
                : 'bg-slate-950/95 backdrop-blur-md border border-sky-500/40 text-slate-100 shadow-sky-950/20'
            }`}
            style={{
              animation: alert.type === 'HYPE' ? 'parlayHypeGold 2.5s infinite alternate, fadeIn 0.4s ease-out' : 'fadeIn 0.35s ease-out',
            }}
          >
            {/* Background strobe / highlight gradient for hype wins */}
            {alert.type === 'HYPE' && (
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/20 via-transparent to-transparent opacity-80 animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
            )}

            {/* Close button */}
            <button
              onClick={() => setActiveAlerts((prev) => prev.filter(al => al.id !== alert.id))}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-900/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Notification content body */}
            <div className="flex gap-3 items-start">
              {alert.type === 'HYPE' ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-white font-extrabold flex-shrink-0 animate-bounce shadow">
                  <Trophy className="w-5 h-5 text-amber-950" />
                </div>
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alert.metricType === 'Homerun' 
                    ? 'bg-rose-500/20 text-rose-450 border border-rose-500/30'
                    : alert.metricType === 'Run'
                    ? 'bg-amber-500/20 text-amber-450 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-450 border border-emerald-500/30'
                }`}>
                  {alert.metricType === 'Homerun' ? (
                    <Flame className="w-4.5 h-4.5 text-rose-550" />
                  ) : alert.metricType === 'Run' ? (
                    <TrendingUp className="w-4.5 h-4.5 text-amber-550" />
                  ) : (
                    <Zap className="w-4.5 h-4.5 text-emerald-550" />
                  )}
                </div>
              )}

              <div className="flex-1 pr-4">
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase block ${
                  alert.type === 'HYPE' ? 'text-amber-400' : 'text-sky-400'
                }`}>
                  {alert.title}
                </span>
                
                {alert.playerName && (
                  <span className="text-xs font-black block mt-0.5 uppercase tracking-wide">
                    {alert.playerName}
                  </span>
                )}

                <p className="text-[11px] text-slate-300 mt-1 leading-normal font-medium">
                  {alert.description}
                </p>

                {alert.odds && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                    <span>MULTIPLIER HIT: {alert.odds}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom pulsing neon line timer indicator */}
            <div className={`absolute bottom-0 left-0 h-0.5 w-full ${
              alert.type === 'HYPE' ? 'bg-amber-400 animate-shimmer' : 'bg-sky-500'
            }`} style={{ animation: 'shrinkBar 6.5s linear forwards' }} />
          </div>
        ))}
      </div>


      {/* =======================================================
          BOTTOM-RIGHT INTERACTIVE DRAWER HUB (the control configuration)
         ======================================================= */}
      <div className="fixed bottom-4 right-4 z-50 text-slate-100" id="bottom-right-notification-center">
        
        {/* Hub FAB Floating Toggle Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAllRead();
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center relative shadow-2xl transition-all duration-300 scale-100 active:scale-95 border ${
            isOpen 
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-450 hover:bg-rose-500/20' 
              : 'bg-slate-950 hover:bg-slate-900 border-sky-500/40 text-sky-400 hover:text-sky-300'
          }`}
          title="Notification Hub Settings"
          id="notif-fab-toggle"
        >
          {unreadCount > 0 ? (
            <>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-650 to-rose-600 border border-rose-950 font-mono text-[9px] font-black tracking-tighter px-1.5 py-0.5 rounded-full shadow animate-bounce">
                {unreadCount}
              </span>
              <BellRing className="w-5 h-5 text-sky-400 animate-pulse" />
            </>
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </button>

        {/* Floating Settings Drawer Panel */}
        {isOpen && (
          <div 
            className="absolute bottom-14 right-0 w-[350px] bg-slate-950/95 border-2 border-slate-900/80 rounded-2xl p-4 shadow-3xl text-sm flex flex-col max-h-[500px] overflow-hidden animate-fade-in"
            style={{ backdropFilter: 'blur(20px)' }}
            id="notif-drawer-canvas"
          >
            {/* Header row */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-sky-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Live Notification Hub</h4>
                  <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold mt-0.5">SABERMETRIC FEED CHECKS</span>
                </div>
              </div>

              {/* Sound toggling & close buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    soundEnabled 
                      ? 'bg-sky-500/15 border-sky-450/40 text-sky-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-900 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Agent Fusion & Settings Collapsible Trigger */}
            <div className="flex gap-2 my-2">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-vedge-agent-chat', {
                    detail: { 
                      action: 'explain_alerts',
                      text: "Can you analyze our recent live alerts and explain active sabermetric trends?"
                    }
                  }));
                }}
                className="flex-1 py-1.5 px-3 bg-gradient-to-r from-sky-900/50 to-indigo-900/50 hover:from-sky-850 hover:to-indigo-850 border border-sky-505/30 hover:border-sky-404 text-[10px] font-bold text-sky-400 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-950/20"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Ask VEdge Agent to Analyze Alerts</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className={`py-1.5 px-3 border rounded-xl flex items-center gap-1.5 transition-all text-[10px] font-bold ${
                  showPreferences 
                    ? 'bg-slate-900 border-slate-800 text-slate-300' 
                    : 'bg-slate-900/50 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showPreferences ? 'Hide Filter' : 'Show Filter'}</span>
                {showPreferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Filter Choice Checklist - Collapsible Section */}
            {showPreferences && (
              <div className="p-2.5 bg-slate-900/40 border border-slate-900 rounded-xl my-1.5 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">CHECK PREFERRED ALERTS TO RECEIVE:</span>
                  <span className="text-[8px] text-[#38bdf8] uppercase font-bold animate-pulse">LIVE ALIGNMENT</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10.5px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={notifyHomeruns}
                      onChange={(e) => setNotifyHomeruns(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-sky-500"
                    />
                    <span className={notifyHomeruns ? 'text-slate-200 font-bold' : 'text-slate-500'}>⚾ Homeruns (HR)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={notifyRuns}
                      onChange={(e) => setNotifyRuns(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-sky-500"
                    />
                    <span className={notifyRuns ? 'text-slate-200 font-bold' : 'text-slate-500'}>🏃 Runs Scored</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={notifyHits}
                      onChange={(e) => setNotifyHits(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-sky-500"
                    />
                    <span className={notifyHits ? 'text-slate-200 font-bold' : 'text-slate-500'}>⚾ Base Hits</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={notifyParlays}
                      onChange={(e) => setNotifyParlays(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-sky-500"
                    />
                    <span className={notifyParlays ? 'text-indigo-400 font-bold' : 'text-slate-500'}>🏆 Parlay Success</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tabs for Navigation */}
            <div className="flex bg-[#121824] p-1 rounded-xl border border-slate-900 text-xs my-1">
              <button
                type="button"
                onClick={() => setActiveTab('universal')}
                className={`flex-1 py-1.5 font-mono font-bold rounded-lg text-center transition-all ${
                  activeTab === 'universal' 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚾ Universal Live ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('parlays')}
                className={`flex-1 py-1.5 font-mono font-bold rounded-lg text-center transition-all ${
                  activeTab === 'parlays' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏆 My Parlays Tracker ({savedSlips.length})
              </button>
            </div>

            {/* TAB CONTAINER PAGE 1: UNIVERSAL REALTIME LOGS */}
            {activeTab === 'universal' && (
              <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-2 max-h-[220px] scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 flex flex-col items-center justify-center gap-1.5">
                    <Tv className="w-7 h-7 text-slate-700" />
                    <span className="text-xs uppercase font-mono tracking-wider font-bold">No active notifications</span>
                    <span className="text-[10px] text-slate-600">Simulate MLB hits below to populate!</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                        notif.type === 'HYPE'
                          ? 'bg-indigo-950/20 border-amber-500/30 text-amber-250'
                          : 'bg-slate-950 border-slate-900/90 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold tracking-widest font-mono uppercase ${
                          notif.type === 'HYPE' ? 'text-amber-400' : 'text-sky-400'
                        }`}>
                          {notif.title}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">{notif.timestamp}</span>
                      </div>
                      
                      <p className="text-[11px] leading-snug">{notif.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTAINER PAGE 2: MY PARLAYS STATUS */}
            {activeTab === 'parlays' && (
              <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-2 max-h-[220px] scrollbar-thin">
                {savedSlips.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 flex flex-col items-center justify-center gap-1.5">
                    <Trophy className="w-7 h-7 text-slate-700" />
                    <span className="text-xs uppercase font-mono tracking-wider font-bold">No parlays monitored</span>
                    <span className="text-[10px] text-slate-600">Build a sliplist parlay in Parlay Lab!</span>
                  </div>
                ) : (
                  savedSlips.map((slip) => (
                    <div 
                      key={slip.id} 
                      className="p-2.5 rounded-xl border border-slate-900 bg-slate-950/80 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-slate-100 truncate max-w-[150px]">{slip.title}</span>
                        <span className="px-1.5 py-0.5 bg-slate-900 rounded font-mono text-[9px] text-[#34d399] font-bold">{slip.totalOdds}</span>
                      </div>

                      <div className="space-y-1">
                        {slip.legs.map((leg) => (
                          <div key={leg.id} className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-450 truncate max-w-[210px]">• {leg.selection}</span>
                            <span className="text-sky-400 font-bold uppercase">{leg.status}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-900/60 pt-1.5 mt-0.5 text-[9px] text-slate-500 font-mono">
                        <span>Risk: {slip.riskTier}</span>
                        <span className={`font-bold ${slip.status === 'WON' ? 'text-emerald-400' : 'text-amber-550'}`}>{slip.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Control Simulators row */}
            <div className="border-t border-slate-900/80 pt-3 mt-1 space-y-2">
              <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                ⚾ Interactive Realtime MLB Prop Simulators:
              </span>
              
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={simulateHomerun}
                  disabled={!notifyHomeruns}
                  className="py-1 px-2.5 bg-rose-500/10 border border-rose-550/30 hover:bg-rose-500/20 hover:border-rose-500/65 font-bold font-mono text-[9.5px] text-rose-350 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Simulate HR ⚾
                </button>

                <button
                  type="button"
                  onClick={simulateRunScored}
                  disabled={!notifyRuns}
                  className="py-1 px-2.5 bg-amber-500/10 border border-amber-550/30 hover:bg-amber-500/20 hover:border-amber-500/65 font-bold font-mono text-[9.5px] text-amber-350 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Simulate Run 🏃
                </button>

                <button
                  type="button"
                  onClick={simulateHitLine}
                  disabled={!notifyHits}
                  className="py-1 px-2.5 bg-emerald-500/10 border border-emerald-555/30 hover:bg-emerald-500/20 hover:border-emerald-500/65 font-bold font-mono text-[9.5px] text-emerald-350 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Simulate Hit ⚡
                </button>

                <button
                  type="button"
                  onClick={simulateParlayWin}
                  disabled={!notifyParlays}
                  className="py-1 px-2.5 bg-indigo-500/10 border border-indigo-550/35 hover:bg-indigo-500/20 hover:border-indigo-550/70 font-bold font-mono text-[9.5px] text-indigo-305 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Simulate Win 🏆
                </button>
              </div>

              {/* Utility Clear buttons */}
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1.5 border-t border-slate-900/30">
                <button 
                  onClick={markAllRead} 
                  className="hover:text-slate-300"
                >
                  Mark All Read
                </button>
                <button 
                  onClick={clearAllNotifications} 
                  className="hover:text-rose-450 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Logs
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* =======================================================
          CUSTOM CSS KEYFRAMES INJECTED IN COMPONENT FOR PRECISION
         ======================================================= */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shrinkBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes parlayHypeGold {
          0% {
            border-color: #f59e0b;
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.4), 0 0 25px rgba(245, 158, 11, 0.1);
          }
          50% {
            border-color: #ec4899;
            box-shadow: 0 0 25px rgba(236, 72, 153, 0.7), 0 0 45px rgba(236, 72, 153, 0.3);
          }
          100% {
            border-color: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.4), 0 0 25px rgba(16, 185, 129, 0.1);
          }
        }
      `}</style>
    </>
  );
}
