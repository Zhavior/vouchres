export function LoadingState({ label = 'Loading VouchEdge data...' }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300" />
      <p className="text-sm font-bold text-slate-300">{label}</p>
    </div>
  );
}
