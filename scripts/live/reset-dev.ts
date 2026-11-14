/**
 * DESTRUCTIVE: removes this application's objects from the approved DEV project so migrations can be re-applied.
 * Refuses to run without --confirm. The project ref is pinned in mgmt.ts, so no other project can be affected.
 * Auth users are NOT deleted here (use cleanup-test-users.ts for the clearly-marked test accounts).
 */
import { sql, REF } from "./mgmt";

(async () => {
  if (!process.argv.includes("--confirm")) { console.error("Refusing to run without --confirm"); process.exit(1); }
  console.log(`Resetting application objects in dev project ${REF}`);
  await sql(`
    drop trigger if exists on_auth_user_created on auth.users;
    do $$
    declare r record;
    begin
      for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') loop
        execute 'drop function if exists ' || r.sig || ' cascade';
      end loop;
      for r in select viewname from pg_views where schemaname = 'public' loop execute format('drop view if exists public.%I cascade', r.viewname); end loop;
      for r in select tablename from pg_tables where schemaname = 'public' loop execute format('drop table if exists public.%I cascade', r.tablename); end loop;
      for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e' loop execute format('drop type if exists public.%I cascade', r.typname); end loop;
      for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'topic_images_%' loop execute format('drop policy %I on storage.objects', r.policyname); end loop;
    end $$;
    drop schema if exists private cascade;
    truncate supabase_migrations.schema_migrations;
  `);
  console.log("done");
})().catch((e) => { console.error(e.message); process.exit(1); });
