/**
 * Both drivers in use (Postgres via node-postgres with `mode: "string"`
 * timestamp columns, and the SQLite dev fallback) store/compare timestamps
 * as ISO strings rather than JS Date objects. Route handlers should pass
 * dates through this before writing or comparing so values round-trip
 * consistently across both drivers.
 */
export function toDbDate(date: Date): string {
  return date.toISOString();
}
