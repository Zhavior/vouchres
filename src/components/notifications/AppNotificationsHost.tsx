import React, { useEffect, useState } from 'react';
import { Bell, X, Sparkles, Lock, Trophy, Info } from 'lucide-react';
import {
  AppNotification,
  getNotifications,
  markAllRead,
  clearNotifications,
  onNotification,
} from '../../lib/appNotifications';

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ai: Sparkles, lock: Lock, result: Trophy, info: Info,
};
const ACCENT: Record<string, string> = {
  ai: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  lock: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  result: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  info: 'text-slate-300 border-slate-700 bg-slate-800/40',
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

interface Props {
  onNavigate?: (section: string) => void;
}

export default function AppNotificationsHost({ onNavigate }: Props) {
  const [list, setList] = useState<AppNotification[]>(() => getNotifications());
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return onNotification((n) => {
      setList(getNotifications());
      if (n) {
        setToasts((t) => [n, ...t].slice(0, 3));
        window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 7000);
      }
    });
  }, []);

  const unread = list.filter((n) => !n.read).length;

  const openPanel = () => {
    setOpen(true);
    markAllRead();
    setList(getNotifications());
  };

  return (
    <>
      {/* Toasts — top center, above everything */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
        {toasts.map((n) => {
          const Icon = ICON[n.kind] ?? Info;
          return (
            <div key={n.id} className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl bg-slate-950/95 backdrop-blur-md border shadow-2xl animate-slide-in ${ACCENT[n.kind] ?? ACCENT.info}`}>
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-100 truncate">{n.title}</p>
                {n.body && <p className="text-[11px] text-slate-400 leading-snug">{n.body}</p>}
              </div>
              <button onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))} className="text-slate-500 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bell — stacked above the HR bell + AI FAB */}
      <button
        onClick={openPanel}
        className="fixed bottom-44 md:bottom-40 right-6 md:right-8 z-[60] w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl hover:border-cyan-500/60 transition-colors"
        aria-label="App notifications"
      >
        <Bell className="w-5 h-5 text-cyan-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-[10px] font-black text-slate-950 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[125] md:inset-auto md:bottom-40 md:right-20">
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <div className="relative h-full md:h-auto md:w-96 md:max-h-[60vh] bg-[#0b1120] md:border border-slate-800 md:rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-100"><Bell className="w-4 h-4 text-cyan-400" /> Notifications</h3>
              <div className="flex items-center gap-2">
                {list.length > 0 && (
                  <button onClick={() => { clearNotifications(); setList([]); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider">Clear</button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {list.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs font-mono">No notifications yet.</div>
              ) : (
                list.map((n) => {
                  const Icon = ICON[n.kind] ?? Info;
                  return (
                    <button
                      key={n.id}
                      onClick={() => { if (n.section && onNavigate) { onNavigate(n.section); setOpen(false); } }}
                      className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl border bg-slate-900/40 ${n.section ? 'hover:bg-slate-900/70 cursor-pointer' : ''} border-slate-800`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${ACCENT[n.kind] ?? ACCENT.info}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-100">{n.title}</p>
                        {n.body && <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{n.body}</p>}
                        <p className="text-[9px] text-slate-600 font-mono mt-1 uppercase">{timeAgo(n.ts)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
