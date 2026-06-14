import Link from "next/link";
import { BellRing, Inbox } from "lucide-react";
import { MarkReadButton } from "@/components/notifications/mark-read-button";
import { RetryDeliveryButton } from "@/components/notifications/retry-delivery-button";
import { TestNotificationButton } from "@/components/notifications/test-notification-button";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadNotificationCount(),
  ]);
  const sentCount = notifications.filter((notification) => notification.sent).length;
  const pendingDeliveryCount = notifications.length - sentCount;

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review domain events and alert previews before the monitoring jobs start creating them automatically.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <RetryDeliveryButton />
          <TestNotificationButton />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellRing className="size-4 text-primary" />
            Unread
          </div>
          <p className="mt-2 text-3xl font-semibold">{unreadCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="size-4 text-primary" />
            Total
          </div>
          <p className="mt-2 text-3xl font-semibold">{notifications.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellRing className="size-4 text-primary" />
            Sent
          </div>
          <p className="mt-2 text-3xl font-semibold">{sentCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="size-4 text-primary" />
            In-app only
          </div>
          <p className="mt-2 text-3xl font-semibold">{pendingDeliveryCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Notification Center</h2>
        </div>
        {notifications.length > 0 ? (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <article key={notification.id} className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/domains/${notification.domainId}`}
                      className="font-medium hover:text-primary"
                    >
                      {notification.domainName}
                    </Link>
                    {!notification.read ? (
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Unread
                      </span>
                    ) : null}
                    <span
                      className={
                        notification.sent
                          ? "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                          : "rounded-md border border-border bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground"
                      }
                    >
                      {notification.sent ? "Sent" : "In-app only"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-normal text-muted-foreground">
                    {formatNotificationType(notification.changeType)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notification.message || "No message provided."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.read ? <MarkReadButton notificationId={notification.id} /> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
