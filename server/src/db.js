// ─── db.js ────────────────────────────────────────────────────────────────────
// Sets up the SQLite database using @libsql/client (pure JavaScript, no
// native build tools required — works on Windows without Visual Studio).
//
// We use the local file-based client so the database lives at server/plant-o-meter.db.

import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'plant-o-meter.db');

// createClient with a file:// URL = local SQLite file (no server needed)
export const db = createClient({
  url: `file:${DB_PATH}`,
});

// ─── Initialise schema ────────────────────────────────────────────────────────
// Called once at server startup. Creates the table if it doesn't exist.
export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS readings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id   TEXT    NOT NULL DEFAULT 'esp32-01',
      moisture    REAL    NOT NULL,
      temperature REAL    NOT NULL,
      ph          REAL    NOT NULL,
      received_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_readings_received_at
      ON readings(received_at DESC)
  `);

  console.log('[DB] Schema ready →', DB_PATH);
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/** Insert a new sensor reading. Returns the inserted row id. */
export async function insertReading({ deviceId, moisture, temperature, ph }) {
  const result = await db.execute({
    sql: `INSERT INTO readings (device_id, moisture, temperature, ph)
          VALUES (?, ?, ?, ?)`,
    args: [deviceId, moisture, temperature, ph],
  });
  return result.lastInsertRowid;
}

/** Return the single most recent reading, or null if the table is empty. */
export async function getLatestReading() {
  const result = await db.execute(`
    SELECT * FROM readings ORDER BY id DESC LIMIT 1
  `);
  return result.rows[0] ?? null;
}

/**
 * Return up to `limit` readings, oldest-first (for charting).
 * @param {number} limit
 */
export async function getHistory(limit = 50) {
  const result = await db.execute({
    sql: `SELECT * FROM (
            SELECT * FROM readings ORDER BY id DESC LIMIT ?
          ) sub
          ORDER BY id ASC`,
    args: [limit],
  });
  return result.rows;
}
