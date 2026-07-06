import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.sqlite.ts",
  out: "./lib/db/migrations-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SQLITE_PATH || "./dev.sqlite3",
  },
});
