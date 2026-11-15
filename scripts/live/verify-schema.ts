/** Verifies the LIVE dev project's schema/permissions against the same allowlists used by tests/db. Exits non-zero on any failure. */
import { sql } from "./mgmt";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`); if (!ok) failed++; };
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const col = async (q: string, key: string) => (await sql<Record<string, string>>(q)).map((r) => r[key]);

(async () => {
  const tables = await col("select c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1", "t");
  console.log(`tables (${tables.length}): ${tables.join(", ")}`);
  check("expected tables exist", eq(tables, ["app_settings","audit_log","bookmarks","case_attempt_steps","case_attempts","case_items","case_option_keys","case_step_options","case_steps","content_reviews","content_versions","learner_question_stats","learner_review_schedule","learning_progress","nursing_domains","profiles","question_answer_keys","question_bookmarks","question_explanations","question_items","question_options","question_stats","quiz_answers","quiz_attempt_items","quiz_attempts","review_assignments","reviewer_specialties","skill_bookmarks","skill_checklist_items","skill_items","skill_revisions","skill_session_items","skill_sessions","sources","topic_actions","topic_images","topic_references","topic_sections","topics","user_roles"]));
  check("RLS enabled on every public table", (await col("select c.relname t from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity", "t")).length === 0);
  const views = await col("select viewname v from pg_views where schemaname='public' order by 1", "v");
  check("public views are exactly the two read surfaces", eq(views, ["public_domains", "public_topics"]), views.join(","));
  check("both public views are security barriers", (await col("select c.relname v from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and not coalesce('security_barrier=true' = any(c.reloptions), false)", "v")).length === 0);
  check("nobody can create objects in public/private", (await sql<{ c: boolean }>("select bool_or(has_schema_privilege(r, s, 'CREATE')) c from unnest(array['anon','authenticated']) r, unnest(array['public','private']) s"))[0]!.c === false);

  const fnAuth = await col("select p.proname f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and has_function_privilege('authenticated', p.oid, 'execute') order by 1", "f");
  check("RPC functions executable by authenticated = allowlist (16 workflow/admin/learner RPCs + 10 question-bank RPCs + 3 study RPCs + 6 case RPCs + 9 skills RPCs)", eq(fnAuth, ["admin_grant_role","admin_revoke_role","admin_set_specialty","archive_topic","assign_reviewer","cs_choose","cs_discard","cs_get","cs_list","cs_progress","cs_start","publish_topic","qb_discard_attempt","qb_get_attempt","qb_list_attempts","qb_progress","qb_set_bookmark","qb_set_flag","qb_set_position","qb_start_attempt","qb_submit_answer","qb_submit_attempt","record_review","record_topic_view","restore_topic","rollback_topic","set_required_roles","set_topic_completion","sk_complete_session","sk_discard_session","sk_get","sk_get_session","sk_list","sk_mark","sk_progress","sk_set_bookmark","sk_start_session","st_history","st_overview","st_start_revision","start_revision","submit_for_review","validate_topic_for_review","withdraw_submission"]), fnAuth.length + " functions");
  const fnAnon = await col("select n.nspname || '.' || p.proname f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and has_function_privilege('anon', p.oid, 'execute') order by 1", "f");
  check("anon can execute no application function", fnAnon.length === 0, fnAnon.join(","));
  check("anon has no access to the private schema", (await sql<{ u: boolean }>("select has_schema_privilege('anon','private','usage') u"))[0]!.u === false);
  check("internal helpers/triggers are not executable by authenticated", (await col("select p.proname f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname in ('write_audit','audit_row','_evaluate_version','_topic_snapshot','_require_role','handle_new_user') and has_function_privilege('authenticated', p.oid, 'execute')", "f")).length === 0);
  check("no application function falls back to PUBLIC execute", (await col("select p.proname f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and p.proacl is null", "f")).length === 0);
  check("every application function pins search_path", (await col("select p.proname f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')", "f")).length === 0);
  const anonTables = (await sql<{ table_name: string; privilege_type: string }>("select table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee='anon' order by 1,2")).map((r) => `${r.table_name}:${r.privilege_type}`);
  check("anon can only SELECT domains and the two public views", eq(anonTables, ["nursing_domains:SELECT", "public_domains:SELECT", "public_topics:SELECT"]), anonTables.join(","));
  check("authenticated has no write access to workflow tables", (await col("select table_name t from information_schema.role_table_grants where table_schema='public' and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE') and table_name in ('content_versions','content_reviews','review_assignments','audit_log','user_roles','reviewer_specialties','learning_progress','app_settings')", "t")).length === 0);
  const upd = await col("select column_name c from information_schema.column_privileges where table_schema='public' and table_name='topics' and grantee='authenticated' and privilege_type='UPDATE'", "c");
  check("topics: workflow columns not updatable by API", !["status","kind","author_id","published_version_id","archived_at","id","required_review_roles"].some((c) => upd.includes(c)), `${upd.length} editable columns`);
  check("service_role/anon cannot write audit_log", (await col("select grantee g from information_schema.role_table_grants where table_schema='public' and table_name='audit_log' and privilege_type in ('INSERT','UPDATE','DELETE') and grantee in ('anon','authenticated')", "g")).length === 0);

  check("auth.users signup trigger exists", (await col("select tgname t from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal and tgname='on_auth_user_created'", "t")).length === 1);
  const counts = (await sql<{ policies: number; indexes: number; triggers: number }>("select (select count(*) from pg_policies where schemaname='public')::int policies, (select count(*) from pg_indexes where schemaname='public')::int indexes, (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int triggers"))[0]!;
  console.log(`policies=${counts.policies} indexes=${counts.indexes} triggers=${counts.triggers}`);
  check("policies, indexes and triggers present", counts.policies >= 30 && counts.indexes >= 20 && counts.triggers >= 15);
  check("ten curriculum domains seeded", (await sql<{ n: number }>("select count(*)::int n from public.nursing_domains"))[0]!.n === 10);
  check("no demo/clinical topics imported", (await sql<{ n: number }>("select count(*)::int n from public.topics"))[0]!.n === 0);
  check("app_settings: staff MFA and distinct reviewers required", eq((await sql("select require_staff_mfa, require_distinct_reviewers from public.app_settings"))[0], { require_staff_mfa: true, require_distinct_reviewers: true }));

  const bucket = (await sql("select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='topic-images'"))[0];
  check("storage bucket topic-images: public, 2 MB, png/jpeg/webp only", eq(bucket, { id: "topic-images", public: true, file_size_limit: 2097152, allowed_mime_types: ["image/png", "image/jpeg", "image/webp"] }), JSON.stringify(bucket));
  const sp = await col("select policyname p from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'topic_images_%' order by 1", "p");
  check("storage object policies installed", eq(sp, ["topic_images_delete", "topic_images_insert", "topic_images_select", "topic_images_update"]), sp.join(","));
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll schema checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
