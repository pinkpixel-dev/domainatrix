import { ensureDatabaseReady, sqlite } from "../db/client";
import {
  createDomainRepository,
  type DomainUpdateInput,
} from "../domain/domain-repository";
import type { DomainSummary } from "../domain/types";
import { getDaysUntilExpiry } from "../domain/domain-utils";
import { enrichDomain } from "../enrichment/enrich";
import type { EnrichmentResult } from "../enrichment/types";
import { createNotificationRepository } from "../notifications/notification-repository";
import { createNotification } from "../notifications/notification-service";
import type { CreateNotificationInput } from "../notifications/types";
import { detectDomainChanges } from "./domain-change-detection";

const EXPIRY_REMINDER_DAYS = new Set([30, 14, 7, 1, 0]);

export type DomainCheckResult = {
  domainId: string;
  domainName: string;
  changed: boolean;
  changeCount: number;
  notificationCount: number;
  errors: string[];
};

export type PortfolioCheckResult = {
  checked: number;
  changed: number;
  notificationsCreated: number;
  errors: Array<{
    domainId: string;
    domainName: string;
    message: string;
  }>;
  domains: DomainCheckResult[];
};

type ApplyDomainCheckInput = {
  domain: DomainSummary;
  enrichment: EnrichmentResult;
  recordDomainUpdate: (input: DomainUpdateInput) => Promise<unknown>;
  createNotification: (input: CreateNotificationInput) => Promise<unknown>;
  saveEnrichmentData: (domainId: string, enrichment: EnrichmentResult) => Promise<unknown>;
};

type ApplyExpiryReminderInput = {
  domain: DomainSummary;
  now?: Date;
  notificationExists: (input: CreateNotificationInput & { message: string }) => Promise<boolean>;
  createNotification: (input: CreateNotificationInput) => Promise<unknown>;
};

export async function applyDomainCheck({
  domain,
  enrichment,
  recordDomainUpdate,
  createNotification,
  saveEnrichmentData,
}: ApplyDomainCheckInput): Promise<DomainCheckResult> {
  const changes = detectDomainChanges(domain, enrichment);
  const enabledNotificationTypes = new Set(
    domain.notificationPreferences
      .filter((preference) => preference.enabled)
      .map((preference) => preference.type),
  );
  let notificationCount = 0;

  for (const change of changes) {
    await recordDomainUpdate({
      domainId: domain.id,
      change: change.message,
      changeType: change.changeType,
      oldValue: change.oldValue,
      newValue: change.newValue,
    });

    if (enabledNotificationTypes.has(change.changeType)) {
      await createNotification({
        domainId: domain.id,
        changeType: change.changeType,
        message: `${change.message} ${change.oldValue || "None"} -> ${change.newValue}.`,
      });
      notificationCount += 1;
    }
  }

  await saveEnrichmentData(domain.id, enrichment);

  return {
    domainId: domain.id,
    domainName: domain.name,
    changed: changes.length > 0,
    changeCount: changes.length,
    notificationCount,
    errors: enrichment.errors,
  };
}

export async function applyExpiryReminder({
  domain,
  now = new Date(),
  notificationExists,
  createNotification,
}: ApplyExpiryReminderInput): Promise<number> {
  const expiryNotificationsEnabled = domain.notificationPreferences.some(
    (preference) => preference.type === "expiry_domain" && preference.enabled,
  );

  if (!expiryNotificationsEnabled || !domain.expiryDate) return 0;

  const daysUntilExpiry = getDaysUntilExpiry(domain.expiryDate, now);
  const message = getExpiryReminderMessage(domain.name, domain.expiryDate, daysUntilExpiry);

  if (!message) return 0;

  const exists = await notificationExists({
    domainId: domain.id,
    changeType: "expiry_domain",
    message,
  });

  if (exists) return 0;

  await createNotification({
    domainId: domain.id,
    changeType: "expiry_domain",
    message,
  });

  return 1;
}

export async function runPortfolioChecks(): Promise<PortfolioCheckResult> {
  ensureDatabaseReady();

  const domainRepository = createDomainRepository(sqlite);
  const notificationRepository = createNotificationRepository(sqlite);
  await domainRepository.seedDefaults();

  const domains = await domainRepository.listDomains();
  const results: DomainCheckResult[] = [];
  const errors: PortfolioCheckResult["errors"] = [];

  for (const domain of domains) {
    try {
      const expiryNotificationCount = await applyExpiryReminder({
        domain,
        notificationExists: notificationRepository.hasNotification,
        createNotification,
      });
      const enrichment = await enrichDomain(domain.name);
      const result = await applyDomainCheck({
        domain,
        enrichment,
        recordDomainUpdate: domainRepository.recordDomainUpdate,
        createNotification,
        saveEnrichmentData: domainRepository.saveEnrichmentData,
      });

      results.push({
        ...result,
        notificationCount: result.notificationCount + expiryNotificationCount,
      });

      for (const message of result.errors) {
        errors.push({ domainId: domain.id, domainName: domain.name, message });
      }
    } catch (error) {
      errors.push({
        domainId: domain.id,
        domainName: domain.name,
        message: error instanceof Error ? error.message : "Domain check failed.",
      });
    }
  }

  return {
    checked: results.length,
    changed: results.filter((result) => result.changed).length,
    notificationsCreated: results.reduce((total, result) => total + result.notificationCount, 0),
    errors,
    domains: results,
  };
}

function getExpiryReminderMessage(domainName: string, expiryDate: string, daysUntilExpiry: number) {
  if (daysUntilExpiry < 0) {
    return `${domainName} has expired.`;
  }

  if (daysUntilExpiry === 0) {
    return `${domainName} expires today (${expiryDate}).`;
  }

  if (!EXPIRY_REMINDER_DAYS.has(daysUntilExpiry)) {
    return null;
  }

  return `${domainName} expires in ${daysUntilExpiry} days on ${expiryDate}.`;
}
