import Link from "next/link";
import { Pencil } from "lucide-react";
import type { DomainSummary, MonitoringStatus } from "@/lib/domain/types";

type DomainTableProps = {
  domains: DomainSummary[];
};

const statusStyles: Record<MonitoringStatus, string> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  unknown: "border-border bg-muted/40 text-muted-foreground",
};

export function DomainTable({ domains }: DomainTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">Portfolio</h2>
        <Link
          href="/domains/new"
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium transition hover:bg-primary/90"
          style={{ color: "#000" }}
        >
          Add domain
        </Link>
      </div>
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
            ) : (
              domains.map((domain) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
