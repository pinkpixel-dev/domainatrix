import { db, ensureDatabaseReady } from "../db/client";
import { appSettings } from "../db/schema";
import { eq } from "drizzle-orm";

export function getSetting(key: string): string | undefined {
  ensureDatabaseReady();
  try {
    const [row] = db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)
      .all();
    if (row && row.value !== null && row.value !== undefined) {
      return row.value;
    }
  } catch (err) {
    console.error(`Error reading setting ${key} from DB:`, err);
  }
  // Fallback to process.env
  return process.env[key];
}

export function getSettings(keys: string[]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    result[key] = getSetting(key);
  }
  return result;
}

export function setSetting(key: string, value: string): void {
  ensureDatabaseReady();
  db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
}

export function setSettings(settings: Record<string, string>): void {
  for (const [key, value] of Object.entries(settings)) {
    setSetting(key, value);
  }
}

export function deleteSetting(key: string): void {
  ensureDatabaseReady();
  db.delete(appSettings).where(eq(appSettings.key, key)).run();
}

