import { getDaysUntilExpiry } from "./domain-utils";
import type { DomainSummary } from "./types";

const rawDomains = [
  {
    id: "example-brand",
    name: "example-brand.com",
    expiryDate: "2026-09-18",
    monitoringStatus: "healthy",
    notes: "Primary brand website and documentation hub.",
    tags: ["brand", "production"],
    links: [
      {
        id: "link-example-brand-website",
        name: "Website",
        url: "https://example-brand.com",
        description: "Public brand page.",
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
    id: "example-app",
    name: "example-app.com",
    expiryDate: "2026-07-04",
    monitoringStatus: "warning",
    notes: "Future home for the rebranded product interface.",
    tags: ["product", "watch"],
    links: [
      {
        id: "link-example-app-product",
        name: "Product",
        url: "https://example-app.com",
        description: "Product staging page.",
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
    id: "example-personal",
    name: "example-personal.com",
    expiryDate: "2027-02-12",
    monitoringStatus: "healthy",
    notes: "Personal portfolio website and sandbox area.",
    tags: ["lab", "personal"],
    links: [
      {
        id: "link-example-personal-lab",
        name: "Lab",
        url: "https://example-personal.com",
        description: "Dev staging sandbox.",
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
