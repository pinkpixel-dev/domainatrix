import { ensureDatabaseReady, sqlite } from "../db/client";
import {
  createDomainRepository,
  type CreateDomainInput,
  type PortfolioExport,
  type UpdateDomainInput,
} from "./domain-repository";
import { enrichDomain as runEnrichment } from "../enrichment/enrich";

function getRepository() {
  ensureDatabaseReady();
  return createDomainRepository(sqlite);
}

export async function getDomainSummaries() {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listDomains();
}

export async function getRegistrarSuggestions() {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listRegistrars();
}

export async function getDomainById(id: string) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.getDomainById(id);
}

export async function getDomainUpdates(id: string, options?: { limit?: number }) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listDomainUpdates(id, options);
}

export async function getDomainUptime(id: string, options?: { limit?: number }) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listDomainUptime(id, options);
}

export async function getPortfolioUptimeSummary(options?: { limit?: number }) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listPortfolioUptime(options);
}

export async function getSubdomains(id: string) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listSubdomains(id);
}

export async function discoverSubdomains(id: string) {
  const { discoverSubdomains: runDiscovery } = await import("../enrichment/subdomains");
  const repository = getRepository();
  await repository.seedDefaults();

  const domain = await repository.getDomainById(id);
  if (!domain) throw new Error("Domain not found.");

  const result = await runDiscovery(domain.name);
  await repository.saveSubdomains(id, result.subdomains);

  return result;
}

export async function getRecentDomainUpdates(options?: { limit?: number }) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.listRecentDomainUpdates(options);
}

export async function createDomain(input: CreateDomainInput) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.createDomain(input);
}

export async function updateDomain(id: string, input: UpdateDomainInput) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.updateDomain(id, input);
}

export async function deleteDomain(id: string) {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.deleteDomain(id);
}

export async function exportPortfolio() {
  const repository = getRepository();
  await repository.seedDefaults();
  return repository.exportPortfolio();
}

export async function importPortfolio(payload: PortfolioExport) {
  if (payload.version !== 1 || !Array.isArray(payload.domains)) {
    throw new Error("Unsupported import file.");
  }

  const repository = getRepository();
  await repository.seedDefaults();
  return repository.importDomains(payload.domains);
}

export async function enrichDomain(id: string) {
  const repository = getRepository();
  await repository.seedDefaults();

  const domain = await repository.getDomainById(id);
  if (!domain) {
    throw new Error("Domain not found.");
  }

  const result = await runEnrichment(domain.name);
  await repository.saveEnrichmentData(id, result);

  // Return the refreshed summary + the partial errors list
  const updated = await repository.getDomainById(id);
  return { domain: updated!, errors: result.errors };
}
