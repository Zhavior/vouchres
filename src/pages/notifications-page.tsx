import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type NotificationItem } from "@/services/notifications";
import { EmptyStateCard, LoadingCard, ErrorCard } from "@/components/ui-states";
import { Bell, CheckCheck } from "lucide-react";

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ limit: 50 }),
    staleTime: 10_000,
  });

  const unreadCount = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 10_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: "var(--ve-accent)" }} />
            Notifications
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--ve-text-muted)" }}>
            {unreadCount.data ? <span style={{ color: "var(--ve-accent)" }}>{unreadCount.data} unread</span> : "All caught up"}
          </p>
        </div>
        {unreadCount.data && unreadCount.data > 0 && (
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="ve-button-ghost text-xs">
            <CheckCheck className="w-3.5 h-3.5 inline mr-1" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <LoadingCard key={i} lines={2} />)}</div>
      ) : isError ? (
        <ErrorCard onRetry={() => refetch()} />
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif: NotificationItem) => (
            <div
              key={notif.id}
              onClick={() => { if (!notif.read_at) markRead.mutate(notif.id); }}
              className="ve-card p-3 cursor-pointer ve-card-hover"
              style={!notif.read_at ? { borderLeft: "2px solid var(--ve-accent)" } : {}}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{getNotifTitle(notif)}</span>
                    {!notif.read_at && <div className="w-1.5 h-1.5 rounded-full ve-pulse" style={{ background: "var(--ve-accent)" }} />}
                  </div>
                  {notif.payload && getNotifBody(notif) && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--ve-text-muted)" }}>{getNotifBody(notif)}</p>
                  )}
                  <span className="text-[10px] mt-1 inline-block font-mono" style={{ color: "var(--ve-text-dim)" }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateCard title="No notifications yet" description="You'll be notified when picks are graded, parlays win, trust increases, and cappers post." icon={Bell} />
      )}
    </div>
  );
}

function getNotifTitle(notif: NotificationItem): string {
  const titles: Record<string, string> = {
    pick_graded: "Pick Graded",
    hr_hit: "Home Run!",
    parlay_won: "Parlay Won!",
    parlay_lost: "Parlay Lost",
    capper_posted: "Capper Posted",
    game_delayed: "Game Delayed",
    big_win: "Big Community Win",
    trust_up: "Trust Score Increased",
    subscriber_joined: "New Subscriber",
  };
  return titles[notif.type] || "Notification";
}

function getNotifBody(notif: NotificationItem): string | undefined {
  const p = notif.payload;
  if (!p) return undefined;
  switch (notif.type) {
    case "pick_graded":
    case "hr_hit":
      return `${(p.market || "").toUpperCase()} pick ${p.result === "won" ? "won" : p.result} (actual: ${p.actual_value})`;
    case "trust_up":
      return `Score: ${p.old_score} -> ${p.new_score} (${p.new_level})`;
    case "parlay_won":
      return "All legs hit! Verified win.";
    case "parlay_lost":
      return "At least one leg failed.";
    default:
      return undefined;
  }
}
