import { resolveIPv4, resolveIPv6, resolveMx, resolveNs, resolveTxt } from "./dns";
import { getSslEnrichment } from "./ssl";
import { getHostEnrichment } from "./host";
import { getWhoisEnrichment } from "./whois";
import type { EnrichmentResult } from "./types";

// ---------------------------------------------------------------------------
// Safe executor — one lookup failing doesn't abort the others.
// ---------------------------------------------------------------------------
async function safeRun<T>(
  fn: () => Promise<T>,
  fallback: T,
  errors: string[],
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    errors.push(`${label}: ${err instanceof Error ? err.message : "failed"}`);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Orchestrate all enrichment lookups in parallel.
// Never throws — partial results are valid.
// ---------------------------------------------------------------------------
export async function enrichDomain(domainName: string): Promise<EnrichmentResult> {
  const errors: string[] = [];

  const [whois, ipv4, ipv6, mx, txt, ns, ssl] = await Promise.all([
    safeRun(() => getWhoisEnrichment(domainName), null, errors, "WHOIS"),
    safeRun(() => resolveIPv4(domainName), [], errors, "IPv4"),
    safeRun(() => resolveIPv6(domainName), [], errors, "IPv6"),
    safeRun(() => resolveMx(domainName), [], errors, "MX records"),
    safeRun(() => resolveTxt(domainName), [], errors, "TXT records"),
    safeRun(() => resolveNs(domainName), [], errors, "NS records"),
    safeRun(() => getSslEnrichment(domainName), null, errors, "SSL cert"),
  ]);

  // Host lookup requires at least one IPv4 address.
  const host = ipv4.length > 0
    ? await safeRun(() => getHostEnrichment(ipv4[0]), null, errors, "Host geo")
    : null;

  return {
    whois,
    dns: {
      nameServers: ns,
      mxRecords: mx,
      txtRecords: txt,
      ipv4,
      ipv6,
    },
    ssl,
    host,
    errors,
  };
}
