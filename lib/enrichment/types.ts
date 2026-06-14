// ---------------------------------------------------------------------------
// Enrichment result types
// Populated by the parallel lookup orchestrator and persisted to SQLite.
// All sections except dns are nullable — partial enrichment is valid.
// ---------------------------------------------------------------------------

export type WhoisEnrichment = {
  domainName: string | null;
  registrar: {
    name: string | null;
    url?: string | null;
  };
  dates: {
    creationDate?: string;
    updatedDate?: string;
    expiryDate?: string;
  };
  contact: {
    name?: string | null;
    organization?: string | null;
    street?: string | null;
    city?: string | null;
    country?: string | null;
    state?: string | null;
    postalCode?: string | null;
  };
  status: string[];
  dnssec?: string | null;
};

export type DnsEnrichment = {
  nameServers: string[];
  mxRecords: string[];
  txtRecords: string[];
  ipv4: string[];
  ipv6: string[];
};

export type SslEnrichment = {
  issuer: string | null;
  issuerCountry: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  keySize: number;
  signatureAlgorithm: string;
};

export type HostEnrichment = {
  ip: string;
  org: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  isp: string;
  asNumber: string;
};

export type EnrichmentResult = {
  whois: WhoisEnrichment | null;
  dns: DnsEnrichment;
  ssl: SslEnrichment | null;
  host: HostEnrichment | null;
  errors: string[];
};
