import React from 'react';
import { Wind } from 'lucide-react';

interface ParkSprayChartProps {
  stadiumName?: string;
  windSpeedMph?: number;
  windDirection?: string;
  vectors?: Array<{
    distance: number;
    angle: number; // in degrees, 0 is center field, -45 is left, +45 is right
    result: string;
    exitVelocity: number;
  }>;
}

export function ParkSprayChart({
  stadiumName,
  windSpeedMph,
  windDirection,
  vectors = [],
}: ParkSprayChartProps) {
  // 3D Isometric / Perspective coordinate transformation: Home plate at (150, 245)
  const homeX = 150;
  const homeY = 245;

  // Convert distance (ft) and angle (deg) to 3D projected coordinates
  const getCoordinates = (distance: number, angleDeg: number) => {
    const scale = 175 / 430; // 430 ft max scale
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const r = distance * scale;
    // Apply 3D perspective foreshortening along Y axis (0.65 compression)
    const x = homeX + r * Math.cos(rad);
    const y = homeY + r * Math.sin(rad) * 0.72;
    return { x, y };
  };

  return (
    <div className="relative w-full rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 p-4 flex flex-col items-center shadow-xl">
      {/* Stadium Header & 3D Environment Badge */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300">
            {stadiumName ?? 'Venue UNKNOWN'} 3D Dimension Grid
          </span>
        </div>
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
          <Wind className="w-3 h-3 text-emerald-400 shrink-0" />{' '}
          {windSpeedMph != null && Number.isFinite(windSpeedMph)
            ? `${windSpeedMph} mph ${windDirection ?? ''}`.trim()
            : 'Wind UNKNOWN'}
        </span>
      </div>

      {/* 3D Isometric Field Canvas */}
      <div className="relative w-full max-w-[340px] aspect-[4/3]">
        <svg viewBox="0 0 300 270" className="w-full h-full">
          <defs>
            <radialGradient id="fieldGrass3D" cx="50%" cy="85%" r="75%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#047857" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.03" />
            </radialGradient>
            <linearGradient id="wall3DGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00d9a0" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 3D Stadium Outer Bowl Shadow */}
          <ellipse cx="150" cy="150" rx="140" ry="95" fill="rgba(0,0,0,0.5)" />

          {/* Outfield Grass 3D Sector */}
          <path
            d="M 150 245 L 45 135 A 145 105 0 0 1 255 135 Z"
            fill="url(#fieldGrass3D)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.5"
          />

          {/* 3D Outfield Wall Heights & Distance Line */}
          <path
            d="M 45 135 Q 150 72 255 135"
            fill="none"
            stroke="url(#wall3DGrad)"
            strokeWidth="3"
          />
          {/* Wall Depth Extrusion */}
          <path
            d="M 45 135 L 45 142 Q 150 79 255 142 L 255 135"
            fill="none"
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="1.5"
          />

          {/* Concentric Distance Arc Rings (300ft, 375ft, 420ft) */}
          <path
            d="M 75 168 Q 150 115 225 168"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <path
            d="M 58 150 Q 150 90 242 150"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          {/* 3D Infield Dirt Diamond */}
          <polygon
            points="150,245 118,218 150,192 182,218"
            fill="rgba(180, 83, 9, 0.22)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
          />

          {/* Pitcher's Mound */}
          <circle cx="150" cy="214" r="3.5" fill="rgba(245, 158, 11, 0.6)" stroke="#ffffff" strokeWidth="0.5" />

          {/* 3D Foul Lines with Flag Poles */}
          <line x1="150" y1="245" x2="35" y2="125" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
          <line x1="150" y1="245" x2="265" y2="125" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />

          {/* Foul Pole Verticals */}
          <line x1="35" y1="125" x2="35" y2="108" stroke="#fbbf24" strokeWidth="2" />
          <line x1="265" y1="125" x2="265" y2="108" stroke="#fbbf24" strokeWidth="2" />

          {/* Distance Text Labels */}
          <text x="32" y="102" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="bold">318' LF</text>
          <text x="135" y="65" fill="#00d9a0" fontSize="9" fontFamily="var(--font-mono)" fontWeight="bold">408' CF</text>
          <text x="245" y="102" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="bold">314' RF</text>

          {/* 3D Parabolic Trajectory Vectors */}
          {vectors.map((vec, i) => {
            const { x, y } = getCoordinates(vec.distance, vec.angle);
            const isHr = vec.result === 'HR';
            const apexY = 245 - (245 - y) * 0.7 - 26; // 3D parabolic elevation
            return (
              <g key={i} className="group">
                {/* 3D Parabolic Arc Flight Path */}
                <path
                  d={`M 150 245 Q ${150 + (x - 150) * 0.45} ${apexY} ${x} ${y}`}
                  fill="none"
                  stroke={isHr ? '#00d9a0' : '#f59e0b'}
                  strokeWidth={isHr ? '2' : '1.5'}
                  strokeDasharray={isHr ? 'none' : '3 2'}
                  opacity="0.9"
                  style={{ filter: isHr ? 'drop-shadow(0 0 4px rgba(0, 217, 160, 0.6))' : 'none' }}
                />
                {/* Landing Point Marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={isHr ? '#00d9a0' : '#f59e0b'}
                  className="transition-transform duration-200 group-hover:scale-150 cursor-pointer"
                  style={{ filter: isHr ? 'drop-shadow(0 0 6px #00d9a0)' : 'none' }}
                />
                {/* Hover Tooltip Label */}
                <text
                  x={x}
                  y={y - 8}
                  fill="#ffffff"
                  fontSize="7.5"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {vec.distance}ft
                </text>
              </g>
            );
          })}

          {/* Home Plate 3D Marker */}
          <polygon points="148,245 152,245 153,249 150,252 147,249" fill="#ffffff" />
        </svg>
      </div>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-white/50 border-t border-white/5 pt-2.5 mt-2">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-vouch-cyan inline-block shadow-[0_0_6px_#00d9a0]" /> Home Run (Cleared 3D Wall)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-vouch-amber inline-block" /> Extra Base Hit</span>
      </div>
    </div>
  );
}
