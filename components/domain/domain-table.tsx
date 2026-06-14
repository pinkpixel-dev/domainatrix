"use client";

import Link from "next/link";
import { Pencil, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DomainSummary, MonitoringStatus } from "@/lib/domain/types";

type DomainTableProps = {
  domains: DomainSummary[];
  title?: string;
  totalCount?: number;
  showAddButton?: boolean;
  showFilters?: boolean;
  footerHref?: string;
  footerLabel?: string;
};

const statusStyles: Record<MonitoringStatus, string> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  unknown: "border-border bg-muted/40 text-muted-foreground",
};

export function DomainTable({
  domains,
  title = "Portfolio",
  totalCount = domains.length,
  showAddButton = true,
  showFilters = true,
  footerHref,
  footerLabel = "See all domains",
}: DomainTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MonitoringStatus | "all">("all");
  const [registrar, setRegistrar] = useState("all");

  const registrars = useMemo(
    () => Array.from(new Set(domains.map((domain) => domain.registrar.name))).sort((a, b) => a.localeCompare(b)),
    [domains],
  );

  const filteredDomains = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return domains.filter((domain) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          domain.name,
          domain.registrar.name,
          domain.expiryDate,
          domain.monitoringStatus,
          ...domain.tags,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = status === "all" || domain.monitoringStatus === status;
      const matchesRegistrar = registrar === "all" || domain.registrar.name === registrar;

      return matchesQuery && matchesStatus && matchesRegistrar;
    });
  }, [domains, query, registrar, status]);

  const hasFilters = query.trim().length > 0 || status !== "all" || registrar !== "all";
  const showFooter = Boolean(footerHref);

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setRegistrar("all");
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredDomains.length} of {totalCount} domain{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        {showAddButton ? (
          <Link
            href="/domains/new"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium transition hover:bg-primary/90"
            style={{ color: "#000" }}
          >
            Add domain
          </Link>
        ) : null}
      </div>
      {showFilters ? (
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
          <label className="relative block">
            <span className="sr-only">Search domains</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search domains, registrars, tags..."
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-muted-foreground"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as MonitoringStatus | "all")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground outline-none transition focus:border-muted-foreground"
            >
              <option value="all">All statuses</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by registrar</span>
            <select
              value={registrar}
              onChange={(event) => setRegistrar(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground outline-none transition focus:border-muted-foreground"
            >
              <option value="all">All registrars</option>
              {registrars.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="size-4" />
            Clear
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Registrar</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No domains yet.{" "}
                  <Link href="/domains/new" className="text-primary underline underline-offset-2">
                    Add your first one.
                  </Link>
                </td>
              </tr>
            ) : filteredDomains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No domains match those filters.
                </td>
              </tr>
            ) : (
              <>
                {filteredDomains.map((domain) => (
                <tr key={domain.id} className="transition hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <Link href={`/domains/${domain.id}`} className="font-medium hover:text-primary">
                      {domain.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{domain.registrar.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {domain.expiryDate}
                    {domain.daysUntilExpiry > 0 ? (
                      <span className="ml-2 text-xs">({domain.daysUntilExpiry}d)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs capitalize ${statusStyles[domain.monitoringStatus]}`}
                    >
                      {domain.monitoringStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {domain.tags.length > 0 ? domain.tags.join(", ") : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/domains/${domain.id}/edit`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      title={`Edit ${domain.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
                ))}
                {showFooter ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center">
                      <Link href={footerHref!} className="text-sm font-medium text-primary hover:underline">
                        {footerLabel}
                      </Link>
                    </td>
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
