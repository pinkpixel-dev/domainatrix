import type { LucideIcon } from "lucide-react";

type DashboardMetricProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function DashboardMetric({ icon: Icon, label, value }: DashboardMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
