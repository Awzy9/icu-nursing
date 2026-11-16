import "server-only";
import { getSessionUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { getActorKey } from "@/lib/question-bank";
import { rateLimit } from "@/lib/rate-limit";
import { cleanQuery, searchEverything } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import { detectRefusal } from "./refusal";
import { TutorError, type TutorAnswer } from "./types";

export { detectRefusal } from "./refusal";
export * from "./types";

const MAX_HITS = 6;

/**
 * In demonstration mode there is no account and no Server Action write path from this page (Next.js refuses to
 * set a cookie from a plain Server Component render), so there is no reliable per-visitor identity here:
 * `getActorKey()` falls back to the literal string "anonymous" for every demo visitor who has not separately
 * started a question-bank/case fixture session first. This cap is therefore, honestly, a shared guard against a
 * runaway loop across this demo deployment as a whole, not a per-browser-session quota - there is no paid service
 * behind it and nothing costs money in demo mode, so it is set generously rather than pretending to an isolation
 * this mechanism cannot actually provide.
 */
function demoUsageOk(actorKey: string): boolean {
  return rateLimit(`tutor-demo-day:${actorKey}`, 600, 24 * 60 * 60_000) && rateLimit(`tutor-demo-hour:${actorKey}`, 200, 60 * 60_000);
}

/**
 * Ask the mock-mode learner tutor a question. There is no call to any AI model here or anywhere downstream:
 * `askTutor` only runs the refusal check, then (if not refused) the exact same retrieval `/search` already uses -
 * which only ever returns titles/summaries of already-published content and structurally cannot see
 * `content/drafts/`. The "answer" a caller renders from this is the citation list plus fixed, translated template
 * text; nothing here, now or by construction, generates clinical prose.
 *
 * Usage caps: a fast in-process burst guard always applies (`rateLimit`); in real (non-demo) mode a signed-in
 * learner's query is also logged and capped in the database (migration 0020: 20/hour, 60/day), which holds even
 * across server instances and even if the request bypasses this function entirely (e.g. raw PostgREST).
 */
export async function askTutor(rawQuery: unknown, locale: string): Promise<TutorAnswer> {
  const query = cleanQuery(rawQuery);
  if (isDemoMode() && !demoUsageOk(await getActorKey())) throw new TutorError("limit", "Too many questions. Please wait a moment.");
  const refusalKind = detectRefusal(query);
  if (refusalKind) {
    await recordUsage(query, locale, true, refusalKind, 0);
    return { query, refused: true, refusalKind, hits: [] };
  }
  const { hits } = await searchEverything(query, locale);
  const kept = hits.slice(0, MAX_HITS);
  await recordUsage(query, locale, false, undefined, kept.length);
  return { query, refused: false, hits: kept };
}

async function recordUsage(query: string, locale: string, refused: boolean, refusalKind: string | undefined, hitCount: number): Promise<void> {
  if (isDemoMode()) {
    // Fixture content mode: no real account exists to attribute usage to, so the app-level burst/day guard
    // above (demoUsageOk) is the only cap - there is no durable per-user DB cap, and nothing here calls a
    // paid service, so there is no cost reason to log a demo visitor's query server-side.
    return;
  }
  const user = await getSessionUser();
  if (!user) throw new TutorError("auth", "Sign in to ask the tutor a question.");
  if (!rateLimit(`tutor:${user.id}`, 10, 60_000)) throw new TutorError("limit", "Too many questions. Please wait a moment.");
  const supabase = await createClient();
  if (!supabase) throw new TutorError("unavailable", "The tutor is temporarily unavailable.");
  const { error } = await supabase.rpc("tutor_record_query", {
    p_query: query, p_locale: locale, p_refused: refused, p_refusal_reason: refusalKind ?? null, p_hit_count: hitCount,
  });
  if (error) {
    if (error.code === "54000") throw new TutorError("limit", error.message);
    throw new TutorError("unavailable", "The tutor is temporarily unavailable.");
  }
}

export async function tutorUsageRemaining(): Promise<{ remainingThisHour: number; remainingToday: number } | null> {
  if (isDemoMode()) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("tutor_usage_remaining");
  if (error || !data) return null;
  const d = data as { remaining_this_hour: number; remaining_today: number };
  return { remainingThisHour: d.remaining_this_hour, remainingToday: d.remaining_today };
}
