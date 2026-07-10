import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from './LandingIcons';
import {
  Z8_INTERACTIVE,
  Z8_LABEL,
  Z8_PANEL,
  Z8_PANEL_PREMIUM,
} from '../../theme/z8Tokens';
import { JUDGE_COLOR_RING, LANDING_JUDGES } from '../../constants/aiJudges';
import JudgePixelIcon from '../judges/JudgePixelIcon';

const SLIDE_MS = 6500;

function JudgeSlide({ judge }: { judge: (typeof LANDING_JUDGES)[number] }) {
  const ring = JUDGE_COLOR_RING[judge.color] ?? JUDGE_COLOR_RING.cyan;

  return (
    <article className={`ve-landing-judge-slide min-w-full ${Z8_PANEL} p-6 sm:p-8`}>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <JudgePixelIcon code={judge.code} />
        <p className={`${Z8_LABEL} mt-5 text-vouch-cyan/80`}>{judge.specialty}</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{judge.displayName}</h3>
        <p className="mt-2 text-sm font-medium text-vouch-cyan/75">{judge.tagline}</p>
        <p className="mt-4 text-sm leading-relaxed text-white/55">{judge.useCase}</p>
        <blockquote className="mt-5 max-w-lg border-l-2 border-vouch-cyan/35 pl-4 text-left text-sm italic leading-relaxed text-white/70">
          &ldquo;{judge.quote}&rdquo;
        </blockquote>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-white/40">
            @{judge.handle}
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest ${ring}`}>
            Live when signed in
          </span>
        </div>
      </div>
    </article>
  );
}

export default function LandingJudgesDeck() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = LANDING_JUDGES.length;
  const judge = LANDING_JUDGES[index];

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  return (
    <section aria-labelledby="judges-heading" className="space-y-6">
      <div className="text-center">
        <p className={`${Z8_LABEL} text-vouch-cyan`}>AI Judge Council</p>
        <h2 id="judges-heading" className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Five judges. Five real-world edges.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Hover to explore each judge — click a profile to switch. Every AI maps to how serious researchers
          work the slate, from math-first screening to trap detection.
        </p>
      </div>

      <div
        className="ve-landing-judge-interactive space-y-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={`ve-landing-judge-slideshow relative overflow-hidden rounded-2xl ${Z8_PANEL_PREMIUM}`}
        >
        <div className="ve-landing-judge-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {LANDING_JUDGES.map((item) => (
            <JudgeSlide key={item.id} judge={item} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2.5">
          <button
            type="button"
            aria-label="Previous judge"
            onClick={() => setIndex((current) => (current - 1 + count) % count)}
            className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {LANDING_JUDGES.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.displayName}`}
                aria-current={dotIndex === index}
                onClick={() => setIndex(dotIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index
                    ? 'w-5 bg-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.45)]'
                    : 'w-1.5 bg-white/20 hover:bg-vouch-cyan/40'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next judge"
            onClick={() => setIndex((current) => (current + 1) % count)}
            className={`${Z8_INTERACTIVE} flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            Now viewing:{' '}
            <span className="text-vouch-cyan/85">
              {judge.code} · {judge.displayName}
            </span>
            {paused && <span className="text-white/25"> · paused</span>}
          </p>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {LANDING_JUDGES.map((item, judgeIndex) => {
            const active = judgeIndex === index;
            const ring = JUDGE_COLOR_RING[item.color] ?? JUDGE_COLOR_RING.cyan;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active}
                onMouseEnter={() => setIndex(judgeIndex)}
                onFocus={() => setIndex(judgeIndex)}
                onClick={() => setIndex(judgeIndex)}
                className={[
                  've-landing-judge-tab group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all',
                  Z8_INTERACTIVE,
                  active
                    ? `${ring} border-vouch-cyan/45 bg-vouch-cyan/10 shadow-[0_0_24px_rgba(0,240,255,0.1)]`
                    : 'border-white/10 bg-black/25 hover:border-vouch-cyan/25 hover:bg-vouch-cyan/5',
                ].join(' ')}
              >
                <JudgePixelIcon code={item.code} size="sm" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-vouch-cyan">
                  {item.code}
                </span>
                <span
                  className={`hidden text-[10px] font-bold uppercase tracking-wide sm:block ${
                    active ? 'text-white' : 'text-white/45 group-hover:text-white/70'
                  }`}
                >
                  {item.displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
        Judge IDs: data_scout · power_hunter · momentum_reader · risk_auditor · pro_edge_agent
      </p>
    </section>
  );
}

export { LANDING_JUDGES };
