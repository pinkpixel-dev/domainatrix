import { NextResponse } from "next/server";
import { getSettings, setSetting, deleteSetting } from "@/lib/settings/settings-service";

export const dynamic = "force-dynamic";

const SETTING_KEYS = [
  "CRON_SECRET",
  "NOTIFICATION_WEBHOOK_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "NOTIFICATION_EMAIL_FROM",
  "NOTIFICATION_EMAIL_TO",
  "CRUX_API_KEY",
];

const SENSITIVE_KEYS = ["SMTP_PASS", "CRUX_API_KEY"];

export async function GET() {
  try {
    const rawSettings = await getSettings(SETTING_KEYS);
    
    // Mask sensitive keys
    const settings = { ...rawSettings };
    for (const key of SENSITIVE_KEYS) {
      if (settings[key]) {
        settings[key] = "********";
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updates = body.settings || {};

    // Get current values to check against masked inputs
    const currentSettings = await getSettings(SETTING_KEYS);

    for (const key of SETTING_KEYS) {
      const newValue = updates[key];
      
      // If the value is undefined in the payload, skip it
      if (newValue === undefined) {
        continue;
      }

      const trimmedValue = String(newValue).trim();

      // If it's a sensitive key and the value is the masked placeholder, skip it
      if (SENSITIVE_KEYS.includes(key) && trimmedValue === "********") {
        continue;
      }

      // If the value is empty, delete it to revert to default/env or unset
      if (trimmedValue === "") {
        await deleteSetting(key);
      } else {
        await setSetting(key, trimmedValue);
      }
    }

    // Return the updated and masked settings
    const rawSettings = await getSettings(SETTING_KEYS);
    const settings = { ...rawSettings };
    for (const key of SENSITIVE_KEYS) {
      if (settings[key]) {
        settings[key] = "********";
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings." },
      { status: 500 },
    );
  }
}
