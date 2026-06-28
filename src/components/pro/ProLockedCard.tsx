import { Lock } from 'lucide-react';

export default function ProLockedCard({
  title,
  detail,
  label = 'Pro',
}: {
  title: string;
  detail: string;
  label?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.28)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
          {label}
        </span>
        <Lock className="h-4 w-4 text-slate-500" />
      </div>
      <h3 className="text-sm font-black text-slate-100">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}
