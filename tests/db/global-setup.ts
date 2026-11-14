import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = path.resolve(__dirname, "../..");
const BASE = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const DB = "icu_nursing_test";

function urlFor(db: string) {
  const u = new URL(BASE);
  u.pathname = `/${db}`;
  return u.toString();
}

/** Creates a fresh database, installs the auth shim, applies every migration in order. */
export default async function setup() {
  const admin = new pg.Client({ connectionString: BASE });
  await admin.connect();
  await admin.query(`drop database if exists ${DB} with (force)`);
  await admin.query(`create database ${DB}`);
  await admin.end();

  const c = new pg.Client({ connectionString: urlFor(DB) });
  await c.connect();
  await c.query(readFileSync(path.join(__dirname, "auth-shim.sql"), "utf8"));
  const dir = path.join(ROOT, "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    try {
      await c.query(readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      throw new Error(`Migration ${f} failed: ${(e as Error).message}`);
    }
  }
  await c.end();
  process.env.TEST_DATABASE_URL = urlFor(DB);

  return async () => {
    const a = new pg.Client({ connectionString: BASE });
    await a.connect();
    await a.query(`drop database if exists ${DB} with (force)`);
    await a.end();
  };
}
