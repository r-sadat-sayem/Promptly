import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'promptly.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS savings_records (
    id            TEXT    PRIMARY KEY,
    timestamp     INTEGER NOT NULL,
    type          TEXT    NOT NULL,
    tokens_before INTEGER NOT NULL,
    tokens_after  INTEGER NOT NULL,
    tokens_saved  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS savings_config (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    daily_calls       INTEGER NOT NULL DEFAULT 10000,
    price_per_million REAL    NOT NULL DEFAULT 1500
  );

  INSERT OR IGNORE INTO savings_config (id, daily_calls, price_per_million)
    VALUES (1, 10000, 1500);

  CREATE TABLE IF NOT EXISTS optimization_cache (
    cache_key          TEXT    PRIMARY KEY,
    prompt_hash        TEXT    NOT NULL,
    mode               TEXT    NOT NULL,
    normalized_prompt  TEXT    NOT NULL,
    normalized_file_hash TEXT,
    optimized_prompt   TEXT    NOT NULL,
    changes_json       TEXT    NOT NULL,
    quality_confidence REAL    NOT NULL,
    quality_notes      TEXT    NOT NULL,
    metadata_json      TEXT,
    created_at         INTEGER NOT NULL,
    last_hit_at        INTEGER NOT NULL,
    hit_count          INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS optimization_knowledge (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_hash             TEXT    NOT NULL,
    mode                    TEXT    NOT NULL,
    normalized_prompt       TEXT    NOT NULL,
    original_prompt_pattern TEXT    NOT NULL,
    optimized_prompt        TEXT    NOT NULL,
    token_reduction         REAL    NOT NULL,
    accuracy_score          REAL    NOT NULL,
    optimization_rules_json TEXT    NOT NULL,
    timestamp               INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_optimization_cache_prompt_hash
    ON optimization_cache (prompt_hash);

  CREATE INDEX IF NOT EXISTS idx_optimization_knowledge_mode_time
    ON optimization_knowledge (mode, timestamp DESC);
`);

// Backward-compatible migrations — safe to run on existing DB
const migrations = [
  "ALTER TABLE savings_config ADD COLUMN model_name TEXT DEFAULT 'Custom'",
  "ALTER TABLE savings_config ADD COLUMN currency TEXT DEFAULT 'JPY'",
  "ALTER TABLE savings_config ADD COLUMN usd_to_jpy REAL DEFAULT 155",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

export default db;
