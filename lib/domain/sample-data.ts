import { getDaysUntilExpiry } from "./domain-utils";
import type { DomainSummary } from "./types";

const rawDomains = [
  {
    id: "pinkpixel-dev",
    name: "pinkpixel.dev",
    expiryDate: "2026-09-18",
    monitoringStatus: "healthy",
    notes: "Primary Pink Pixel site and brand hub.",
    tags: ["brand", "production"],
    links: [
      {
        id: "link-pinkpixel-dev-website",
        name: "Website",
        url: "https://pinkpixel.dev",
        description: "Public brand hub.",
      },
    ],
    notificationPreferences: [
      { type: "expiry_domain", enabled: true },
      { type: "ssl_expiry", enabled: true },
      { type: "dns_change", enabled: true },
    ],
    costings: {
      purchasePrice: 12.99,
      renewalCost: 14.98,
      currentValue: 250,
      autoRenew: true,
    },
    registrar: { name: "Namecheap", url: "https://namecheap.com" },
    dns: {
      nameServers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"],
      mxRecords: ["mx1.privateemail.com", "mx2.privateemail.com"],
      txtRecords: ["v=spf1 include:spf.privateemail.com ~all"],
    },
    ssl: { issuer: "Let's Encrypt", validTo: "2026-08-21" },
    host: { org: "Cloudflare", city: "San Francisco", country: "US" },
  },
  {
    id: "domainatrix-app",
    name: "domainatrix.app",
    expiryDate: "2026-07-04",
    monitoringStatus: "warning",
    notes: "Future home for the rebranded domain monitoring app.",
    tags: ["product", "watch"],
    links: [
      {
        id: "link-domainatrix-app-product",
        name: "Product",
        url: "https://domainatrix.app",
        description: "Future public product page.",
      },
    ],
    notificationPreferences: [
      { type: "expiry_domain", enabled: true },
      { type: "ssl_expiry", enabled: true },
      { type: "dns_change", enabled: false },
    ],
    costings: {
      purchasePrice: 19.99,
      renewalCost: 24.99,
      currentValue: 120,
      autoRenew: false,
    },
    registrar: { name: "Porkbun", url: "https://porkbun.com" },
    dns: {
      nameServers: ["curitiba.ns.porkbun.com", "fortaleza.ns.porkbun.com"],
      mxRecords: [],
      txtRecords: [],
    },
    ssl: { issuer: "Pending", validTo: "Unknown" },
    host: { org: "Unassigned", city: "Unknown", country: "Unknown" },
  },
  {
    id: "sizzlebop-dev",
    name: "sizzlebop.dev",
    expiryDate: "2027-02-12",
    monitoringStatus: "healthy",
    notes: "Personal dev experiments and project staging.",
    tags: ["lab", "personal"],
    links: [
      {
        id: "link-sizzlebop-dev-lab",
        name: "Lab",
        url: "https://sizzlebop.dev",
        description: "Personal experiments.",
      },
    ],
    notificationPreferences: [
      { type: "expiry_domain", enabled: true },
      { type: "ssl_expiry", enabled: true },
      { type: "host_change", enabled: true },
    ],
    costings: {
      purchasePrice: 15,
      renewalCost: 15,
      currentValue: 80,
      autoRenew: true,
    },
    registrar: { name: "Cloudflare Registrar", url: "https://cloudflare.com" },
    dns: {
      nameServers: ["arya.ns.cloudflare.com", "bayan.ns.cloudflare.com"],
      mxRecords: [],
      txtRecords: ["google-site-verification=example"],
    },
    ssl: { issuer: "Google Trust Services", validTo: "2026-10-30" },
    host: { org: "Vercel", city: "New York", country: "US" },
  },
] satisfies Omit<DomainSummary, "daysUntilExpiry">[];

export const sampleDomains: DomainSummary[] = rawDomains.map((domain) => ({
  ...domain,
  daysUntilExpiry: getDaysUntilExpiry(domain.expiryDate),
}));
