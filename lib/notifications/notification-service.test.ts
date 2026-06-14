import { describe, expect, it } from "vitest";
import { deliverCreatedNotification, retryUnsentNotifications } from "./notification-service";
import type { NotificationSummary } from "./types";

describe("notification service", () => {
  it("marks a notification sent after successful delivery", async () => {
    const markedSent: string[] = [];

    const result = await deliverCreatedNotification(notification(), {
      deliverNotification: async () => ({ attempted: true, delivered: true, channel: "webhook" }),
      markNotificationSent: async (id) => {
        markedSent.push(id);
        return true;
      },
    });

    expect(result).toEqual({ attempted: true, delivered: true, channel: "webhook" });
    expect(markedSent).toEqual(["notification-example"]);
  });

  it("does not mark a notification sent when no delivery channel is configured", async () => {
    const markedSent: string[] = [];

    const result = await deliverCreatedNotification(notification(), {
      deliverNotification: async () => ({ attempted: false, delivered: false, channel: "none" }),
      markNotificationSent: async (id) => {
        markedSent.push(id);
        return true;
      },
    });

    expect(result).toEqual({ attempted: false, delivered: false, channel: "none" });
    expect(markedSent).toEqual([]);
  });

  it("retries unsent notifications and marks successful deliveries sent", async () => {
    const markedSent: string[] = [];

    const result = await retryUnsentNotifications({
      listNotifications: async () => [
        notification({ id: "notification-one" }),
        notification({ id: "notification-two" }),
      ],
      deliverNotification: async (pending) =>
        pending.id === "notification-one"
          ? { attempted: true, delivered: true, channel: "webhook" }
          : { attempted: true, delivered: false, channel: "webhook", error: "Webhook returned 500." },
      markNotificationSent: async (id) => {
        markedSent.push(id);
        return true;
      },
    });

    expect(result).toEqual({ checked: 2, delivered: 1, failed: 1 });
    expect(markedSent).toEqual(["notification-one"]);
  });
});

function notification(overrides: Partial<NotificationSummary> = {}): NotificationSummary {
  return {
    id: "notification-example",
    domainId: "example-dev",
    domainName: "example.dev",
    changeType: "uptime_change",
    message: "example.dev is down.",
    read: false,
    sent: false,
    createdAt: "2026-06-13T20:00:00.000Z",
    ...overrides,
  };
}
