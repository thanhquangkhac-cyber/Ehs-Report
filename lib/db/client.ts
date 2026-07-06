import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { Pool } from "pg";
import Database from "better-sqlite3";
import * as pgSchema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

const useSqlite = process.env.DB_DRIVER === "sqlite";

declare global {
  var __pgPool: Pool | undefined;
  var __sqliteConn: Database.Database | undefined;
}

function createPgDb() {
  const pool =
    globalThis.__pgPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  if (process.env.NODE_ENV !== "production") globalThis.__pgPool = pool;

  return drizzlePg(pool, { schema: pgSchema });
}

function createSqliteDb() {
  const sqlite =
    globalThis.__sqliteConn ?? new Database(process.env.SQLITE_PATH || "./dev.sqlite3");
  if (process.env.NODE_ENV !== "production") globalThis.__sqliteConn = sqlite;

  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

// The Postgres and SQLite Drizzle client types are structurally incompatible
// (different query-builder generics), so TypeScript cannot infer a usable
// union for `db` here. This is fine at runtime - only one branch ever
// executes - but the static type must be erased at this one boundary.
// The SQLite path is a local-dev-only fallback (see schema.sqlite.ts);
// production always runs on Postgres (Neon).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = useSqlite ? createSqliteDb() : createPgDb();

// Re-export the active schema so call sites can do:
//   import { schema } from "@/lib/db/client"; const { users } = schema;
// without caring which driver is active.
export const schema = useSqlite ? sqliteSchema : pgSchema;
