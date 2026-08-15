import React from 'react';

interface HrIndexMeterProps {
  score: number;
  label?: string;
}

export function HrIndexMeter({ score, label = 'HR INDEX' }: HrIndexMeterProps) {
  // Determine tier & color styling based on score
  let tierLabel = 'MODERATE';
  let strokeColor = '#64748b'; // Slate
  let glowColor = 'rgba(100, 116, 139, 0.3)';
  let textColor = 'text-slate-400';

  if (score >= 85) {
    tierLabel = 'VERY HIGH';
    strokeColor = '#10b981'; // Neon Emerald
    glowColor = 'rgba(16, 185, 129, 0.5)';
    textColor = 'text-vouch-emerald';
  } else if (score >= 70) {
    tierLabel = 'HIGH';
    strokeColor = '#f59e0b'; // Electric Amber
    glowColor = 'rgba(245, 158, 11, 0.5)';
    textColor = 'text-vouch-amber';
  }

  // Calculate SVG arc parameters for a 240-degree gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const maxAnglePct = 0.75; // 270 degrees
  const offset = circumference - (score / 100) * circumference * maxAnglePct;

  return (
    <div className="flex flex-col items-center justify-center relative p-2">
      <div className="relative w-24 h-24 grid place-items-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
          {/* Track Arc */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference * maxAnglePct}
            strokeLinecap="round"
          />
          {/* Dynamic Fill Arc */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke={strokeColor}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference * maxAnglePct}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tighter text-white tabular-nums">
            {score}
          </span>
          <span className={`text-[9px] font-bold tracking-widest uppercase ${textColor}`}>
            {tierLabel}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase text-white/50 mt-1">
        {label}
      </span>
    </div>
  );
}

interface TrendIndicatorProps {
  value: string;
  direction?: 'up' | 'down' | 'neutral';
}

export function TrendIndicator({ value, direction = 'up' }: TrendIndicatorProps) {
  const icon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '•';
  const color = direction === 'up' ? 'text-vouch-emerald' : direction === 'down' ? 'text-rose-400' : 'text-white/40';

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${color}`}>
      <span>{icon}</span>
      <span>{value}</span>
    </span>
  );
}
