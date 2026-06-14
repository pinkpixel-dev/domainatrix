import { describe, expect, it } from "vitest";
import { detectDomainChanges } from "./domain-change-detection";
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
    notificationPreferences: [],
    costings: {
      purchasePrice: 0,
      renewalCost: 0,
      currentValue: 0,
      autoRenew: false,
    },
    registrar: { name: "Porkbun" },
    dns: {
      nameServers: ["ns1.old.example", "ns2.old.example"],
      mxRecords: ["10 old.example"],
      txtRecords: ["v=old"],
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
      asNumber: "AS123",
    },
    whois: {
      organization: "Old Org",
      city: "Austin",
      country: "US",
      status: ["clientTransferProhibited"],
    },
    ipAddresses: {
      ipv4: ["192.0.2.1"],
      ipv6: [],
    },
    ...overrides,
  };
}

function enrichment(overrides: Partial<EnrichmentResult> = {}): EnrichmentResult {
  return {
    whois: {
      domainName: "example.dev",
      registrar: { name: "Namecheap", url: "https://namecheap.com" },
      dates: {
        creationDate: "2024-01-02",
        updatedDate: "2026-01-03",
        expiryDate: "2026-12-24",
      },
      contact: {
        organization: "New Org",
        city: "Boston",
        country: "US",
      },
      status: ["serverTransferProhibited"],
    },
    dns: {
      nameServers: ["ns1.new.example", "ns2.new.example"],
      mxRecords: ["10 new.example"],
      txtRecords: ["v=new"],
      ipv4: ["198.51.100.10"],
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
    host: {
      ip: "198.51.100.10",
      org: "New Host",
      city: "Boston",
      region: "MA",
      country: "US",
      lat: 42.36,
      lon: -71.05,
      isp: "New ISP",
      asNumber: "AS456",
    },
    errors: [],
    ...overrides,
  };
}

describe("domain change detection", () => {
  it("detects meaningful enrichment changes by notification category", () => {
    expect(detectDomainChanges(domain(), enrichment()).map((change) => change.changeType)).toEqual([
      "registrar_change",
      "dns_change",
      "ip_change",
      "ssl_change",
      "host_change",
      "whois_change",
      "security_change",
    ]);
  });

  it("does not report changes for missing partial enrichment sections", () => {
    const changes = detectDomainChanges(
      domain(),
      enrichment({
        whois: null,
        dns: {
          nameServers: [],
          mxRecords: [],
          txtRecords: [],
          ipv4: [],
          ipv6: [],
        },
        ssl: null,
        host: null,
      }),
    );

    expect(changes).toEqual([]);
  });
});
