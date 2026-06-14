export type MonitoringStatus = "healthy" | "warning" | "unknown";

export type NotificationType =
  | "expiry_domain"
  | "ssl_expiry"
  | "ssl_change"
  | "dns_change"
  | "ip_change"
  | "registrar_change"
  | "whois_change"
  | "host_change"
  | "security_change"
  | "uptime_change";

export type NotificationPreference = {
  type: NotificationType;
  enabled: boolean;
};

export type DomainLink = {
  id: string;
  name: string;
  url: string;
  description: string;
};

export type DomainSummary = {
  id: string;
  name: string;
  expiryDate: string;
  registrationDate?: string;
  updatedDate?: string;
  daysUntilExpiry: number;
  monitoringStatus: MonitoringStatus;
  notes: string;
  tags: string[];
  links: DomainLink[];
  notificationPreferences: NotificationPreference[];
  costings: {
    purchasePrice: number;
    renewalCost: number;
    currentValue: number;
    autoRenew: boolean;
  };
  registrar: {
    name: string;
    url?: string;
  };
  dns: {
    nameServers: string[];
    mxRecords: string[];
    txtRecords: string[];
  };
  ssl: {
    issuer: string;
    validTo: string;
    // enriched fields — present after an Enrich run
    validFrom?: string;
    issuerCountry?: string;
    subject?: string;
    fingerprint?: string;
    keySize?: number;
    signatureAlgorithm?: string;
  };
  host: {
    org: string;
    city: string;
    country: string;
    // enriched fields — present after an Enrich run
    lat?: number;
    lon?: number;
    isp?: string;
    asNumber?: string;
    region?: string;
  };
  // Optional sections populated by enrichment
  whois?: {
    name?: string | null;
    organization?: string | null;
    street?: string | null;
    city?: string | null;
    country?: string | null;
    state?: string | null;
    postalCode?: string | null;
    status: string[];
  };
  ipAddresses?: {
    ipv4: string[];
    ipv6: string[];
  };
  lastEnriched?: string;
};

export type RegistrarSuggestion = {
  id: string;
  name: string;
  url?: string;
  domainCount: number;
};
