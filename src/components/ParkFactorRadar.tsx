'use client';

import React from 'react';
import { Wind, Thermometer, Layers, AlertCircle, Compass } from 'lucide-react';
import { STADIUM_RADAR_DATA } from '@/data/mockData';

export const ParkFactorRadar: React.FC = () => {
  return (
    <section className="relative border-b border-white/[0.08] bg-[#06070a] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Title */}
        <div className="border-b border-white/[0.08] pb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            ATMOSPHERIC PHYSICS // ENVIRONMENTAL MODIFIERS
          </span>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white font-sans sm:text-3xl">
            Thermodynamic Park Factor Matrix
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-400">
            Air density ($kg/m^3$) and wind vectors dynamically alter exit velocity trajectory carry distance.
          </p>
        </div>

        {/* Environmental Telemetry Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
          {STADIUM_RADAR_DATA.map((venue) => (
            <div key={venue.id} className="border border-white/[0.08] bg-[#080a0e] p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-bold text-white truncate">{venue.name}</span>
                <span className="text-emerald-400 font-bold">{venue.hrMultiplier}x HR</span>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Elevation:</span>
                  <span>{venue.elevationFeet} FT</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Surface Temp:</span>
                  <span>{venue.tempF}°F</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Wind Velocity:</span>
                  <span className="text-cyan-400">{venue.windMph} mph ({venue.windDirection})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Air Density (ρ):</span>
                  <span className="text-emerald-400 font-bold">{venue.airDensityIndex} kg/m³</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
