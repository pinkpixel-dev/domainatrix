import type { NotificationType } from "@/lib/domain/types";
import type { DomainSummary } from "@/lib/domain/types";
import type { EnrichmentResult } from "@/lib/enrichment/types";

export type DomainChange = {
  changeType: NotificationType;
  label: string;
  oldValue: string;
  newValue: string;
  message: string;
};

export function detectDomainChanges(domain: DomainSummary, enrichment: EnrichmentResult): DomainChange[] {
  const changes: DomainChange[] = [];

  if (enrichment.whois?.registrar.name && enrichment.whois.registrar.name !== "Unknown") {
    addChange(changes, {
      domainName: domain.name,
      changeType: "registrar_change",
      label: "Registrar",
      oldValue: domain.registrar.name,
      newValue: enrichment.whois.registrar.name,
    });
  }

  const newDnsRecords = [
    ...enrichment.dns.nameServers.map((value) => `NS ${value}`),
    ...enrichment.dns.mxRecords.map((value) => `MX ${value}`),
    ...enrichment.dns.txtRecords.map((value) => `TXT ${value}`),
  ];

  if (newDnsRecords.length > 0) {
    addChange(changes, {
      domainName: domain.name,
      changeType: "dns_change",
      label: "DNS records",
      oldValue: [
        ...domain.dns.nameServers.map((value) => `NS ${value}`),
        ...domain.dns.mxRecords.map((value) => `MX ${value}`),
        ...domain.dns.txtRecords.map((value) => `TXT ${value}`),
      ].join(", "),
      newValue: newDnsRecords.join(", "),
    });
  }

  const newIpAddresses = [...enrichment.dns.ipv4, ...enrichment.dns.ipv6];

  if (newIpAddresses.length > 0) {
    addChange(changes, {
      domainName: domain.name,
      changeType: "ip_change",
      label: "IP addresses",
      oldValue: [...(domain.ipAddresses?.ipv4 ?? []), ...(domain.ipAddresses?.ipv6 ?? [])].join(", "),
      newValue: newIpAddresses.join(", "),
    });
  }

  if (enrichment.ssl) {
    addChange(changes, {
      domainName: domain.name,
      changeType: "ssl_change",
      label: "SSL certificate",
      oldValue: compactValue([domain.ssl.issuer, domain.ssl.validTo, domain.ssl.fingerprint]),
      newValue: compactValue([enrichment.ssl.issuer, enrichment.ssl.validTo, enrichment.ssl.fingerprint]),
    });
  }

  if (enrichment.host) {
    addChange(changes, {
      domainName: domain.name,
      changeType: "host_change",
      label: "Host",
      oldValue: compactValue([domain.host.org, domain.host.asNumber, domain.host.country]),
      newValue: compactValue([enrichment.host.org, enrichment.host.asNumber, enrichment.host.country]),
    });
  }

  if (enrichment.whois) {
    addChange(changes, {
      domainName: domain.name,
      changeType: "whois_change",
      label: "WHOIS contact",
      oldValue: compactValue([domain.whois?.organization, domain.whois?.city, domain.whois?.country]),
      newValue: compactValue([
        enrichment.whois.contact.organization,
        enrichment.whois.contact.city,
        enrichment.whois.contact.country,
      ]),
    });

    if (enrichment.whois.status.length > 0) {
      addChange(changes, {
        domainName: domain.name,
        changeType: "security_change",
        label: "Domain status",
        oldValue: normalizeList(domain.whois?.status ?? []).join(", "),
        newValue: normalizeList(enrichment.whois.status).join(", "),
      });
    }
  }

  return changes;
}

function addChange(
  changes: DomainChange[],
  input: {
    domainName: string;
    changeType: NotificationType;
    label: string;
    oldValue: string;
    newValue: string;
  },
) {
  const oldValue = normalizeComparableValue(input.oldValue);
  const newValue = normalizeComparableValue(input.newValue);

  if (!newValue || oldValue === newValue) {
    return;
  }

  changes.push({
    changeType: input.changeType,
    label: input.label,
    oldValue,
    newValue,
    message: `${input.label} changed for ${input.domainName}.`,
  });
}

function compactValue(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value !== "Unknown"))
    .join(" · ");
}

function normalizeComparableValue(value: string) {
  return normalizeList(value.split(",")).join(", ");
}

function normalizeList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));
}
