import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, "../../data/shoptalk.sqlite");

export const COLLECTION_KEYS = [
  "hiringManagers",
  "organizations",
  "memberships",
  "candidates",
  "jobPostings",
  "applications",
  "interviews",
  "interviewPanelists",
  "calendarEvents",
  "calendarConnections",
  "recordings",
  "transcripts",
  "bots",
  "scorecardCriteria",
  "scorecardResults",
];

/**
 * SQLite-backed snapshot persistence for the in-memory Store.
 * Keeps route/model APIs stable while surviving process restarts.
 */
export class SqlitePersistence {
  /**
   * @param {string} [dbPath]
   */
  constructor(dbPath = process.env.DATABASE_PATH?.trim() || DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.sqlite = new DatabaseSync(dbPath);
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        name TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        event TEXT,
        status TEXT NOT NULL,
        error TEXT,
        created_at TEXT NOT NULL,
        processed_at TEXT
      );
    `);
    this._insertCollection = this.sqlite.prepare(
      `INSERT INTO collections (name, data) VALUES (?, ?)
       ON CONFLICT(name) DO UPDATE SET data = excluded.data`,
    );
    this._selectCollection = this.sqlite.prepare(
      `SELECT data FROM collections WHERE name = ?`,
    );
    this._getWebhook = this.sqlite.prepare(
      `SELECT id, event, status, error, created_at, processed_at
       FROM webhook_events WHERE id = ?`,
    );
    this._upsertWebhook = this.sqlite.prepare(
      `INSERT INTO webhook_events (id, event, status, error, created_at, processed_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         event = excluded.event,
         status = excluded.status,
         error = excluded.error,
         processed_at = excluded.processed_at`,
    );
  }

  /**
   * @param {import("./db.js").Store} store
   */
  loadInto(store) {
    for (const key of COLLECTION_KEYS) {
      const row = this._selectCollection.get(key);
      if (!row?.data) continue;
      try {
        const entries = JSON.parse(row.data);
        if (!Array.isArray(entries)) continue;
        store[key] = new Map(entries);
      } catch (err) {
        console.error(`[persist] failed to load collection ${key}:`, err.message);
      }
    }
  }

  /**
   * @param {import("./db.js").Store} store
   */
  saveFrom(store) {
    this.sqlite.exec("BEGIN");
    try {
      for (const key of COLLECTION_KEYS) {
        const map = store[key];
        if (!(map instanceof Map)) continue;
        this._insertCollection.run(key, JSON.stringify([...map.entries()]));
      }
      this.sqlite.exec("COMMIT");
    } catch (err) {
      this.sqlite.exec("ROLLBACK");
      throw err;
    }
  }

  getWebhookEvent(id) {
    return this._getWebhook.get(id) || null;
  }

  /**
   * @param {{ id: string, event?: string, status: string, error?: string | null, createdAt?: string, processedAt?: string | null }} input
   */
  upsertWebhookEvent(input) {
    const now = new Date().toISOString();
    this._upsertWebhook.run(
      input.id,
      input.event || null,
      input.status,
      input.error || null,
      input.createdAt || now,
      input.processedAt ?? null,
    );
    return this.getWebhookEvent(input.id);
  }
}
