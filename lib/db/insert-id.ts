/**
 * Normalizes the insert result across drivers: mysql2 returns
 * [ResultSetHeader, FieldPacket[]] where ResultSetHeader.insertId is the
 * new row id; better-sqlite3 (used only for local dev fallback) returns a
 * single RunResult object with `lastInsertRowid`. Route handlers should use
 * this instead of destructuring the raw insert() result directly.
 */
export function extractInsertId(insertResult: unknown): number {
  if (Array.isArray(insertResult)) {
    const header = insertResult[0] as { insertId?: number };
    return header?.insertId ?? 0;
  }
  const runResult = insertResult as { lastInsertRowid?: number | bigint };
  return Number(runResult?.lastInsertRowid ?? 0);
}
