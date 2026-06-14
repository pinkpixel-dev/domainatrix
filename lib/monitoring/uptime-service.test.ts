import { describe, expect, it } from "vitest";
import { applyUptimeCheck, checkDomainUptime } from "./uptime-service";
import type { DomainSummary } from "@/lib/domain/types";
import type { UptimeCheckSummary } from "@/lib/domain/domain-repository";

describe("uptime service", () => {
  it("marks a domain up when the HTTP check returns a successful response", async () => {
    const result = await checkDomainUptime("example.dev", async () => new Response(null, { status: 204 }));

    expect(result).toMatchObject({
      isUp: true,
      responseCode: 204,
    });
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("marks a domain down when the HTTP check throws", async () => {
    const result = await checkDomainUptime("example.dev", async () => {
      throw new Error("Connection refused");
    });

    expect(result).toMatchObject({
      isUp: false,
      responseCode: null,
    });
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("creates an uptime notification when an enabled domain changes state", async () => {
    const notifications: string[] = [];
    const updates: string[] = [];

    const result = await applyUptimeCheck({
      domain: domain(),
      current: {
        domainName: "example.dev",
        isUp: false,
        responseCode: null,
        responseTimeMs: 25,
      },
      previous: uptime({ isUp: true }),
      recordUptimeCheck: async () => undefined,
      recordDomainUpdate: async (update) => {
        updates.push(update.changeType);
      },
      createNotification: async (notification) => {
        notifications.push(notification.changeType);
      },
    });

    expect(result.notificationCreated).toBe(true);
    expect(updates).toEqual(["uptime_change"]);
    expect(notifications).toEqual(["uptime_change"]);
  });

  it("does not notify on the first uptime check", async () => {
    const notifications: string[] = [];

    const result = await applyUptimeCheck({
      domain: domain(),
      current: {
        domainName: "example.dev",
        isUp: false,
        responseCode: null,
        responseTimeMs: 25,
      },
      previous: undefined,
      recordUptimeCheck: async () => undefined,
      recordDomainUpdate: async () => undefined,
      createNotification: async (notification) => {
        notifications.push(notification.changeType);
      },
    });

    expect(result.notificationCreated).toBe(false);
    expect(notifications).toEqual([]);
  });
});

function domain(overrides: Partial<DomainSummary> = {}): DomainSummary {
  return {
    id: "example-dev",
    name: "example.dev",
    expiryDate: "2026-12-24",
    daysUntilExpiry: 194,
    monitoringStatus: "healthy",
    notes: "",
    tags: [],
    links: [],
    notificationPreferences: [{ type: "uptime_change", enabled: true }],
    costings: {
      purchasePrice: 0,
      renewalCost: 0,
      currentValue: 0,
      autoRenew: false,
    },
    registrar: { name: "Porkbun" },
    dns: { nameServers: [], mxRecords: [], txtRecords: [] },
    ssl: { issuer: "Unknown", validTo: "Unknown" },
    host: { org: "Unknown", city: "Unknown", country: "Unknown" },
    ...overrides,
  };
}

function uptime(overrides: Partial<UptimeCheckSummary> = {}): UptimeCheckSummary {
  return {
    id: "uptime-example-dev",
    domainId: "example-dev",
    checkedAt: "2026-06-13T12:00:00.000Z",
    isUp: true,
    responseCode: 200,
    responseTimeMs: 125,
    dnsLookupTimeMs: null,
    sslHandshakeTimeMs: null,
    ...overrides,
  };
}
