'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Compass, Wind, Thermometer, Radio, Navigation, Eye, Maximize2 } from 'lucide-react';
import { STADIUM_RADAR_DATA } from '@/data/mockData';
import { StadiumGeoMetric } from '@/types/intelligence';

export const StadiumGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedStadium, setSelectedStadium] = useState<StadiumGeoMetric>(STADIUM_RADAR_DATA[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(0.8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = rotationAngle;

    const render = () => {
      if (autoRotate) {
        angle += 0.003;
        setRotationAngle(angle);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * 0.42;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw Globe Outer Ring & Atmospheric Aura
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#07090e';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Draw Latitude & Longitude Orthographic Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Longitude meridians
      for (let i = -180; i <= 180; i += 30) {
        const rad = ((i * Math.PI) / 180) + angle;
        const xOffset = Math.sin(rad) * radius;
        if (Math.cos(rad) > -0.2) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Latitude parallels
      for (let lat = -60; lat <= 60; lat += 30) {
        const yOffset = (lat / 90) * radius * 0.85;
        const latRadius = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
        ctx.beginPath();
        ctx.ellipse(cx, cy - yOffset, latRadius, latRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Draw Radar Sweep Pulse
      const sweepAngle = (Date.now() / 1200) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepAngle, sweepAngle + 0.35);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // 4. Plot MLB Stadiums as Emerald Radar Nodes
      STADIUM_RADAR_DATA.forEach((stadium) => {
        const radLng = ((stadium.lng * Math.PI) / 180) + angle;
        const radLat = (stadium.lat * Math.PI) / 180;

        // Check if node is on the front side of the globe
        const isVisible = Math.cos(radLng) > 0;
        if (isVisible) {
          const px = cx + radius * Math.cos(radLat) * Math.sin(radLng);
          const py = cy - radius * Math.sin(radLat);

          const isSelected = selectedStadium.id === stadium.id;

          // Pulse ring for selected stadium
          if (isSelected) {
            const pulse = (Date.now() / 300) % 12;
            ctx.beginPath();
            ctx.arc(px, py, 6 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Stadium Dot
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#10b981' : '#06b6d4';
          ctx.fill();

          // Label
          ctx.font = '9px "Geist Mono", monospace';
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
          ctx.fillText(stadium.name.split(' ')[0], px + 8, py - 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [autoRotate, rotationAngle, selectedStadium]);

  return (
    <section id="radar" className="relative border-b border-white/[0.08] bg-[#06070a] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
              GEOSPATIAL TELEMETRY // 3D ATMOSPHERICS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Active Stadium Radar Grid
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`border px-3 py-1 text-[11px] uppercase transition-colors ${
                autoRotate 
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                  : 'border-white/[0.1] bg-[#0a0c10] text-slate-400'
              }`}
            >
              ORBIT_ROTATION: {autoRotate ? 'ACTIVE' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* Interactive Radar Stage */}
        <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          
          {/* Globe Canvas Viewport */}
          <div className="relative border border-white/[0.12] bg-[#08090d] p-4 lg:col-span-7 flex flex-col items-center justify-center min-h-[460px] overflow-hidden">
            {/* Viewport UI Accents */}
            <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-[10px] text-slate-400">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>RADAR_PROJECTION // WGS-84 ORTHOGRAPHIC</span>
            </div>
            <div className="absolute top-3 right-3 font-mono text-[10px] text-emerald-400">
              [LIVE_DOPPLER_STREAM]
            </div>

            <canvas
              ref={canvasRef}
              width={560}
              height={440}
              className="max-w-full cursor-grab active:cursor-grabbing"
              onClick={() => {
                // Cycle through stadiums on canvas click
                const nextIdx = (STADIUM_RADAR_DATA.findIndex(s => s.id === selectedStadium.id) + 1) % STADIUM_RADAR_DATA.length;
                setSelectedStadium(STADIUM_RADAR_DATA[nextIdx]);
              }}
            />

            {/* Coordinate readout */}
            <div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-400">
              LAT: {selectedStadium.lat.toFixed(4)}°N // LNG: {Math.abs(selectedStadium.lng).toFixed(4)}°W
            </div>
            <div className="absolute bottom-3 right-3 font-mono text-[10px] text-slate-400">
              ELEV: {selectedStadium.elevationFeet} FT
            </div>
          </div>

          {/* Stadium Atmospheric Telemetry Card */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Stadium Selector Pills */}
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {STADIUM_RADAR_DATA.map((stadium) => {
                const isSelected = stadium.id === selectedStadium.id;
                return (
                  <button
                    key={stadium.id}
                    onClick={() => setSelectedStadium(stadium)}
                    className={`border px-2 py-1.5 text-left truncate transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                        : 'border-white/[0.06] bg-[#090b0e] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {stadium.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Selected Stadium Deep Telemetry */}
            <div className="border border-white/[0.12] bg-[#090b0f] p-5">
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase text-cyan-400">{selectedStadium.city}</span>
                  <h3 className="text-xl font-black text-white font-sans">{selectedStadium.name}</h3>
                  <div className="font-mono text-xs text-slate-400">{selectedStadium.team} // {selectedStadium.roofStatus}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-slate-400">HR MULTIPLIER</div>
                  <div className="text-xl font-bold text-emerald-400">{selectedStadium.hrMultiplier}x</div>
                </div>
              </div>

              {/* Atmospheric Metrics List */}
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="border border-white/[0.06] bg-[#06070a] p-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Thermometer className="h-3 w-3 text-amber-400" />
                    <span>SURFACE TEMP</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">{selectedStadium.tempF}°F</div>
                  <div className="text-[9px] text-slate-400">Warm Air Lift: Active</div>
                </div>

                <div className="border border-white/[0.06] bg-[#06070a] p-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Wind className="h-3 w-3 text-cyan-400" />
                    <span>WIND VECTOR</span>
                  </div>
                  <div className="mt-1 text-lg font-bold text-cyan-400 tabular-nums">{selectedStadium.windMph} mph</div>
                  <div className="text-[9px] text-slate-300 truncate">{selectedStadium.windDirection}</div>
                </div>

                <div className="border border-white/[0.06] bg-[#06070a] p-3">
                  <div className="text-[10px] text-slate-400">AIR DENSITY INDEX</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">{selectedStadium.airDensityIndex} <span className="text-xs font-normal text-slate-400">kg/m³</span></div>
                  <div className="text-[9px] text-emerald-400">Baseline Standard: 1.225</div>
                </div>

                <div className="border border-white/[0.06] bg-[#06070a] p-3">
                  <div className="text-[10px] text-slate-400">ALTITUDE GRADIENT</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">+{selectedStadium.elevationFeet} <span className="text-xs font-normal text-slate-400">ft</span></div>
                  <div className="text-[9px] text-slate-400">Drag Reduction Computed</div>
                </div>
              </div>

              {/* Ballistic Impact Note */}
              <div className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-slate-300">
                <span className="text-cyan-400 font-bold">[BALLISTIC_MODIFIER]</span> At {selectedStadium.tempF}°F and {selectedStadium.airDensityIndex} kg/m³, a 102 mph exit velocity at 28° carries <span className="text-emerald-400 font-bold">+{Math.round((selectedStadium.hrMultiplier - 1) * 120)} ft</span> beyond standard sea-level trajectory.
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
