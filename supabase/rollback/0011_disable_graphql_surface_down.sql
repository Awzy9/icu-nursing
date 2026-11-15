-- MANUAL ROLLBACK for 0011: restore the default GraphQL entry-point grants.
begin;
do $$
begin
  if to_regprocedure('graphql_public.graphql(text, text, jsonb, jsonb)') is not null then
    grant execute on function graphql_public.graphql(text, text, jsonb, jsonb) to anon, authenticated;
  end if;
end $$;
delete from supabase_migrations.schema_migrations where version = '0011';
commit;
