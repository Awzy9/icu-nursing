import "server-only";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFixtureKey, resolveMode } from "@/lib/question-bank";
import { QuestionBankError } from "@/lib/question-bank/types";
import type { MedicationService } from "./types";

/** Same backend selection and production refusal as the question bank (fixtures never run in production). */
export async function getMedicationService(opts: { create?: boolean } = {}): Promise<MedicationService | null> {
  const mode = resolveMode();
  if (mode === "disabled") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new QuestionBankError("auth", "Sign in to use the medication library.");
    const { createSupabaseMedicationService } = await import("./supabase-service");
    return createSupabaseMedicationService(supabase);
  }
  const key = await getFixtureKey(opts.create ?? false);
  const { createMedicationFixtureService } = await import("./fixture-service");
  return createMedicationFixtureService(key ?? "anonymous-empty");
}
