import { BarChart3, Radio, ShieldCheck } from 'lucide-react';
import { ProductEvents } from '../../lib/productEvents';

type Props = {
  onComplete: (section?: string) => void;
};

const STARTING_POINTS = [
  {
    id: 'hr_board',
    title: "Research today's HR board",
    description: 'Compare official lineup status, model confidence, and supporting evidence.',
    icon: BarChart3,
  },
  {
    id: 'live_parlays',
    title: 'Build and track a parlay',
    description: 'Create a grading-safe slip and keep its status synchronized.',
    icon: Radio,
  },
  {
    id: 'profile',
    title: 'Review my trust record',
    description: 'See settled results, proof history, and account controls.',
    icon: ShieldCheck,
  },
] as const;

export function PersonalizedOnboarding({ onComplete }: Props) {
  function finish(section: string) {
    ProductEvents.onboardingStepCompleted?.('starting_point_selected');
    ProductEvents.onboardingCompleted?.({ startingPoint: section });
    onComplete(section);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ve-obsidian px-4 py-10 text-white">
      <section className="w-full max-w-3xl border border-white/10 bg-black/30 p-5 sm:p-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-vouch-emerald">Welcome to VouchEdge</p>
        <h1 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">What do you want to do first?</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Choose a starting point. Nothing is locked in, and every tool remains available from navigation.</p>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {STARTING_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => finish(item.id)}
                className="z8-control group min-h-44 border border-white/10 bg-black/25 p-4 text-left transition hover:border-vouch-emerald/40 hover:bg-vouch-emerald/[0.04]"
              >
                <Icon className="h-5 w-5 text-vouch-emerald" />
                <span className="mt-5 block text-base font-black leading-tight text-white">{item.title}</span>
                <span className="mt-2 block text-sm leading-5 text-white/50">{item.description}</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => finish('today')} className="z8-control mt-5 px-3 text-sm font-semibold text-white/55 hover:text-white">
          Skip and open Today
        </button>
      </section>
    </main>
  );
}
