import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { createDomainRepository } from "../domain/domain-repository";
import { createNotificationRepository } from "./notification-repository";

describe("notification repository", () => {
  let tempDir: string;
  let sqlite: Database.Database;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "domainatrix-notifications-"));
    sqlite = new Database(join(tempDir, "test.sqlite"));
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: "drizzle" });
  });

  afterEach(() => {
    sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates, lists, and marks notifications read", async () => {
    const domainRepository = createDomainRepository(sqlite);
    const notificationRepository = createNotificationRepository(sqlite);
    const domain = await domainRepository.createDomain({ domainName: "example.dev" });

    const created = await notificationRepository.createNotification({
      domainId: domain.id,
      changeType: "test_notification",
      message: "This is a test notification.",
    });

    const unread = await notificationRepository.listNotifications({ unreadOnly: true });

    expect(unread).toMatchObject([
      {
        id: created.id,
        domainId: domain.id,
        domainName: "example.dev",
        changeType: "test_notification",
        message: "This is a test notification.",
        read: false,
      },
    ]);

    await notificationRepository.markNotificationRead(created.id);

    expect(await notificationRepository.listNotifications({ unreadOnly: true })).toEqual([]);
    expect(await notificationRepository.getUnreadCount()).toBe(0);
  });

  it("marks notifications sent after delivery", async () => {
    const domainRepository = createDomainRepository(sqlite);
    const notificationRepository = createNotificationRepository(sqlite);
    const domain = await domainRepository.createDomain({ domainName: "example.dev" });

    const created = await notificationRepository.createNotification({
      domainId: domain.id,
      changeType: "uptime_change",
      message: "example.dev is down.",
    });

    await notificationRepository.markNotificationSent(created.id);

    const [sent] = await notificationRepository.listNotifications();

    expect(sent).toMatchObject({
      id: created.id,
      sent: true,
    });
  });

  it("checks whether a matching notification already exists", async () => {
    const domainRepository = createDomainRepository(sqlite);
    const notificationRepository = createNotificationRepository(sqlite);
    const domain = await domainRepository.createDomain({ domainName: "example.dev" });

    await notificationRepository.createNotification({
      domainId: domain.id,
      changeType: "expiry_domain",
      message: "example.dev expires in 30 days on 2026-07-13.",
    });

    await expect(
      notificationRepository.hasNotification({
        domainId: domain.id,
        changeType: "expiry_domain",
        message: "example.dev expires in 30 days on 2026-07-13.",
      }),
    ).resolves.toBe(true);
    await expect(
      notificationRepository.hasNotification({
        domainId: domain.id,
        changeType: "expiry_domain",
        message: "example.dev expires in 14 days on 2026-06-27.",
      }),
    ).resolves.toBe(false);
  });

  it("lists unsent notifications for delivery retries", async () => {
    const domainRepository = createDomainRepository(sqlite);
    const notificationRepository = createNotificationRepository(sqlite);
    const domain = await domainRepository.createDomain({ domainName: "example.dev" });

    const sent = await notificationRepository.createNotification({
      domainId: domain.id,
      changeType: "dns_change",
      message: "Sent notification.",
    });
    await notificationRepository.createNotification({
      domainId: domain.id,
      changeType: "expiry_domain",
      message: "Pending notification.",
    });

    await notificationRepository.markNotificationSent(sent.id);

    const unsent = await notificationRepository.listNotifications({ unsentOnly: true });

    expect(unsent).toHaveLength(1);
    expect(unsent[0]).toMatchObject({
      sent: false,
      message: "Pending notification.",
    });
  });
});
