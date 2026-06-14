import type { DomainSummary } from "./types";

export type DashboardBreakdown = {
  label: string;
  value: number;
};

export type DashboardMetrics = {
  totalDomains: number;
  expiringSoon: number;
  healthyMonitors: number;
  checksQueued: number;
  missingExpiry: number;
  sslExpiringSoon: number;
  autoRenewDisabled: number;
  annualRenewalCost: number;
  notificationCoverage: number;
  registrarBreakdown: DashboardBreakdown[];
  hostBreakdown: DashboardBreakdown[];
};

const soonWindowDays = 30;
const dayInMs = 24 * 60 * 60 * 1000;
const maxBreakdownItems = 5;

function daysUntil(dateValue: string, now: Date): number | null {
  if (dateValue === "Unknown" || dateValue === "Untracked") {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.ceil((date.getTime() - now.getTime()) / dayInMs);
}

function buildBreakdown(values: string[]): DashboardBreakdown[] {
  const counts = values.reduce<Record<string, number>>((items, rawValue) => {
    const label = rawValue.trim() || "Unknown";
    items[label] = (items[label] ?? 0) + 1;
    return items;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label))
    .slice(0, maxBreakdownItems);
}

export function getDashboardMetrics(domains: DomainSummary[], now = new Date()): DashboardMetrics {
  return {
    totalDomains: domains.length,
    expiringSoon: domains.filter(
      (domain) =>
        domain.expiryDate !== "Untracked" &&
        domain.daysUntilExpiry > 0 &&
        domain.daysUntilExpiry <= soonWindowDays,
    ).length,
    healthyMonitors: domains.filter((domain) => domain.monitoringStatus === "healthy").length,
    checksQueued: 0,
    missingExpiry: domains.filter((domain) => domain.expiryDate === "Untracked").length,
    sslExpiringSoon: domains.filter((domain) => {
      const sslDaysUntilExpiry = daysUntil(domain.ssl.validTo, now);

      return sslDaysUntilExpiry !== null && sslDaysUntilExpiry > 0 && sslDaysUntilExpiry <= soonWindowDays;
    }).length,
    autoRenewDisabled: domains.filter((domain) => !domain.costings.autoRenew).length,
    annualRenewalCost: domains.reduce((total, domain) => total + domain.costings.renewalCost, 0),
    notificationCoverage: domains.filter((domain) =>
      domain.notificationPreferences.some((preference) => preference.enabled),
    ).length,
    registrarBreakdown: buildBreakdown(domains.map((domain) => domain.registrar.name)),
    hostBreakdown: buildBreakdown(domains.map((domain) => domain.host.org)),
  };
}
