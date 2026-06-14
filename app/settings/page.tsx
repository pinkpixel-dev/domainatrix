import { CronSettingsPanel } from "@/components/settings/cron-settings-panel";
import { ImportExportPanel } from "@/components/settings/import-export-panel";
import { NotificationDeliveryPanel } from "@/components/settings/notification-delivery-panel";

export default function SettingsPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
      </div>

      <ImportExportPanel />

      <CronSettingsPanel />

      <NotificationDeliveryPanel />

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium">Next up</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>Display controls for density, theme, and portfolio defaults.</li>
          <li>Email delivery and notification retry history.</li>
        </ul>
      </section>
    </main>
  );
}
