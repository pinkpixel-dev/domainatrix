import type { LucideIcon } from "lucide-react";

type DetailPanelProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
};

export function DetailPanel({ icon: Icon, label, value, detail }: DetailPanelProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-4 text-lg font-semibold tracking-normal capitalize">{value}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}
