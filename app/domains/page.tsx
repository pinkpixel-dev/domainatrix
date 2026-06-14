import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { DomainCardGrid } from "@/components/domain/domain-card-grid";
import { DomainTable } from "@/components/domain/domain-table";
import { getDomainSummaries } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

type DomainsPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function getViewLinkClass(isActive: boolean) {
  return [
    "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition",
    isActive
      ? "border-primary bg-primary text-black"
      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

export default async function DomainsPage({ searchParams }: DomainsPageProps) {
  const { view } = await searchParams;
  const domains = await getDomainSummaries();
  const portfolioView = view === "grid" ? "grid" : "list";

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-normal">Domains</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/domains?view=list"
            className={getViewLinkClass(portfolioView === "list")}
            style={portfolioView === "list" ? { color: "#000" } : undefined}
            aria-current={portfolioView === "list" ? "page" : undefined}
          >
            <List className="size-4" />
            List
          </Link>
          <Link
            href="/domains?view=grid"
            className={getViewLinkClass(portfolioView === "grid")}
            style={portfolioView === "grid" ? { color: "#000" } : undefined}
            aria-current={portfolioView === "grid" ? "page" : undefined}
          >
            <LayoutGrid className="size-4" />
            Grid
          </Link>
        </div>
      </div>
      {portfolioView === "grid" ? <DomainCardGrid domains={domains} /> : <DomainTable domains={domains} />}
    </main>
  );
}
