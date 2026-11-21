import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { createRpc, type Rpc } from "../api/rpc";
import { createAppClient } from "./client";
import { createChunkedStorage } from "./chunkedStorage";
import { readAuthConfig, type AuthConfig } from "./config";
import { parseAuthCallback } from "./deepLinks";
import { createSessionManager, type SessionManager } from "./session";

interface AuthCtx { config: AuthConfig | null; manager: SessionManager | null; rpc: Rpc | null; email: string | null; notice: "callbackFailed" | null; clearNotice(): void }
const Ctx = createContext<AuthCtx>({ config: null, manager: null, rpc: null, email: null, notice: null, clearNotice() {} });
export const useAuth = () => useContext(Ctx);

const secure = { get: (k: string) => SecureStore.getItemAsync(k), set: (k: string, v: string) => SecureStore.setItemAsync(k, v), remove: (k: string) => SecureStore.deleteItemAsync(k) };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Expo only inlines static process.env.EXPO_PUBLIC_* property accesses. Passing process.env
  // wholesale silently drops the auth configuration from compiled iOS/Android bundles.
  const config = useMemo(() => readAuthConfig({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL,
  }), []);
  const built = useMemo(() => {
    if (!config) return null;
    const client = createAppClient(config, createChunkedStorage(secure));
    return { client, manager: createSessionManager(client), rpc: createRpc(client) };
  }, [config]);
  const [email, setEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<"callbackFailed" | null>(null);

  useEffect(() => {
    if (!built) return;
    const sub = built.client.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    void built.manager.current().then((s) => setEmail(s?.user.email ?? null));
    const app = AppState.addEventListener("change", (st) => { if (st === "active") void built.manager.onForeground(); }); // refresh only in the foreground
    const handle = async (url: string | null) => {
      if (!url) return;
      const r = parseAuthCallback(url, config!.siteOrigin);
      if (!r.ok) return; // anything that is not an exact callback shape is ignored
      const x = await built.manager.exchangeCallback(r.intent.code);
      if (!x.ok) setNotice("callbackFailed");
    };
    void Linking.getInitialURL().then(handle);
    const link = Linking.addEventListener("url", (e) => void handle(e.url));
    return () => { sub.data.subscription.unsubscribe(); app.remove(); link.remove(); };
  }, [built, config]);

  const value = useMemo<AuthCtx>(() => ({ config, manager: built?.manager ?? null, rpc: built?.rpc ?? null, email, notice, clearNotice: () => setNotice(null) }), [config, built, email, notice]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
