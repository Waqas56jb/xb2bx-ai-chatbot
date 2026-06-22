/**
 * Database connection — the adapter boundary.
 *
 * Uses Node's built-in SQLite (node:sqlite) — no native build, no extra
 * dependency. Requires the --experimental-sqlite flag on Node 22 (already
 * set in the npm scripts; dropped automatically on Node 23+).
 *
 * Everything DB-specific lives here and in the repositories. Swap SQLite
 * for Postgres/MySQL by changing this file + the repository query; the
 * agents, tools, and server stay untouched.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SUPPLIERS_DB || resolve(__dirname, '../../data/xb2bx.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

// Ensure the schema exists on startup.
db.exec(readFileSync(resolve(__dirname, 'schema.sql'), 'utf8'));

export default db;
