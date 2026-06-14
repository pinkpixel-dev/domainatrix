import { Clock3, KeyRound } from "lucide-react";

export function CronSettingsPanel() {
  const hasSecret = Boolean(process.env.CRON_SECRET?.trim());

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-medium">Scheduled checks</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Call the cron endpoint from your host, server, or cron service to run the same portfolio checks as the dashboard button.
          </p>
        </div>
        <span
          className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium ${
            hasSecret
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400"
          }`}
        >
          <KeyRound className="size-3.5" />
          {hasSecret ? "Secret configured" : "Secret missing"}
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 text-sm">
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock3 className="size-4 text-primary" />
            Endpoint
          </div>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-foreground">
            GET /api/monitoring/checks/cron
          </code>
        </div>
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
          <p className="text-muted-foreground">Header</p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-foreground">
            Authorization: Bearer $CRON_SECRET
          </code>
        </div>
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
          <p className="text-muted-foreground">Example crontab</p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-foreground">
            0 */6 * * * curl -fsS -H &quot;Authorization: Bearer $CRON_SECRET&quot; http://localhost:3000/api/monitoring/checks/cron
          </code>
        </div>
      </div>
    </section>
  );
}
