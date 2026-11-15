import "server-only";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFixtureKey, resolveMode } from "@/lib/question-bank";
import { EquipmentError, type EquipmentStateService } from "./state";

/** Same backend selection and production refusal as the question bank and skills (fixtures never run in production). */
export async function getEquipmentStateService(opts: { create?: boolean } = {}): Promise<EquipmentStateService | null> {
  const mode = resolveMode();
  if (mode === "disabled") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new EquipmentError("auth", "Sign in to use equipment learning.");
    const { createSupabaseEquipmentService } = await import("./state-supabase");
    return createSupabaseEquipmentService(supabase);
  }
  const key = await getFixtureKey(opts.create ?? false);
  const { createEquipmentFixtureService } = await import("./state-fixture");
  return createEquipmentFixtureService(key ?? "anonymous-empty");
}
