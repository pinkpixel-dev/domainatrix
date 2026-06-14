import { describe, expect, it } from "vitest";
import { deliverNotification, getNotificationDeliverySettings } from "./notification-delivery";
import type { NotificationSummary } from "./types";

describe("notification delivery", () => {
  it("does not attempt delivery when no channel is configured", async () => {
    let calls = 0;

    const result = await deliverNotification(notification(), {
      settings: getNotificationDeliverySettings({}),
      fetcher: async () => {
        calls += 1;
        return new Response(null, { status: 200 });
      },
    });

    expect(result).toEqual({ attempted: false, delivered: false, channel: "none" });
    expect(calls).toBe(0);
  });

  it("posts notification payloads to the configured webhook URL", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];

    const result = await deliverNotification(notification(), {
      settings: getNotificationDeliverySettings({ NOTIFICATION_WEBHOOK_URL: "https://hooks.example.test/domainatrix" }),
      fetcher: async (url, init) => {
        requests.push({ url, init });
        return new Response(null, { status: 204 });
      },
    });

    expect(result).toEqual({ attempted: true, delivered: true, channel: "webhook" });
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://hooks.example.test/domainatrix");
    expect(requests[0].init).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect(JSON.parse(String(requests[0].init?.body))).toMatchObject({
      id: "notification-example",
      domainId: "example-dev",
      domainName: "example.dev",
      changeType: "uptime_change",
      message: "example.dev is down.",
      source: "domainatrix",
    });
  });

  it("sends notification emails when SMTP settings are configured", async () => {
    const messages: Array<{ from: string; to: string; subject: string; text: string }> = [];

    const result = await deliverNotification(notification(), {
      settings: getNotificationDeliverySettings({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "587",
        SMTP_USER: "alerts@example.test",
        SMTP_PASS: "secret",
        NOTIFICATION_EMAIL_FROM: "Domainatrix <alerts@example.test>",
        NOTIFICATION_EMAIL_TO: "owner@example.test",
      }),
      emailSender: async (message) => {
        messages.push(message);
      },
    });

    expect(result).toEqual({ attempted: true, delivered: true, channel: "email" });
    expect(messages).toMatchObject([
      {
        from: "Domainatrix <alerts@example.test>",
        to: "owner@example.test",
        subject: "Domainatrix: example.dev uptime_change",
        text: expect.stringContaining("example.dev is down."),
      },
    ]);
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
