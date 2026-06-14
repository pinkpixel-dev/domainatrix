import type Database from "better-sqlite3";
import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { getDaysUntilExpiry, normalizeDomainName, validateDomainName } from "./domain-utils";
import { sampleDomains } from "./sample-data";
import type {
  DomainLink,
  DomainSummary,
  MonitoringStatus,
  NotificationPreference,
  NotificationType,
  RegistrarSuggestion,
} from "./types";
import type { EnrichmentResult } from "../enrichment/types";

const DEFAULT_USER_ID = "a0000000-aaaa-42a0-a0a0-00a000000a69";
const DEFAULT_USER_EMAIL = "domainatrix@local";

// ---------------------------------------------------------------------------
// Typed errors
// ---------------------------------------------------------------------------

export class DomainConflictError extends Error {
  constructor(
    public readonly domainName: string,
    public readonly existingId: string,
  ) {
    super(`Domain "${domainName}" already exists.`);
    this.name = "DomainConflictError";
  }
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreateDomainInput = {
  domainName: string;
  registrarName?: string;
  expiryDate?: string;
  notes?: string;
  tags?: string[];
  links?: DomainLinkInput[];
  costings?: DomainCostingsInput;
  notificationPreferences?: NotificationPreference[];
};

export type UpdateDomainInput = {
  registrarName?: string;
  expiryDate?: string;
  notes?: string;
  tags?: string[];
  links?: DomainLinkInput[];
  costings?: DomainCostingsInput;
  notificationPreferences?: NotificationPreference[];
};

export type DomainLinkInput = {
  name: string;
  url: string;
  description?: string;
};

export type DomainCostingsInput = {
  purchasePrice?: number;
  renewalCost?: number;
  currentValue?: number;
  autoRenew?: boolean;
};

export type PortfolioExport = {
  version: 1;
  exportedAt: string;
  domains: DomainSummary[];
};

export type ImportResult = {
  created: number;
  updated: number;
};

export type DomainUpdateInput = {
  domainId: string;
  change: string;
  changeType: NotificationType;
  oldValue?: string;
  newValue?: string;
};

export type DomainUpdateSummary = {
  id: string;
  domainId: string;
  domainName?: string;
  change: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  date: string;
};

export type UptimeCheckInput = {
  domainId: string;
  isUp: boolean;
  responseCode?: number | null;
  responseTimeMs?: number | null;
  dnsLookupTimeMs?: number | null;
  sslHandshakeTimeMs?: number | null;
};

export type UptimeCheckSummary = {
  id: string;
  domainId: string;
  checkedAt: string;
  isUp: boolean;
  responseCode: number | null;
  responseTimeMs: number | null;
  dnsLookupTimeMs: number | null;
  sslHandshakeTimeMs: number | null;
};

export type SubdomainSummary = {
  id: string;
  domainId: string;
  name: string;
  resolved: boolean;
  ipAddresses: string[];
  source: "crtsh" | "wordlist" | "both";
  discoveredAt: string;
};

type DomainRow = typeof schema.domains.$inferSelect;

// ---------------------------------------------------------------------------
// Repository factory
// ---------------------------------------------------------------------------

export function createDomainRepository(sqlite: Database.Database) {
  const db = drizzle(sqlite, { schema });

  async function ensureDefaultUser() {
    await db
      .insert(schema.users)
      .values({ id: DEFAULT_USER_ID, email: DEFAULT_USER_EMAIL })
      .onConflictDoNothing()
      .run();
  }

  async function upsertRegistrar(name: string, url?: string | null) {
    const registrarName = name.trim() || "Unknown";
    const id = `registrar-${toId(registrarName)}`;

    await db
      .insert(schema.registrars)
      .values({ id, userId: DEFAULT_USER_ID, name: registrarName, url: url ?? undefined })
      .onConflictDoNothing()
      .run();

    return id;
  }

  async function listDomains(): Promise<DomainSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select({ domain: schema.domains, registrar: schema.registrars })
      .from(schema.domains)
      .leftJoin(schema.registrars, eq(schema.domains.registrarId, schema.registrars.id))
      .orderBy(schema.domains.domainName);

    return Promise.all(
      rows.map(async (row) => {
        const details = await getDomainDetails(row.domain.id);
        return toDomainSummary(row.domain, { registrar: row.registrar, ...details });
      }),
    );
  }

  async function getDomainById(id: string): Promise<DomainSummary | null> {
    await ensureDefaultUser();

    const [row] = await db
      .select({ domain: schema.domains, registrar: schema.registrars })
      .from(schema.domains)
      .leftJoin(schema.registrars, eq(schema.domains.registrarId, schema.registrars.id))
      .where(eq(schema.domains.id, id))
      .limit(1);

    if (!row) return null;

    const details = await getDomainDetails(row.domain.id);
    return toDomainSummary(row.domain, { registrar: row.registrar, ...details });
  }

  async function listRegistrars(): Promise<RegistrarSuggestion[]> {
    await ensureDefaultUser();

    const registrarRows = await db
      .select()
      .from(schema.registrars)
      .where(eq(schema.registrars.userId, DEFAULT_USER_ID));

    const domainRows = await db
      .select({ registrarId: schema.domains.registrarId })
      .from(schema.domains)
      .where(eq(schema.domains.userId, DEFAULT_USER_ID));

    return registrarRows
      .map((registrar) => ({
        id: registrar.id,
        name: registrar.name,
        url: registrar.url ?? undefined,
        domainCount: domainRows.filter((domain) => domain.registrarId === registrar.id).length,
      }))
      .filter((registrar) => registrar.name !== "Unknown")
      .sort((a, b) => b.domainCount - a.domainCount || a.name.localeCompare(b.name))
      .slice(0, 25);
  }

  async function createDomain(input: CreateDomainInput): Promise<DomainSummary> {
    await ensureDefaultUser();

    const validation = validateDomainName(input.domainName);
    if (!validation.valid) throw new Error(validation.error);

    const domainName = normalizeDomainName(input.domainName);
    const id = toId(domainName);
    const registrarId = await upsertRegistrar(input.registrarName || "Unknown");

    try {
      await db
        .insert(schema.domains)
        .values({
          id,
          userId: DEFAULT_USER_ID,
          domainName,
          registrarId,
          expiryDate: input.expiryDate || null,
          notes: input.notes || "",
        })
        .run();
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const [existing] = await db
          .select({ id: schema.domains.id })
          .from(schema.domains)
          .where(and(eq(schema.domains.userId, DEFAULT_USER_ID), eq(schema.domains.domainName, domainName)))
          .limit(1);
        throw new DomainConflictError(domainName, existing?.id ?? id);
      }
      throw error;
    }

    if (input.tags && input.tags.length > 0) {
      await saveTags(id, input.tags);
    }

    if (input.links && input.links.length > 0) {
      await saveLinks(id, input.links);
    }

    if (input.costings) {
      await saveCostings(id, input.costings);
    }

    if (input.notificationPreferences && input.notificationPreferences.length > 0) {
      await saveNotificationPreferences(id, input.notificationPreferences);
    }

    const created = await getDomainById(id);
    if (!created) throw new Error("Failed to create domain.");
    return created;
  }

  async function updateDomain(id: string, input: UpdateDomainInput): Promise<DomainSummary> {
    await ensureDefaultUser();

    const existing = await getDomainById(id);
    if (!existing) throw new Error("Domain not found.");

    const registrarId = input.registrarName
      ? await upsertRegistrar(input.registrarName)
      : existing.registrar.name !== "Unknown"
        ? `registrar-${toId(existing.registrar.name)}`
        : null;

    await db
      .update(schema.domains)
      .set({
        registrarId: registrarId ?? undefined,
        expiryDate: input.expiryDate !== undefined ? input.expiryDate || null : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.domains.id, id))
      .run();

    if (input.tags !== undefined) {
      await db.delete(schema.domainTags).where(eq(schema.domainTags.domainId, id)).run();
      if (input.tags.length > 0) {
        await saveTags(id, input.tags);
      }
    }

    if (input.links !== undefined) {
      await db.delete(schema.domainLinks).where(eq(schema.domainLinks.domainId, id)).run();
      if (input.links.length > 0) {
        await saveLinks(id, input.links);
      }
    }

    if (input.costings !== undefined) {
      await saveCostings(id, input.costings);
    }

    if (input.notificationPreferences !== undefined) {
      await db.delete(schema.notificationPreferences).where(eq(schema.notificationPreferences.domainId, id)).run();
      if (input.notificationPreferences.length > 0) {
        await saveNotificationPreferences(id, input.notificationPreferences);
      }
    }

    const updated = await getDomainById(id);
    if (!updated) throw new Error("Failed to fetch updated domain.");
    return updated;
  }

  async function deleteDomain(id: string): Promise<boolean> {
    const existing = await getDomainById(id);
    if (!existing) return false;
    await db.delete(schema.domains).where(eq(schema.domains.id, id)).run();
    return true;
  }

  async function exportPortfolio(): Promise<PortfolioExport> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      domains: await listDomains(),
    };
  }

  async function importDomains(domainsToImport: DomainSummary[]): Promise<ImportResult> {
    let created = 0;
    let updated = 0;

    for (const domain of domainsToImport) {
      const domainName = normalizeDomainName(domain.name);
      const id = toId(domainName);
      const existing = await getDomainById(id);
      const input = {
        registrarName: domain.registrar.name,
        expiryDate: domain.expiryDate === "Untracked" ? undefined : domain.expiryDate,
        notes: domain.notes,
        tags: domain.tags,
        links: domain.links,
        costings: domain.costings,
        notificationPreferences: domain.notificationPreferences,
      };

      if (existing) {
        await updateDomain(id, input);
        updated += 1;
      } else {
        await createDomain({
          domainName,
          ...input,
        });
        created += 1;
      }
    }

    return { created, updated };
  }

  // ---------------------------------------------------------------------------
  // Enrichment persistence
  // ---------------------------------------------------------------------------

  async function saveEnrichmentData(domainId: string, result: EnrichmentResult): Promise<void> {
    const now = new Date().toISOString();

    // --- WHOIS: update registrar, domain dates, and contact info ---
    if (result.whois) {
      const { whois, dns: _dns } = result;

      // Upsert registrar from WHOIS data if it has a real name
      if (whois.registrar.name && whois.registrar.name !== "Unknown") {
        const registrarId = await upsertRegistrar(whois.registrar.name, whois.registrar.url);
        await db
          .update(schema.domains)
          .set({
            registrarId,
            registrationDate: whois.dates.creationDate ?? undefined,
            updatedDate: whois.dates.updatedDate ?? undefined,
            // Only update expiry if WHOIS returned one and we don't already have one
            updatedAt: now,
          })
          .where(eq(schema.domains.id, domainId))
          .run();
      }

      // Upsert WHOIS contact info
      await db
        .insert(schema.whoisInfo)
        .values({
          id: `whois-${domainId}`,
          domainId,
          name: whois.contact.name ?? null,
          organization: whois.contact.organization ?? null,
          street: whois.contact.street ?? null,
          city: whois.contact.city ?? null,
          country: whois.contact.country ?? null,
          state: whois.contact.state ?? null,
          postalCode: whois.contact.postalCode ?? null,
        })
        .onConflictDoUpdate({
          target: schema.whoisInfo.id,
          set: {
            name: whois.contact.name ?? null,
            organization: whois.contact.organization ?? null,
            street: whois.contact.street ?? null,
            city: whois.contact.city ?? null,
            country: whois.contact.country ?? null,
            state: whois.contact.state ?? null,
            postalCode: whois.contact.postalCode ?? null,
          },
        })
        .run();

      if (whois.status.length > 0) {
        await db.delete(schema.domainStatuses).where(eq(schema.domainStatuses.domainId, domainId)).run();

        for (const status of whois.status) {
          await db
            .insert(schema.domainStatuses)
            .values({
              id: `status-${domainId}-${toId(status)}`,
              domainId,
              statusCode: status,
            })
            .onConflictDoNothing()
            .run();
        }
      }
    }

    // --- DNS: replace all records with fresh data ---
    if (
      result.dns.nameServers.length > 0 ||
      result.dns.mxRecords.length > 0 ||
      result.dns.txtRecords.length > 0
    ) {
      await db.delete(schema.dnsRecords).where(eq(schema.dnsRecords.domainId, domainId)).run();

      const records = [
        ...result.dns.nameServers.map((v) => ({ type: "NS", value: v })),
        ...result.dns.mxRecords.map((v) => ({ type: "MX", value: v })),
        ...result.dns.txtRecords.map((v) => ({ type: "TXT", value: v })),
      ];

      for (const rec of records) {
        await db
          .insert(schema.dnsRecords)
          .values({
            id: `dns-${domainId}-${toId(rec.type)}-${toId(rec.value).slice(0, 40)}`,
            domainId,
            recordType: rec.type,
            recordValue: rec.value,
          })
          .onConflictDoNothing()
          .run();
      }
    }

    // --- IP addresses: replace with fresh data ---
    if (result.dns.ipv4.length > 0 || result.dns.ipv6.length > 0) {
      await db.delete(schema.ipAddresses).where(eq(schema.ipAddresses.domainId, domainId)).run();

      const ips = [
        ...result.dns.ipv4.map((ip) => ({ ip, isIpv6: false })),
        ...result.dns.ipv6.map((ip) => ({ ip, isIpv6: true })),
      ];

      for (const { ip, isIpv6 } of ips) {
        await db
          .insert(schema.ipAddresses)
          .values({
            id: `ip-${domainId}-${toId(ip)}`,
            domainId,
            ipAddress: ip,
            isIpv6,
          })
          .onConflictDoNothing()
          .run();
      }
    }

    // --- SSL cert: upsert with full fields ---
    if (result.ssl) {
      const ssl = result.ssl;
      await db
        .insert(schema.sslCertificates)
        .values({
          id: `ssl-${domainId}`,
          domainId,
          issuer: ssl.issuer,
          issuerCountry: ssl.issuerCountry,
          subject: ssl.subject,
          validFrom: ssl.validFrom,
          validTo: ssl.validTo,
          fingerprint: ssl.fingerprint,
          keySize: ssl.keySize,
          signatureAlgorithm: ssl.signatureAlgorithm,
        })
        .onConflictDoUpdate({
          target: schema.sslCertificates.id,
          set: {
            issuer: ssl.issuer,
            issuerCountry: ssl.issuerCountry,
            subject: ssl.subject,
            validFrom: ssl.validFrom,
            validTo: ssl.validTo,
            fingerprint: ssl.fingerprint,
            keySize: ssl.keySize,
            signatureAlgorithm: ssl.signatureAlgorithm,
            updatedAt: now,
          },
        })
        .run();
    }

    // --- Host: upsert with full geo fields ---
    if (result.host) {
      const h = result.host;
      const hostId = `host-${domainId}`;

      await db
        .insert(schema.hosts)
        .values({
          id: hostId,
          userId: DEFAULT_USER_ID,
          ip: h.ip,
          lat: h.lat,
          lon: h.lon,
          isp: h.isp,
          org: h.org,
          asNumber: h.asNumber,
          city: h.city,
          region: h.region,
          country: h.country,
        })
        .onConflictDoUpdate({
          target: schema.hosts.id,
          set: {
            ip: h.ip,
            lat: h.lat,
            lon: h.lon,
            isp: h.isp,
            org: h.org,
            asNumber: h.asNumber,
            city: h.city,
            region: h.region,
            country: h.country,
          },
        })
        .run();

      await db
        .insert(schema.domainHosts)
        .values({ domainId, hostId })
        .onConflictDoNothing()
        .run();
    }

    // Stamp updatedAt on the domain row to track last enrichment time
    await db
      .update(schema.domains)
      .set({ updatedAt: now })
      .where(eq(schema.domains.id, domainId))
      .run();
  }

  async function recordDomainUpdate(input: DomainUpdateInput): Promise<DomainUpdateSummary> {
    await ensureDefaultUser();

    const id = `domain-update-${Date.now()}-${toId(input.domainId)}-${toId(input.changeType)}`;
    await db
      .insert(schema.domainUpdates)
      .values({
        id,
        userId: DEFAULT_USER_ID,
        domainId: input.domainId,
        change: input.change,
        changeType: input.changeType,
        oldValue: input.oldValue ?? "",
        newValue: input.newValue ?? "",
      })
      .run();

    const [created] = await listDomainUpdates(input.domainId, { limit: 1 });
    if (!created) throw new Error("Failed to record domain update.");
    return created;
  }

  async function listDomainUpdates(domainId: string, options: { limit?: number } = {}): Promise<DomainUpdateSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select()
      .from(schema.domainUpdates)
      .where(eq(schema.domainUpdates.domainId, domainId))
      .orderBy(desc(schema.domainUpdates.date))
      .limit(options.limit ?? 50);

    return rows.map((row) => ({
      id: row.id,
      domainId: row.domainId,
      change: row.change,
      changeType: row.changeType,
      oldValue: row.oldValue ?? "",
      newValue: row.newValue ?? "",
      date: row.date,
    }));
  }

  async function listRecentDomainUpdates(options: { limit?: number } = {}): Promise<DomainUpdateSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select({
        update: schema.domainUpdates,
        domainName: schema.domains.domainName,
      })
      .from(schema.domainUpdates)
      .innerJoin(schema.domains, eq(schema.domainUpdates.domainId, schema.domains.id))
      .orderBy(desc(schema.domainUpdates.date))
      .limit(options.limit ?? 10);

    return rows.map((row) => ({
      id: row.update.id,
      domainId: row.update.domainId,
      domainName: row.domainName,
      change: row.update.change,
      changeType: row.update.changeType,
      oldValue: row.update.oldValue ?? "",
      newValue: row.update.newValue ?? "",
      date: row.update.date,
    }));
  }

  async function recordUptimeCheck(input: UptimeCheckInput): Promise<UptimeCheckSummary> {
    await ensureDefaultUser();

    const id = `uptime-${Date.now()}-${toId(input.domainId)}`;
    await db
      .insert(schema.uptime)
      .values({
        id,
        domainId: input.domainId,
        isUp: input.isUp,
        responseCode: input.responseCode ?? null,
        responseTimeMs: input.responseTimeMs ?? null,
        dnsLookupTimeMs: input.dnsLookupTimeMs ?? null,
        sslHandshakeTimeMs: input.sslHandshakeTimeMs ?? null,
      })
      .run();

    const [created] = await listDomainUptime(input.domainId, { limit: 1 });
    if (!created) throw new Error("Failed to record uptime check.");
    return created;
  }

  async function listDomainUptime(domainId: string, options: { limit?: number } = {}): Promise<UptimeCheckSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select()
      .from(schema.uptime)
      .where(eq(schema.uptime.domainId, domainId))
      .orderBy(desc(schema.uptime.checkedAt))
      .limit(options.limit ?? 20);

    return rows.map((row) => ({
      id: row.id,
      domainId: row.domainId,
      checkedAt: row.checkedAt,
      isUp: row.isUp,
      responseCode: row.responseCode,
      responseTimeMs: row.responseTimeMs,
      dnsLookupTimeMs: row.dnsLookupTimeMs,
      sslHandshakeTimeMs: row.sslHandshakeTimeMs,
    }));
  }

  // ---------------------------------------------------------------------------
  // Seeding
  // ---------------------------------------------------------------------------

  async function seedDefaults() {
    await ensureDefaultUser();

    const existing = await db.select({ id: schema.domains.id }).from(schema.domains).limit(1);
    if (existing.length > 0) return;

    for (const domain of sampleDomains) {
      const registrarId = await upsertRegistrar(domain.registrar.name, domain.registrar.url);
      const domainId = toId(domain.name);

      await db
        .insert(schema.domains)
        .values({
          id: domainId,
          userId: DEFAULT_USER_ID,
          domainName: domain.name,
          expiryDate: domain.expiryDate,
          notes: domain.notes,
          registrarId,
        })
        .onConflictDoNothing()
        .run();

      await saveTags(domainId, domain.tags);
      await saveLinks(domainId, domain.links);
      await saveNotificationPreferences(domainId, domain.notificationPreferences);
      await saveDns(domainId, domain.dns);
      await saveSsl(domainId, domain.ssl);
      await saveHost(domainId, domain.host);
    }
  }

  // ---------------------------------------------------------------------------
  // Seed helpers (used only during initial seeding)
  // ---------------------------------------------------------------------------

  async function saveTags(domainId: string, tags: string[]) {
    for (const tag of tags) {
      const tagId = `tag-${toId(tag)}`;
      await db.insert(schema.tags).values({ id: tagId, userId: DEFAULT_USER_ID, name: tag }).onConflictDoNothing().run();
      await db.insert(schema.domainTags).values({ domainId, tagId }).onConflictDoNothing().run();
    }
  }

  async function saveLinks(domainId: string, links: DomainLinkInput[]) {
    for (const link of links) {
      const name = link.name.trim();
      const url = link.url.trim();
      if (!name || !url) continue;

      await db
        .insert(schema.domainLinks)
        .values({
          id: `link-${domainId}-${toId(name)}`,
          domainId,
          linkName: name,
          linkUrl: url,
          linkDescription: link.description?.trim() || "",
        })
        .onConflictDoNothing()
        .run();
    }
  }

  async function saveDns(domainId: string, dns: DomainSummary["dns"]) {
    const records = [
      ...dns.nameServers.map((value) => ({ type: "NS", value })),
      ...dns.mxRecords.map((value) => ({ type: "MX", value })),
      ...dns.txtRecords.map((value) => ({ type: "TXT", value })),
    ];
    for (const record of records) {
      await db
        .insert(schema.dnsRecords)
        .values({ id: `dns-${domainId}-${toId(record.type)}-${toId(record.value)}`, domainId, recordType: record.type, recordValue: record.value })
        .onConflictDoNothing()
        .run();
    }
  }

  async function saveSsl(domainId: string, ssl: DomainSummary["ssl"]) {
    await db
      .insert(schema.sslCertificates)
      .values({ id: `ssl-${domainId}`, domainId, issuer: ssl.issuer, validTo: ssl.validTo === "Unknown" ? null : ssl.validTo })
      .onConflictDoNothing()
      .run();
  }

  async function saveHost(domainId: string, host: DomainSummary["host"]) {
    const hostId = `host-${domainId}`;
    await db.insert(schema.hosts).values({ id: hostId, userId: DEFAULT_USER_ID, ip: `seed-${domainId}`, org: host.org, city: host.city, country: host.country }).onConflictDoNothing().run();
    await db.insert(schema.domainHosts).values({ domainId, hostId }).onConflictDoNothing().run();
  }

  async function saveCostings(domainId: string, costings: DomainCostingsInput) {
    const now = new Date().toISOString();
    await db
      .insert(schema.domainCostings)
      .values({
        id: `costing-${domainId}`,
        domainId,
        purchasePrice: costings.purchasePrice ?? 0,
        renewalCost: costings.renewalCost ?? 0,
        currentValue: costings.currentValue ?? 0,
        autoRenew: costings.autoRenew ?? false,
      })
      .onConflictDoUpdate({
        target: schema.domainCostings.id,
        set: {
          purchasePrice: costings.purchasePrice ?? 0,
          renewalCost: costings.renewalCost ?? 0,
          currentValue: costings.currentValue ?? 0,
          autoRenew: costings.autoRenew ?? false,
          updatedAt: now,
        },
      })
      .run();
  }

  async function saveNotificationPreferences(domainId: string, preferences: NotificationPreference[]) {
    const now = new Date().toISOString();
    for (const preference of preferences) {
      await db
        .insert(schema.notificationPreferences)
        .values({
          id: `notification-preference-${domainId}-${preference.type}`,
          domainId,
          notificationType: preference.type,
          isEnabled: preference.enabled,
        })
        .onConflictDoUpdate({
          target: schema.notificationPreferences.id,
          set: {
            isEnabled: preference.enabled,
            updatedAt: now,
          },
        })
        .run();
    }
  }

  // ---------------------------------------------------------------------------
  // Detail query — loads all related data for a domain
  // ---------------------------------------------------------------------------

  async function getDomainDetails(domainId: string) {
    const tagRows = await db
      .select({ name: schema.tags.name })
      .from(schema.domainTags)
      .innerJoin(schema.tags, eq(schema.domainTags.tagId, schema.tags.id))
      .where(eq(schema.domainTags.domainId, domainId));

    const dnsRows = await db
      .select({ type: schema.dnsRecords.recordType, value: schema.dnsRecords.recordValue })
      .from(schema.dnsRecords)
      .where(eq(schema.dnsRecords.domainId, domainId));

    const linkRows = await db
      .select({
        id: schema.domainLinks.id,
        name: schema.domainLinks.linkName,
        url: schema.domainLinks.linkUrl,
        description: schema.domainLinks.linkDescription,
      })
      .from(schema.domainLinks)
      .where(eq(schema.domainLinks.domainId, domainId));

    const [ssl] = await db
      .select({
        issuer: schema.sslCertificates.issuer,
        issuerCountry: schema.sslCertificates.issuerCountry,
        subject: schema.sslCertificates.subject,
        validFrom: schema.sslCertificates.validFrom,
        validTo: schema.sslCertificates.validTo,
        fingerprint: schema.sslCertificates.fingerprint,
        keySize: schema.sslCertificates.keySize,
        signatureAlgorithm: schema.sslCertificates.signatureAlgorithm,
      })
      .from(schema.sslCertificates)
      .where(eq(schema.sslCertificates.domainId, domainId))
      .limit(1);

    const [host] = await db
      .select({
        org: schema.hosts.org,
        city: schema.hosts.city,
        country: schema.hosts.country,
        lat: schema.hosts.lat,
        lon: schema.hosts.lon,
        isp: schema.hosts.isp,
        asNumber: schema.hosts.asNumber,
        region: schema.hosts.region,
      })
      .from(schema.domainHosts)
      .innerJoin(schema.hosts, eq(schema.domainHosts.hostId, schema.hosts.id))
      .where(eq(schema.domainHosts.domainId, domainId))
      .limit(1);

    const [whoisRow] = await db
      .select({
        name: schema.whoisInfo.name,
        organization: schema.whoisInfo.organization,
        street: schema.whoisInfo.street,
        city: schema.whoisInfo.city,
        country: schema.whoisInfo.country,
        state: schema.whoisInfo.state,
        postalCode: schema.whoisInfo.postalCode,
      })
      .from(schema.whoisInfo)
      .where(eq(schema.whoisInfo.domainId, domainId))
      .limit(1);

    const statusRows = await db
      .select({ status: schema.domainStatuses.statusCode })
      .from(schema.domainStatuses)
      .where(eq(schema.domainStatuses.domainId, domainId));

    const ipRows = await db
      .select({ ip: schema.ipAddresses.ipAddress, isIpv6: schema.ipAddresses.isIpv6 })
      .from(schema.ipAddresses)
      .where(eq(schema.ipAddresses.domainId, domainId));

    const [costing] = await db
      .select({
        purchasePrice: schema.domainCostings.purchasePrice,
        renewalCost: schema.domainCostings.renewalCost,
        currentValue: schema.domainCostings.currentValue,
        autoRenew: schema.domainCostings.autoRenew,
      })
      .from(schema.domainCostings)
      .where(eq(schema.domainCostings.domainId, domainId))
      .limit(1);

    const notificationPreferenceRows = await db
      .select({
        type: schema.notificationPreferences.notificationType,
        enabled: schema.notificationPreferences.isEnabled,
      })
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.domainId, domainId));

    return {
      tags: tagRows.map((t) => t.name),
      links: linkRows
        .map((link): DomainLink => ({
          id: link.id,
          name: link.name,
          url: link.url,
          description: link.description ?? "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      notificationPreferences: notificationPreferenceRows
        .map((preference) => ({
          type: preference.type as NotificationPreference["type"],
          enabled: preference.enabled,
        }))
        .sort((a, b) => a.type.localeCompare(b.type)),
      costings: {
        purchasePrice: costing?.purchasePrice ?? 0,
        renewalCost: costing?.renewalCost ?? 0,
        currentValue: costing?.currentValue ?? 0,
        autoRenew: costing?.autoRenew ?? false,
      },
      dns: {
        nameServers: valuesForType(dnsRows, "NS"),
        mxRecords: valuesForType(dnsRows, "MX"),
        txtRecords: valuesForType(dnsRows, "TXT"),
      },
      ssl: {
        issuer: ssl?.issuer || "Unknown",
        validTo: ssl?.validTo || "Unknown",
        validFrom: ssl?.validFrom ?? undefined,
        issuerCountry: ssl?.issuerCountry ?? undefined,
        subject: ssl?.subject ?? undefined,
        fingerprint: ssl?.fingerprint ?? undefined,
        keySize: ssl?.keySize ?? undefined,
        signatureAlgorithm: ssl?.signatureAlgorithm ?? undefined,
      },
      host: {
        org: host?.org || "Unknown",
        city: host?.city || "Unknown",
        country: host?.country || "Unknown",
        lat: host?.lat ?? undefined,
        lon: host?.lon ?? undefined,
        isp: host?.isp ?? undefined,
        asNumber: host?.asNumber ?? undefined,
        region: host?.region ?? undefined,
      },
      whois: whoisRow
        ? {
            name: whoisRow.name,
            organization: whoisRow.organization,
            street: whoisRow.street,
            city: whoisRow.city,
            country: whoisRow.country,
            state: whoisRow.state,
            postalCode: whoisRow.postalCode,
            status: statusRows.map((row) => row.status),
          }
        : undefined,
      ipAddresses:
        ipRows.length > 0
          ? {
              ipv4: ipRows.filter((r) => !r.isIpv6).map((r) => r.ip),
              ipv6: ipRows.filter((r) => r.isIpv6).map((r) => r.ip),
            }
          : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Shape mapping
  // ---------------------------------------------------------------------------

  function toDomainSummary(
    domain: DomainRow,
    details: {
      registrar: typeof schema.registrars.$inferSelect | null;
      tags: string[];
      links: DomainSummary["links"];
      notificationPreferences: DomainSummary["notificationPreferences"];
      costings: DomainSummary["costings"];
      dns: DomainSummary["dns"];
      ssl: DomainSummary["ssl"];
      host: DomainSummary["host"];
      whois?: DomainSummary["whois"];
      ipAddresses?: DomainSummary["ipAddresses"];
    },
  ): DomainSummary {
    return {
      id: domain.id,
      name: domain.domainName,
      expiryDate: domain.expiryDate || "Untracked",
      registrationDate: domain.registrationDate ?? undefined,
      updatedDate: domain.updatedDate ?? undefined,
      daysUntilExpiry: domain.expiryDate ? getDaysUntilExpiry(domain.expiryDate) : 0,
      monitoringStatus: getMonitoringStatus(domain.expiryDate, details.host.org),
      notes: domain.notes || "",
      tags: details.tags,
      links: details.links,
      notificationPreferences: details.notificationPreferences,
      costings: details.costings,
      registrar: {
        name: details.registrar?.name || "Unknown",
        url: details.registrar?.url || undefined,
      },
      dns: details.dns,
      ssl: details.ssl,
      host: details.host,
      whois: details.whois,
      ipAddresses: details.ipAddresses,
      lastEnriched: domain.updatedAt,
    };
  }


  async function listPortfolioUptime(options: { limit?: number } = {}): Promise<UptimeCheckSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select()
      .from(schema.uptime)
      .orderBy(desc(schema.uptime.checkedAt))
      .limit(options.limit ?? 50);

    return rows.map((row) => ({
      id: row.id,
      domainId: row.domainId,
      checkedAt: row.checkedAt,
      isUp: row.isUp,
      responseCode: row.responseCode,
      responseTimeMs: row.responseTimeMs,
      dnsLookupTimeMs: row.dnsLookupTimeMs,
      sslHandshakeTimeMs: row.sslHandshakeTimeMs,
    }));
  }

  async function saveSubdomains(
    domainId: string,
    subdomains: Array<{
      name: string;
      resolved: boolean;
      ipAddresses: string[];
      source: "crtsh" | "wordlist" | "both";
    }>,
  ): Promise<void> {
    await ensureDefaultUser();

    // Replace all existing subdomains for this domain
    await db.delete(schema.subDomains).where(eq(schema.subDomains.domainId, domainId)).run();

    for (const sub of subdomains) {
      const id = `sd-${domainId}-${sub.name.replace(/\./g, "-")}`;
      await db
        .insert(schema.subDomains)
        .values({
          id,
          domainId,
          name: sub.name,
          sdInfo: JSON.stringify({
            resolved: sub.resolved,
            ipAddresses: sub.ipAddresses,
            source: sub.source,
          }),
        })
        .onConflictDoNothing()
        .run();
    }
  }

  async function listSubdomains(domainId: string): Promise<SubdomainSummary[]> {
    await ensureDefaultUser();

    const rows = await db
      .select()
      .from(schema.subDomains)
      .where(eq(schema.subDomains.domainId, domainId))
      .orderBy(schema.subDomains.name);

    return rows.map((row) => {
      const info = (row.sdInfo as {
        resolved?: boolean;
        ipAddresses?: string[];
        source?: "crtsh" | "wordlist" | "both";
      } | null) ?? {};

      return {
        id: row.id,
        domainId: row.domainId,
        name: row.name,
        resolved: info.resolved ?? false,
        ipAddresses: info.ipAddresses ?? [],
        source: info.source ?? "wordlist",
        discoveredAt: row.createdAt,
      };
    });
  }

  return {
    seedDefaults,
    listDomains,
    getDomainById,
    listRegistrars,
    createDomain,
    updateDomain,
    deleteDomain,
    exportPortfolio,
    importDomains,
    saveEnrichmentData,
    recordDomainUpdate,
    listDomainUpdates,
    listRecentDomainUpdates,
    recordUptimeCheck,
    listDomainUptime,
    listPortfolioUptime,
    saveSubdomains,
    listSubdomains,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  if (code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT") return true;
  return error.message.includes("UNIQUE constraint failed");
}

function valuesForType(rows: { type: string; value: string }[], type: string) {
  return rows.filter((r) => r.type === type).map((r) => r.value);
}

function getMonitoringStatus(expiryDate: string | null, hostOrg: string): MonitoringStatus {
  if (hostOrg === "Unknown") return "unknown";
  if (expiryDate && getDaysUntilExpiry(expiryDate) <= 30) return "warning";
  return "healthy";
}

function toId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
