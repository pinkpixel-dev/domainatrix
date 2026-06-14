import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { createDomainRepository } from "./domain-repository";
import type { EnrichmentResult } from "../enrichment/types";

describe("domain repository", () => {
  let tempDir: string;
  let sqlite: Database.Database;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "domainatrix-"));
    sqlite = new Database(join(tempDir, "test.sqlite"));
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: "drizzle" });
  });

  afterEach(() => {
    sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("seeds default domains only once", async () => {
    const repository = createDomainRepository(sqlite);

    await repository.seedDefaults();
    await repository.seedDefaults();

    const domains = await repository.listDomains();

    expect(domains.map((domain) => domain.name)).toEqual([
      "domainatrix.app",
      "pinkpixel.dev",
      "sizzlebop.dev",
    ]);
  });

  it("creates and reads back a draft domain", async () => {
    const repository = createDomainRepository(sqlite);

    const created = await repository.createDomain({
      domainName: "https://www.Example.dev/path",
      registrarName: "Porkbun",
      expiryDate: "2026-12-24",
      notes: "Launch candidate.",
      costings: {
        purchasePrice: 12.5,
        renewalCost: 18.99,
        currentValue: 250,
        autoRenew: true,
      },
      notificationPreferences: [
        { type: "expiry_domain", enabled: true },
        { type: "ssl_expiry", enabled: false },
        { type: "dns_change", enabled: true },
      ],
      links: [
        {
          name: "Production",
          url: "https://example.dev",
          description: "Live site.",
        },
      ],
    });

    const fetched = await repository.getDomainById(created.id);

    expect(fetched).toMatchObject({
      id: "example-dev",
      name: "example.dev",
      expiryDate: "2026-12-24",
      daysUntilExpiry: expect.any(Number),
      registrar: { name: "Porkbun" },
      notes: "Launch candidate.",
      monitoringStatus: "unknown",
      costings: {
        purchasePrice: 12.5,
        renewalCost: 18.99,
        currentValue: 250,
        autoRenew: true,
      },
      notificationPreferences: [
        { type: "dns_change", enabled: true },
        { type: "expiry_domain", enabled: true },
        { type: "ssl_expiry", enabled: false },
      ],
      links: [
        {
          name: "Production",
          url: "https://example.dev",
          description: "Live site.",
        },
      ],
    });
  });

  it("updates domain costings without changing the domain name", async () => {
    const repository = createDomainRepository(sqlite);

    const created = await repository.createDomain({
      domainName: "example.dev",
      registrarName: "Porkbun",
    });

    const updated = await repository.updateDomain(created.id, {
      costings: {
        purchasePrice: 9,
        renewalCost: 21,
        currentValue: 100,
        autoRenew: false,
      },
    });

    expect(updated).toMatchObject({
      id: "example-dev",
      name: "example.dev",
      costings: {
        purchasePrice: 9,
        renewalCost: 21,
        currentValue: 100,
        autoRenew: false,
      },
    });
  });

  it("replaces notification preferences on update", async () => {
    const repository = createDomainRepository(sqlite);

    const created = await repository.createDomain({
      domainName: "example.dev",
      notificationPreferences: [
        { type: "expiry_domain", enabled: true },
        { type: "ssl_expiry", enabled: true },
      ],
    });

    const updated = await repository.updateDomain(created.id, {
      notificationPreferences: [
        { type: "expiry_domain", enabled: false },
        { type: "dns_change", enabled: true },
      ],
    });

    expect(updated.notificationPreferences).toEqual([
      { type: "dns_change", enabled: true },
      { type: "expiry_domain", enabled: false },
    ]);
  });

  it("replaces domain links on update", async () => {
    const repository = createDomainRepository(sqlite);

    const created = await repository.createDomain({
      domainName: "example.dev",
      links: [
        { name: "Old docs", url: "https://old.example.dev/docs", description: "Old docs." },
      ],
    });

    const updated = await repository.updateDomain(created.id, {
      links: [
        { name: "Homepage", url: "https://example.dev", description: "Live site." },
        { name: "Admin", url: "https://admin.example.dev" },
      ],
    });

    expect(updated.links).toEqual([
      { id: "link-example-dev-admin", name: "Admin", url: "https://admin.example.dev", description: "" },
      { id: "link-example-dev-homepage", name: "Homepage", url: "https://example.dev", description: "Live site." },
    ]);
  });

  it("returns enriched WHOIS details for the domain detail UI", async () => {
    const repository = createDomainRepository(sqlite);
    const created = await repository.createDomain({
      domainName: "example.dev",
      registrarName: "Unknown",
    });

    await repository.saveEnrichmentData(created.id, enrichmentWithWhoisOnly());

    const fetched = await repository.getDomainById(created.id);

    expect(fetched).toMatchObject({
      registrar: { name: "Porkbun", url: "https://porkbun.com" },
      registrationDate: "2024-01-02",
      updatedDate: "2026-02-03",
      whois: {
        organization: "Example Labs",
        city: "Austin",
        country: "US",
        status: ["clientTransferProhibited", "serverTransferProhibited"],
      },
    });
  });

  it("lists registrars for autocomplete sorted by domain count then name", async () => {
    const repository = createDomainRepository(sqlite);

    await repository.createDomain({ domainName: "alpha.dev", registrarName: "Namecheap" });
    await repository.createDomain({ domainName: "beta.dev", registrarName: "Porkbun" });
    await repository.createDomain({ domainName: "gamma.dev", registrarName: "Namecheap" });

    const registrars = await repository.listRegistrars();

    expect(registrars).toEqual([
      { id: "registrar-namecheap", name: "Namecheap", url: undefined, domainCount: 2 },
      { id: "registrar-porkbun", name: "Porkbun", url: undefined, domainCount: 1 },
    ]);
  });

  it("exports and imports domains with core metadata", async () => {
    const repository = createDomainRepository(sqlite);

    await repository.createDomain({
      domainName: "example.dev",
      registrarName: "Porkbun",
      expiryDate: "2027-01-01",
      notes: "Portable domain.",
      tags: ["portable"],
      links: [{ name: "Homepage", url: "https://example.dev" }],
      costings: { purchasePrice: 10, renewalCost: 12, currentValue: 50, autoRenew: true },
      notificationPreferences: [{ type: "expiry_domain", enabled: true }],
    });

    const exported = await repository.exportPortfolio();
    await repository.deleteDomain("example-dev");

    const result = await repository.importDomains(exported.domains);
    const imported = await repository.getDomainById("example-dev");

    expect(result).toEqual({ created: 1, updated: 0 });
    expect(imported).toMatchObject({
      name: "example.dev",
      registrar: { name: "Porkbun" },
      expiryDate: "2027-01-01",
      notes: "Portable domain.",
      tags: ["portable"],
      links: [{ name: "Homepage", url: "https://example.dev" }],
      costings: { purchasePrice: 10, renewalCost: 12, currentValue: 50, autoRenew: true },
      notificationPreferences: [{ type: "expiry_domain", enabled: true }],
    });
  });

  it("records domain updates for monitoring change history", async () => {
    const repository = createDomainRepository(sqlite);
    const created = await repository.createDomain({ domainName: "example.dev" });

    await repository.recordDomainUpdate({
      domainId: created.id,
      change: "DNS records changed for example.dev.",
      changeType: "dns_change",
      oldValue: "NS ns1.old.example",
      newValue: "NS ns1.new.example",
    });

    expect(await repository.listDomainUpdates(created.id)).toMatchObject([
      {
        domainId: created.id,
        change: "DNS records changed for example.dev.",
        changeType: "dns_change",
        oldValue: "NS ns1.old.example",
        newValue: "NS ns1.new.example",
      },
    ]);
  });

  it("lists recent domain updates across the portfolio", async () => {
    const repository = createDomainRepository(sqlite);
    const first = await repository.createDomain({ domainName: "first.dev" });
    const second = await repository.createDomain({ domainName: "second.dev" });

    await repository.recordDomainUpdate({
      domainId: first.id,
      change: "DNS records changed for first.dev.",
      changeType: "dns_change",
      oldValue: "NS ns1.old.example",
      newValue: "NS ns1.new.example",
    });
    await repository.recordDomainUpdate({
      domainId: second.id,
      change: "SSL certificate changed for second.dev.",
      changeType: "ssl_change",
      oldValue: "Old CA",
      newValue: "New CA",
    });

    expect(await repository.listRecentDomainUpdates({ limit: 2 })).toHaveLength(2);
    expect(await repository.listRecentDomainUpdates({ limit: 1 })).toMatchObject([
      {
        domainId: expect.any(String),
        domainName: expect.any(String),
        change: expect.any(String),
      },
    ]);
  });

  it("records uptime checks for a domain", async () => {
    const repository = createDomainRepository(sqlite);
    const created = await repository.createDomain({ domainName: "example.dev" });

    await repository.recordUptimeCheck({
      domainId: created.id,
      isUp: true,
      responseCode: 200,
      responseTimeMs: 123,
      dnsLookupTimeMs: 0,
      sslHandshakeTimeMs: 0,
    });

    expect(await repository.listDomainUptime(created.id)).toMatchObject([
      {
        domainId: created.id,
        isUp: true,
        responseCode: 200,
        responseTimeMs: 123,
      },
    ]);
  });
});

function enrichmentWithWhoisOnly(): EnrichmentResult {
  return {
    whois: {
      domainName: "example.dev",
      registrar: {
        name: "Porkbun",
        url: "https://porkbun.com",
      },
      dates: {
        creationDate: "2024-01-02",
        updatedDate: "2026-02-03",
        expiryDate: "2027-04-05",
      },
      contact: {
        organization: "Example Labs",
        city: "Austin",
        state: "TX",
        country: "US",
        postalCode: "78701",
      },
      status: ["clientTransferProhibited", "serverTransferProhibited"],
      dnssec: "signed",
    },
    dns: {
      nameServers: [],
      mxRecords: [],
      txtRecords: [],
      ipv4: [],
      ipv6: [],
    },
    ssl: null,
    host: null,
    errors: [],
  };
}
