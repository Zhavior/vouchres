import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Info, Lock, Sparkles, Trash2, Trophy, X } from 'lucide-react';
import {
  AppNotification,
  clearNotifications,
  getNotifications,
  markAllRead,
  onNotification,
} from '../../lib/appNotifications';

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ai: Sparkles,
  lock: Lock,
  result: Trophy,
  success: CheckCircle2,
  info: Info,
};

const ACCENT: Record<string, string> = {
  ai: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200',
  lock: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  result: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  success: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
  info: 'border-slate-700 bg-slate-800/50 text-slate-300',
};

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  onSectionChange: (section: string) => void;
}

export default function NotificationsPage({ onSectionChange }: Props) {
  const [list, setList] = useState<AppNotification[]>(() => getNotifications());

  useEffect(() => {
    markAllRead();
    setList(getNotifications());
    return onNotification(() => setList(getNotifications()));
  }, []);

  const grouped = useMemo(() => {
    const unread = list.filter((notification) => !notification.read);
    const read = list.filter((notification) => notification.read);
    return { unread, read };
  }, [list]);

  const handleClear = () => {
    clearNotifications();
    setList([]);
  };

  const renderNotification = (notification: AppNotification) => {
    const Icon = ICON[notification.kind] ?? Info;
    const accent = ACCENT[notification.kind] ?? ACCENT.info;

    return (
      <button
        key={notification.id}
        type="button"
        onClick={() => notification.section && onSectionChange(notification.section)}
        className={`group w-full rounded-2xl border border-slate-800 bg-slate-950/55 p-4 text-left shadow-xl shadow-black/10 transition ${
          notification.section ? 'hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-slate-900/70' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-black text-slate-100">{notification.title}</h3>
              <span className="flex-shrink-0 font-mono text-[10px] uppercase text-slate-600">{timeAgo(notification.ts)}</span>
            </div>
            {notification.body && (
              <p className="mt-1 text-xs leading-5 text-slate-400">{notification.body}</p>
            )}
            {notification.section && (
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 opacity-80 transition group-hover:opacity-100">
                Open related screen
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <Bell className="h-3.5 w-3.5" />
              Notification Center
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Alerts and updates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Real app alerts from saved parlays, lock movement, AI generation, and grading results.
            </p>
          </div>

          {list.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-xs font-black text-slate-200 transition hover:border-rose-300/35 hover:text-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-500">
              <X className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black text-white">No notifications yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Save parlays, generate AI picks, or wait for lock and grading events to populate this inbox.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {grouped.unread.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Unread</h2>
                <div className="space-y-3">{grouped.unread.map(renderNotification)}</div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                {grouped.unread.length > 0 ? 'Earlier' : 'All notifications'}
              </h2>
              <div className="space-y-3">{grouped.read.map(renderNotification)}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
