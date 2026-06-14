import { exec } from "child_process";
import { promisify } from "util";
import type { WhoisEnrichment } from "./types";

const execAsync = promisify(exec);

const WHOIS_TIMEOUT_MS = 8_000;
const RDAP_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";

// In-process cache for RDAP bootstrap data (survives the process lifetime).
let rdapBootstrapCache: Record<string, string> | null = null;

// ---------------------------------------------------------------------------
// Public entry point — three-layer fallback chain:
//   1. whois-json npm package
//   2. native `whois` CLI (skipped on serverless)
//   3. RDAP via IANA bootstrap
// ---------------------------------------------------------------------------

export async function getWhoisEnrichment(domain: string): Promise<WhoisEnrichment | null> {
  const trimmed = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").trim();

  // Layer 1: whois-json
  try {
    // Dynamic import avoids bundling this CJS-only package into anything
    // that might run on the client or in an Edge runtime.
    const whoisFn = (await import("whois-json")) as unknown as (
      d: string,
    ) => Promise<Record<string, unknown>>;
    const fn = typeof whoisFn === "function" ? whoisFn : (whoisFn as { default: typeof whoisFn }).default;

    const raw = await Promise.race([
      fn(trimmed),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("WHOIS timeout")), WHOIS_TIMEOUT_MS),
      ),
    ]);

    if (raw && typeof raw === "object" && Object.keys(raw).length > 0 && !raw.error) {
      const normalized = normalizeWhoisJson(raw);
      if (normalized.dates.expiryDate || (normalized.registrar.name && normalized.registrar.name !== "Unknown")) {
        return normalized;
      }
    }
  } catch {
    // fall through to next strategy
  }

  // Layer 2: native whois CLI (skip on serverless)
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY) {
    const native = await tryNativeWhois(trimmed);
    if (native && (native.dates.expiryDate || (native.registrar.name && native.registrar.name !== "Unknown"))) {
      return native;
    }
  }

  // Layer 3: RDAP via IANA
  const rdap = await tryRdapLookup(trimmed);
  if (rdap && (rdap.dates.expiryDate || rdap.registrar.name)) {
    return rdap;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise the mystery structure that whois-json returns into our clean type. */
function normalizeWhoisJson(raw: Record<string, unknown>): WhoisEnrichment {
  const str = (key: string): string | undefined => {
    const v = raw[key];
    return typeof v === "string" ? v : undefined;
  };

  const registrarRaw = raw.registrar;
  const registrarName =
    str("registrarName") ||
    (typeof registrarRaw === "string" ? registrarRaw : null) ||
    (registrarRaw && typeof registrarRaw === "object"
      ? (registrarRaw as { name?: string }).name ?? null
      : null) ||
    "Unknown";

  const datesRaw = raw.dates as Record<string, string | undefined> | undefined;

  return {
    domainName: str("domainName") ?? null,
    registrar: {
      name: registrarName,
      url: str("registrarUrl") ?? null,
    },
    dates: {
      creationDate: parseDate(
        str("creationDate") || str("createdDate") || str("created") || str("registered") ||
          (datesRaw?.["creation_date"] ?? datesRaw?.["created"]),
      ),
      updatedDate: parseDate(
        str("updatedDate") || str("lastUpdated") || str("updated") || str("lastModified") ||
          (datesRaw?.["updated_date"] ?? datesRaw?.["updated"]),
      ),
      expiryDate: parseDate(
        str("expiryDate") || str("registrarRegistrationExpirationDate") || str("expiresDate") ||
          str("expirationDate") || str("expiry") || str("expires") || str("paidUntil") ||
          (datesRaw?.["expiry_date"] ?? datesRaw?.["expires"]),
      ),
    },
    contact: {
      name: str("registrantName") ?? null,
      organization: str("registrantOrganization") ?? null,
      street: str("registrantStreet") ?? null,
      city: str("registrantCity") ?? null,
      country: str("registrantCountry") ?? null,
      state: str("registrantStateProvince") ?? null,
      postalCode: str("registrantPostalCode") ?? null,
    },
    abuse: {
      email: str("abuseContactEmail") || str("registrarAbuseContactEmail") || null,
    },
    status: parseStatusArray(str("domainStatus") || str("status")),
    dnssec: str("dnssec") ?? null,
  } as WhoisEnrichment;
}

/** Run system `whois` command and parse key-value output. */
async function tryNativeWhois(domain: string): Promise<WhoisEnrichment | null> {
  try {
    const sanitized = domain.replace(/[^a-zA-Z0-9.-]/g, "");
    if (!sanitized || sanitized !== domain) return null;

    const { stdout } = await execAsync(`whois ${sanitized}`, { timeout: 10_000 });
    if (!stdout || stdout.length < 50) return null;

    const data: Record<string, string> = {};
    for (const line of stdout.split(/\r?\n/)) {
      const match = line.trim().match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_");
        const value = match[2].trim();
        if (value && !value.startsWith("REDACTED") && !data[key]) {
          data[key] = value;
        }
      }
    }

    return {
      domainName: data.domain_name ?? null,
      registrar: {
        name: data.registrar ?? "Unknown",
        url: data.registrar_url ?? data.registrar_whois_server ?? null,
      },
      dates: {
        creationDate: parseDate(data.creation_date ?? data.created_date ?? data.registration_time),
        updatedDate: parseDate(data.updated_date ?? data.last_updated),
        expiryDate: parseDate(
          data.registry_expiry_date ?? data.registrar_registration_expiration_date ??
            data.expiry_date ?? data.expiration_time ?? data.paid_until,
        ),
      },
      contact: {
        name: data.registrant_name ?? null,
        organization: data.registrant_organization ?? null,
        street: data.registrant_street ?? null,
        city: data.registrant_city ?? null,
        country: data.registrant_country ?? null,
        state: data.registrant_state_province ?? data.registrant_state ?? null,
        postalCode: data.registrant_postal_code ?? null,
      },
      status: data.domain_status ? parseStatusArray(data.domain_status) : [],
      dnssec: data.dnssec ?? null,
    };
  } catch {
    return null;
  }
}

type VCardEntry = [string, Record<string, unknown>, string, string];
interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, VCardEntry[]];
}
interface RdapResponse {
  ldhName?: string;
  status?: string[];
  events?: { eventAction: string; eventDate: string }[];
  entities?: RdapEntity[];
  secureDNS?: { zoneSigned?: boolean };
}

async function getRdapUrlForTld(tld: string): Promise<string | null> {
  try {
    if (!rdapBootstrapCache) {
      const res = await fetch(RDAP_BOOTSTRAP_URL);
      if (!res.ok) return null;
      const json = (await res.json()) as { services: [string[], string[]][] };
      rdapBootstrapCache = {};
      for (const [tlds, urls] of json.services) {
        for (const name of tlds) {
          rdapBootstrapCache[name] = urls[0].replace(/\/$/, "");
        }
      }
    }
    return rdapBootstrapCache[tld] ?? null;
  } catch {
    return null;
  }
}

async function tryRdapLookup(domain: string): Promise<WhoisEnrichment | null> {
  try {
    const tld = domain.split(".").pop();
    if (!tld) return null;

    const rdapBase = await getRdapUrlForTld(tld);
    if (!rdapBase) return null;

    const res = await fetch(`${rdapBase}/domain/${domain}`);
    if (!res.ok) return null;
    const json = (await res.json()) as RdapResponse;

    const events = json.events ?? [];
    const getEvent = (action: string) => events.find((e) => e.eventAction === action)?.eventDate ?? undefined;

    const registrarEntity = json.entities?.find((e) => e.roles?.includes("registrar"));
    const registrarName =
      registrarEntity?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] ?? null;

    return {
      domainName: json.ldhName ?? null,
      registrar: { name: registrarName, url: null },
      dates: {
        creationDate: parseDate(getEvent("registration")),
        updatedDate: parseDate(getEvent("last changed")),
        expiryDate: parseDate(getEvent("expiration")),
      },
      contact: {},
      status: json.status ?? [],
      dnssec: json.secureDNS?.zoneSigned ? "signed" : null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Date parsing — handles ISO, DD/MM/YYYY, and most other common formats.
// ---------------------------------------------------------------------------
function parseDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  const cleaned = date.trim().replace(/\s+[A-Z]+$/, "").trim();

  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(cleaned)) {
    return cleaned.split(/[T\s]/)[0];
  }

  const match = cleaned.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (match) {
    const [, a, b, year] = match.map(Number);
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    const parsed = new Date(year, month - 1, day);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  }

  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().split("T")[0];
}

const KNOWN_STATUSES = [
  "clientDeleteProhibited", "clientHold", "clientRenewProhibited",
  "clientTransferProhibited", "clientUpdateProhibited",
  "serverDeleteProhibited", "serverHold", "serverRenewProhibited",
  "serverTransferProhibited", "serverUpdateProhibited",
  "inactive", "ok", "pendingCreate", "pendingDelete", "pendingRenew",
  "pendingRestore", "pendingTransfer", "pendingUpdate",
  "addPeriod", "autoRenewPeriod", "renewPeriod", "transferPeriod",
];

function parseStatusArray(status?: string): string[] {
  if (!status) return [];
  const normalized = status.toLowerCase();
  return Array.from(new Set(KNOWN_STATUSES.filter((s) => normalized.includes(s.toLowerCase()))));
}
