/**
 * LIVE integration test against the approved DEV Supabase project (icu-nursing-dev).
 * Covers: auth, MFA, roles, the clinical publication workflow, learner state, storage, and abuse attempts.
 * All identities are clearly-labelled TEST accounts; nobody is represented as a real qualified reviewer.
 * Fixtures use the admin API (no inbox); roles are granted through the real admin RPCs by an MFA-verified admin.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminStorageRemove } from "../../scripts/live/admin";
import { PASSWORD, RUN, actor, adminAuth, aalOf, cleanup, emailFor, makeUser, newClient, png, signIn, sql, totp, withMfa, type Actor } from "./helpers";

const slug = (n: string) => `live-${RUN}-${n}`;
const created: string[] = [];
const uploaded: string[] = [];
let admin: Actor, author1: Actor, author2: Actor, rvNE: Actor, rvPH: Actor, publisher: Actor, learnerA: Actor, learnerB: Actor;
let domainId: string, sourceId: string;
let topic1 = "", v1 = "", topic2 = "";

const rpc = (a: Actor, fn: string, args: Record<string, unknown> = {}) => a.c.rpc(fn, args);
const ok = <T>(r: { data: T; error: { message: string } | null }) => { expect(r.error?.message).toBeUndefined(); return r.data as NonNullable<T>; };
const denied = async (p: PromiseLike<{ error: { message: string } | null; data?: unknown }>, re = /permission denied|row-level security|required|not assigned|cannot review|only the author|not found|violates|does not exist|schema/i) => {
  const r = await p; expect(r.error, "expected an error").not.toBeNull(); expect(r.error!.message).toMatch(re);
};

async function addTopic(a: Actor, name: string, roles?: string[]) {
  const { data, error } = await a.c.from("topics").insert({ domain_id: domainId, slug: slug(name), title: { en: `LIVE TEST ${name}` }, summary: { en: "Synthetic live-test topic (no clinical content)." } }).select("id").single();
  expect(error?.message).toBeUndefined();
  const id = data!.id as string;
  // Authors cannot choose their own reviewers: a publisher (with MFA) sets the required roles. Default is NE only.
  if (roles) ok(await rpc(publisher, "set_required_roles", { p_topic: id, p_roles: roles }));
  ok(await a.c.from("topic_sections").insert([
    { topic_id: id, kind: "objectives", sort: 0, title: { en: "Objectives" }, body: { en: "- Placeholder objective for a synthetic live test." } },
    { topic_id: id, kind: "overview", sort: 1, title: { en: "Overview" }, body: { en: "Synthetic text. Not clinical guidance." } },
  ]));
  ok(await a.c.from("topic_references").insert({ topic_id: id, source_id: sourceId, citation: "Synthetic citation" }));
  return id;
}
const latestVersion = async (topic: string) => (await sql<{ id: string; version_no: number; status: string }>(`select id, version_no, status from public.content_versions where topic_id='${topic}' order by version_no desc limit 1`))[0]!;
const versionOf = async (a: Actor, topic: string) => ok(await a.c.from("content_versions").select("id, version_no, status").eq("topic_id", topic).order("version_no", { ascending: false }).limit(1).single());

beforeAll(async () => {
  const mk = async (label: string, name: string) => { const u = await makeUser(label, name); created.push(u.id); return u; };
  const [a, b, c, d, e, f, g, h] = await Promise.all([mk("admin", "Admin"), mk("author1", "Author One"), mk("author2", "Author Two"), mk("rv-ne", "Reviewer NE"), mk("rv-ph", "Reviewer PH"), mk("publisher", "Publisher"), mk("learner-a", "Learner A"), mk("learner-b", "Learner B")]);
  // Owner bootstrap (documented in docs/SECURITY.md): the first administrator can only be created by the project owner.
  await sql(`insert into public.user_roles (user_id, role) values ('${a.id}', 'admin')`);
  admin = await actor(a.email, a.id);
  author1 = { ...b, c: newClient() }; author2 = { ...c, c: newClient() }; rvNE = { ...d, c: newClient() }; rvPH = { ...e, c: newClient() };
  publisher = { ...f, c: newClient() }; learnerA = await actor(g.email, g.id); learnerB = await actor(h.email, h.id);
  domainId = (await sql<{ id: string }>("select id from public.nursing_domains where slug='renal-metabolic'"))[0]!.id;
});

afterAll(async () => {
  await adminStorageRemove(uploaded).catch(() => undefined);
  await cleanup(created);
});

describe("1-2. Authentication, sessions and email verification", () => {
  it("rejects weak passwords and invalid input at sign-up", async () => {
    const { error } = await newClient().auth.signUp({ email: emailFor("weak"), password: "short1" });
    expect(error?.code).toBe("weak_password");
  });
  it("blocks sign-in until the email is verified, then accepts the verification link (token hash)", async () => {
    const email = emailFor("verify");
    const link = await adminAuth<{ hashed_token: string; id?: string }>("/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "signup", email, password: PASSWORD, data: { display_name: "LIVE TEST Verify" } }) });
    const u = (await sql<{ id: string }>(`select id from auth.users where email='${email}'`))[0]!; created.push(u.id);
    const c = newClient();
    expect((await c.auth.signInWithPassword({ email, password: PASSWORD })).error?.code).toBe("email_not_confirmed");
    const v = await c.auth.verifyOtp({ token_hash: link.hashed_token, type: "signup" });
    expect(v.error?.message).toBeUndefined();
    expect(v.data.session).not.toBeNull();
    expect((await newClient().auth.signInWithPassword({ email, password: PASSWORD })).error).toBeNull();
    expect((await sql<{ display_name: string }>(`select display_name from public.profiles where id='${u.id}'`))[0]!.display_name).toBe("LIVE TEST Verify");
  });
  it("sign-in succeeds with the right password only; error does not reveal whether the account exists", async () => {
    const bad = await newClient().auth.signInWithPassword({ email: learnerA.email, password: "wrong-password-123" });
    const none = await newClient().auth.signInWithPassword({ email: emailFor("nobody"), password: "wrong-password-123" });
    expect(bad.error?.code).toBe("invalid_credentials");
    expect(none.error?.code).toBe("invalid_credentials");
    expect(bad.error?.message).toBe(none.error?.message);
  });
  it("persists the session across client restarts and refreshes tokens", async () => {
    const store: Record<string, string> = {};
    const first = newClient(store);
    expect((await first.auth.signInWithPassword({ email: learnerB.email, password: PASSWORD })).error).toBeNull();
    const second = newClient(store); // a "new page load" sharing storage
    const { data } = await second.auth.getSession();
    expect(data.session?.user.email).toBe(learnerB.email);
    const before = data.session!.access_token;
    const refreshed = await second.auth.refreshSession();
    expect(refreshed.error).toBeNull();
    expect(refreshed.data.session!.access_token).not.toBe(before);
  });
  it("sign-out ends the session; a global sign-out revokes other sessions", async () => {
    const a = await signIn(learnerA.email); const b = await signIn(learnerA.email);
    await a.auth.signOut({ scope: "global" });
    expect((await b.auth.refreshSession()).error).not.toBeNull();
    expect((await a.auth.getUser()).data.user).toBeNull();
    learnerA = await actor(learnerA.email, learnerA.id);
  });
  it("password reset: recovery link signs in once, sets a new strong password, and rejects a weak one", async () => {
    const u = await makeUser("reset", "Reset"); created.push(u.id);
    const link = await adminAuth<{ hashed_token: string }>("/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "recovery", email: u.email }) });
    const c = newClient();
    expect((await c.auth.verifyOtp({ token_hash: link.hashed_token, type: "recovery" })).error).toBeNull();
    expect((await c.auth.updateUser({ password: "short1" })).error?.code).toBe("weak_password");
    expect((await c.auth.updateUser({ password: "a-brand-new-strong-password-2" })).error).toBeNull();
    expect((await newClient().auth.signInWithPassword({ email: u.email, password: PASSWORD })).error?.code).toBe("invalid_credentials");
    expect((await newClient().auth.signInWithPassword({ email: u.email, password: "a-brand-new-strong-password-2" })).error).toBeNull();
    expect((await newClient().auth.verifyOtp({ token_hash: link.hashed_token, type: "recovery" })).error).not.toBeNull(); // single use
  });
  it("a recovery request for an unknown address reveals nothing", async () => {
    const r = await newClient().auth.resetPasswordForEmail(emailFor("ghost"), { redirectTo: "http://localhost:3000/auth/callback?next=/en/reset-password" });
    expect(r.error === null || r.error.status === 429 || /rate limit/i.test(r.error.message)).toBe(true);
  });
  it("creates a learner profile + learner role for every user and ignores role claims in metadata", async () => {
    const u = await makeUser("meta", "Meta"); created.push(u.id);
    await adminAuth(`/admin/users/${u.id}`, { method: "PUT", body: JSON.stringify({ user_metadata: { display_name: "x", role: "admin", roles: ["admin"] } }) });
    const roles = (await sql<{ role: string }>(`select role from public.user_roles where user_id='${u.id}'`)).map((r) => r.role);
    expect(roles).toEqual(["learner"]);
    const c = await signIn(u.email);
    expect((await c.auth.updateUser({ data: { role: "admin" } })).error).toBeNull(); // user may edit their own metadata...
    expect((await sql<{ role: string }>(`select role from public.user_roles where user_id='${u.id}'`)).map((r) => r.role)).toEqual(["learner"]); // ...it grants nothing
    expect((await c.rpc("admin_grant_role", { p_user: u.id, p_role: "admin" })).error).not.toBeNull();
  });
});

describe("3. TOTP multi-factor authentication and staff role permissions", () => {
  it("an administrator without MFA cannot use administrator powers; the JWT is aal1", async () => {
    expect((await aalOf(admin.c)).aal).toBe("aal1");
    await denied(rpc(admin, "admin_grant_role", { p_user: author1.id, p_role: "author" }), /administrator access with MFA required/);
    expect((await admin.c.from("profiles").select("id")).data!.length).toBe(1); // staff powers inactive: only own profile visible
  });
  it("TOTP enrolment + verification upgrades the session to aal2 and activates the role", async () => {
    await withMfa(admin.c, admin.email);
    expect((await aalOf(admin.c)).aal).toBe("aal2");
    ok(await rpc(admin, "admin_grant_role", { p_user: author1.id, p_role: "author" }));
  });
  it("a wrong TOTP code is rejected", async () => {
    const c = await signIn(admin.email);
    const { data } = await c.auth.mfa.listFactors();
    const bad = await c.auth.mfa.challengeAndVerify({ factorId: data!.totp[0]!.id, code: "000000" });
    expect(bad.error).not.toBeNull();
    expect((await aalOf(c)).aal).toBe("aal1");
  });
  it("signing in again returns to aal1 until the factor is challenged again", async () => {
    const c = await signIn(admin.email);
    expect((await aalOf(c)).aal).toBe("aal1");
    await withMfa(c, admin.email);
    expect((await aalOf(c)).aal).toBe("aal2");
    admin.c = c;
  });
  it("grants staff roles and reviewer specialties only through the MFA-verified administrator", async () => {
    ok(await rpc(admin, "admin_grant_role", { p_user: author2.id, p_role: "author" }));
    ok(await rpc(admin, "admin_grant_role", { p_user: rvNE.id, p_role: "clinical_reviewer" }));
    ok(await rpc(admin, "admin_grant_role", { p_user: rvPH.id, p_role: "clinical_reviewer" }));
    ok(await rpc(admin, "admin_grant_role", { p_user: publisher.id, p_role: "publisher" }));
    ok(await rpc(admin, "admin_set_specialty", { p_user: rvNE.id, p_specialty: "NE", p_enabled: true }));
    ok(await rpc(admin, "admin_set_specialty", { p_user: rvPH.id, p_specialty: "PH", p_enabled: true }));
    const roles = await sql<{ role: string }>(`select role from public.user_roles where user_id in ('${rvNE.id}','${publisher.id}') order by 1`);
    expect(roles.map((r) => r.role)).toEqual(["learner", "learner", "clinical_reviewer", "publisher"]); // enum order
  });
  it("cannot revoke the last administrator", async () => {
    await denied(rpc(admin, "admin_revoke_role", { p_user: admin.id, p_role: "admin" }), /last administrator/);
  });
});

describe("4-7. Author draft -> reviewer assignment -> independent approval -> publication", () => {
  it("an author without MFA cannot create content; with MFA they can create a draft (source register is curated by the publisher)", async () => {
    author1 = await actor(author1.email, author1.id, false);
    await denied(author1.c.from("topics").insert({ domain_id: domainId, slug: slug("nomfa"), title: { en: "x" }, summary: { en: "x" } }));
    await withMfa(author1.c, author1.email);
    publisher = await actor(publisher.email, publisher.id, true);
    await denied(author1.c.from("sources").insert({ source_code: `EVIL-${RUN}`, organization: "x", title: `LIVE TEST ${RUN} self-certified`, url: "https://example.org/x", licence_class: "GREEN", is_draft_guideline: false }));
    ok(await publisher.c.from("sources").insert({ source_code: `LIVE-${RUN}`, organization: "Live Test", title: `LIVE TEST ${RUN} synthetic source`, url: "https://example.org/live-test", licence_class: "GREEN" }));
    sourceId = ok(await author1.c.from("sources").select("id").eq("source_code", `LIVE-${RUN}`).single()).id; // authors can read the register to cite
    topic1 = await addTopic(author1, "workflow-1", ["NE", "PH"]);
    expect((await rpc(author1, "validate_topic_for_review", { p_topic: topic1 })).data).toEqual([]);
  });
  it("authors cannot choose their own reviewers or edit the source register", async () => {
    await denied(author1.c.from("topics").update({ required_review_roles: ["OTHER"] }).eq("id", topic1));
    await denied(author1.c.from("topics").insert({ domain_id: domainId, slug: slug("sneaky"), title: { en: "x" }, summary: { en: "x" }, required_review_roles: ["OTHER"] }));
    await denied(rpc(author1, "set_required_roles", { p_topic: topic1, p_roles: ["OTHER"] }), /publisher access with MFA required/);
    expect((await author1.c.from("sources").update({ licence_class: "GREEN", is_draft_guideline: false }).eq("id", sourceId).select("id")).data).toEqual([]);
  });
  it("an author cannot set workflow columns or take another author's work", async () => {
    await denied(author1.c.from("topics").update({ status: "published" }).eq("id", topic1));
    await denied(author1.c.from("topics").update({ published_version_id: topic1 }).eq("id", topic1));
    await denied(author1.c.from("topics").update({ author_id: author2.id }).eq("id", topic1));
    author2 = await actor(author2.email, author2.id, true);
    expect((await author2.c.from("topics").select("id").eq("id", topic1)).data).toEqual([]);
    expect((await author2.c.from("topics").update({ est_minutes: 99 }).eq("id", topic1).select("id")).data).toEqual([]);
  });
  it("submission creates version 1 and freezes the working copy", async () => {
    ok(await rpc(author1, "submit_for_review", { p_topic: topic1 }));
    v1 = (await versionOf(author1, topic1)).id;
    expect((await author1.c.from("topics").update({ est_minutes: 99 }).eq("id", topic1).select("id")).data).toEqual([]);
    await denied(rpc(author1, "submit_for_review", { p_topic: topic1 }), /in_review|cannot be submitted/);
  });
  it("only a publisher with MFA can assign reviewers, only eligible non-author reviewers, only for required roles", async () => {
    publisher = await actor(publisher.email, publisher.id, true);
    await denied(rpc(author1, "assign_reviewer", { p_version: v1, p_reviewer: rvNE.id, p_specialty: "NE" }));
    await denied(rpc(publisher, "assign_reviewer", { p_version: v1, p_reviewer: rvNE.id, p_specialty: "PH" }), /specialty/);
    await denied(rpc(publisher, "assign_reviewer", { p_version: v1, p_reviewer: learnerA.id, p_specialty: "NE" }), /not a clinical reviewer/);
    await denied(rpc(publisher, "assign_reviewer", { p_version: v1, p_reviewer: rvNE.id, p_specialty: "RT" }), /not required/);
    ok(await rpc(publisher, "assign_reviewer", { p_version: v1, p_reviewer: rvNE.id, p_specialty: "NE" }));
    ok(await rpc(publisher, "assign_reviewer", { p_version: v1, p_reviewer: rvPH.id, p_specialty: "PH" }));
  });
  it("publication is refused before approval, and the author cannot approve their own work", async () => {
    await denied(rpc(publisher, "publish_topic", { p_topic: topic1, p_version: v1 }), /only an approved version/);
    await denied(rpc(author1, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "approve" }));
    await denied(rpc(learnerA, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "approve" }));
    expect((await anonPublic()).some((t) => t.slug === slug("workflow-1"))).toBe(false);
  });
  it("reviewers need MFA, an assignment for that exact role, and the right specialty", async () => {
    rvNE = await actor(rvNE.email, rvNE.id, false);
    await denied(rpc(rvNE, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "approve" }), /clinical reviewer access with MFA required/);
    await withMfa(rvNE.c, rvNE.email);
    rvPH = await actor(rvPH.email, rvPH.id, true);
    await denied(rpc(rvPH, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "approve" }), /not assigned/);
    await denied(rpc(rvNE, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "request_changes" }), /comments are required/);
  });
  it("approval needs every required role: one approval is not enough", async () => {
    ok(await rpc(rvNE, "record_review", { p_version: v1, p_specialty: "NE", p_decision: "approve" }));
    expect((await latestVersion(topic1)).status).toBe("in_review");
    await denied(rpc(publisher, "publish_topic", { p_topic: topic1, p_version: v1 }), /only an approved version/);
    ok(await rpc(rvPH, "record_review", { p_version: v1, p_specialty: "PH", p_decision: "approve" }));
    expect((await latestVersion(topic1)).status).toBe("approved");
  });
  it("an approved version can be published only by a publisher; learners then see the approved snapshot", async () => {
    await denied(rpc(author1, "publish_topic", { p_topic: topic1, p_version: v1 }));
    await denied(rpc(rvNE, "publish_topic", { p_topic: topic1, p_version: v1 }));
    ok(await rpc(publisher, "publish_topic", { p_topic: topic1, p_version: v1 }));
    const pub = (await anonPublic()).find((t) => t.slug === slug("workflow-1"))!;
    expect(pub).toBeDefined();
    expect(pub.snapshot.reviewer_roles.sort()).toEqual(["NE", "PH"]);
    expect(pub.last_reviewed_at).not.toBeNull();
  });
  it("approvals are immutable and reviewers' comments are visible to the author", async () => {
    const r = ok(await author1.c.from("content_reviews").select("specialty, decision").eq("version_id", v1));
    expect(r.map((x: { specialty: string }) => x.specialty).sort()).toEqual(["NE", "PH"]);
    await denied(rvNE.c.from("content_reviews").update({ decision: "reject" }).eq("version_id", v1));
    await denied(rvNE.c.from("content_reviews").delete().eq("version_id", v1));
  });
});

async function anonPublic() {
  const { data, error } = await newClient().from("public_topics").select("slug, version_no, last_reviewed_at, snapshot");
  expect(error?.message).toBeUndefined();
  return (data ?? []) as { slug: string; version_no: number; last_reviewed_at: string | null; snapshot: { title: { en: string }; reviewer_roles: string[] } }[];
}

describe("8. Learner dashboard, progress, bookmarks and content access", () => {
  it("anonymous visitors read published snapshots and domains only", async () => {
    const anon = newClient();
    expect((await anon.from("nursing_domains").select("slug")).data!.length).toBe(10);
    expect((await anonPublic()).length).toBeGreaterThan(0);
    for (const t of ["topics", "content_versions", "topic_sections", "sources", "profiles", "bookmarks", "learning_progress", "audit_log", "user_roles"]) {
      const r = await anon.from(t).select("*").limit(1);
      expect(r.error, t).not.toBeNull();
    }
  });
  it("records views and completion; progress persists across sign-ins", async () => {
    ok(await rpc(learnerA, "record_topic_view", { p_topic: topic1 }));
    ok(await rpc(learnerA, "record_topic_view", { p_topic: topic1 }));
    ok(await rpc(learnerA, "set_topic_completion", { p_topic: topic1, p_completed: true }));
    const again = await actor(learnerA.email, learnerA.id);
    const row = ok(await again.c.from("learning_progress").select("status, view_count, completed_version_id").eq("topic_id", topic1).single());
    expect(row).toMatchObject({ status: "completed", view_count: 2, completed_version_id: v1 });
    learnerA = again;
  });
  it("bookmarks persist for the owner; unpublished topics cannot be bookmarked", async () => {
    ok(await learnerA.c.from("bookmarks").insert({ topic_id: topic1 }));
    const again = await actor(learnerA.email, learnerA.id);
    expect(ok(await again.c.from("bookmarks").select("topic_id")).length).toBe(1);
    topic2 = await addTopic(author1, "workflow-2");
    await denied(learnerA.c.from("bookmarks").insert({ topic_id: topic2 }));
    learnerA = again;
  });
  it("progress and bookmarks cannot be written directly or forged", async () => {
    await denied(learnerA.c.from("learning_progress").insert({ user_id: learnerA.id, topic_id: topic1, status: "completed" }));
    await denied(learnerA.c.from("learning_progress").update({ status: "completed" }).eq("topic_id", topic1));
    await denied(learnerA.c.from("bookmarks").insert({ user_id: learnerB.id, topic_id: topic1 }));
    await denied(rpc(learnerA, "record_topic_view", { p_topic: topic2 }), /not published/);
  });
});

describe("9. Rejection and revision", () => {
  it("a change request returns the topic to the author; resubmission creates version 2; approval and publication follow", async () => {
    ok(await rpc(author1, "submit_for_review", { p_topic: topic2 }));
    const va = (await versionOf(author1, topic2)).id;
    ok(await rpc(publisher, "assign_reviewer", { p_version: va, p_reviewer: rvNE.id, p_specialty: "NE" }));
    ok(await rpc(rvNE, "record_review", { p_version: va, p_specialty: "NE", p_decision: "request_changes", p_comments: "LIVE TEST: add an escalation section (synthetic feedback)." }));
    expect((await latestVersion(topic2)).status).toBe("changes_requested");
    expect(ok(await author1.c.from("topics").select("status").eq("id", topic2).single()).status).toBe("changes_requested");
    const feedback = ok(await author1.c.from("content_reviews").select("comments").eq("version_id", va).single());
    expect(feedback.comments).toMatch(/escalation/);
    ok(await author1.c.from("topic_sections").insert({ topic_id: topic2, kind: "escalation", sort: 2, title: { en: "Escalation" }, body: { en: "Synthetic escalation text." } }));
    ok(await rpc(author1, "submit_for_review", { p_topic: topic2 }));
    const vb = await versionOf(author1, topic2);
    expect(vb.version_no).toBe(2);
    ok(await rpc(publisher, "assign_reviewer", { p_version: vb.id, p_reviewer: rvNE.id, p_specialty: "NE" }));
    ok(await rpc(rvNE, "record_review", { p_version: vb.id, p_specialty: "NE", p_decision: "approve" }));
    ok(await rpc(publisher, "publish_topic", { p_topic: topic2, p_version: vb.id }));
    expect((await anonPublic()).some((t) => t.slug === slug("workflow-2") && t.version_no === 2)).toBe(true);
  });
});

describe("10. Revisions, rollback and audit history", () => {
  it("a revision does not change the live topic until its new version is approved and published", async () => {
    ok(await rpc(author1, "start_revision", { p_topic: topic1 }));
    ok(await author1.c.from("topics").update({ title: { en: "LIVE TEST workflow-1 REVISED" } }).eq("id", topic1));
    const live = (await anonPublic()).find((t) => t.slug === slug("workflow-1"))!;
    expect(live.snapshot.title.en).toBe("LIVE TEST workflow-1");
    ok(await rpc(author1, "submit_for_review", { p_topic: topic1 }));
    const v2 = (await versionOf(author1, topic1)).id;
    ok(await rpc(publisher, "assign_reviewer", { p_version: v2, p_reviewer: rvNE.id, p_specialty: "NE" }));
    ok(await rpc(publisher, "assign_reviewer", { p_version: v2, p_reviewer: rvPH.id, p_specialty: "PH" }));
    ok(await rpc(rvNE, "record_review", { p_version: v2, p_specialty: "NE", p_decision: "approve" }));
    ok(await rpc(rvPH, "record_review", { p_version: v2, p_specialty: "PH", p_decision: "approve" }));
    ok(await rpc(publisher, "publish_topic", { p_topic: topic1, p_version: v2 }));
    expect((await anonPublic()).find((t) => t.slug === slug("workflow-1"))!.snapshot.title.en).toBe("LIVE TEST workflow-1 REVISED");
  });
  it("rollback restores version 1 for learners, requires a reason and the publisher role", async () => {
    await denied(rpc(author1, "rollback_topic", { p_topic: topic1, p_version: v1, p_reason: "an author must not be able to do this" }));
    await denied(rpc(publisher, "rollback_topic", { p_topic: topic1, p_version: v1, p_reason: "short" }), /reason/);
    ok(await rpc(publisher, "rollback_topic", { p_topic: topic1, p_version: v1, p_reason: "LIVE TEST: restoring the earlier approved version." }));
    expect((await anonPublic()).find((t) => t.slug === slug("workflow-1"))!.snapshot.title.en).toBe("LIVE TEST workflow-1");
  });
  it("archiving hides a topic from learners; an administrator can restore it", async () => {
    ok(await rpc(publisher, "archive_topic", { p_topic: topic2, p_reason: "LIVE TEST: archive and restore check." }));
    expect((await anonPublic()).some((t) => t.slug === slug("workflow-2"))).toBe(false);
    ok(await rpc(admin, "restore_topic", { p_topic: topic2 }));
    expect((await anonPublic()).some((t) => t.slug === slug("workflow-2"))).toBe(true);
  });
  it("the audit log records every workflow step with the acting user, readable only by an MFA administrator", async () => {
    const rows = ok(await admin.c.from("audit_log").select("action, actor").eq("entity_type", "topic").eq("entity_id", topic1).order("id"));
    const actions = rows.map((r: { action: string }) => r.action);
    for (const a of ["submit_for_review", "assign_reviewer", "record_review", "publish", "start_revision", "rollback"]) expect(actions, a).toContain(a);
    expect(rows.find((r: { action: string; actor: string }) => r.action === "publish")!.actor).toBe(publisher.id);
    expect(rows.find((r: { action: string; actor: string }) => r.action === "rollback")!.actor).toBe(publisher.id);
    expect((await publisher.c.from("audit_log").select("id")).data).toEqual([]);
    expect((await learnerA.c.from("audit_log").select("id")).data).toEqual([]);
    const aal1admin = await signIn(admin.email);
    expect((await aal1admin.from("audit_log").select("id")).data).toEqual([]);
  });
});

describe("11. Unauthorized actions and role-escalation attempts", () => {
  it("an administrator WITHOUT the publisher role cannot publish, roll back or archive (separation of duties)", async () => {
    for (const [fn, args] of [["publish_topic", { p_topic: topic1, p_version: v1 }], ["rollback_topic", { p_topic: topic1, p_version: v1, p_reason: "administrators are not publishers" }], ["archive_topic", { p_topic: topic1, p_reason: "administrators are not publishers" }]] as [string, Record<string, unknown>][])
      await denied(rpc(admin, fn, args), /publisher access with MFA required/);
  });
  it("learners cannot use any staff or administrator function", async () => {
    for (const [fn, args] of [
      ["set_required_roles", { p_topic: topic1, p_roles: ["OTHER"] }],
      ["admin_grant_role", { p_user: learnerA.id, p_role: "admin" }], ["admin_set_specialty", { p_user: learnerA.id, p_specialty: "NE", p_enabled: true }],
      ["publish_topic", { p_topic: topic1, p_version: v1 }], ["assign_reviewer", { p_version: v1, p_reviewer: learnerA.id, p_specialty: "NE" }],
      ["submit_for_review", { p_topic: topic2 }], ["archive_topic", { p_topic: topic1, p_reason: "learner should not be able to" }],
      ["rollback_topic", { p_topic: topic1, p_version: v1, p_reason: "learner should not be able to" }], ["restore_topic", { p_topic: topic1 }],
      ["start_revision", { p_topic: topic1 }],
    ] as [string, Record<string, unknown>][]) await denied(rpc(learnerA, fn, args));
  });
  it("direct table writes that would bypass the workflow are refused for every role, including an MFA administrator", async () => {
    const attempts: Promise<{ error: { message: string } | null }>[] = [
      learnerA.c.from("user_roles").insert({ user_id: learnerA.id, role: "admin" }) as never,
      learnerA.c.from("user_roles").update({ role: "admin" }).eq("user_id", learnerA.id) as never,
      learnerA.c.from("topics").insert({ domain_id: domainId, slug: slug("evil"), title: { en: "x" }, summary: { en: "x" } }) as never,
      admin.c.from("content_versions").insert({ topic_id: topic1, version_no: 99, status: "approved", snapshot: {}, required_review_roles: ["NE"], origin: "human" }) as never,
      admin.c.from("content_versions").update({ status: "approved" }).eq("id", v1) as never,
      admin.c.from("content_reviews").insert({ version_id: v1, reviewer_id: admin.id, specialty: "NE", decision: "approve" }) as never,
      admin.c.from("topics").update({ status: "published" }).eq("id", topic1) as never,
      admin.c.from("audit_log").insert({ action: "forged", entity_type: "topic" }) as never,
      admin.c.from("audit_log").delete().neq("id", 0) as never,
      admin.c.from("app_settings").update({ require_staff_mfa: false }).eq("id", true) as never,
      learnerA.c.from("profiles").update({ email: "evil@example.org" }).eq("id", learnerA.id) as never,
    ];
    for (const p of attempts) await denied(p);
    const settings = (await sql<{ require_staff_mfa: boolean }>("select require_staff_mfa from public.app_settings"))[0]!;
    expect(settings.require_staff_mfa).toBe(true);
  });
  it("internal functions and the private schema are unreachable through the API", async () => {
    for (const fn of ["write_audit", "audit_row", "_evaluate_version", "_topic_snapshot", "has_staff_role", "can_read_topic", "is_published_topic"])
      await denied(admin.c.rpc(fn, {}), /Could not find the function|does not exist|schema cache|not found/i);
    await denied(admin.c.schema("private" as never).from("x").select("*") as never, /schema|private|not found|invalid/i);
    await denied(newClient().rpc("submit_for_review", { p_topic: topic1 }));
  });
  it("a reviewer cannot read or review content that is not assigned to them", async () => {
    const draft = await addTopic(author1, "unassigned-draft");
    expect((await rvPH.c.from("topics").select("id").eq("id", draft)).data).toEqual([]);
    expect((await rvPH.c.from("topic_sections").select("id").eq("topic_id", draft)).data).toEqual([]);
  });
  it("a staff member's elevated powers vanish if their session is not MFA-verified", async () => {
    const weak = await signIn(publisher.email);
    await denied(rpc({ ...publisher, c: weak }, "archive_topic", { p_topic: topic2, p_reason: "no MFA, should be refused" }), /publisher access with MFA required/);
    expect((await weak.from("topics").select("id")).data).toEqual([]); // cannot even list working copies
  });
});

describe("12. Cross-user data isolation", () => {
  it("one learner cannot read, change or delete another's profile, bookmarks or progress", async () => {
    expect((await learnerB.c.from("bookmarks").select("*")).data).toEqual([]);
    expect((await learnerB.c.from("learning_progress").select("*")).data).toEqual([]);
    expect((await learnerB.c.from("profiles").select("id")).data!.map((r: { id: string }) => r.id)).toEqual([learnerB.id]);
    expect((await learnerB.c.from("bookmarks").delete().eq("user_id", learnerA.id).select()).data).toEqual([]);
    expect((await learnerB.c.from("profiles").update({ display_name: "hijacked" }).eq("id", learnerA.id).select()).data).toEqual([]);
    expect((await learnerB.c.from("user_roles").select("user_id")).data!.every((r: { user_id: string }) => r.user_id === learnerB.id)).toBe(true);
    expect((await sql<{ display_name: string }>(`select display_name from public.profiles where id='${learnerA.id}'`))[0]!.display_name).toMatch(/Learner A/);
  });
});

describe("Storage: image upload permissions", () => {
  const up = (a: Actor, p: string, body: Uint8Array | Blob, type = "image/png") => a.c.storage.from("topic-images").upload(p, body, { contentType: type, upsert: false });
  it("an author can upload a valid image into their own editable topic's folder, and it is publicly readable by URL", async () => {
    const p = `${topic2}/${crypto.randomUUID()}.png`; // topic2 is currently published => not editable
    await denied(up(author1, p, png()));
    const draft = await addTopic(author1, "with-image");
    const path = `${draft}/${crypto.randomUUID()}.png`;
    const r = await up(author1, path, png());
    expect(r.error?.message).toBeUndefined();
    uploaded.push(path);
    const url = author1.c.storage.from("topic-images").getPublicUrl(path).data.publicUrl;
    expect((await fetch(url)).status).toBe(200);
    ok(await author1.c.from("topic_images").insert({ topic_id: draft, storage_path: path, alt_text: { en: "Synthetic test image" }, licence: "Original", licence_class: "GREEN", is_original: true }));
    const wrong = `${draft}/${crypto.randomUUID()}.png`;
    expect((await author1.c.from("topic_images").insert({ topic_id: topic1, storage_path: wrong, licence: "x" })).error).not.toBeNull(); // path must be inside own topic folder
  });
  it("rejects other authors, learners, anonymous users, other folders, SVG/oversize files", async () => {
    const draft = (ok(await author1.c.from("topics").select("id").like("slug", `live-${RUN}-with-image`).single()) as { id: string }).id;
    const base = `${draft}/${crypto.randomUUID()}`;
    await denied(up(author2, `${base}.png`, png()));
    await denied(up(learnerA, `${base}.png`, png()));
    await denied(newClient().storage.from("topic-images").upload(`${base}.png`, png(), { contentType: "image/png" }) as never);
    await denied(up(author1, `${base}.svg`, new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), "image/svg+xml"), /mime|not supported|allowed|invalid/i);
    await denied(up(author1, `${base}-big.png`, new Uint8Array(3 * 1024 * 1024), "image/png"), /size|exceeded|too large|maximum/i);
    await denied(up(author1, `${draft}/../${topic1}/x.png`, png()));
    await denied(up(author1, `${topic1}/${crypto.randomUUID()}.png`, png())); // topic1 is not editable (published)
  });
  it("freezes uploads while a topic is in review", async () => {
    const t = await addTopic(author1, "freeze");
    ok(await rpc(author1, "submit_for_review", { p_topic: t }));
    await denied(up(author1, `${t}/${crypto.randomUUID()}.png`, png()));
  });
});

describe("Cleanup guard", () => {
  it("test accounts are clearly labelled and none holds a real-clinician claim", async () => {
    const rows = await sql<{ display_name: string }>(`select display_name from public.profiles where email like 'live-test-${RUN}-%'`);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(rows.every((r) => /^LIVE TEST /.test(r.display_name) && /not a real clinician|Verify|Reset|Meta/.test(r.display_name))).toBe(true);
  });
  it("totp helper is time-correct (sanity)", () => {
    expect(totp("JBSWY3DPEHPK3PXP", 59_000)).toMatch(/^\d{6}$/);
  });
});
