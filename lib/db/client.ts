import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import * as mysqlSchema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

const useSqlite = process.env.DB_DRIVER === "sqlite";

declare global {
  var __mysqlPool: mysql.Pool | undefined;
  var __sqliteConn: Database.Database | undefined;
}

function createMysqlDb() {
  const pool =
    globalThis.__mysqlPool ??
    mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });
  if (process.env.NODE_ENV !== "production") globalThis.__mysqlPool = pool;

  return drizzleMysql(pool, { schema: mysqlSchema, mode: "default" });
}

function createSqliteDb() {
  const sqlite =
    globalThis.__sqliteConn ?? new Database(process.env.SQLITE_PATH || "./dev.sqlite3");
  if (process.env.NODE_ENV !== "production") globalThis.__sqliteConn = sqlite;

  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

// The MySQL and SQLite Drizzle client types are structurally incompatible
// (different query-builder generics), so TypeScript cannot infer a usable
// union for `db` here. This is fine at runtime - only one branch ever
// executes - but the static type must be erased at this one boundary.
// The dev-only SQLite path is a temporary fallback (see schema.sqlite.ts);
// once MySQL is confirmed available, `db` behaves as a plain MySqlDatabase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = useSqlite ? createSqliteDb() : createMysqlDb();

// Re-export the active schema so call sites can do:
//   import { schema } from "@/lib/db/client"; const { users } = schema;
// without caring which driver is active. This indirection only exists for
// the SQLite dev fallback period; once MySQL is the fixed target, route
// handlers can import table objects from "@/lib/db/schema" directly.
export const schema = useSqlite ? sqliteSchema : mysqlSchema;
