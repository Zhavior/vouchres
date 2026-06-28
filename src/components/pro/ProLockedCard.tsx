import { Lock } from 'lucide-react';

type ProLockedCardProps = {
  title: string;
  description: string;
  badge?: string;
};

export function ProLockedCard({
  title,
  description,
  badge = 'Pro',
}: ProLockedCardProps) {
  return (
    <div className="rounded-2xl border border-sky-400/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-2">
            <Lock className="h-4 w-4 text-sky-200" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-200">
          {badge}
        </span>
      </div>
    </div>
  );
}
