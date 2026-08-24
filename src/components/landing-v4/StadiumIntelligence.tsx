import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Thermometer, Droplets, Navigation, Globe, Zap } from 'lucide-react';
import { STADIUMS, StadiumTelemetry } from '../../lib/stadium-data';
import { useLandingTelemetry } from '../../hooks/public/useLandingTelemetry';

export default function StadiumIntelligence() {
  const [activeStadium, setActiveStadium] = useState<StadiumTelemetry>(STADIUMS[0]);
  const { weatherByVenue, isLoading } = useLandingTelemetry();

  /*
   * Conditions are looked up by the venue's official StatsAPI name. When the
   * forecast feed has nothing for first pitch it says so rather than estimating
   * — the same contract the endpoint itself states — so these read as dashes
   * instead of the literals that used to sit here.
   */
  const conditions = weatherByVenue.find((w) => w.venue === activeStadium.venueName) ?? null;
  const windLabel =
    conditions?.windMph != null
      ? `${Math.round(conditions.windMph)} MPH${conditions.windCompass ? ` ${conditions.windCompass}` : ''}`
      : null;
  const tempLabel = conditions?.tempF != null ? `${Math.round(conditions.tempF)}\u00B0F` : null;
  const precipLabel = conditions?.precipChancePct != null ? `${Math.round(conditions.precipChancePct)}%` : null;
  const liveCell = (value: string | null) =>
    value ?? <span className="text-white/25">{isLoading ? '\u2026' : '\u2014'}</span>;


  return (
    <section id="intelligence" className="scroll-mt-20 py-40 px-6 bg-obsidian-950 relative overflow-hidden">
      {/* Background Grid Decor */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Editorial Context */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="terminal-text text-ve-cyan mb-4 block">02 / GEOSPATIAL_INTELLIGENCE</span>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tighter italic text-white leading-tight mb-6">
                Baseball doesn’t <br />
                <span className="text-white/20">happen in a vacuum.</span>
              </h2>
              <p className="text-lg text-white/55 font-light leading-relaxed mb-10">
                Every matchup exists inside a physical environment. VouchEdge ingest live weather vectors and stadium geometry to calculate the "True Carry" of every projected contact.
              </p>
            </motion.div>

            <div className="flex flex-col gap-2">
              {STADIUMS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStadium(s)}
                  className={`flex items-center justify-between p-4 border transition-all ${
                    activeStadium.id === s.id 
                    ? 'bg-ve-cyan/10 border-ve-cyan text-ve-cyan' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest">{s.name}</span>
                  <Navigation size={12} className={activeStadium.id === s.id ? 'rotate-45' : 'opacity-0'} />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Intelligence HUD */}
          <div className="lg:col-span-7">
            <div className="glass-panel border-white/10 p-1 relative overflow-hidden">
              {/* Scanning Line Animation */}
              <motion.div 
                animate={{ y: [0, 400, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-[1px] bg-ve-cyan/20 z-20 pointer-events-none"
              />

              <div className="bg-obsidian-900 p-8 md:p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={14} className="text-ve-cyan animate-pulse" />
                      <span className="terminal-text text-ve-cyan">Active_Node: {activeStadium.city}</span>
                    </div>
                    <h3 className="text-3xl font-bold italic text-white tracking-tighter">{activeStadium.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="terminal-text block mb-1">Park_HR_Factor</span>
                    <span className="text-2xl font-mono text-white">{activeStadium.parkFactor}</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStadium.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-8"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 terminal-text">
                        <Wind size={12} /> Wind_Vector
                      </div>
                      <p className="text-sm font-mono text-white">{liveCell(windLabel)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 terminal-text">
                        <Thermometer size={12} /> Air_Temp
                      </div>
                      <p className="text-sm font-mono text-white">{liveCell(tempLabel)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 terminal-text">
                        <Droplets size={12} /> Precip_Chance
                      </div>
                      <p className="text-sm font-mono text-white">{liveCell(precipLabel)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 terminal-text">
                        <Navigation size={12} /> Orientation
                      </div>
                      <p className="text-sm font-mono text-white">{activeStadium.orientation}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 terminal-text">
                        <Zap size={12} /> Elevation
                      </div>
                      <p className="text-sm font-mono text-white">{activeStadium.elevation}</p>
                    </div>
                    <div className="p-4 bg-ve-cyan/5 border border-ve-cyan/20 rounded flex flex-col justify-center">
                      <span className="text-[8px] font-bold text-ve-cyan uppercase mb-1">Forecast_Feed</span>
                      <span className="text-xs font-mono text-white">
                        {conditions?.available ? 'LIVE' : isLoading ? 'SYNCING' : 'NO FORECAST'}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">
                    {/* Claimed NOAA; the forecast feed is open-meteo, and
                        "STATCAST_GEO_v2" was not a real system. */}
                    Source: OPEN-METEO // PARK_FACTOR_TABLE
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-1 bg-ve-cyan/40 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
