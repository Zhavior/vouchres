import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Lock,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  AppNotification,
  clearNotifications,
  markAllRead,
  onNotification,
} from '../../lib/appNotifications';
import { useAppNotifications } from '../../hooks/queries/useAppNotifications';
import { useHrNotificationState } from '../../hooks/useHrNotificationState';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queries/queryKeys';
import type { Parlay } from '../../types';
import { Z8_LABEL } from '../../theme/z8Tokens';

const APP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ai: Sparkles,
  lock: Lock,
  result: Trophy,
  success: CheckCircle2,
  info: Info,
};

const APP_ACCENT: Record<string, string> = {
  ai: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  lock: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  result: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  success: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  info: 'text-slate-300 border-slate-700 bg-slate-800/40',
};

type TabId = 'all' | 'app' | 'hr';

type NotificationContextValue = {
  unreadCount: number;
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function useNotificationCenter() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationCenter must be used within NotificationProvider');
  }
  return ctx;
}

/** Narrow hook for badge-only consumers — avoids pulling panel open/close state. */
export function useNotificationUnreadCount(): number {
  const ctx = useContext(NotificationContext);
  return ctx?.unreadCount ?? 0;
}

type ProviderProps = {
  savedSlips?: Parlay[];
  onNavigate?: (section: string) => void;
  children: React.ReactNode;
};

export function NotificationProvider({ savedSlips = [], onNavigate, children }: ProviderProps) {
  const queryClient = useQueryClient();
  const { data: appList = [] } = useAppNotifications();
  const hr = useHrNotificationState(savedSlips);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [appToasts, setAppToasts] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onNotification((n) => {
      if (!n) return;
      setAppToasts((t) => [n, ...t].slice(0, 3));
      window.setTimeout(() => setAppToasts((t) => t.filter((x) => x.id !== n.id)), 7000);
    });
  }, []);

  const appUnread = appList.filter((n) => !n.read).length;
  const hrUnread = hr.enabled ? hr.unread : 0;
  const unreadCount = appUnread + hrUnread;

  const openPanel = useCallback(() => {
    setOpen(true);
    const updated = markAllRead();
    hr.markHrRead();
    queryClient.setQueryData(queryKeys.appNotifications(), updated);
  }, [hr, queryClient]);

  const closePanel = useCallback(() => setOpen(false), []);

  const handleClearApp = () => {
    clearNotifications();
    queryClient.setQueryData(queryKeys.appNotifications(), []);
  };

  const ctx = useMemo(
    () => ({ unreadCount, open, openPanel, closePanel }),
    [unreadCount, open, openPanel, closePanel],
  );

  const showHr = activeTab === 'all' || activeTab === 'hr';
  const showApp = activeTab === 'all' || activeTab === 'app';

  return (
    <NotificationContext.Provider value={ctx}>
      {children}

      {/* App toasts */}
      <div className="pointer-events-none fixed top-4 left-1/2 z-[130] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2">
        {appToasts.map((n) => {
          const Icon = APP_ICON[n.kind] ?? Info;
          return (
            <div
              key={n.id}
              className={`pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md ${APP_ACCENT[n.kind] ?? APP_ACCENT.info}`}
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-100">{n.title}</p>
                {n.body && <p className="text-[11px] leading-snug text-slate-400">{n.body}</p>}
              </div>
              <button
                type="button"
                onClick={() => setAppToasts((t) => t.filter((x) => x.id !== n.id))}
                className="text-slate-500 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* HR toasts */}
      <div className="pointer-events-none fixed top-4 left-1/2 z-[129] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2 md:left-auto md:right-4 md:translate-x-0">
        {hr.toasts.map((e) => (
          <div
            key={e.id}
            className="pointer-events-auto flex animate-slide-in items-center gap-3 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-950/95 to-slate-950 p-3 shadow-[0_0_24px_rgba(249,115,22,0.25)]"
          >
            <span className="text-2xl">⚾</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-orange-400">
                Home Run!
              </p>
              <p className="truncate text-sm font-bold text-slate-100">
                {e.playerName}{' '}
                <span className="font-normal text-slate-400">({e.teamAbbr})</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {e.inning ? `${e.halfInning} ${e.inning} · ` : ''}
                {e.matchup} · {e.rbi} RBI
              </p>
            </div>
            <button
              type="button"
              onClick={() => hr.dismissToast(e.id)}
              className="text-slate-500 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-[125]">
          <div className="absolute inset-0 bg-black/50" onClick={closePanel} aria-hidden />
          <div
            ref={panelRef}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-vouch-cyan/20 bg-[#0b1120] shadow-2xl md:right-4 md:top-14 md:h-auto md:max-h-[min(72vh,640px)] md:rounded-2xl md:border"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-100">
                <Bell className="h-4 w-4 text-vouch-cyan" />
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {appList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearApp}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePanel}
                  className="text-slate-500 hover:text-slate-200"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-slate-800 p-2">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'app' as const, label: 'Activity' },
                  { id: 'hr' as const, label: 'Home Runs' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? 'border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan'
                      : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'hr' && (
              <div className="space-y-2.5 border-b border-slate-800 px-4 py-3">
                <ToggleRow
                  label="Home Run notifications"
                  sub="Real-time alerts when a HR is hit"
                  value={hr.enabled}
                  onChange={() => hr.setEnabled((v) => !v)}
                />
                <ToggleRow
                  label="Only from my parlays"
                  sub="Only notify for hitters in your saved slips"
                  value={hr.onlyParlays}
                  onChange={() => hr.setOnlyParlays((v) => !v)}
                  disabled={!hr.enabled}
                />
              </div>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {showApp &&
                appList.map((n) => {
                  const Icon = APP_ICON[n.kind] ?? Info;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (n.section && onNavigate) {
                          onNavigate(n.section);
                          closePanel();
                        }
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-left ${
                        n.section ? 'cursor-pointer hover:bg-slate-900/70' : ''
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border ${
                          APP_ACCENT[n.kind] ?? APP_ACCENT.info
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{n.body}</p>
                        )}
                        <p className="mt-1 font-mono text-[9px] uppercase text-slate-600">
                          {timeAgo(n.ts)}
                        </p>
                      </div>
                    </button>
                  );
                })}

              {showHr && !hr.enabled && activeTab !== 'all' && (
                <EmptyState
                  icon={<Bell className="h-5 w-5" />}
                  text="HR notifications are off. Turn them on above."
                />
              )}

              {showHr &&
                hr.enabled &&
                hr.events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-2.5"
                  >
                    <img
                      src={e.headshot}
                      alt={e.playerName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 flex-shrink-0 rounded-lg border border-slate-800 bg-slate-900 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-100">
                        ⚾ {e.playerName}{' '}
                        <span className="text-xs font-normal text-slate-500">({e.teamAbbr})</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {e.halfInning} {e.inning} · {e.matchup} · {e.rbi} RBI
                      </p>
                    </div>
                    <span className="flex-shrink-0 font-mono text-[10px] text-slate-600">
                      {timeAgo(e.timestamp)}
                    </span>
                  </div>
                ))}

              {activeTab === 'all' && appList.length === 0 && hr.events.length === 0 && (
                <EmptyState
                  icon={<Info className="h-5 w-5" />}
                  text="No notifications yet. Save parlays or wait for live HR alerts."
                />
              )}

              {activeTab === 'app' && appList.length === 0 && (
                <EmptyState
                  icon={<Info className="h-5 w-5" />}
                  text="No activity notifications yet."
                />
              )}

              {activeTab === 'hr' && hr.enabled && hr.events.length === 0 && (
                <EmptyState
                  icon={<AlertTriangle className="h-5 w-5" />}
                  text={
                    hr.onlyParlays
                      ? savedSlips.length === 0
                        ? 'You have no saved parlays yet. Build one to use this filter.'
                        : 'No HRs from your parlay players yet today.'
                      : 'No home runs yet today — check back during games.'
                  }
                />
              )}
            </div>

            {showHr && hr.enabled && (
              <p className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-600">
                Live from MLB game data. Research/entertainment only.
              </p>
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

type BellButtonProps = {
  className?: string;
  size?: 'sm' | 'md';
};

export function NotificationBellButton({ className = '', size = 'md' }: BellButtonProps) {
  const { unreadCount, openPanel } = useNotificationCenter();
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={openPanel}
      className={`relative flex items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/60 transition-all hover:border-vouch-cyan/40 hover:text-vouch-cyan ${dim} ${className}`}
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className={icon} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-vouch-emerald px-1 text-[8px] font-black text-black">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  disabled,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      <div>
        <p className="text-xs font-bold text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`flex h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
          value ? 'bg-orange-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`mt-1 block h-4 w-4 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center text-slate-500 ${Z8_LABEL}`}>
      <div className="mb-2">{icon}</div>
      <p className="max-w-[240px] text-xs">{text}</p>
    </div>
  );
}

export default NotificationBellButton;
