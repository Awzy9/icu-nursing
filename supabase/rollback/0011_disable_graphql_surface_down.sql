-- MANUAL ROLLBACK for 0011: re-enable GraphQL (only where wanted; the app does not use it).
begin;
create extension if not exists pg_graphql;
delete from supabase_migrations.schema_migrations where version = '0011';
commit;
