import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationSummary } from "@/lib/notifications/types";

type NotificationBellProps = {
  notifications: NotificationSummary[];
  unreadCount: number;
};

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  return (
    <details className="group relative">
      <summary
        className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-foreground"
        aria-label="Open notifications"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-background bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/domains/${notification.domainId}`}
                className="block border-b border-border px-4 py-3 transition last:border-b-0 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{notification.domainName}</p>
                  {!notification.read ? (
                    <span className="mt-1 size-2 rounded-full bg-primary" aria-label="Unread" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs uppercase tracking-normal text-muted-foreground">
                  {formatNotificationType(notification.changeType)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {notification.message || "No message provided."}
                </p>
              </Link>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
        <Link
          href="/notifications"
          className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-foreground transition hover:bg-muted/50"
        >
          View all notifications
        </Link>
      </div>
    </details>
  );
}

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}
