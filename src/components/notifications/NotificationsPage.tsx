import React from 'react';
import { ProductEvents } from "../../lib/productEvents";
import { Bell, Info, Trash2, Trophy, X } from 'lucide-react';
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
} satisfies Record<string, typeof Info>;

const toneMap = {
  info: 'info',
  success: 'success',
} satisfies Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'>;

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
  const { data: list = [], unreadCount, markAllRead, clearLocal } = useAppNotifications();

  React.useEffect(() => {
    void markAllRead();
  }, [markAllRead]);

  const handleClear = () => {
    void clearLocal();
  };

  const renderNotification = (notification: (typeof list)[number]) => {
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
              <VEBadge tone={toneMap[notification.kind] ?? 'neutral'}>{notification.typeLabel}</VEBadge>

              <VEBadge tone={notification.source === 'server' ? 'success' : 'neutral'}>
                {notification.source === 'server' ? 'SocialOS' : 'Local'}
              </VEBadge>

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
              Track saved parlays, grading events, AI signals, and account updates from one native inbox.
            </p>
            <div className="z8-accent-line mt-2 w-full max-w-xs" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`${Z8_STAT_CHIP} ${unreadCount > 0 ? 'border-vouch-amber/30 text-vouch-amber' : ''}`}>
              <span className={`${Z8_LABEL} block text-white/40`}>Unread</span>
              <span className="z8-tabular-nums text-lg font-bold text-white">{unreadCount}</span>
            </span>

            {list.length > 0 && (
              <VEButton
                type="button"
                variant="danger"
                size="md"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleClear}
              >
                Clear local
              </VEButton>
            )}
          </div>
        </header>

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
    </main>
  );
}

export default NotificationsPage;
