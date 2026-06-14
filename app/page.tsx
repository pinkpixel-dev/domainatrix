import Link from "next/link";
import {
  Activity,
  BellRing,
  CalendarClock,
  DollarSign,
  Globe2,
  LayoutGrid,
  List,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { DashboardBreakdown } from "@/components/domain/dashboard-breakdown";
import { DomainChangeHistory } from "@/components/domain/domain-change-history";
import { DashboardMetric } from "@/components/domain/dashboard-metric";
import { DomainCardGrid } from "@/components/domain/domain-card-grid";
import { DomainTable } from "@/components/domain/domain-table";
import { ExpiryTimeline } from "@/components/domain/expiry-timeline";
import { UptimeSparklineCard } from "@/components/domain/uptime-sparkline-card";
import { RunChecksButton } from "@/components/monitoring/run-checks-button";
import { RunUptimeButton } from "@/components/monitoring/run-uptime-button";
import { getDashboardMetrics } from "@/lib/domain/domain-metrics";
import { getDomainSummaries, getPortfolioUptimeSummary, getRecentDomainUpdates } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getViewLinkClass(isActive: boolean) {
  return [
    "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition",
    isActive
      ? "border-primary bg-primary text-black"
      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { view } = await searchParams;
  const [domains, recentUpdates, portfolioUptime] = await Promise.all([
    getDomainSummaries(),
    getRecentDomainUpdates({ limit: 5 }),
    getPortfolioUptimeSummary({ limit: 50 }),
  ]);
  const metrics = getDashboardMetrics(domains);
  const portfolioView = view === "grid" ? "grid" : "list";

  return (
    <main className="space-y-8">
      <section className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <RunChecksButton />
          <RunUptimeButton />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardMetric icon={Globe2} label="Domains" value={metrics.totalDomains.toString()} />
        <DashboardMetric icon={CalendarClock} label="Expiring in 30 days" value={metrics.expiringSoon.toString()} />
        <UptimeSparklineCard
          checks={portfolioUptime}
          healthyCount={metrics.healthyMonitors}
          totalDomains={metrics.totalDomains}
        />
        <DashboardMetric icon={ShieldAlert} label="Missing expiry" value={metrics.missingExpiry.toString()} />
        <DashboardMetric icon={ShieldAlert} label="SSL expiring soon" value={metrics.sslExpiringSoon.toString()} />
        <DashboardMetric icon={RefreshCw} label="Auto-renew off" value={metrics.autoRenewDisabled.toString()} />
        <DashboardMetric icon={DollarSign} label="Annual renewals" value={formatCurrency(metrics.annualRenewalCost)} />
        <DashboardMetric icon={BellRing} label="Notification coverage" value={metrics.notificationCoverage.toString()} />
        <DashboardMetric icon={Activity} label="Checks queued" value={metrics.checksQueued.toString()} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardBreakdown
          title="Registrar distribution"
          items={metrics.registrarBreakdown}
          total={metrics.totalDomains}
        />
        <DashboardBreakdown title="Host providers" items={metrics.hostBreakdown} total={metrics.totalDomains} />
      </section>

      <ExpiryTimeline domains={domains} />

      <DomainChangeHistory
        updates={recentUpdates}
        title="Recent activity"
        emptyText="No monitoring changes have been recorded yet."
        showDomainName
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Portfolio preview</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/?view=list"
              className={getViewLinkClass(portfolioView === "list")}
              style={portfolioView === "list" ? { color: "#000" } : undefined}
              aria-current={portfolioView === "list" ? "page" : undefined}
            >
              <List className="size-4" />
              List
            </Link>
            <Link
              href="/?view=grid"
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
      </section>
    </main>
  );
}
