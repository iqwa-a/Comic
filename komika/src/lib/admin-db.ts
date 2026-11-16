import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { AD_SLOTS, SETTING_DEFAULTS, type AdSlotKey } from "./admin-config";

// Penyimpanan admin: SQLite tunggal di folder data/. Data kecil (iklan + pengaturan)
// dan hanya ditulis admin, jadi satu file DB dengan WAL sudah lebih dari cukup.
const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "komika.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    slot TEXT PRIMARY KEY,
    code TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`);

export type AdEntry = { slot: string; code: string; active: boolean };

function normalizeSlot(slot: unknown): AdSlotKey | null {
  return AD_SLOTS.some((s) => s.key === slot) ? (slot as AdSlotKey) : null;
}

export function getAd(slot: AdSlotKey): AdEntry | null {
  const row = db.prepare("SELECT slot, code, active FROM ads WHERE slot = ?").get(slot) as { slot: string; code: string; active: number } | undefined;
  if (!row) return null;
  return { slot: row.slot, code: row.code, active: row.active === 1 };
}

export function getAllAds(): AdEntry[] {
  return (db.prepare("SELECT slot, code, active FROM ads").all() as { slot: string; code: string; active: number }[])
    .map((row) => ({ slot: row.slot, code: row.code, active: row.active === 1 }));
}

export function saveAd(slot: string, code: string, active: boolean): boolean {
  const key = normalizeSlot(slot);
  if (!key) return false;
  db.prepare("INSERT INTO ads (slot, code, active) VALUES (?, ?, ?) ON CONFLICT(slot) DO UPDATE SET code = excluded.code, active = excluded.active")
    .run(key, code, active ? 1 : 0);
  return true;
}

export function getSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return { ...SETTING_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export function saveSettings(values: Record<string, unknown>): void {
  const update = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const allowed = Object.keys(SETTING_DEFAULTS);
  for (const [key, value] of Object.entries(values)) {
    if (allowed.includes(key) && typeof value === "string") update.run(key, value);
  }
}
