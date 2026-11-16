// Validated Supabase RPC contracts. Every response is parsed with the shared @icu/schemas definition, so a server change that breaks the contract
// fails here instead of rendering wrong data. Staff functions (adm_*) are deliberately absent: the app has no staff features.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { caseListSchema, caseProgressSchema } from "@icu/schemas/cases";
import { equipmentStateSchema, type EquipmentState } from "@icu/schemas/equipment-state";
import { skillListSchema, skillProgressSchema } from "@icu/schemas/skills";

export class RpcError extends Error { constructor(readonly code: "auth" | "not_found" | "invalid" | "limit" | "contract" | "unavailable", message: string) { super(message); } }
const MAP: Record<string, RpcError["code"]> = { "42501": "auth", P0002: "not_found", "22023": "invalid", "54000": "limit" };

export function createRpc(client: SupabaseClient) {
  async function raw(fn: string, args?: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
    return data;
  }
  async function call<S extends z.ZodType>(fn: string, schema: S, args?: Record<string, unknown>): Promise<z.infer<S>> {
    const parsed = schema.safeParse(await raw(fn, args));
    if (!parsed.success) throw new RpcError("contract", `${fn}: response does not match the shared schema`);
    return parsed.data;
  }
  async function run(fn: string, args: Record<string, unknown>): Promise<void> { await raw(fn, args); }
  return {
    equipmentState: (): Promise<EquipmentState> => call("eq_state", equipmentStateSchema),
    setEquipmentBookmark: (code: string, on: boolean) => run("eq_set_bookmark", { p_code: code, p_on: on }),
    markEquipmentViewed: (code: string, part: string) => run("eq_mark_viewed", { p_code: code, p_part: part }),
    resetEquipmentProgress: (code: string) => run("eq_reset_progress", { p_code: code }),
    caseList: () => call("cs_list", caseListSchema),
    caseProgress: () => call("cs_progress", caseProgressSchema),
    skillList: () => call("sk_list", skillListSchema, { p_query: null, p_category: null, p_bookmarked: false }),
    skillProgress: () => call("sk_progress", skillProgressSchema),
  };
}
export type Rpc = ReturnType<typeof createRpc>;
