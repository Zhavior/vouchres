export type AppToastKind = "info" | "success" | "error" | "warning";

export type AppToast = {
  id: number;
  message: string;
  kind: AppToastKind;
};

type Listener = (toast: AppToast) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function showAppToast(message: string, kind: AppToastKind = "info"): void {
  const trimmed = message.trim();
  if (!trimmed) return;
  const toast: AppToast = { id: nextId++, message: trimmed, kind };
  for (const listener of listeners) listener(toast);
}

export function subscribeAppToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Drop-in replacement for window.alert in product flows. */
export function appAlert(message: string, kind: AppToastKind = "info"): void {
  showAppToast(message, kind);
}
