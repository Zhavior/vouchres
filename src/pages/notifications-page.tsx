import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type NotificationItem } from "@/services/notifications";
import { NotificationCard } from "@/components/notification-card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-electric-400" />
            Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {unreadCount.data ? (
              <span className="text-electric-300 font-mono">
                {unreadCount.data} unread
              </span>
            ) : (
              "All caught up"
            )}
          </p>
        </div>
        {unreadCount.data && unreadCount.data > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="ghost-button text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} lines={2} className="glass-card p-3" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif: NotificationItem) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read_at) {
                  markRead.mutate(notif.id);
                }
              }}
              className="cursor-pointer"
            >
              <NotificationCard
                type={notif.type as any}
                title={_getNotificationTitle(notif)}
                body={_getNotificationBody(notif)}
                timestamp={notif.created_at}
                read={!!notif.read_at}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll be notified when picks are graded, parlays win, trust increases, and cappers post."
        />
      )}
    </div>
  );
}

function _getNotificationTitle(notif: NotificationItem): string {
  const titles: Record<string, string> = {
    pick_graded: "Pick Graded",
    hr_hit: "Home Run Hit!",
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

function _getNotificationBody(notif: NotificationItem): string | undefined {
  const p = notif.payload;
  if (!p) return undefined;

  switch (notif.type) {
    case "pick_graded":
    case "hr_hit":
      return `Your ${p.market?.toUpperCase()} pick ${p.result === "won" ? "won" : p.result} (actual: ${p.actual_value})`;
    case "parlay_won":
      return `Your parlay won! All legs hit.`;
    case "parlay_lost":
      return `Your parlay lost. Better luck next time.`;
    case "trust_up":
      return `Score: ${p.old_score} → ${p.new_score} (${p.new_level})`;
    case "capper_posted":
      return `A capper you follow posted a new pick.`;
    case "game_delayed":
      return `Game #${p.game_id} has been delayed.`;
    case "subscriber_joined":
      return `You have a new subscriber!`;
    default:
      return undefined;
  }
}
