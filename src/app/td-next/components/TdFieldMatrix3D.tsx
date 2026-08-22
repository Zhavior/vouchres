import React, { useMemo } from 'react';
import { Crosshair, Navigation } from 'lucide-react';
import type { TouchdownPlayer } from '../../../types/touchdown';

export function TdFieldMatrix3D({ player }: { player: TouchdownPlayer }) {
  const heatPoints = useMemo(() => {
    if (player.nextGenTelemetry && player.nextGenTelemetry.length > 0) {
      return player.nextGenTelemetry.map(pt => ({
        xOffset: pt.x,
        distance: pt.y,
        isSuccess: pt.isSuccess,
        playDescription: pt.playDescription
      }));
    }

    const points = [];
    const baseVolume = player.inside10Touches || 5;
    const isPasser = player.position === 'QB';
    
    // Generate pseudo-random dots weighted by player tendencies
    for (let i = 0; i < baseVolume; i++) {
      // 0 to 1
      const depthRaw = Math.sin(player.tdpiScore * i * 17.3) * 0.5 + 0.5; 
      // -1 to 1
      const widthRaw = Math.cos(player.tdpiScore * i * 11.2); 
      
      let distance; // 0 is goal line, 20 is 20-yard line, -10 is back of endzone
      const isSuccess = Math.sin(i * 3.1) > 0.2; // ~60% success rate visually
      
      if (isPasser) {
        // QBs throw to the endzone
        distance = -8 + (depthRaw * 15); 
      } else {
        // RBs/WRs usually get tackled before or cross the plane
        distance = -2 + (depthRaw * 15);
      }
      
      points.push({
        xOffset: widthRaw * 22, // -22 to 22 yards wide
        distance, // yard line
        isSuccess
      });
    }
    return points;
  }, [player]);

  // Coordinate transformation for 3D Isometric projection
  // Field is ~53.3 yards wide, we're looking at last 30 yards (-10 to 20)
  const getCoordinates = (xYards: number, yYards: number) => {
    // Center is x=150
    // yYards: 20 is bottom (y=240), -10 is top (y=60)
    // Map yYards (20 to -10) -> (240 to 60)
    // 30 yards total = 180 pixels -> 6 pixels per yard
    
    const perspectiveScale = 1 - ((20 - yYards) * 0.015); // Objects further away get narrower
    
    const y = 240 - ((20 - yYards) * 6);
    const x = 150 + (xYards * 4 * perspectiveScale);
    
    return { x, y, scale: perspectiveScale };
  };

  return (
    <div className="relative w-full rounded-xl bg-black border border-white/10 p-4 flex flex-col items-center shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
      {/* 3D Header Badge */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
            3D RED ZONE MATRIX
          </span>
        </div>
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-white/10 bg-zinc-950 text-zinc-400 text-[9px] font-mono font-bold">
          <Navigation className="w-3 h-3 text-cyan-400" />
          {player.position} TENDENCY
        </span>
      </div>

      {/* 3D Isometric Field Canvas */}
      <div className="relative w-full max-w-[340px] aspect-[4/3] bg-zinc-950 rounded border border-white/5 overflow-hidden">
        <svg viewBox="0 0 300 270" className="w-full h-full">
          <defs>
            <linearGradient id="fieldGrass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="endzone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 3D Perspective Field Base (20 yard line to back of endzone) */}
          <polygon
            points="70,60 230,60 280,240 20,240"
            fill="url(#fieldGrass)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Endzone (-10 to 0) */}
          <polygon
            points="70,60 230,60 214,120 86,120"
            fill="url(#endzone)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />

          {/* Goal Line (0 yard line) */}
          <line x1="86" y1="120" x2="214" y2="120" stroke="#ffffff" strokeWidth="2" strokeDasharray="none" />
          
          {/* 10 yard line */}
          <line x1="53" y1="180" x2="247" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          
          {/* 20 yard line (bottom edge) */}
          <line x1="20" y1="240" x2="280" y2="240" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

          {/* Hash marks & yard numbers mapping (approximate perspective) */}
          <text x="45" y="185" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold" transform="skewX(-15)">10</text>
          <text x="245" y="185" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold" transform="skewX(15)">10</text>
          
          <text x="150" y="95" fill="rgba(255,255,255,0.15)" fontSize="20" fontFamily="var(--font-sans)" fontWeight="900" textAnchor="middle" letterSpacing="10" transform="scale(1, 0.5)">
            {player.team}
          </text>

          {/* Telemetry Heat Points */}
          {heatPoints.map((pt, i) => {
            const { x, y, scale } = getCoordinates(pt.xOffset, pt.distance);
            return (
              <g key={i} className="group transition-transform duration-300">
                <title>{pt.playDescription || (pt.isSuccess ? 'Touchdown Scored' : 'Tackled / Incomplete')}</title>
                {/* Ping shadow */}
                <ellipse
                  cx={x}
                  cy={y + 2}
                  rx={6 * scale}
                  ry={3 * scale}
                  fill="rgba(0,0,0,0.5)"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={3.5 * scale}
                  fill={pt.isSuccess ? '#00d9a0' : '#f43f5e'}
                  className="cursor-crosshair"
                  style={{ filter: pt.isSuccess ? 'drop-shadow(0 0 6px rgba(0,217,160,0.8))' : 'none' }}
                />
                {/* Extruded height line to show "action" */}
                <line x1={x} y1={y} x2={x} y2={y - (15 * scale)} stroke={pt.isSuccess ? '#00d9a0' : '#f43f5e'} strokeWidth={1 * scale} strokeDasharray="1 1" opacity="0.6" />
                <circle cx={x} cy={y - (15 * scale)} r={1.5 * scale} fill={pt.isSuccess ? '#00d9a0' : '#f43f5e'} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-white/50 border-t border-white/10 pt-2.5 mt-3">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#00d9a0]" /> Touchdown</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Tackled / Inc</span>
      </div>
    </div>
  );
}
