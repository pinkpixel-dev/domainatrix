import { notificationPreferenceOptions } from "./notification-preferences";
import type {
  CreateDomainInput,
  DomainLinkInput,
  DomainCostingsInput,
} from "./domain-repository";
import type { DomainSummary, NotificationPreference, NotificationType } from "./types";

const headers = [
  "domainName",
  "registrarName",
  "expiryDate",
  "notes",
  "tags",
  "purchasePrice",
  "renewalCost",
  "currentValue",
  "autoRenew",
  "links",
  "enabledNotifications",
] as const;

type Header = (typeof headers)[number];

const notificationTypes = new Set<NotificationType>(notificationPreferenceOptions.map((option) => option.type));

export function domainsToCsv(domains: DomainSummary[]) {
  const rows = domains.map((domain) => {
    const row: Record<Header, string> = {
      domainName: domain.name,
      registrarName: domain.registrar.name,
      expiryDate: domain.expiryDate === "Untracked" ? "" : domain.expiryDate,
      notes: domain.notes,
      tags: domain.tags.join("; "),
      purchasePrice: formatNumber(domain.costings.purchasePrice),
      renewalCost: formatNumber(domain.costings.renewalCost),
      currentValue: formatNumber(domain.costings.currentValue),
      autoRenew: domain.costings.autoRenew ? "true" : "false",
      links: domain.links.map(formatLink).join("; "),
      enabledNotifications: domain.notificationPreferences
        .filter((preference) => preference.enabled)
        .map((preference) => preference.type)
        .join("; "),
    };

    return headers.map((header) => escapeCell(row[header])).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function csvToDomainInputs(csv: string): CreateDomainInput[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headerRow = rows[0].map((value) => value.trim());
  const indexes = Object.fromEntries(headerRow.map((header, index) => [header, index]));

  if (indexes.domainName === undefined) {
    throw new Error("CSV import requires a domainName column.");
  }

  return rows.slice(1).flatMap((row, rowIndex) => {
    if (row.every((cell) => cell.trim().length === 0)) return [];

    const domainName = getCell(row, indexes.domainName);
    if (!domainName) {
      throw new Error(`CSV row ${rowIndex + 2} is missing domainName.`);
    }

    return [{
      domainName,
      registrarName: getCell(row, indexes.registrarName),
      expiryDate: getCell(row, indexes.expiryDate),
      notes: getCell(row, indexes.notes),
      tags: splitList(getCell(row, indexes.tags)),
      links: parseLinks(getCell(row, indexes.links)),
      costings: parseCostings(row, indexes),
      notificationPreferences: parseNotificationPreferences(getCell(row, indexes.enabledNotifications)),
    }];
  });
}

function formatNumber(value: number) {
  return value > 0 ? value.toString() : "";
}

function formatLink(link: DomainSummary["links"][number]) {
  return [link.name, link.url, link.description].filter(Boolean).join("|");
}

function parseLinks(value: string): DomainLinkInput[] {
  return splitList(value).flatMap((item) => {
    const [name, url, description] = item.split("|").map((part) => part.trim());
    if (!name || !url) return [];
    return [{ name, url, description }];
  });
}

function parseCostings(row: string[], indexes: Record<string, number>): DomainCostingsInput {
  return {
    purchasePrice: parseMoney(getCell(row, indexes.purchasePrice)),
    renewalCost: parseMoney(getCell(row, indexes.renewalCost)),
    currentValue: parseMoney(getCell(row, indexes.currentValue)),
    autoRenew: parseBoolean(getCell(row, indexes.autoRenew)),
  };
}

function parseNotificationPreferences(value: string): NotificationPreference[] {
  const enabled = new Set(
    splitList(value).filter((type): type is NotificationType => notificationTypes.has(type as NotificationType)),
  );

  return notificationPreferenceOptions.map((option) => ({
    type: option.type,
    enabled: enabled.has(option.type),
  }));
}

function parseMoney(value: string) {
  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "y", "enabled"].includes(value.trim().toLowerCase());
}

function splitList(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCell(row: string[], index: number | undefined) {
  return index === undefined ? "" : (row[index] ?? "").trim();
}

function escapeCell(value: string) {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  return rows;
}
