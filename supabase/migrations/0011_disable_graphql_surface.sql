-- 0011_disable_graphql_surface.sql
-- Security review (Phase 6): Supabase ships a second API surface, pg_graphql at /graphql/v1. The application never uses it, yet it
-- would let any signed-in user introspect table and column names and run ad-hoc queries over every table they hold SELECT on.
-- Row-level security still protects the data (tested), but an unused, schema-revealing endpoint is attack surface with no benefit.
-- Learners and anonymous callers lose EXECUTE on the GraphQL entry point; PostgREST (/rest/v1) is unaffected. Reversible by
-- re-granting EXECUTE (see supabase/rollback/0011_disable_graphql_surface_down.sql). Guarded so databases without pg_graphql
-- (the plain-PostgreSQL test database) are unaffected.
do $$
begin
  if to_regnamespace('graphql_public') is not null and to_regprocedure('graphql_public.graphql(text, text, jsonb, jsonb)') is not null then
    revoke execute on function graphql_public.graphql(text, text, jsonb, jsonb) from anon, authenticated;
  end if;
end $$;
