import { ProductEvents } from "../../lib/productEvents";
import { Bell, CheckCheck, Info, Search, Trash2, Trophy, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  clearNotifications,
  markAllRead,
  markNotificationRead,
  type AppNotification,
} from '../../lib/appNotifications';
import { useAppNotifications } from '../../hooks/queries/useAppNotifications';
import {
  Z8_DISPLAY,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
  Z8_SURFACE,
} from '../../theme/z8Tokens';
import { VEButton, VECard, VEBadge, VEState } from '../ui/ve';

type NotificationsPageProps = {
  onSectionChange: (section: string) => void;
};

const iconMap = {
  info: Info,
  success: Trophy,
} satisfies Partial<Record<AppNotification['kind'], typeof Info>>;

const toneMap = {
  info: 'info',
  success: 'success',
} satisfies Partial<Record<AppNotification['kind'], 'neutral' | 'info' | 'success' | 'warning' | 'danger'>>;

function timeAgo(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'just now';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationsPage({ onSectionChange }: NotificationsPageProps) {
  const { data: list = [] } = useAppNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'signals'>('all');
  const [query, setQuery] = useState('');

  const unread = list.filter((notification) => !notification.read).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return list.filter((notification) => {
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'signals' && !['ai', 'result', 'success'].includes(notification.kind)) return false;
      return !needle || `${notification.title} ${notification.body ?? ''}`.toLowerCase().includes(needle);
    });
  }, [filter, list, query]);

  const handleClear = () => {
    clearNotifications();
  };

  const renderNotification = (notification: AppNotification) => {
    const Icon = iconMap[notification.kind] ?? Info;

    return (
      <VECard
        key={notification.id}
        tone={notification.read ? 'soft' : 'elevated'}
        interactive={Boolean(notification.section)}
        className={`group w-full p-4 text-left ${Z8_SURFACE}`}
        role={notification.section ? 'button' : undefined}
        tabIndex={notification.section ? 0 : undefined}
        onClick={() => {
          markNotificationRead(notification.id);
          ProductEvents.notificationOpened(notification.kind);

          if (notification.section) {
            onSectionChange(notification.section);
          }
        }}
        onKeyDown={(event) => {
          if (!notification.section) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            ProductEvents.notificationOpened(notification.kind);
            markNotificationRead(notification.id);
            onSectionChange(notification.section);
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-vouch-cyan/20 bg-vouch-cyan/10 text-vouch-cyan`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-black text-slate-100">{notification.title}</h3>
              <span className="flex-shrink-0 font-mono text-[10px] uppercase text-slate-600">
                {timeAgo(notification.ts)}
              </span>
            </div>

            {notification.body && (
              <p className="mt-1 text-xs leading-5 text-slate-400">{notification.body}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VEBadge tone={toneMap[notification.kind] ?? 'neutral'}>{notification.kind}</VEBadge>

              {notification.section && (
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Open {notification.section}
                </span>
              )}

              {!notification.read && <VEBadge tone="info">New</VEBadge>}
            </div>
          </div>
        </div>
      </VECard>
    );
  };

  return (
    <main className={`${Z8_PAGE} min-h-screen ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className={`${Z8_PANEL_PREMIUM} flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-end`}>
          <div className={Z8_SECTION_HEADER}>
            <span className={`${Z8_LABEL} inline-flex w-fit items-center gap-2 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-1 text-vouch-cyan`}>
              <Bell className="h-3.5 w-3.5" />
              Notification Center
            </span>

            <h1 className={`${Z8_DISPLAY} mt-3`}>
              VouchEdge Alerts
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-white/45">
              A precision inbox for validated signals, lineup changes, graded results, and account events.
            </p>
            <div className="z8-accent-line mt-2 w-full max-w-xs" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`${Z8_STAT_CHIP} ${unread > 0 ? 'border-vouch-amber/30 text-vouch-amber' : ''}`}>
              <span className={`${Z8_LABEL} block text-white/40`}>Unread</span>
              <span className="z8-tabular-nums text-lg font-bold text-white">{unread}</span>
            </span>

            {list.length > 0 && (
              <VEButton
                type="button"
                variant="danger"
                size="md"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleClear}
              >
                Clear all
              </VEButton>
            )}
          </div>
        </header>

        <section className="grid gap-3 border border-white/10 bg-black/25 p-3 sm:grid-cols-[1fr_auto]">
          <label className="flex min-h-11 items-center gap-2 border border-white/10 bg-black/30 px-3 text-white/45 focus-within:border-[#00ff94]/35">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </label>
          <div className="flex gap-1 overflow-x-auto">
            {(['all', 'unread', 'signals'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-11 whitespace-nowrap border px-3 font-mono text-[10px] font-black uppercase tracking-wider ${filter === value ? 'border-[hsl(var(--ve-success)/0.35)] bg-[hsl(var(--ve-success)/0.1)] text-[#00ff94]' : 'border-white/10 text-white/40'}`}>{value}</button>
            ))}
            {unread > 0 && <button type="button" onClick={() => markAllRead()} className="flex min-h-11 items-center gap-1.5 whitespace-nowrap border border-white/10 px-3 font-mono text-[10px] font-black uppercase text-white/55"><CheckCheck className="h-3.5 w-3.5" />Read all</button>}
          </div>
        </section>

        {visible.length === 0 ? (
          <div className="mt-8">
            <VEState
              tone="empty"
              icon={<X className="h-6 w-6" />}
              title={list.length === 0 ? 'No notifications yet' : 'No alerts match this view'}
              description={list.length === 0 ? 'Save parlays, generate AI picks, or wait for lock and grading events to populate this inbox.' : 'Change the filter or search term to see more alerts.'}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">{visible.map(renderNotification)}</div>
        )}
      </div>
    </main>
  );
}

export default NotificationsPage;
