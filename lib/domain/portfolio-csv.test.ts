import { describe, expect, it } from "vitest";
import { csvToDomainInputs, domainsToCsv } from "./portfolio-csv";
import type { DomainSummary } from "./types";

function domain(overrides: Partial<DomainSummary> = {}): DomainSummary {
  return {
    id: "example-com",
    name: "example.com",
    expiryDate: "2026-12-01",
    daysUntilExpiry: 120,
    monitoringStatus: "healthy",
    notes: "Launch domain, keep forever",
    tags: ["production", "brand"],
    links: [
      {
        id: "link-1",
        name: "Website",
        url: "https://example.com",
        description: "Primary site",
      },
    ],
    notificationPreferences: [
      { type: "expiry_domain", enabled: true },
      { type: "ssl_expiry", enabled: false },
      { type: "dns_change", enabled: true },
    ],
    costings: {
      purchasePrice: 12,
      renewalCost: 18,
      currentValue: 250,
      autoRenew: true,
    },
    registrar: {
      name: "Spaceship, Inc.",
    },
    dns: {
      nameServers: [],
      mxRecords: [],
      txtRecords: [],
    },
    ssl: {
      issuer: "Unknown",
      validTo: "Unknown",
    },
    host: {
      org: "Unknown",
      city: "Unknown",
      country: "Unknown",
    },
    ...overrides,
  };
}

describe("portfolio CSV", () => {
  it("round-trips spreadsheet-friendly domain fields", () => {
    const csv = domainsToCsv([domain()]);
    const [input] = csvToDomainInputs(csv);

    expect(input).toMatchObject({
      domainName: "example.com",
      registrarName: "Spaceship, Inc.",
      expiryDate: "2026-12-01",
      notes: "Launch domain, keep forever",
      tags: ["production", "brand"],
      links: [
        {
          name: "Website",
          url: "https://example.com",
          description: "Primary site",
        },
      ],
      costings: {
        purchasePrice: 12,
        renewalCost: 18,
        currentValue: 250,
        autoRenew: true,
      },
    });
    expect(input.notificationPreferences?.filter((preference) => preference.enabled).map((preference) => preference.type)).toEqual([
      "expiry_domain",
      "dns_change",
    ]);
  });
});
