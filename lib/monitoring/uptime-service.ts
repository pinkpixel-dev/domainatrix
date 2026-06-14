import { ensureDatabaseReady, sqlite } from "../db/client";
import {
  createDomainRepository,
  type DomainUpdateInput,
  type UptimeCheckInput,
  type UptimeCheckSummary,
} from "../domain/domain-repository";
import type { DomainSummary } from "../domain/types";
import { createNotification } from "../notifications/notification-service";
import type { CreateNotificationInput } from "../notifications/types";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type UptimeCheckResult = {
  domainId?: string;
  domainName: string;
  isUp: boolean;
  responseCode: number | null;
  responseTimeMs: number;
};

export type AppliedUptimeCheckResult = UptimeCheckResult & {
  domainId: string;
  notificationCreated: boolean;
};

export type PortfolioUptimeResult = {
  checked: number;
  up: number;
  down: number;
  notificationsCreated: number;
  domains: AppliedUptimeCheckResult[];
};

type ApplyUptimeCheckInput = {
  domain: DomainSummary;
  current: UptimeCheckResult;
  previous?: UptimeCheckSummary;
  recordUptimeCheck: (input: UptimeCheckInput) => Promise<unknown>;
  recordDomainUpdate: (input: DomainUpdateInput) => Promise<unknown>;
  createNotification: (input: CreateNotificationInput) => Promise<unknown>;
};

export async function checkDomainUptime(domainName: string, fetcher: FetchLike = fetch): Promise<UptimeCheckResult> {
  const startedAt = performance.now();

  try {
    const response = await fetcher(`https://${domainName}`, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const responseTimeMs = Math.max(0, Math.round(performance.now() - startedAt));

    return {
      domainName,
      isUp: response.status >= 200 && response.status < 400,
      responseCode: response.status,
      responseTimeMs,
    };
  } catch {
    return {
      domainName,
      isUp: false,
      responseCode: null,
      responseTimeMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  }
}

export async function applyUptimeCheck({
  domain,
  current,
  previous,
  recordUptimeCheck,
  recordDomainUpdate,
  createNotification,
}: ApplyUptimeCheckInput): Promise<AppliedUptimeCheckResult> {
  await recordUptimeCheck({
    domainId: domain.id,
    isUp: current.isUp,
    responseCode: current.responseCode,
    responseTimeMs: current.responseTimeMs,
  });

  const changedState = Boolean(previous && previous.isUp !== current.isUp);
  const uptimeNotificationsEnabled = domain.notificationPreferences.some(
    (preference) => preference.type === "uptime_change" && preference.enabled,
  );
  let notificationCreated = false;

  if (changedState) {
    const oldValue = previous!.isUp ? "Up" : "Down";
    const newValue = current.isUp ? "Up" : "Down";
    const change = current.isUp ? `${domain.name} recovered.` : `${domain.name} is down.`;

    await recordDomainUpdate({
      domainId: domain.id,
      change,
      changeType: "uptime_change",
      oldValue,
      newValue,
    });

    if (uptimeNotificationsEnabled) {
      await createNotification({
        domainId: domain.id,
        changeType: "uptime_change",
        message: `${change} ${oldValue} -> ${newValue}.`,
      });
      notificationCreated = true;
    }
  }

  return {
    ...current,
    domainId: domain.id,
    notificationCreated,
  };
}

export async function runPortfolioUptimeChecks(): Promise<PortfolioUptimeResult> {
  ensureDatabaseReady();

  const repository = createDomainRepository(sqlite);
  await repository.seedDefaults();

  const domains = await repository.listDomains();
  const results: AppliedUptimeCheckResult[] = [];

  for (const domain of domains) {
    const previous = (await repository.listDomainUptime(domain.id, { limit: 1 }))[0];
    const current = await checkDomainUptime(domain.name);
    const result = await applyUptimeCheck({
      domain,
      current,
      previous,
      recordUptimeCheck: repository.recordUptimeCheck,
      recordDomainUpdate: repository.recordDomainUpdate,
      createNotification,
    });
    results.push(result);
  }

  return {
    checked: results.length,
    up: results.filter((result) => result.isUp).length,
    down: results.filter((result) => !result.isUp).length,
    notificationsCreated: results.filter((result) => result.notificationCreated).length,
    domains: results,
  };
}
