import { Mail, Webhook } from "lucide-react";
import { getNotificationDeliverySettings } from "@/lib/notifications/notification-delivery";

export function NotificationDeliveryPanel() {
  const settings = getNotificationDeliverySettings();
  const webhookConfigured = Boolean(settings.webhookUrl);
  const emailConfigured = Boolean(settings.email);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">Notification delivery</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Send created notifications to a webhook endpoint or SMTP inbox. Notifications always stay available in the
            app.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DeliveryStatus configured={webhookConfigured} icon="webhook" label="Webhook" />
          <DeliveryStatus configured={emailConfigured} icon="mail" label="Email" />
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 text-sm">
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
          <p className="text-muted-foreground">Webhook</p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-foreground">
            NOTIFICATION_WEBHOOK_URL=https://example.com/domainatrix-webhook
          </code>
        </div>

        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-muted/20 p-3">
          <p className="text-muted-foreground">Email</p>
          <code className="mt-2 block overflow-x-auto whitespace-pre text-xs text-foreground">
            SMTP_HOST=smtp.example.com{"\n"}
            SMTP_PORT=587{"\n"}
            SMTP_USER=alerts@example.com{"\n"}
            SMTP_PASS=app-password{"\n"}
            NOTIFICATION_EMAIL_FROM=Domainatrix &lt;alerts@example.com&gt;{"\n"}
            NOTIFICATION_EMAIL_TO=you@example.com
          </code>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Webhook delivery takes priority when configured. If no webhook is configured, SMTP email delivery is used when
          all required email settings are present.
        </p>
      </div>
    </section>
  );
}

type DeliveryStatusProps = {
  configured: boolean;
  icon: "webhook" | "mail";
  label: string;
};

function DeliveryStatus({ configured, icon, label }: DeliveryStatusProps) {
  const Icon = icon === "webhook" ? Webhook : Mail;

  return (
    <div
      className={
        configured
          ? "inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"
          : "inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground"
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label} {configured ? "configured" : "not configured"}
    </div>
  );
}
