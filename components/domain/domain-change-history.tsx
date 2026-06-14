import Link from "next/link";
import { Activity } from "lucide-react";
import type { DomainUpdateSummary } from "@/lib/domain/domain-repository";

type DomainChangeHistoryProps = {
  updates: DomainUpdateSummary[];
  title?: string;
  emptyText?: string;
  showDomainName?: boolean;
};

export function DomainChangeHistory({
  updates,
  title = "Recent changes",
  emptyText = "No changes recorded yet.",
  showDomainName = false,
}: DomainChangeHistoryProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Activity className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      {updates.length > 0 ? (
        <div className="divide-y divide-border">
          {updates.map((update) => (
            <article key={update.id} className="px-4 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {showDomainName && update.domainName ? (
                    <Link href={`/domains/${update.domainId}`} className="text-sm font-medium hover:text-primary">
                      {update.domainName}
                    </Link>
                  ) : null}
                  <p className="text-sm font-medium">{update.change}</p>
                  <p className="mt-1 text-xs uppercase tracking-normal text-muted-foreground">
                    {formatChangeType(update.changeType)}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={update.date}>
                  {formatDate(update.date)}
                </time>
              </div>
              {(update.oldValue || update.newValue) ? (
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="min-w-0 rounded-md border border-border bg-muted/20 p-2">
                    <dt className="text-muted-foreground">Old</dt>
                    <dd className="mt-1 break-words font-mono">{update.oldValue || "None"}</dd>
                  </div>
                  <div className="min-w-0 rounded-md border border-border bg-muted/20 p-2">
                    <dt className="text-muted-foreground">New</dt>
                    <dd className="mt-1 break-words font-mono">{update.newValue || "None"}</dd>
                  </div>
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
      )}
    </section>
  );
}

function formatChangeType(type: string) {
  return type.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
