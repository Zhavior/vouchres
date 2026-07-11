import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { AppToast, AppToastKind } from '../../lib/appToast';
import { subscribeAppToast } from '../../lib/appToast';

const KIND_STYLES: Record<AppToastKind, string> = {
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  error: 'border-red-400/30 bg-red-400/10 text-red-100',
};

function ToastIcon({ kind }: { kind: AppToastKind }) {
  const className = 'h-4 w-4 shrink-0';
  if (kind === 'success') return <CheckCircle2 className={className} aria-hidden="true" />;
  if (kind === 'error' || kind === 'warning') return <AlertTriangle className={className} aria-hidden="true" />;
  return <Info className={className} aria-hidden="true" />;
}

export function AppToastHost() {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    return subscribeAppToast((toast) => {
      setToasts((current) => [...current.slice(-2), toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4200);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] z-[130] flex w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg backdrop-blur-md ${KIND_STYLES[toast.kind]}`}
        >
          <ToastIcon kind={toast.kind} />
          <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
            aria-label="Dismiss notification"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
