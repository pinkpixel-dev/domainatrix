import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const databasePath = process.env.DB_FILE_NAME ?? "./data/domainatrix.sqlite";

if (databasePath !== ":memory:") {
  mkdirSync(dirname(databasePath), { recursive: true });
}

const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };

let migrated = false;

export function ensureDatabaseReady() {
  if (migrated) {
    return;
  }

  const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? "drizzle";
  migrate(db, { migrationsFolder });
  migrated = true;
}
