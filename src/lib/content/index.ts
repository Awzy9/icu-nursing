import { isDemoMode } from "@/lib/env";
import { demoRepository } from "./demo-repository";
import type { ContentRepository } from "./types";

export * from "./types";
export { localize } from "./localize";

/** Demo mode serves synthetic content; otherwise published content comes from Supabase. */
export async function getContentRepository(): Promise<ContentRepository> {
  if (isDemoMode()) return demoRepository;
  const { supabaseRepository } = await import("./supabase-repository");
  return supabaseRepository;
}
