import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emptyProgress, loadProgress, saveProgress, scopedProgressStore } from "../../mobile/src/core/progress";

const root = path.resolve(__dirname, "../..");
const source = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("native account discovery, build configuration and privacy", () => {
  it("exposes every primary tab including Account and provides a prominent Home account entry", () => {
    const tab = source("mobile/app/(tabs)/_layout.tsx");
    for (const name of ["home", "library", "practice", "tools", "visuals", "account"]) {
      expect(tab).toContain(`<Tabs.Screen name="${name}"`);
      expect(tab).toContain(`<Icon name={route.name}`);
    }
    expect(tab).toContain("accessibilityRole=\"tab\"");
    expect(tab).toContain("VisibleTabBar");
    expect(source("mobile/app/(tabs)/home.tsx")).toContain('href="/(tabs)/account"');
    expect(source("mobile/app/(tabs)/account.tsx")).toContain('href="/signup"');
    expect(source("mobile/app/(tabs)/account.tsx")).toContain('href="/signin"');
  });

  it("inlines explicit public Expo variables and provides them for both EAS build profiles", () => {
    const provider = source("mobile/src/auth/provider.tsx");
    expect(provider).toContain("process.env.EXPO_PUBLIC_SUPABASE_URL");
    expect(provider).toContain("process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(provider).not.toContain("readAuthConfig(process.env as");
    const eas = JSON.parse(source("mobile/eas.json")).build;
    for (const name of ["preview", "production"]) {
      const env = eas[name].env as Record<string, string>;
      expect(env.EXPO_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\/[a-z]+\.supabase\.co$/);
      expect(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_[A-Za-z0-9_-]+$/);
      expect(env.EXPO_PUBLIC_SITE_URL).toBe("https://icu-nursing.vercel.app");
      expect(Object.keys(env).some((k) => /SECRET|SERVICE_ROLE/i.test(k))).toBe(false);
    }
  });

  it("has native registration, recovery and callback routes registered in the root stack", () => {
    const routes = source("mobile/app/_layout.tsx");
    for (const route of ["signup", "signin", "auth/callback", "reset-password"]) {
      expect(routes).toContain(`<Stack.Screen name="${route}"`);
    }
    expect(source("mobile/app/signup.tsx")).toContain("manager.signUp");
    expect(source("mobile/app/signup.tsx")).toContain("CaptchaView");
    expect(source("mobile/app/signup.tsx")).toContain("confirmationRequired");
    expect(source("mobile/app/reset-password.tsx")).toContain("manager.updatePassword");
    expect(source("mobile/app/auth/callback.tsx")).toContain("recoveryReady");
    expect(source("mobile/app/signin.tsx")).toContain("nursingmastery://auth/callback?type=recovery");
  });

  it("does not leak one account's device-side learning history to guests or another account", async () => {
    const storage = new Map<string, string>();
    const base = {
      get: async (k: string) => storage.get(k) ?? null,
      set: async (k: string, v: string) => { storage.set(k, v); },
      remove: async (k: string) => { storage.delete(k); },
    };
    const guest = scopedProgressStore(base, null);
    const a = scopedProgressStore(base, "user-a");
    const b = scopedProgressStore(base, "user-b");
    await saveProgress(guest, { ...emptyProgress(), viewed: ["D06-T01"] });
    await saveProgress(a, { ...emptyProgress(), bookmarks: ["topics:D01-T07"] });
    await saveProgress(b, { ...emptyProgress(), completed: ["SK-01"] });
    expect((await loadProgress(guest)).viewed).toEqual(["D06-T01"]);
    expect((await loadProgress(guest)).bookmarks).toEqual([]);
    expect((await loadProgress(a)).bookmarks).toEqual(["topics:D01-T07"]);
    expect((await loadProgress(a)).completed).toEqual([]);
    expect((await loadProgress(b)).completed).toEqual(["SK-01"]);
    expect((await loadProgress(b)).viewed).toEqual([]);
    expect(source("mobile/src/state/app.tsx")).toContain("loadedScope === scopeId");
    expect(source("mobile/src/state/app.tsx")).toContain("activeScopeRef.current !== scopeId");
    expect(source("mobile/src/hooks/useProgressSync.ts")).toContain("if (!cancelled) {");
    expect(source("mobile/src/hooks/useProgressSync.ts")).toContain("return () => { cancelled = true; };");
    expect(source("mobile/app/_layout.tsx")).toContain('accountId={userId}');
  });
});
