type ProGraphShellProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function ProGraphShell({ title, description, children }: ProGraphShellProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-100">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-200">
          Graph
        </span>
      </div>

      {children ?? (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/70">
          <p className="max-w-sm text-center text-xs leading-relaxed text-slate-500">
            Verified trend feed required. No fake graph data shown.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProGraphShell;
