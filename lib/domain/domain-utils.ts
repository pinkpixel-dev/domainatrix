const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function normalizeDomainName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function validateDomainName(input: string): { valid: true } | { valid: false; error: string } {
  const domain = normalizeDomainName(input);

  if (!domain) {
    return { valid: false, error: "Domain name is required." };
  }

  if (!DOMAIN_PATTERN.test(domain)) {
    return { valid: false, error: "Enter a valid domain like example.com." };
  }

  return { valid: true };
}

export function getDaysUntilExpiry(expiryDate: string, now = new Date()) {
  const expiry = new Date(`${expiryDate}T00:00:00Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diff = expiry.getTime() - today.getTime();

  return Math.ceil(diff / 86_400_000);
}
