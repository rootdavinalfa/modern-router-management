import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { loadDatabaseEnv, type DatabaseEngine } from './env';
import { pgSchema, sqliteSchema } from './schema';

export type DatabaseClient =
  | ReturnType<typeof drizzlePg<typeof pgSchema>>
  | ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>;

export type DatabaseConnection = {
  db: DatabaseClient;
  engine: DatabaseEngine;
};

const initializeSqliteSchema = (sqlite: Database.Database): void => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS routers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      driver TEXT NOT NULL,
      host TEXT NOT NULL,
      username TEXT,
      is_online INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS router_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      router_id INTEGER NOT NULL,
      encrypted_username TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      username_iv TEXT NOT NULL,
      username_auth_tag TEXT NOT NULL,
      password_iv TEXT NOT NULL,
      password_auth_tag TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};

export const createDatabase = (): DatabaseConnection => {
  const env = loadDatabaseEnv();

  if (env.DB_ENGINE === 'sqlite') {
    mkdirSync(dirname(env.SQLITE_PATH), { recursive: true });
    const sqlite = new Database(env.SQLITE_PATH);
    initializeSqliteSchema(sqlite);
    return {
      db: drizzleSqlite(sqlite, { schema: sqliteSchema }),
      engine: 'sqlite',
    };
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return {
    db: drizzlePg(pool, { schema: pgSchema }),
    engine: 'postgres',
  };
};
