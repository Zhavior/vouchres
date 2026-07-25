import type { IntelligenceAnalysis } from "../types";

interface Props {
  analysis: IntelligenceAnalysis;
}

export default function HeroScore({ analysis }: Props) {
  const value = Math.max(0, Math.min(100, Number(analysis.score) || 0));

  const size = 164;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[164px] w-[164px]">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="progressbar"
          aria-label="HR Score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.08)"
            strokeWidth={stroke}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            className="transition-all duration-700"
          />

          <defs>
            <linearGradient id="scoreGradient">
              <stop offset="0%" stopColor="#06b6d4"/>
              <stop offset="100%" stopColor="#f59e0b"/>
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-black text-white">
            {value}
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.35em] text-zinc-400">
            HR Score
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-amber-300">
          ★★★★★ ELITE
        </div>

        <div className="text-sm text-zinc-400">
          Top 2% Today
        </div>
      </div>
    </div>
  );
}
