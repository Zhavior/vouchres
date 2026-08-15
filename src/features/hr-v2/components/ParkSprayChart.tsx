import React from 'react';

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
  stadiumName = 'Yankee Stadium',
  windSpeedMph = 12,
  windDirection = 'OUT → CF',
  vectors = [
    { distance: 412, angle: -15, result: 'HR', exitVelocity: 112.4 },
    { distance: 395, angle: 10, result: 'HR', exitVelocity: 108.2 },
    { distance: 424, angle: 0, result: 'HR', exitVelocity: 114.6 },
    { distance: 360, angle: -35, result: '2B', exitVelocity: 101.5 }
  ]
}: ParkSprayChartProps) {
  // SVG coordinate transformation: Home plate at (150, 260)
  const homeX = 150;
  const homeY = 260;

  // Convert distance (ft) and angle (deg) to SVG coordinates
  const getCoordinates = (distance: number, angleDeg: number) => {
    const scale = 200 / 430; // 430 ft max
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const r = distance * scale;
    const x = homeX + r * Math.cos(rad);
    const y = homeY + r * Math.sin(rad);
    return { x, y };
  };

  return (
    <div className="relative w-full rounded-2xl bg-black/50 border border-white/10 p-4 flex flex-col items-center">
      {/* Stadium Header & Wind Badge */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-vouch-cyan">
          {stadiumName} Dimension Grid
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-vouch-emerald text-[10px] font-mono font-bold">
          <span>🌬️</span> {windSpeedMph} mph {windDirection}
        </span>
      </div>

      {/* SVG Field Canvas */}
      <div className="relative w-full max-w-[320px] aspect-[4/3]">
        <svg viewBox="0 0 300 280" className="w-full h-full">
          {/* Outfield Grass Sector */}
          <path
            d="M 150 260 L 50 140 A 150 150 0 0 1 250 140 Z"
            fill="rgba(16, 185, 129, 0.06)"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />

          {/* Outfield Fence Distance Markers */}
          <path
            d="M 50 140 Q 150 70 250 140"
            fill="none"
            stroke="rgba(6, 182, 212, 0.4)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Infield Diamond */}
          <polygon
            points="150,260 120,230 150,200 180,230"
            fill="rgba(245, 158, 11, 0.1)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />

          {/* Foul Lines */}
          <line x1="150" y1="260" x2="30" y2="120" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <line x1="150" y1="260" x2="270" y2="120" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />

          {/* Distance Text Labels */}
          <text x="35" y="115" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace">318 LF</text>
          <text x="140" y="65" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace" fontWeight="bold">408 CF</text>
          <text x="245" y="115" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace">314 RF</text>

          {/* Trajectory Vectors */}
          {vectors.map((vec, i) => {
            const { x, y } = getCoordinates(vec.distance, vec.angle);
            const isHr = vec.result === 'HR';
            return (
              <g key={i} className="group">
                {/* Arc Line */}
                <path
                  d={`M 150 260 Q ${150 + (x - 150) * 0.4} ${260 + (y - 260) * 0.7 - 20} ${x} ${y}`}
                  fill="none"
                  stroke={isHr ? '#10b981' : '#f59e0b'}
                  strokeWidth="1.5"
                  strokeDasharray={isHr ? 'none' : '2 2'}
                  opacity="0.8"
                />
                {/* Landing Point Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={isHr ? '#10b981' : '#f59e0b'}
                  className="transition-transform duration-200 group-hover:scale-150 cursor-pointer"
                  style={{ filter: isHr ? 'drop-shadow(0 0 4px #10b981)' : 'none' }}
                />
                {/* Hover Tooltip Label */}
                <text
                  x={x}
                  y={y - 6}
                  fill="#ffffff"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {vec.distance}ft
                </text>
              </g>
            );
          })}

          {/* Home Plate Icon */}
          <polygon points="148,260 152,260 153,264 150,267 147,264" fill="#ffffff" />
        </svg>
      </div>

      <div className="w-full flex items-center justify-between text-[9px] font-mono text-white/50 border-t border-white/5 pt-2 mt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-vouch-emerald inline-block" /> Home Run (Cleared Wall)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-vouch-amber inline-block" /> Extra Base Hit</span>
      </div>
    </div>
  );
}
