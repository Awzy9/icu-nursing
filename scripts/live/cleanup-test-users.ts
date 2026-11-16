/** Removes every clearly-marked LIVE TEST account and its content from the approved DEV project. */
import { sql } from "./mgmt";
import { deleteTestUser } from "./admin";

(async () => {
  await sql(`begin;
    alter table public.content_reviews disable trigger content_reviews_no_change;
    delete from public.topics where slug like 'live-%' or slug like 'ui-live-%';
    delete from public.sources where title like 'LIVE TEST %';
    alter table public.content_reviews enable trigger content_reviews_no_change;
    commit;`);
  const users = await sql<{ id: string }>("select id from auth.users where email like 'live-test-%@example.org'");
  for (const u of users) await deleteTestUser(u.id).catch((e) => console.log("could not delete", u.id, e.message.slice(0, 80)));
  console.log(`removed ${users.length} test account(s)`);
  console.log(await sql("select (select count(*) from auth.users) users, (select count(*) from public.topics) topics, (select count(*) from public.sources) sources"));
})().catch((e) => { console.error(e.message); process.exit(1); });
