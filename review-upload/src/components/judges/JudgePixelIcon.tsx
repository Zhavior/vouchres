import { JUDGE_PIXEL_THEME } from '../../constants/aiJudges';

interface JudgePixelIconProps {
  code: string;
  size?: 'sm' | 'md';
}

export default function JudgePixelIcon({ code, size = 'md' }: JudgePixelIconProps) {
  const t = JUDGE_PIXEL_THEME[code] ?? JUDGE_PIXEL_THEME.DS;
  const box = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 rounded-2xl';
  const label = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className={`relative shrink-0 overflow-hidden border border-white/10 bg-black/60 shadow-inner ${box}`}>
      <div className={`absolute inset-0 ${t.glow} blur-xl`} />
      <div className="absolute inset-1 grid grid-cols-4 grid-rows-4 gap-[2px]">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`rounded-[2px] ${
              t.active.includes(i)
                ? t.main
                : [0, 5, 10, 15].includes(i)
                  ? t.accent
                  : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`rounded-md bg-black/80 px-1.5 py-0.5 font-mono font-black text-white shadow ${label}`}>
          {code}
        </span>
      </div>
    </div>
  );
}
