import pg from "pg";

export type Aal = "aal1" | "aal2";
export interface Actor { id: string; aal?: Aal; role?: "authenticated" | "anon"; amr?: { method: string; timestamp: number }[] }

let pool: pg.Pool;
let dbName = "";

/** Each test file gets its own database cloned from the fully migrated template (isolated fixtures). */
export async function setupDb() {
  const adminUrl = process.env.TEST_ADMIN_URL!;
  dbName = `icu_nursing_t_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`create database ${dbName} template ${process.env.TEST_TEMPLATE_DB}`);
  await admin.end();
  const u = new URL(adminUrl);
  u.pathname = `/${dbName}`;
  pool = new pg.Pool({ connectionString: u.toString(), max: 4 });
}

export async function closePool() {
  await pool.end();
  const admin = new pg.Client({ connectionString: process.env.TEST_ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${dbName} with (force)`);
  await admin.end();
}

/** Runs as the database owner (bypasses RLS). Used only to build fixtures. */
export const owner = {
  query: (text: string, params: unknown[] = []) => pool.query(text, params),
};

/**
 * Runs ONE statement as an API user: SET LOCAL ROLE + JWT claims, exactly like PostgREST does.
 * Each call is its own transaction (so an error doesn't poison later calls).
 */
export async function asUser(actor: Actor | null, text: string, params: unknown[] = []) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const role = actor ? (actor.role ?? "authenticated") : "anon";
    await client.query(`set local role ${role}`);
    const claims = actor ? { sub: actor.id, role, aal: actor.aal ?? "aal1", ...(actor.amr ? { amr: actor.amr } : {}) } : { role: "anon" };
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    const res = await client.query(text, params);
    await client.query("commit");
    return res;
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

export async function createUser(email: string, meta: Record<string, unknown> = {}): Promise<string> {
  const r = await owner.query("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id", [email, JSON.stringify(meta)]);
  return r.rows[0].id as string;
}

export async function grantRole(userId: string, role: string) {
  await owner.query("insert into public.user_roles (user_id, role) values ($1, $2) on conflict do nothing", [userId, role]);
}

let n = 0;
export const uniqueEmail = (p: string) => `${p}-${Date.now()}-${n++}@example.test`;

export async function expectDenied(p: Promise<unknown>) {
  await expect(p).rejects.toThrow(/permission denied|row-level security|violates row-level|forbidden|required|42501|insufficient|only the author|only an administrator|not assigned|cannot review|access with MFA/i);
}
import { expect } from "vitest";
