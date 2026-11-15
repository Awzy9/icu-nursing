import "server-only";
import { cookies } from "next/headers";
import { getEnv, isDemoMode } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QuestionBankError, type QuestionBankService } from "./types";

export type QuestionBankMode = "database" | "fixtures" | "disabled";

/**
 * Which backend serves the question bank.
 *   - QUESTION_BANK_MODE=fixtures  synthetic nonclinical in-memory fixtures (development and tests only);
 *   - QUESTION_BANK_MODE=database  Supabase functions with the content gate;
 *   - unset                        demo mode (no Supabase configured) -> fixtures, otherwise database.
 * Fixtures are refused outright in a production deployment.
 */
export function resolveMode(): QuestionBankMode {
  const env = getEnv();
  const explicit = process.env.QUESTION_BANK_MODE;
  const wanted = explicit === "fixtures" || explicit === "database" ? explicit : isDemoMode() ? "fixtures" : "database";
  if (wanted === "fixtures" && env.NEXT_PUBLIC_APP_ENV === "production") return "disabled";
  if (wanted === "database" && isDemoMode()) return "disabled";
  return wanted;
}

const FX_COOKIE = "qb_fx";

/**
 * Returns the service for the current request. In database mode the caller must be signed in (callers use requireUser first).
 * In fixture mode identity is an opaque random cookie; pass `create` from a server action to mint it.
 */
export async function getQuestionBankService(opts: { create?: boolean } = {}): Promise<QuestionBankService | null> {
  const mode = resolveMode();
  if (mode === "disabled") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new QuestionBankError("auth", "Sign in to use the question bank.");
    const { createSupabaseService } = await import("./supabase-service");
    return createSupabaseService(supabase);
  }
  const jar = await cookies();
  let key = jar.get(FX_COOKIE)?.value;
  if (!key || !/^[0-9a-f-]{36}$/.test(key)) {
    if (!opts.create) key = undefined;
    else {
      key = crypto.randomUUID();
      jar.set(FX_COOKIE, key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8, secure: false });
    }
  }
  const { createFixtureService } = await import("./fixture-service");
  // A visitor without a fixture session sees an empty bank until they start something.
  return createFixtureService(key ?? "anonymous-empty");
}

/** Stable per-actor key for rate limiting (signed-in user id, or the fixture-session cookie). */
export async function getActorKey(): Promise<string> {
  const user = await getSessionUser().catch(() => null);
  if (user) return user.id;
  const jar = await cookies();
  return jar.get(FX_COOKIE)?.value ?? "anonymous";
}
