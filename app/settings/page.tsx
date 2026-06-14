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
      
    </main>
  );
}
