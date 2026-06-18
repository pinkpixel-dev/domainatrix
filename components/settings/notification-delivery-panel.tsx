"use client";

import { Mail, Webhook, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

type NotificationDeliveryPanelProps = {
  settings: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<void>;
};

export function NotificationDeliveryPanel({ settings, onSave }: NotificationDeliveryPanelProps) {
  const [webhookUrl, setWebhookUrl] = useState(settings.NOTIFICATION_WEBHOOK_URL || "");
  const [smtpHost, setSmtpHost] = useState(settings.SMTP_HOST || "");
  const [smtpPort, setSmtpPort] = useState(settings.SMTP_PORT || "587");
  const [smtpSecure, setSmtpSecure] = useState(settings.SMTP_SECURE === "true");
  const [smtpUser, setSmtpUser] = useState(settings.SMTP_USER || "");
  const [smtpPass, setSmtpPass] = useState("");
  const [emailFrom, setEmailFrom] = useState(settings.NOTIFICATION_EMAIL_FROM || "");
  const [emailTo, setEmailTo] = useState(settings.NOTIFICATION_EMAIL_TO || "");

  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const webhookConfigured = Boolean((settings.NOTIFICATION_WEBHOOK_URL || "").trim());
  const smtpPassConfigured = Boolean(settings.SMTP_PASS && settings.SMTP_PASS !== "");
  const emailConfigured = Boolean(
    (settings.SMTP_HOST || "").trim() &&
    (settings.SMTP_USER || "").trim() &&
    (settings.SMTP_PASS || "").trim() &&
    (settings.NOTIFICATION_EMAIL_FROM || "").trim() &&
    (settings.NOTIFICATION_EMAIL_TO || "").trim()
  );

  async function handleSave() {
    setIsSaving(true);
    try {
      const updates: Record<string, string> = {
        NOTIFICATION_WEBHOOK_URL: webhookUrl,
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_SECURE: String(smtpSecure),
        SMTP_USER: smtpUser,
        NOTIFICATION_EMAIL_FROM: emailFrom,
        NOTIFICATION_EMAIL_TO: emailTo,
      };
      if (smtpPass !== "") {
        updates.SMTP_PASS = smtpPass;
      }
      await onSave(updates);
      setSmtpPass("");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearSmtpPass() {
    setIsSaving(true);
    try {
      await onSave({ SMTP_PASS: "" });
      setSmtpPass("");
    } finally {
      setIsSaving(false);
    }
  }

  const isEditingPass = smtpPass !== "";

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">Notification delivery</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Send created alerts to a webhook endpoint (Discord/Slack) or an SMTP mail inbox.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DeliveryStatus configured={webhookConfigured} icon="webhook" label="Webhook" />
          <DeliveryStatus configured={emailConfigured} icon="mail" label="Email" />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Webhook section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook Channel</h3>
          <div className="mt-3 flex flex-col gap-2">
            <label htmlFor="webhook-url" className="text-xs font-medium text-muted-foreground">
              Webhook URL (Discord or Slack)
            </label>
            <input
              id="webhook-url"
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
              className="w-full max-w-xl rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
            />
          </div>
        </div>

        {/* Email SMTP section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (SMTP) Channel</h3>
          <div className="mt-4 grid gap-4 max-w-xl sm:grid-cols-6">
            <div className="sm:col-span-4 flex flex-col gap-2">
              <label htmlFor="smtp-host" className="text-xs font-medium text-muted-foreground">
                SMTP Host
              </label>
              <input
                id="smtp-host"
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.mailgun.org"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label htmlFor="smtp-port" className="text-xs font-medium text-muted-foreground">
                Port
              </label>
              <input
                id="smtp-port"
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
            </div>

            <div className="sm:col-span-6 flex items-center gap-2">
              <input
                id="smtp-secure"
                type="checkbox"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="size-4 rounded border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="smtp-secure" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                Use Secure TLS Connection (SSL/TLS on Port 465)
              </label>
            </div>

            <div className="sm:col-span-3 flex flex-col gap-2">
              <label htmlFor="smtp-user" className="text-xs font-medium text-muted-foreground">
                SMTP Username
              </label>
              <input
                id="smtp-user"
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="alerts@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
            </div>
            <div className="sm:col-span-3 flex flex-col gap-2">
              <label htmlFor="smtp-pass" className="text-xs font-medium text-muted-foreground flex justify-between items-center">
                <span>SMTP Password / App Password</span>
                {smtpPassConfigured && !isEditingPass && (
                  <button
                    type="button"
                    onClick={handleClearSmtpPass}
                    disabled={isSaving}
                    className="text-[10px] font-medium text-destructive hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Clear Saved
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  id="smtp-pass"
                  type={showPass ? "text" : "password"}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={smtpPassConfigured ? "•••••••• (Password Saved)" : "Enter SMTP password"}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-10 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50 text-ellipsis"
                />
                {isEditingPass ? (
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                ) : smtpPassConfigured ? (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                    title="Password is saved and hidden for security"
                  >
                    <Lock className="size-4" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sm:col-span-3 flex flex-col gap-2">
              <label htmlFor="email-from" className="text-xs font-medium text-muted-foreground">
                Email From (Sender Header)
              </label>
              <input
                id="email-from"
                type="text"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder='Domainatrix <alerts@example.com>'
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
            </div>
            <div className="sm:col-span-3 flex flex-col gap-2">
              <label htmlFor="email-to" className="text-xs font-medium text-muted-foreground">
                Email To (Recipient)
              </label>
              <input
                id="email-to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Action Button & Note */}
        <div className="border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Webhook delivery takes priority when configured. If empty, SMTP email delivery is used instead.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Delivery Settings"}
          </button>
        </div>
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
          ? "inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
          : "inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label} {configured ? "active" : "inactive"}
    </div>
  );
}

