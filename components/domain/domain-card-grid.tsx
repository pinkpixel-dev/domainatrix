import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import type { DomainSummary, MonitoringStatus } from "@/lib/domain/types";

type DomainCardGridProps = {
  domains: DomainSummary[];
};

const statusStyles: Record<MonitoringStatus, string> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  unknown: "border-border bg-muted/40 text-muted-foreground",
};

function formatRenewalCost(value: number) {
  return value > 0 ? `$${value.toFixed(2)}` : "Untracked";
}

export function DomainCardGrid({ domains }: DomainCardGridProps) {
  if (domains.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        No domains yet.{" "}
        <Link href="/domains/new" className="text-primary underline underline-offset-2">
          Add your first one.
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {domains.map((domain) => (
        <article key={domain.id} className="flex min-h-[210px] flex-col rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <Link href={`/domains/${domain.id}`} className="block truncate text-base font-semibold hover:text-primary">
                {domain.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">{domain.registrar.name}</p>
            </div>
            <span
              className={`inline-flex shrink-0 rounded-md border px-2 py-1 text-xs capitalize ${statusStyles[domain.monitoringStatus]}`}
            >
              {domain.monitoringStatus}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Expiry</dt>
              <dd className="mt-1 font-medium">
                {domain.expiryDate}
                {domain.daysUntilExpiry > 0 ? (
                  <span className="ml-1 text-xs text-muted-foreground">({domain.daysUntilExpiry}d)</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Renewal</dt>
              <dd className="mt-1 font-medium">{formatRenewalCost(domain.costings.renewalCost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Host</dt>
              <dd className="mt-1 truncate font-medium">{domain.host.org}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Links</dt>
              <dd className="mt-1 inline-flex items-center gap-1 font-medium">
                {domain.links.length}
                {domain.links.length > 0 ? <ExternalLink className="size-3 text-muted-foreground" /> : null}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="flex min-w-0 flex-wrap gap-2">
              {domain.tags.length > 0 ? (
                domain.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground/60">No tags</span>
              )}
            </div>
            <Link
              href={`/domains/${domain.id}/edit`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title={`Edit ${domain.name}`}
            >
              <Pencil className="size-4" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
