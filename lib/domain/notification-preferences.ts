import type { NotificationPreference, NotificationType } from "./types";

export const notificationPreferenceOptions: { type: NotificationType; label: string; detail: string }[] = [
  {
    type: "expiry_domain",
    label: "Domain expiry",
    detail: "Alert before a domain expires.",
  },
  {
    type: "ssl_expiry",
    label: "SSL expiry",
    detail: "Alert before certificates expire.",
  },
  {
    type: "ssl_change",
    label: "SSL changes",
    detail: "Alert when certificate details change.",
  },
  {
    type: "dns_change",
    label: "DNS changes",
    detail: "Alert when DNS records change.",
  },
  {
    type: "ip_change",
    label: "IP changes",
    detail: "Alert when resolved IP addresses change.",
  },
  {
    type: "registrar_change",
    label: "Registrar changes",
    detail: "Alert when registrar data changes.",
  },
  {
    type: "whois_change",
    label: "WHOIS changes",
    detail: "Alert when WHOIS contact data changes.",
  },
  {
    type: "host_change",
    label: "Host changes",
    detail: "Alert when host/network data changes.",
  },
  {
    type: "security_change",
    label: "Security status changes",
    detail: "Alert when domain status codes change.",
  },
  {
    type: "uptime_change",
    label: "Uptime changes",
    detail: "Alert when a domain goes down or recovers.",
  },
];

export const defaultNotificationPreferences: NotificationPreference[] = notificationPreferenceOptions.map((option) => ({
  type: option.type,
  enabled: option.type === "expiry_domain" || option.type === "ssl_expiry",
}));

export function normalizeNotificationPreferences(
  preferences: NotificationPreference[] | undefined,
): NotificationPreference[] {
  const byType = new Map(preferences?.map((preference) => [preference.type, preference.enabled]));

  return notificationPreferenceOptions.map((option) => ({
    type: option.type,
    enabled: byType.get(option.type) ?? false,
  }));
}
