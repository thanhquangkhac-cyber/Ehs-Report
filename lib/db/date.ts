const useSqlite = process.env.DB_DRIVER === "sqlite";

/**
 * better-sqlite3 (dev-only fallback driver) cannot bind JS Date objects
 * directly - only numbers, strings, bigints, buffers, and null. mysql2
 * (production driver) accepts Date objects natively for DATETIME columns.
 * Route handlers should pass dates through this before writing so the same
 * code works against both drivers; on MySQL it is a no-op passthrough.
 */
export function toDbDate(date: Date): Date | string {
  return useSqlite ? date.toISOString() : date;
}
