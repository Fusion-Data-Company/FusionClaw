import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "FusionClaw: DATABASE_URL is not set.\n" +
        "  → Run `npm run onboard` to configure your environment, OR\n" +
        "  → Copy .env.example to .env.local and fill in your Neon connection string.\n" +
        "  → Free Neon database: https://neon.tech"
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

/**
 * Lazy database client.
 * The Neon connection is only instantiated on first method access — so
 * importing this module at app startup never blows up if DATABASE_URL is
 * missing. Errors surface with a clear message at first query attempt.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
