export function ErrorState({ title = 'Something failed', message = 'The app recovered safely. Try refreshing this section.' }: { title?: string; message?: string }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
      <h3 className="text-sm font-black text-red-100">{title}</h3>
      <p className="mt-2 text-xs text-red-200/80">{message}</p>
    </div>
  );
}
