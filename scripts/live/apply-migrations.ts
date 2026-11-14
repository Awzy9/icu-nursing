/** Applies supabase/migrations/*.sql, in order, to the approved dev project. Idempotent: applied versions are recorded. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "./mgmt";

(async () => {
  await sql("create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)");
  const done = new Set((await sql<{ version: string }>("select version from supabase_migrations.schema_migrations")).map((r) => r.version));
  const dir = path.resolve(__dirname, "../../supabase/migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const [, version, name] = /^(\d+)_(.+)\.sql$/.exec(f)!;
    if (done.has(version!)) { console.log(`skip  ${f} (already applied)`); continue; }
    const body = readFileSync(path.join(dir, f), "utf8");
    process.stdout.write(`apply ${f} ... `);
    // One transaction per migration: any failure rolls the whole file back.
    await sql(`begin;\n${body}\n;insert into supabase_migrations.schema_migrations (version, name, statements) values ('${version}', '${name}', array[]::text[]);\ncommit;`);
    console.log("ok");
  }
})().catch((e) => { console.error("\nFAILED:", e.message); process.exit(1); });
