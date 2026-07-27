export function EmptyState({ title = 'No data yet', message = 'Verified data is not available right now.' }: { title?: string; message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center">
      <h3 className="text-sm font-black text-slate-200">{title}</h3>
      <p className="mt-2 text-xs text-slate-500">{message}</p>
    </div>
  );
}
