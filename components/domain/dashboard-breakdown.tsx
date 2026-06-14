import type { DashboardBreakdown as DashboardBreakdownItem } from "@/lib/domain/domain-metrics";

type DashboardBreakdownProps = {
  title: string;
  items: DashboardBreakdownItem[];
  total: number;
};

export function DashboardBreakdown({ title, items, total }: DashboardBreakdownProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No domains yet.</p>
        ) : (
          items.map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {item.value} · {percentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
