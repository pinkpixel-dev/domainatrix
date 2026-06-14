import { ensureDatabaseReady, sqlite } from "../db/client";
import { getDomainSummaries } from "../domain/domain-service";
import { deliverNotification, type NotificationDeliveryResult } from "./notification-delivery";
import { createNotificationRepository } from "./notification-repository";
import type { CreateNotificationInput, NotificationSummary } from "./types";

type DeliverCreatedNotificationOptions = {
  deliverNotification?: (notification: NotificationSummary) => Promise<NotificationDeliveryResult>;
  markNotificationSent?: (id: string) => Promise<boolean>;
};

type RetryUnsentNotificationsOptions = {
  listNotifications?: (options: { unsentOnly: true; limit?: number }) => Promise<NotificationSummary[]>;
  deliverNotification?: (notification: NotificationSummary) => Promise<NotificationDeliveryResult>;
  markNotificationSent?: (id: string) => Promise<boolean>;
};

export type RetryUnsentNotificationsResult = {
  checked: number;
  delivered: number;
  failed: number;
};

function getRepository() {
  ensureDatabaseReady();
  return createNotificationRepository(sqlite);
}

export async function getNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  return getRepository().listNotifications(options);
}

export async function getUnreadNotificationCount() {
  return getRepository().getUnreadCount();
}

export async function createNotification(input: CreateNotificationInput) {
  const repository = getRepository();
  const notification = await repository.createNotification(input);
  await deliverCreatedNotification(notification, {
    markNotificationSent: repository.markNotificationSent,
  });
  return notification;
}

export async function markNotificationRead(id: string) {
  return getRepository().markNotificationRead(id);
}

export async function createTestNotification() {
  const domains = await getDomainSummaries();
  const domain = domains[0];

  if (!domain) {
    throw new Error("Create a domain before sending a test notification.");
  }

  return createNotification({
    domainId: domain.id,
    changeType: "test_notification",
    message: `Test notification for ${domain.name}.`,
  });
}

export async function deliverCreatedNotification(
  notification: NotificationSummary,
  options: DeliverCreatedNotificationOptions = {},
): Promise<NotificationDeliveryResult> {
  const delivery = await (options.deliverNotification ?? deliverNotification)(notification);

  if (delivery.delivered) {
    await options.markNotificationSent?.(notification.id);
  }

  return delivery;
}

export async function retryUnsentNotifications(
  options: RetryUnsentNotificationsOptions = {},
): Promise<RetryUnsentNotificationsResult> {
  const repository = getRepository();
  const listNotifications = options.listNotifications ?? repository.listNotifications;
  const markNotificationSent = options.markNotificationSent ?? repository.markNotificationSent;
  const pending = await listNotifications({ unsentOnly: true, limit: 50 });

  let delivered = 0;
  let failed = 0;

  for (const notification of pending) {
    const result = await (options.deliverNotification ?? deliverNotification)(notification);

    if (result.delivered) {
      await markNotificationSent(notification.id);
      delivered += 1;
    } else if (result.attempted) {
      failed += 1;
    }
  }

  return {
    checked: pending.length,
    delivered,
    failed,
  };
}
