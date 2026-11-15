import "server-only";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFixtureKey, resolveMode } from "@/lib/question-bank";
import { QuestionBankError } from "@/lib/question-bank/types";
import type { CaseService } from "./types";

/** Same backend selection and production refusal as the question bank (fixtures never run in production). */
export async function getCaseService(opts: { create?: boolean } = {}): Promise<CaseService | null> {
  const mode = resolveMode();
  if (mode === "disabled") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new QuestionBankError("auth", "Sign in to use case-based learning.");
    const { createSupabaseCaseService } = await import("./supabase-service");
    return createSupabaseCaseService(supabase);
  }
  const key = await getFixtureKey(opts.create ?? false);
  const { createCaseFixtureService } = await import("./fixture-service");
  return createCaseFixtureService(key ?? "anonymous-empty");
}
