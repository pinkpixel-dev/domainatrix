"use client";

import { useEffect, useState } from "react";
import { CronSettingsPanel } from "@/components/settings/cron-settings-panel";
import { ImportExportPanel } from "@/components/settings/import-export-panel";
import { NotificationDeliveryPanel } from "@/components/settings/notification-delivery-panel";
import { CruxSettingsPanel } from "@/components/settings/crux-settings-panel";
import { ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("Failed to load settings.");
        const data = await response.json();
        setSettings(data.settings || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSaveSettings(updatedKeys: Record<string, string>) {
    setError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedKeys }),
      });
      if (!response.ok) throw new Error("Failed to save settings.");
      const data = await response.json();
      setSettings(data.settings || {});
      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred saving settings.");
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-normal animate-pulse">Loading settings...</h1>
      </main>
    );
  }

  return (
    <main className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure application keys, alerts, notifications, and scheduled backups. Need help? Reference the{" "}
            <a
              href="https://domainatrix.xyz"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              official documentation <ExternalLink className="size-3" />
            </a>.
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <ImportExportPanel />

      <CronSettingsPanel settings={settings} onSave={handleSaveSettings} />

      <NotificationDeliveryPanel settings={settings} onSave={handleSaveSettings} />

      <CruxSettingsPanel settings={settings} onSave={handleSaveSettings} />
    </main>
  );
}

