"use client";

import { Clock3, KeyRound, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";

type CronSettingsPanelProps = {
  settings: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<void>;
};

export function CronSettingsPanel({ settings, onSave }: CronSettingsPanelProps) {
  const [cronSecret, setCronSecret] = useState(settings.CRON_SECRET || "");
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasSecret = Boolean((settings.CRON_SECRET || "").trim());

  function generateSecret() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let autoSecret = "";
    for (let i = 0; i < 32; i++) {
      autoSecret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCronSecret(autoSecret);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave({ CRON_SECRET: cronSecret });
    } finally {
      setIsSaving(false);
    }
  }

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

      <div className="mt-5 space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="cron-secret" className="text-xs font-medium text-muted-foreground">
            CRON_SECRET
          </label>
          <div className="flex max-w-xl gap-2">
            <div className="relative flex-1">
              <input
                id="cron-secret"
                type={showSecret ? "text" : "password"}
                value={cronSecret}
                onChange={(e) => setCronSecret(e.target.value)}
                placeholder="Enter a secure cron secret"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-10 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={generateSecret}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              title="Generate Random Secret"
            >
              <RefreshCw className="size-4" />
              Generate
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 text-sm md:grid-cols-3">
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
              Authorization: Bearer {settings.CRON_SECRET || "$CRON_SECRET"}
            </code>
          </div>
          <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
            <p className="text-muted-foreground">Example crontab</p>
            <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-foreground">
              0 */6 * * * curl -fsS -H &quot;Authorization: Bearer {settings.CRON_SECRET || "$CRON_SECRET"}&quot; http://localhost:3000/api/monitoring/checks/cron
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

