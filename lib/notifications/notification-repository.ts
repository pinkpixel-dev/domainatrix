import type Database from "better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import type { CreateNotificationInput, NotificationSummary } from "./types";

const DEFAULT_USER_ID = "a0000000-aaaa-42a0-a0a0-00a000000a69";
const DEFAULT_USER_EMAIL = "domainatrix@local";

type ListNotificationsOptions = {
  limit?: number;
  unreadOnly?: boolean;
  unsentOnly?: boolean;
};

type HasNotificationInput = {
  domainId: string;
  changeType: string;
  message: string;
};

export function createNotificationRepository(sqlite: Database.Database) {
  const db = drizzle(sqlite, { schema });

  async function ensureDefaultUser() {
    await db
      .insert(schema.users)
      .values({ id: DEFAULT_USER_ID, email: DEFAULT_USER_EMAIL })
      .onConflictDoNothing()
      .run();
  }

  async function createNotification(input: CreateNotificationInput): Promise<NotificationSummary> {
    await ensureDefaultUser();

    const id = `notification-${Date.now()}-${toId(input.domainId)}-${toId(input.changeType)}`;
    await db
      .insert(schema.notifications)
      .values({
        id,
        userId: DEFAULT_USER_ID,
        domainId: input.domainId,
        changeType: input.changeType,
        message: input.message ?? "",
      })
      .run();

    const [created] = await listNotifications({ limit: 1 });
    if (!created) throw new Error("Failed to create notification.");
    return created;
  }

  async function listNotifications(options: ListNotificationsOptions = {}): Promise<NotificationSummary[]> {
    await ensureDefaultUser();

    const filters = [
      options.unreadOnly ? eq(schema.notifications.read, false) : undefined,
      options.unsentOnly ? eq(schema.notifications.sent, false) : undefined,
    ].filter((filter) => filter !== undefined);

    const rows = await db
      .select({
        notification: schema.notifications,
        domainName: schema.domains.domainName,
      })
      .from(schema.notifications)
      .innerJoin(schema.domains, eq(schema.notifications.domainId, schema.domains.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(options.limit ?? 50);

    return rows.map((row) => ({
      id: row.notification.id,
      domainId: row.notification.domainId,
      domainName: row.domainName,
      changeType: row.notification.changeType,
      message: row.notification.message ?? "",
      read: row.notification.read,
      sent: row.notification.sent,
      createdAt: row.notification.createdAt,
    }));
  }

  async function getUnreadCount(): Promise<number> {
    const unread = await listNotifications({ unreadOnly: true });
    return unread.length;
  }

  async function markNotificationRead(id: string): Promise<boolean> {
    await ensureDefaultUser();

    const existing = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(eq(schema.notifications.id, id))
      .limit(1);

    if (existing.length === 0) return false;

    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id)).run();
    return true;
  }

  async function markNotificationSent(id: string): Promise<boolean> {
    await ensureDefaultUser();

    const existing = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(eq(schema.notifications.id, id))
      .limit(1);

    if (existing.length === 0) return false;

    await db.update(schema.notifications).set({ sent: true }).where(eq(schema.notifications.id, id)).run();
    return true;
  }

  async function hasNotification(input: HasNotificationInput): Promise<boolean> {
    await ensureDefaultUser();

    const existing = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.domainId, input.domainId),
          eq(schema.notifications.changeType, input.changeType),
          eq(schema.notifications.message, input.message),
        ),
      )
      .limit(1);

    return existing.length > 0;
  }

  return {
    createNotification,
    listNotifications,
    getUnreadCount,
    markNotificationRead,
    markNotificationSent,
    hasNotification,
  };
}

function toId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
