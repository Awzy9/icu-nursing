import "server-only";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFixtureKey, resolveMode } from "@/lib/question-bank";
import { QuestionBankError } from "@/lib/question-bank/types";
import type { SkillService } from "./types";

/** Same backend selection and production refusal as the question bank (fixtures never run in production). */
export async function getSkillService(opts: { create?: boolean } = {}): Promise<SkillService | null> {
  const mode = resolveMode();
  if (mode === "disabled") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new QuestionBankError("auth", "Sign in to use the skills library.");
    const { createSupabaseSkillService } = await import("./supabase-service");
    return createSupabaseSkillService(supabase);
  }
  const key = await getFixtureKey(opts.create ?? false);
  const { createSkillFixtureService } = await import("./fixture-service");
  return createSkillFixtureService(key ?? "anonymous-empty");
}
