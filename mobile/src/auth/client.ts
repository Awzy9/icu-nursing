import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AsyncStorageLike } from "./chunkedStorage";
import type { AuthConfig } from "./config";

/**
 * The only Supabase client in the app. Tokens live in the injected (secure) storage, are refreshed by the lifecycle manager rather than by timers
 * running while the app is in the background, and links are never auto-detected from the URL (callbacks go through parseAuthCallback).
 * PKCE is used so a callback carries a one-time code rather than tokens.
 */
export function createAppClient(config: Pick<AuthConfig, "url" | "anonKey">, storage: AsyncStorageLike, opts: { fetch?: typeof fetch } = {}): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: "pkce" },
    global: opts.fetch ? { fetch: opts.fetch } : undefined,
  });
}
