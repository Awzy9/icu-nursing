-- 0011_disable_graphql_surface.sql
-- Security review (Phase 6): Supabase ships a second API surface, pg_graphql at /graphql/v1. The application never uses it, yet where it
-- is enabled it lets any signed-in user introspect table and column names and run ad-hoc queries over every table they hold SELECT on.
-- Row-level security still protects the data (tested), but an unused, schema-revealing endpoint is attack surface with no benefit.
-- This migration drops the pg_graphql extension where present (the documented way to disable GraphQL). It is a no-op on databases
-- without the extension: the hosted icu-nursing-dev project already has it disabled, and the plain-PostgreSQL test database never had it.
-- Reversible: `create extension pg_graphql;` (see supabase/rollback/0011_disable_graphql_surface_down.sql).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_graphql') then
    drop extension pg_graphql;
  end if;
end $$;
