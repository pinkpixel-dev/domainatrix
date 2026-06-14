import dns from "dns";

// ---------------------------------------------------------------------------
// DNS lookups using Node.js built-in dns module.
// All functions resolve gracefully — errors return empty arrays.
// ---------------------------------------------------------------------------

export const resolveIPv4 = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolve4(domain, (err, addresses) => resolve(err ? [] : addresses));
  });

export const resolveIPv6 = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolve6(domain, (err, addresses) => resolve(err ? [] : addresses));
  });

export const resolveMx = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolveMx(domain, (err, records) =>
      resolve(err ? [] : records.map((r) => `${r.exchange} (priority: ${r.priority})`)),
    );
  });

export const resolveTxt = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolveTxt(domain, (err, records) =>
      resolve(err ? [] : records.flatMap((r) => r)),
    );
  });

export const resolveNs = (domain: string): Promise<string[]> =>
  new Promise((resolve) => {
    dns.resolveNs(domain, (err, records) => resolve(err ? [] : records));
  });
