import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const registrars = sqliteTable(
  "registrars",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url"),
  },
  (table) => [uniqueIndex("registrars_user_name_unique").on(table.userId, table.name)],
);

export const domains = sqliteTable(
  "domains",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domainName: text("domain_name").notNull(),
    expiryDate: text("expiry_date"),
    notes: text("notes"),
    registrarId: text("registrar_id").references(() => registrars.id, { onDelete: "set null" }),
    registrationDate: text("registration_date"),
    updatedDate: text("updated_date"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("domains_user_domain_unique").on(table.userId, table.domainName)],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    description: text("description"),
    icon: text("icon"),
  },
  (table) => [uniqueIndex("tags_user_name_unique").on(table.userId, table.name)],
);

export const domainTags = sqliteTable(
  "domain_tags",
  {
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("domain_tags_unique").on(table.domainId, table.tagId)],
);

export const dnsRecords = sqliteTable(
  "dns_records",
  {
    id: text("id").primaryKey(),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    recordType: text("record_type").notNull(),
    recordValue: text("record_value").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("dns_records_unique").on(table.domainId, table.recordType, table.recordValue)],
);

export const sslCertificates = sqliteTable("ssl_certificates", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  issuer: text("issuer"),
  issuerCountry: text("issuer_country"),
  subject: text("subject"),
  validFrom: text("valid_from"),
  validTo: text("valid_to"),
  fingerprint: text("fingerprint"),
  keySize: integer("key_size"),
  signatureAlgorithm: text("signature_algorithm"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const whoisInfo = sqliteTable("whois_info", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  country: text("country"),
  state: text("state"),
  name: text("name"),
  organization: text("organization"),
  street: text("street"),
  city: text("city"),
  postalCode: text("postal_code"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ipAddresses = sqliteTable("ip_addresses", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  isIpv6: integer("is_ipv6", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const hosts = sqliteTable(
  "hosts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ip: text("ip").notNull(),
    lat: real("lat"),
    lon: real("lon"),
    isp: text("isp"),
    org: text("org"),
    asNumber: text("as_number"),
    city: text("city"),
    region: text("region"),
    country: text("country"),
  },
  (table) => [uniqueIndex("hosts_user_ip_unique").on(table.userId, table.ip)],
);

export const domainHosts = sqliteTable(
  "domain_hosts",
  {
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    hostId: text("host_id")
      .notNull()
      .references(() => hosts.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("domain_hosts_unique").on(table.domainId, table.hostId)],
);

export const domainStatuses = sqliteTable("domain_statuses", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  statusCode: text("status_code").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const subDomains = sqliteTable("sub_domains", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sdInfo: text("sd_info", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notificationPreferences = sqliteTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("notification_preferences_unique").on(table.domainId, table.notificationType)],
);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  changeType: text("change_type").notNull(),
  message: text("message"),
  sent: integer("sent", { mode: "boolean" }).notNull().default(false),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const domainUpdates = sqliteTable("domain_updates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  change: text("change").notNull(),
  changeType: text("change_type").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  date: text("date").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const uptime = sqliteTable("uptime", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  checkedAt: text("checked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  isUp: integer("is_up", { mode: "boolean" }).notNull(),
  responseCode: integer("response_code"),
  responseTimeMs: real("response_time_ms"),
  dnsLookupTimeMs: real("dns_lookup_time_ms"),
  sslHandshakeTimeMs: real("ssl_handshake_time_ms"),
});

export const domainCostings = sqliteTable("domain_costings", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  purchasePrice: real("purchase_price").default(0),
  renewalCost: real("renewal_cost").default(0),
  currentValue: real("current_value").default(0),
  autoRenew: integer("auto_renew", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const domainLinks = sqliteTable("domain_links", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  linkName: text("link_name").notNull(),
  linkUrl: text("link_url").notNull(),
  linkDescription: text("link_description"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

