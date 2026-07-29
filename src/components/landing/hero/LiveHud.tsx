import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Zap, BarChart3, Wind, Thermometer, Flame } from 'lucide-react';

type TabType = 'edge' | 'metrics' | 'evidence';

export default function LiveHud() {
  const [activeTab, setActiveTab] = useState<TabType>('edge');

  const metrics = [
    { label: "Pitching Matchup", value: 92, status: "Dominant vs LHB", color: "from-cyan-400 to-sky-300" },
    { label: "Bullpen Availability", value: 87, status: "Rest Advantage (+2d)", color: "from-emerald-400 to-teal-300" },
    { label: "Environmental Factor", value: 78, status: "Wind Out to RF 12mph", color: "from-amber-400 to-orange-300" },
    { label: "Rest & Travel Index", value: 94, status: "Home Stand Game 1", color: "from-blue-400 to-indigo-300" },
  ];

  const evidenceLog = [
    { text: "Starting pitcher 11.2 K/9 over last 4 outings at home", category: "Pitching", verified: true },
    { text: "Opponent bullpen used 5 arm innings in 14-inning game yesterday", category: "Bullpen", verified: true },
    { text: "Air density -3.2% boosts fly-ball distance by 11.4 feet", category: "Weather", verified: true },
    { text: "VouchEdge ML Engine confirms +4.8% edge vs opening line", category: "Market", verified: true },
  ];

  return (
    <div className="relative rounded-[28px] border border-cyan-500/20 bg-[#060c16]/90 p-6 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.12)] backdrop-blur-2xl">
      {/* Top Console Navigation & Live Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">
                Live Intelligence Console
              </span>
              <span className="flex h-2 w-2 items-center justify-center">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
            </div>
            <h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-white sm:text-xl">
              Yankees <span className="text-white/40">vs</span> Blue Jays
            </h3>
          </div>
        </div>

        {/* Tab Selection Switches */}
        <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('edge')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'edge'
                ? 'bg-cyan-400 text-[#031017] shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Edge Radar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'metrics'
                ? 'bg-cyan-400 text-[#031017] shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'evidence'
                ? 'bg-cyan-400 text-[#031017] shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Evidence Log
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="mt-6 min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeTab === 'edge' && (
            <motion.div
              key="edge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Primary Gauge */}
              <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-950/40 via-sky-950/20 to-emerald-950/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Overall Model Confidence
                    </span>
                    <p className="mt-1 text-xs text-white/65">
                      Synthesized from 1,480+ datapoints & live tracking
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-5xl font-black tracking-tight text-cyan-300 drop-shadow-[0_0_24px_rgba(34,211,238,0.5)]">
                      84%
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10 p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                    initial={{ width: 0 }}
                    animate={{ width: "84%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Quick Signal Badges */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <Flame className="mx-auto h-4 w-4 text-amber-400" />
                  <p className="mt-1.5 text-[10px] uppercase font-bold text-white/50">Bullpen</p>
                  <p className="text-sm font-extrabold text-white">+8.4 Edge</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <Wind className="mx-auto h-4 w-4 text-cyan-400" />
                  <p className="mt-1.5 text-[10px] uppercase font-bold text-white/50">Wind</p>
                  <p className="text-sm font-extrabold text-white">Out to RF</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <Thermometer className="mx-auto h-4 w-4 text-emerald-400" />
                  <p className="mt-1.5 text-[10px] uppercase font-bold text-white/50">Temp</p>
                  <p className="text-sm font-extrabold text-white">74°F Clear</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <Zap className="mx-auto h-4 w-4 text-sky-400" />
                  <p className="mt-1.5 text-[10px] uppercase font-bold text-white/50">Signal</p>
                  <p className="text-sm font-extrabold text-emerald-300">Strong</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {metrics.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-white/80">{item.label}</span>
                    <span className="font-mono font-bold text-cyan-300">{item.status} ({item.value}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'evidence' && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {evidenceLog.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.02] p-3 transition hover:border-cyan-400/20"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white/90 leading-relaxed">
                      {item.text}
                    </p>
                    <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider text-cyan-400/70">
                      {item.category} • Verified
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="mt-5 flex flex-wrap items-center justify-between border-t border-white/[0.08] pt-4 text-[11px] font-medium text-white/45">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Transparent MLB Official Feed
        </span>
        <span className="font-mono text-cyan-300/80">Refreshed 2 sec ago</span>
      </div>
    </div>
  );
}

