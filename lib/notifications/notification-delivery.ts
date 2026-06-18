import nodemailer from "nodemailer";
import type { NotificationSummary } from "./types";
import { getSetting } from "../settings/settings-service";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type NotificationDeliverySettings = {
  webhookUrl?: string;
  email?: EmailDeliverySettings;
};

export type NotificationDeliveryResult = {
  attempted: boolean;
  delivered: boolean;
  channel: "none" | "webhook" | "email";
  error?: string;
};

export type EmailDeliverySettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
};

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type DeliverNotificationOptions = {
  settings?: NotificationDeliverySettings;
  fetcher?: FetchLike;
  emailSender?: (message: EmailMessage, settings: EmailDeliverySettings) => Promise<void>;
};

type EnvMap = Record<string, string | undefined>;

export function getNotificationDeliverySettings(env?: EnvMap): NotificationDeliverySettings {
  if (env) {
    const webhookUrl = env.NOTIFICATION_WEBHOOK_URL?.trim();
    const email = getEmailDeliverySettings(env);
    return {
      webhookUrl: webhookUrl || undefined,
      email,
    };
  }

  const webhookUrl = getSetting("NOTIFICATION_WEBHOOK_URL")?.trim();
  const email = getEmailDeliverySettingsFromDb();

  return {
    webhookUrl: webhookUrl || undefined,
    email,
  };
}

function getEmailDeliverySettingsFromDb(): EmailDeliverySettings | undefined {
  const host = getSetting("SMTP_HOST")?.trim();
  const user = getSetting("SMTP_USER")?.trim();
  const pass = getSetting("SMTP_PASS")?.trim();
  const from = getSetting("NOTIFICATION_EMAIL_FROM")?.trim();
  const to = getSetting("NOTIFICATION_EMAIL_TO")?.trim();

  if (!host || !user || !pass || !from || !to) {
    return undefined;
  }

  const portStr = getSetting("SMTP_PORT");
  const port = Number(portStr || "587");

  const secureStr = getSetting("SMTP_SECURE");
  const secure = secureStr === "true" || port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    from,
    to,
  };
}

export async function deliverNotification(
  notification: NotificationSummary,
  options: DeliverNotificationOptions = {},
): Promise<NotificationDeliveryResult> {
  const settings = options.settings ?? getNotificationDeliverySettings();

  if (settings.webhookUrl) {
    return deliverWebhookNotification(notification, settings.webhookUrl, options.fetcher);
  }

  if (settings.email) {
    return deliverEmailNotification(notification, settings.email, options.emailSender);
  }

  return { attempted: false, delivered: false, channel: "none" };
}

async function deliverWebhookNotification(
  notification: NotificationSummary,
  webhookUrl: string,
  fetcher: FetchLike = fetch,
): Promise<NotificationDeliveryResult> {
  try {
    let body: string;
    if (webhookUrl.includes("discord.com") || webhookUrl.includes("discordapp.com")) {
      body = JSON.stringify({
        content: notification.message || `${notification.domainName}: ${notification.changeType}`,
      });
    } else if (webhookUrl.includes("hooks.slack.com")) {
      body = JSON.stringify({
        text: notification.message || `${notification.domainName}: ${notification.changeType}`,
      });
    } else {
      body = JSON.stringify({
        id: notification.id,
        domainId: notification.domainId,
        domainName: notification.domainName,
        changeType: notification.changeType,
        message: notification.message,
        createdAt: notification.createdAt,
        source: "domainatrix",
      });
    }

    const response = await fetcher(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    if (!response.ok) {
      return {
        attempted: true,
        delivered: false,
        channel: "webhook",
        error: `Webhook returned ${response.status}.`,
      };
    }

    return { attempted: true, delivered: true, channel: "webhook" };
  } catch (caught) {
    return {
      attempted: true,
      delivered: false,
      channel: "webhook",
      error: caught instanceof Error ? caught.message : "Webhook delivery failed.",
    };
  }
}

async function deliverEmailNotification(
  notification: NotificationSummary,
  settings: EmailDeliverySettings,
  emailSender: (message: EmailMessage, settings: EmailDeliverySettings) => Promise<void> = sendSmtpEmail,
): Promise<NotificationDeliveryResult> {
  try {
    await emailSender(formatEmailMessage(notification, settings), settings);
    return { attempted: true, delivered: true, channel: "email" };
  } catch (caught) {
    return {
      attempted: true,
      delivered: false,
      channel: "email",
      error: caught instanceof Error ? caught.message : "Email delivery failed.",
    };
  }
}

function getEmailDeliverySettings(env: EnvMap): EmailDeliverySettings | undefined {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  const from = env.NOTIFICATION_EMAIL_FROM?.trim();
  const to = env.NOTIFICATION_EMAIL_TO?.trim();

  if (!host || !user || !pass || !from || !to) {
    return undefined;
  }

  const port = Number(env.SMTP_PORT || "587");

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: env.SMTP_SECURE === "true" || port === 465,
    user,
    pass,
    from,
    to,
  };
}

function formatEmailMessage(notification: NotificationSummary, settings: EmailDeliverySettings): EmailMessage {
  const subject = `Domainatrix: ${notification.domainName} ${notification.changeType}`;
  const text = [
    `${notification.domainName} - ${notification.changeType}`,
    "",
    notification.message || "No message provided.",
    "",
    `Created: ${notification.createdAt}`,
    `Source: Domainatrix`,
  ].join("\n");

  return {
    from: settings.from,
    to: settings.to,
    subject,
    text,
    html: text
      .split("\n")
      .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br />"))
      .join(""),
  };
}

async function sendSmtpEmail(message: EmailMessage, settings: EmailDeliverySettings) {
  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
  });

  await transporter.sendMail(message);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
