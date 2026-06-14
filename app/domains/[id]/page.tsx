import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CircleDollarSign,
  Dna,
  ExternalLink,
  Globe,
  KeyRound,
  Network,
  Pencil,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CoreWebVitals } from "@/components/domain/core-web-vitals";
import { DetailPanel } from "@/components/domain/detail-panel";
import { DomainChangeHistory } from "@/components/domain/domain-change-history";
import { DomainDeleteButton } from "@/components/domain/domain-delete-button";
import { DomainDiscoverButton } from "@/components/domain/domain-discover-button";
import { DomainEnrichButton } from "@/components/domain/domain-enrich-button";
import { DomainUptimeHistory } from "@/components/domain/domain-uptime-history";
import { ExpiryRing } from "@/components/domain/expiry-ring";
import { SubdomainList } from "@/components/domain/subdomain-list";
import { notificationPreferenceOptions } from "@/lib/domain/notification-preferences";
import { getDomainById, getDomainUpdates, getDomainUptime, getSubdomains } from "@/lib/domain/domain-service";
import type { MonitoringStatus } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

type DomainDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { id } = await params;
  const [domain, updates, uptimeChecks, subdomains] = await Promise.all([
    getDomainById(id),
    getDomainUpdates(id, { limit: 8 }),
    getDomainUptime(id, { limit: 8 }),
    getSubdomains(id),
  ]);

  if (!domain) {
    notFound();
  }

  const hasEnrichedSsl = Boolean(domain.ssl.validFrom || domain.ssl.subject);
  const hasWhois = Boolean(
    domain.registrationDate ||
    domain.updatedDate ||
    domain.whois?.organization ||
    domain.whois?.country ||
    (domain.whois?.status && domain.whois.status.length > 0),
  );
  const hasIps = Boolean(domain.ipAddresses && (domain.ipAddresses.ipv4.length > 0 || domain.ipAddresses.ipv6.length > 0));
  const enabledNotifications = domain.notificationPreferences.filter((preference) => preference.enabled);

  const sslDaysRemaining = computeDaysRemaining(domain.ssl.validTo);
  const domainDaysRemaining = domain.daysUntilExpiry > 0 ? domain.daysUntilExpiry : null;

  return (
    <main className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{domain.registrar.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">{domain.name}</h1>
          {domain.notes ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{domain.notes}</p>
          ) : null}
          {domain.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {domain.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/domains/${domain.id}/edit`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <DomainDeleteButton domainId={domain.id} domainName={domain.name} />
          </div>
          <DomainEnrichButton domainId={domain.id} />
          <DomainDiscoverButton domainId={domain.id} />
        </div>
      </section>

      {/* Health and expiry */}
      <section className="grid gap-4 lg:grid-cols-2">
        <HealthPanel status={domain.monitoringStatus} />

        <article className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <CalendarClock className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-medium">Expiry</h2>
          </div>
          <div className="flex min-h-[150px] flex-wrap items-center justify-around gap-6 px-6 py-5">
            <ExpiryRing
              label="Domain expiry"
              daysRemaining={domainDaysRemaining}
              maxDays={365}
              subtitle={domain.expiryDate !== "Untracked" ? domain.expiryDate : "Not tracked"}
            />
            <ExpiryRing
              label="SSL expiry"
              daysRemaining={sslDaysRemaining}
              maxDays={90}
              subtitle={domain.ssl.validTo !== "Unknown" ? domain.ssl.validTo : "Not enriched"}
            />
          </div>
        </article>
      </section>

      {/* Core panels */}
      <section className="grid gap-4 md:grid-cols-2">
        <DetailPanel
          icon={Dna}
          label="DNS"
          value={`${domain.dns.nameServers.length} nameserver${domain.dns.nameServers.length !== 1 ? "s" : ""}`}
          detail={domain.dns.nameServers.slice(0, 2).join(", ") || "Not yet enriched"}
        />
        <DetailPanel
          icon={Server}
          label="Host"
          value={domain.host.org || "Unknown"}
          detail={[domain.host.region || domain.host.city, domain.host.country].filter((s) => s && s !== "Unknown").join(", ") || "Not yet enriched"}
        />
        <DetailPanel
          icon={KeyRound}
          label="SSL issuer"
          value={domain.ssl.issuer && domain.ssl.issuer !== "Unknown" ? domain.ssl.issuer : "Not yet enriched"}
          detail={domain.ssl.subject || ""}
        />
        <DetailPanel
          icon={Network}
          label="Network"
          value={domain.host.isp || "Unknown"}
          detail={domain.host.asNumber || "Not yet enriched"}
        />
      </section>

      {domain.links.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Links</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domain.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-card p-4 transition hover:border-muted-foreground/40 hover:bg-muted/30"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="size-4 text-primary" />
                  Related link
                </div>
                <p className="mt-4 text-lg font-semibold tracking-normal">{link.name}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {link.description || link.url}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Costings</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailPanel
            icon={CircleDollarSign}
            label="Purchase price"
            value={formatCurrency(domain.costings.purchasePrice)}
            detail="Original acquisition cost"
          />
          <DetailPanel
            icon={CircleDollarSign}
            label="Renewal cost"
            value={formatCurrency(domain.costings.renewalCost)}
            detail="Expected renewal spend"
          />
          <DetailPanel
            icon={CircleDollarSign}
            label="Current value"
            value={formatCurrency(domain.costings.currentValue)}
            detail="Manual portfolio estimate"
          />
          <DetailPanel
            icon={RefreshCw}
            label="Auto-renew"
            value={domain.costings.autoRenew ? "Enabled" : "Disabled"}
            detail={domain.costings.autoRenew ? "Registrar should renew it" : "Manual renewal check needed"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellRing className="size-4 text-primary" />
            <span>{enabledNotifications.length} enabled</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {notificationPreferenceOptions.map((option) => {
              const enabled = domain.notificationPreferences.some(
                (preference) => preference.type === option.type && preference.enabled,
              );

              return (
                <span
                  key={option.type}
                  className={`inline-flex rounded-md border px-2 py-1 text-xs ${
                    enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-muted/30 text-muted-foreground/60"
                  }`}
                >
                  {option.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {hasWhois ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Domain Status</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            {domain.whois?.status && domain.whois.status.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {domain.whois.status.map((status) => (
                  <span
                    key={status}
                    className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {status}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No WHOIS status codes were returned. Some registries redact or omit this data.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <DomainChangeHistory
        updates={updates}
        emptyText="No monitoring changes have been recorded for this domain yet."
      />

      <DomainUptimeHistory checks={uptimeChecks} />

      {/* IP addresses — shown after enrichment */}
      {hasIps && domain.ipAddresses ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">IP Addresses</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {domain.ipAddresses.ipv4.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-4 text-primary" />
                  IPv4
                </div>
                <ul className="mt-3 space-y-1">
                  {domain.ipAddresses.ipv4.map((ip) => (
                    <li key={ip} className="font-mono text-sm">{ip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {domain.ipAddresses.ipv6.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-4 text-primary" />
                  IPv6
                </div>
                <ul className="mt-3 space-y-1">
                  {domain.ipAddresses.ipv6.map((ip) => (
                    <li key={ip} className="font-mono text-sm break-all">{ip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* WHOIS and SSL — shown after enrichment */}
      {hasWhois || hasEnrichedSsl ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {hasWhois ? (
            <div className="flex flex-col">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">WHOIS</h2>
              <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
                <dl className="divide-y divide-border text-sm">
                  <WhoisRow label="Registrar" value={domain.registrar.name} />
                  <WhoisRow label="Created" value={domain.registrationDate} />
                  <WhoisRow label="Updated" value={domain.updatedDate} />
                  <WhoisRow label="Expires" value={domain.expiryDate !== "Untracked" ? domain.expiryDate : undefined} />
                  <WhoisRow label="Registrant" value={domain.whois?.name ?? undefined} />
                  <WhoisRow label="Organization" value={domain.whois?.organization ?? undefined} />
                  <WhoisRow
                    label="Location"
                    value={
                      [
                        domain.whois?.city,
                        domain.whois?.state,
                        domain.whois?.country,
                        domain.whois?.postalCode,
                      ].filter(Boolean).join(", ") || undefined
                    }
                  />
                  <WhoisRow label="Street" value={domain.whois?.street ?? undefined} />
                </dl>
              </div>
            </div>
          ) : null}

          {hasEnrichedSsl ? (
            <div className="flex flex-col">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">SSL Certificate</h2>
              <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
                <dl className="divide-y divide-border text-sm">
                  {domain.ssl.subject ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Subject</dt>
                      <dd className="break-all font-mono">{domain.ssl.subject}</dd>
                    </div>
                  ) : null}
                  {domain.ssl.issuer && domain.ssl.issuer !== "Unknown" ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Issuer</dt>
                      <dd>{domain.ssl.issuer}{domain.ssl.issuerCountry ? ` (${domain.ssl.issuerCountry})` : ""}</dd>
                    </div>
                  ) : null}
                  {domain.ssl.validFrom ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Valid from</dt>
                      <dd>{domain.ssl.validFrom}</dd>
                    </div>
                  ) : null}
                  {domain.ssl.validTo && domain.ssl.validTo !== "Unknown" ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Valid to</dt>
                      <dd>{domain.ssl.validTo}</dd>
                    </div>
                  ) : null}
                  {domain.ssl.keySize ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Key size</dt>
                      <dd>{domain.ssl.keySize} bits</dd>
                    </div>
                  ) : null}
                  {domain.ssl.fingerprint ? (
                    <div className="flex items-start gap-4 px-4 py-3">
                      <dt className="w-32 shrink-0 text-muted-foreground">Fingerprint</dt>
                      <dd className="break-all font-mono text-xs">{domain.ssl.fingerprint}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* DNS records — shown after enrichment with actual data */}
      {(domain.dns.mxRecords.length > 0 || domain.dns.txtRecords.length > 0) ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">DNS Records</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {domain.dns.mxRecords.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">MX Records</p>
                <ul className="mt-3 space-y-1">
                  {domain.dns.mxRecords.map((r) => (
                    <li key={r} className="font-mono text-xs break-all">{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {domain.dns.txtRecords.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">TXT Records</p>
                <ul className="mt-3 space-y-1">
                  {domain.dns.txtRecords.slice(0, 6).map((r) => (
                    <li key={r} className="font-mono text-xs break-all">{r}</li>
                  ))}
                  {domain.dns.txtRecords.length > 6 ? (
                    <li className="text-xs text-muted-foreground">+{domain.dns.txtRecords.length - 6} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <SubdomainList subdomains={subdomains} />

      <CoreWebVitals domain={domain.name} />

      {/* Not yet enriched hint */}
      {!hasEnrichedSsl && !hasWhois && !hasIps ? (
        <section className="rounded-lg border border-dashed border-border p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Click <span className="font-medium text-foreground">Enrich</span> to pull live WHOIS, DNS, SSL, and host data for this domain.
          </p>
        </section>
      ) : null}
    </main>
  );
}

function HealthPanel({ status }: { status: MonitoringStatus }) {
  const theme = getHealthTheme(status);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-medium">Health</h2>
      </div>
      <div className="flex min-h-[150px] items-center justify-between gap-6 px-6 py-5">
        <div className="min-w-0">
          <p className={`text-2xl font-semibold capitalize tracking-normal ${theme.textClass}`}>
            {status}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {theme.detail}
          </p>
        </div>
        <svg
          className="shrink-0"
          width="104"
          height="104"
          viewBox="0 0 104 104"
          aria-label={`Domain health is ${status}`}
        >
          <circle cx="52" cy="52" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="52"
            cy="52"
            r="38"
            fill="none"
            stroke={theme.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="238.76"
            strokeDashoffset={theme.offset}
            transform="rotate(-90 52 52)"
          />
          <circle cx="52" cy="52" r="8" fill={theme.stroke} />
        </svg>
      </div>
    </article>
  );
}

function getHealthTheme(status: MonitoringStatus) {
  if (status === "healthy") {
    return {
      detail: "Expiry, SSL, and host signals look good.",
      offset: 0,
      stroke: "#34d399",
      textClass: "text-emerald-300",
    };
  }

  if (status === "warning") {
    return {
      detail: "One or more signals needs attention soon.",
      offset: 78,
      stroke: "#fbbf24",
      textClass: "text-amber-300",
    };
  }

  return {
    detail: "Not enough monitoring data is available yet.",
    offset: 156,
    stroke: "#6b7280",
    textClass: "text-muted-foreground",
  };
}

function WhoisRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={value ? "wrap-break-word" : "text-muted-foreground/60"}>
        {value || "Not returned"}
      </dd>
    </div>
  );
}

function formatCurrency(value: number) {
  if (value <= 0) return "Untracked";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function computeDaysRemaining(dateValue: string): number | null {
  if (!dateValue || dateValue === "Unknown" || dateValue === "Untracked") {
    return null;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return days;
}
