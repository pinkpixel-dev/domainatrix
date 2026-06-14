// ---------------------------------------------------------------------------
// Common subdomain wordlist — high-value names that may not have certs
// ---------------------------------------------------------------------------
const WORDLIST = [
  "www", "mail", "email", "smtp", "pop", "imap", "webmail",
  "api", "api2", "rest", "graphql", "v1", "v2", "v3",
  "app", "apps", "web", "portal", "dashboard", "admin",
  "dev", "development", "staging", "stage", "test", "uat", "qa", "sandbox",
  "cdn", "static", "assets", "media", "img", "images", "files", "uploads",
  "docs", "help", "support", "kb", "status", "monitor",
  "blog", "news", "shop", "store", "payment", "checkout",
  "auth", "login", "sso", "account", "accounts",
  "git", "gitlab", "github", "ci", "jenkins", "deploy",
  "vpn", "remote", "proxy", "gateway", "lb", "load",
  "db", "database", "mysql", "postgres", "redis", "mongo",
  "ns", "ns1", "ns2", "dns", "mx", "ftp", "sftp",
  "m", "mobile", "wap",
  "intranet", "internal", "corp", "private",
  "beta", "alpha", "preview", "canary",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DiscoveredSubdomain = {
  name: string; // full hostname e.g. "api.example.com"
  source: "crtsh" | "wordlist" | "both";
  resolved: boolean;
  ipAddresses: string[];
};

export type SubdomainDiscoveryResult = {
  domain: string;
  subdomains: DiscoveredSubdomain[];
  errors: string[];
};

// ---------------------------------------------------------------------------
// 1. crt.sh — Certificate Transparency logs (with retry for 5xx)
// ---------------------------------------------------------------------------
async function queryCrtSh(domain: string): Promise<string[]> {
  const url = `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "Domainatrix/1.0 subdomain-discovery" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      if (attempt < 3) {
        await sleep(1000 * attempt);
        continue;
      }
      throw new Error("crt.sh timed out");
    }

    // 404 = domain has no certificate history — valid empty result
    if (res.status === 404) return [];

    // 5xx = transient server error — retry
    if (res.status >= 500 && attempt < 3) {
      await sleep(1000 * attempt);
      continue;
    }

    if (!res.ok) {
      throw new Error(`crt.sh responded with ${res.status}`);
    }

    const rows = (await res.json()) as { name_value: string }[];
    const names = new Set<string>();
    for (const row of rows) {
      for (const raw of row.name_value.split("\n")) {
        const name = raw.trim().toLowerCase();
        const cleaned = name.startsWith("*.") ? name.slice(2) : name;
        if (cleaned && cleaned !== domain && cleaned.endsWith(`.${domain}`)) {
          names.add(cleaned);
        }
      }
    }
    return [...names];
  }

  throw new Error("crt.sh unavailable after 3 attempts");
}

// ---------------------------------------------------------------------------
// 2. HTTP probe — checks if a hostname responds to HTTPS/HTTP
//    Using HTTP probing instead of raw DNS resolution handles:
//    - Cloudflare-proxied subdomains (return ENODATA on direct DNS)
//    - Wildcard DNS setups (*.domain.com → CDN edge)
//    Any HTTP response (including 4xx) means the host exists.
// ---------------------------------------------------------------------------
async function httpProbe(hostname: string): Promise<boolean> {
  for (const scheme of ["https", "http"] as const) {
    try {
      const res = await fetch(`${scheme}://${hostname}`, {
        method: "HEAD",
        redirect: "manual", // don't follow redirects — just check the host exists
        signal: AbortSignal.timeout(5_000),
      });
      // Any response (200, 301, 403, 404, etc.) means the host is reachable
      if (res.status > 0) return true;
    } catch {
      // Connection refused, ENOTFOUND, timeout — try next scheme
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 3. DNS wordlist brute-force using HTTP probing
// ---------------------------------------------------------------------------
async function wordlistBrute(domain: string): Promise<string[]> {
  const results: string[] = [];

  await Promise.allSettled(
    WORDLIST.map(async (word) => {
      const hostname = `${word}.${domain}`;
      const alive = await httpProbe(hostname);
      if (alive) results.push(hostname);
    }),
  );

  return results;
}

// ---------------------------------------------------------------------------
// 4. Resolve IPs for a confirmed live hostname via DNS
//    Best-effort — Cloudflare-proxied hosts will return Cloudflare edge IPs
// ---------------------------------------------------------------------------
async function resolveIps(hostname: string): Promise<string[]> {
  const { resolve4, resolve6 } = await import("node:dns/promises");
  const [v4, v6] = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  return [
    ...(v4.status === "fulfilled" ? v4.value : []),
    ...(v6.status === "fulfilled" ? v6.value : []),
  ];
}

// ---------------------------------------------------------------------------
// Main discovery orchestrator
// ---------------------------------------------------------------------------
export async function discoverSubdomains(domain: string): Promise<SubdomainDiscoveryResult> {
  const errors: string[] = [];

  // crt.sh + wordlist HTTP probe in parallel
  const [crtshNames, wordlistNames] = await Promise.all([
    queryCrtSh(domain).catch((err) => {
      // crt.sh is occasionally down — fail silently, wordlist results still return
      console.warn(`[subdomains] crt.sh soft failure for ${domain}:`, err instanceof Error ? err.message : err);
      return [] as string[];
    }),
    wordlistBrute(domain),
  ]);

  // De-dupe, tracking source per subdomain
  const sourceMap = new Map<string, Set<"crtsh" | "wordlist">>();
  for (const name of crtshNames) {
    if (!sourceMap.has(name)) sourceMap.set(name, new Set());
    sourceMap.get(name)!.add("crtsh");
  }
  for (const name of wordlistNames) {
    if (!sourceMap.has(name)) sourceMap.set(name, new Set());
    sourceMap.get(name)!.add("wordlist");
  }

  // For each unique host: best-effort IP resolution (already confirmed alive via HTTP)
  const subdomains: DiscoveredSubdomain[] = await Promise.all(
    [...sourceMap.entries()].map(async ([name, sources]) => {
      const ips = await resolveIps(name).catch(() => [] as string[]);
      const srcArr = [...sources] as ("crtsh" | "wordlist")[];
      const source: DiscoveredSubdomain["source"] =
        srcArr.includes("crtsh") && srcArr.includes("wordlist")
          ? "both"
          : srcArr[0];

      return {
        name,
        source,
        // wordlist entries already proved alive via HTTP probe
        // crtsh-only entries still need confirmation
        resolved: sources.has("wordlist") || ips.length > 0,
        ipAddresses: ips,
      };
    }),
  );

  subdomains.sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { domain, subdomains, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
