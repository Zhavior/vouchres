import { BarChart3 } from 'lucide-react';

export default function ProGraphShell({
  title,
  subtitle = 'Verified trend feed required. No fake graph data shown.',
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#07111f]/80 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid h-28 grid-cols-8 items-end gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/45 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-t-md bg-slate-800/80" style={{ height: `${24 + index * 7}%` }} />
        ))}
      </div>
    </div>
  );
}
