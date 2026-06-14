import { describe, expect, it } from "vitest";
import { applyDomainCheck, applyExpiryReminder } from "./domain-check-service";
import type { DomainSummary } from "@/lib/domain/types";
import type { EnrichmentResult } from "@/lib/enrichment/types";

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
    notificationPreferences: [
      { type: "dns_change", enabled: true },
      { type: "ssl_change", enabled: false },
    ],
    costings: {
      purchasePrice: 0,
      renewalCost: 0,
      currentValue: 0,
      autoRenew: false,
    },
    registrar: { name: "Porkbun" },
    dns: {
      nameServers: ["ns1.old.example"],
      mxRecords: [],
      txtRecords: [],
    },
    ssl: {
      issuer: "Old CA",
      validTo: "2026-12-24",
      fingerprint: "old-fingerprint",
    },
    host: {
      org: "Old Host",
      city: "Austin",
      country: "US",
    },
    ...overrides,
  };
}

function enrichment(): EnrichmentResult {
  return {
    whois: null,
    dns: {
      nameServers: ["ns1.new.example"],
      mxRecords: [],
      txtRecords: [],
      ipv4: [],
      ipv6: [],
    },
    ssl: {
      issuer: "New CA",
      issuerCountry: "US",
      subject: "example.dev",
      validFrom: "2026-01-01",
      validTo: "2027-01-01",
      fingerprint: "new-fingerprint",
      keySize: 2048,
      signatureAlgorithm: "sha256WithRSAEncryption",
    },
    host: null,
    errors: ["WHOIS lookup failed"],
  };
}

describe("domain check service", () => {
  it("records all detected changes, notifies only enabled preferences, and saves enrichment", async () => {
    const updates: string[] = [];
    const notifications: string[] = [];
    const saves: string[] = [];

    const result = await applyDomainCheck({
      domain: domain(),
      enrichment: enrichment(),
      recordDomainUpdate: async (change) => {
        updates.push(change.changeType);
      },
      createNotification: async (notification) => {
        notifications.push(notification.changeType);
      },
      saveEnrichmentData: async (domainId) => {
        saves.push(domainId);
      },
    });

    expect(result).toEqual({
      domainId: "example-dev",
      domainName: "example.dev",
      changed: true,
      changeCount: 2,
      notificationCount: 1,
      errors: ["WHOIS lookup failed"],
    });
    expect(updates).toEqual(["dns_change", "ssl_change"]);
    expect(notifications).toEqual(["dns_change"]);
    expect(saves).toEqual(["example-dev"]);
  });

  it("creates an expiry reminder when a domain reaches a reminder threshold", async () => {
    const notifications: string[] = [];

    const result = await applyExpiryReminder({
      domain: domain({
        expiryDate: "2026-07-13",
        notificationPreferences: [{ type: "expiry_domain", enabled: true }],
      }),
      now: new Date("2026-06-13T12:00:00Z"),
      notificationExists: async () => false,
      createNotification: async (notification) => {
        notifications.push(notification.message ?? "");
      },
    });

    expect(result).toBe(1);
    expect(notifications).toEqual(["example.dev expires in 30 days on 2026-07-13."]);
  });

  it("does not create duplicate expiry reminders", async () => {
    const notifications: string[] = [];

    const result = await applyExpiryReminder({
      domain: domain({
        expiryDate: "2026-07-13",
        notificationPreferences: [{ type: "expiry_domain", enabled: true }],
      }),
      now: new Date("2026-06-13T12:00:00Z"),
      notificationExists: async () => true,
      createNotification: async (notification) => {
        notifications.push(notification.message ?? "");
      },
    });

    expect(result).toBe(0);
    expect(notifications).toEqual([]);
  });
});
