import { describe, expect, it } from "vitest";
import { getDashboardMetrics } from "./domain-metrics";
import type { DomainSummary } from "./types";

function domain(overrides: Partial<DomainSummary>): DomainSummary {
  return {
    id: "example-dev",
    name: "example.dev",
    expiryDate: "Untracked",
    daysUntilExpiry: 0,
    monitoringStatus: "unknown",
    notes: "",
    tags: [],
    links: [],
    notificationPreferences: [],
    costings: {
      purchasePrice: 0,
      renewalCost: 0,
      currentValue: 0,
      autoRenew: false,
    },
    registrar: { name: "Unknown" },
    dns: { nameServers: [], mxRecords: [], txtRecords: [] },
    ssl: { issuer: "Unknown", validTo: "Unknown" },
    host: { org: "Unknown", city: "Unknown", country: "Unknown" },
    ...overrides,
  };
}

describe("domain dashboard metrics", () => {
  it("does not count untracked domains as expiring soon", () => {
    const metrics = getDashboardMetrics([
      domain({ id: "untracked", expiryDate: "Untracked", daysUntilExpiry: 0 }),
      domain({ id: "expired", expiryDate: "2026-01-01", daysUntilExpiry: -10 }),
      domain({ id: "soon", expiryDate: "2026-06-20", daysUntilExpiry: 7 }),
      domain({ id: "later", expiryDate: "2026-09-20", daysUntilExpiry: 99 }),
      domain({ id: "healthy", expiryDate: "2026-10-20", monitoringStatus: "healthy" }),
    ]);

    expect(metrics).toEqual({
      totalDomains: 5,
      expiringSoon: 1,
      healthyMonitors: 1,
      checksQueued: 0,
      missingExpiry: 1,
      sslExpiringSoon: 0,
      autoRenewDisabled: 5,
      annualRenewalCost: 0,
      notificationCoverage: 0,
      registrarBreakdown: [
        { label: "Unknown", value: 5 },
      ],
      hostBreakdown: [
        { label: "Unknown", value: 5 },
      ],
    });
  });

  it("summarizes risk, spend, notification coverage, and provider breakdowns", () => {
    const metrics = getDashboardMetrics([
      domain({
        id: "pinkpixel-dev",
        registrar: { name: "Namecheap" },
        host: { org: "Vercel", city: "New York", country: "US" },
        ssl: { issuer: "Let's Encrypt", validTo: "2026-06-25" },
        costings: { purchasePrice: 10, renewalCost: 14.5, currentValue: 120, autoRenew: true },
        notificationPreferences: [{ type: "expiry_domain", enabled: true }],
      }),
      domain({
        id: "domainatrix-app",
        registrar: { name: "Porkbun" },
        host: { org: "Cloudflare", city: "Austin", country: "US" },
        ssl: { issuer: "Google Trust Services", validTo: "2026-08-25" },
        costings: { purchasePrice: 20, renewalCost: 24, currentValue: 80, autoRenew: false },
        notificationPreferences: [{ type: "ssl_expiry", enabled: false }],
      }),
      domain({
        id: "sizzlebop-dev",
        registrar: { name: "Namecheap" },
        host: { org: "Vercel", city: "New York", country: "US" },
        ssl: { issuer: "Unknown", validTo: "Unknown" },
        costings: { purchasePrice: 0, renewalCost: 15, currentValue: 0, autoRenew: false },
        notificationPreferences: [{ type: "dns_change", enabled: true }],
      }),
    ], new Date("2026-06-13T12:00:00Z"));

    expect(metrics).toMatchObject({
      sslExpiringSoon: 1,
      autoRenewDisabled: 2,
      annualRenewalCost: 53.5,
      notificationCoverage: 2,
      registrarBreakdown: [
        { label: "Namecheap", value: 2 },
        { label: "Porkbun", value: 1 },
      ],
      hostBreakdown: [
        { label: "Vercel", value: 2 },
        { label: "Cloudflare", value: 1 },
      ],
    });
  });
});
