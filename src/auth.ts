import { createClient, type Client } from '@libsql/client';
import { randomBytes } from 'crypto';
import path from 'path';

const DB_URL = `file:${process.env.DB_PATH || path.join(process.cwd(), 'keys.db')}`;

let client: Client;

function getClient(): Client {
  if (!client) {
    client = createClient({ url: DB_URL });
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      active INTEGER NOT NULL DEFAULT 0
    )
  `);
}

export async function generateKey(email: string): Promise<string> {
  const key = `url2md_${randomBytes(24).toString('hex')}`;
  const db = getClient();
  await db.execute({
    sql: 'INSERT INTO keys (key, email, active) VALUES (?, ?, 1)',
    args: [key, email],
  });
  return key;
}

export async function validateKey(key: string): Promise<boolean> {
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT active FROM keys WHERE key = ?',
    args: [key],
  });
  const row = result.rows[0];
  return row?.active === 1;
}

export async function activateKey(key: string): Promise<void> {
  const db = getClient();
  await db.execute({
    sql: 'UPDATE keys SET active = 1 WHERE key = ?',
    args: [key],
  });
}
