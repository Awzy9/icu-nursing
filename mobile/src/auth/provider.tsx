import "react-native-url-polyfill/auto"; // Native runtime only; keep cross-platform auth client pure.
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { createRpc, type Rpc } from "../api/rpc";
import { createAppClient } from "./client";
import { createChunkedStorage } from "./chunkedStorage";
import { AUTH_SCHEME, CAPTCHA_REQUIRED, readAuthConfig, type AuthConfig } from "./config";
import { parseAuthCallback } from "./deepLinks";
import { createSessionManager, type SessionManager } from "./session";

interface AuthCtx { config: AuthConfig | null; manager: SessionManager | null; rpc: Rpc | null; email: string | null; userId: string | null; notice: "callbackFailed" | null; recoveryReady: boolean; ready: boolean; callbackPending: boolean; clearNotice(): void; clearRecovery(): void }
const Ctx = createContext<AuthCtx>({ config: null, manager: null, rpc: null, email: null, userId: null, notice: null, recoveryReady: false, ready: true, callbackPending: false, clearNotice() {}, clearRecovery() {} });
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
    return { client, manager: createSessionManager(client, { captchaRequired: CAPTCHA_REQUIRED, callbackScheme: AUTH_SCHEME }), rpc: createRpc(client) };
  }, [config]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<"callbackFailed" | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [callbackPending, setCallbackPending] = useState(false);
  const [sessionRead, setSessionRead] = useState(false);

  useEffect(() => {
    if (!built) return;
    const adopt = (s: { user: { id: string; email?: string } } | null) => {
      setEmail(s?.user.email ?? null); setUserId(s?.user.id ?? null);
    };
    const sub = built.client.auth.onAuthStateChange((_e, s) => adopt(s));
    void built.manager.current().then(adopt).catch(() => undefined).finally(() => setSessionRead(true));
    const app = AppState.addEventListener("change", (st) => { if (st === "active") void built.manager.onForeground(); }); // refresh only in the foreground
    const handled = new Set<string>();
    const handle = async (url: string | null) => {
      if (!url || handled.has(url)) return;
      const r = parseAuthCallback(url, config!.siteOrigin, AUTH_SCHEME);
      if (!r.ok) return; // anything that is not an exact callback shape is ignored
      handled.add(url); // initial URL and Linking event may contain the same single-use PKCE code
      setNotice(null); setCallbackPending(true);
      try {
        const x = await built.manager.exchangeCallback(r.intent.code);
        if (!x.ok) setNotice("callbackFailed");
        else if (r.intent.kind === "recovery") setRecoveryReady(true);
      } catch { setNotice("callbackFailed"); }
      finally { setCallbackPending(false); }
    };
    void Linking.getInitialURL().then(handle);
    const link = Linking.addEventListener("url", (e) => void handle(e.url));
    return () => { sub.data.subscription.unsubscribe(); app.remove(); link.remove(); };
  }, [built, config]);

  const value = useMemo<AuthCtx>(() => ({ config, manager: built?.manager ?? null, rpc: built?.rpc ?? null, email, userId, notice, recoveryReady, ready: !built || (sessionRead && !callbackPending), callbackPending, clearNotice: () => setNotice(null), clearRecovery: () => setRecoveryReady(false) }), [config, built, email, userId, notice, recoveryReady, callbackPending, sessionRead]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
