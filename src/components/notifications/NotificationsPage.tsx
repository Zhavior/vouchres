import { useMemo } from 'react';
import { Bell, Info, Trash2, Trophy, X } from 'lucide-react';

import {
  clearNotifications,
  getNotifications,
  markAllRead,
  type AppNotification,
} from '../../lib/appNotifications';
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
  const list = useMemo(() => getNotifications(), []);

  const unread = list.filter((notification) => !notification.read).length;

  markAllRead();

  const handleClear = () => {
    clearNotifications();
    window.location.reload();
  };

  const renderNotification = (notification: AppNotification) => {
    const Icon = iconMap[notification.kind] ?? Info;

    return (
      <VECard
        key={notification.id}
        tone={notification.read ? 'soft' : 'elevated'}
        interactive={Boolean(notification.section)}
        className="group w-full p-4 text-left"
        role={notification.section ? 'button' : undefined}
        tabIndex={notification.section ? 0 : undefined}
        onClick={() => notification.section && onSectionChange(notification.section)}
        onKeyDown={(event) => {
          if (!notification.section) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSectionChange(notification.section);
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
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
    <div className="ve-page-shell min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <VECard tone="elevated" className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end">
          <div>
            <VEBadge tone="info" className="gap-2">
              <Bell className="h-3.5 w-3.5" />
              Notification Center
            </VEBadge>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
              VouchEdge Alerts
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Track saved parlays, grading events, AI signals, and account updates from one native inbox.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VEBadge tone={unread > 0 ? 'warning' : 'neutral'}>
              {unread} unread
            </VEBadge>

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
        </VECard>

        {list.length === 0 ? (
          <div className="mt-8">
            <VEState
              tone="empty"
              icon={<X className="h-6 w-6" />}
              title="No notifications yet"
              description="Save parlays, generate AI picks, or wait for lock and grading events to populate this inbox."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">{list.map(renderNotification)}</div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
