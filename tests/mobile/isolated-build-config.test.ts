import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import app from "../../mobile/app.json";
import eas from "../../mobile/eas.json";
import { parseAuthCallback } from "../../mobile/src/auth/deepLinks";
import { siteBaseUrl } from "../../mobile/src/core/remoteContent";

const requireConfig = createRequire(import.meta.url);
const { configure } = requireConfig("../../mobile/app.config.js") as {
  configure(config: typeof app.expo, env: Record<string, string | undefined>): typeof app.expo & { updates: { enabled?: boolean }; extra: { siteUrl?: string } };
};
const valid = {
  APP_VARIANT: "isolated-replay",
  EXPO_PUBLIC_PROGRESS_REPLAY: "true",
  EXPO_PUBLIC_SUPABASE_URL: "https://qa-backend.example.org",
  EXPO_PUBLIC_SITE_URL: "https://qa-site.example.org",
  ISOLATED_REPLAY_SUPABASE_URL: "https://qa-backend.example.org",
  ISOLATED_REPLAY_SITE_URL: "https://qa-site.example.org",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
};

describe("isolated physical-device build configuration", () => {
  it("keeps the normal application identity and refuses replay outside QA", () => {
    expect(configure(app.expo, {})).toBe(app.expo);
    expect(() => configure(app.expo, {EXPO_PUBLIC_PROGRESS_REPLAY:"true"})).toThrow(/not approved/);
  });
  it("creates an internal physical-device variant, with no production OTA", () => {
    const config = configure(app.expo, valid);
    expect(config.name).toBe("Nursing Mastery QA");
    expect(config.ios.bundleIdentifier).toBe("com.nursingmastery.app.qa");
    expect(config.android.package).toBe("com.nursingmastery.app.qa");
    expect(config.scheme).toBe("nursingmasteryqa");
    expect(config.updates.enabled).toBe(false);
    expect(config.extra.siteUrl).toBe(valid.EXPO_PUBLIC_SITE_URL);
    expect(siteBaseUrl({}, config.extra.siteUrl)).toBe(valid.EXPO_PUBLIC_SITE_URL);
    expect(eas.build["isolated-replay"]).toMatchObject({distribution:"internal",ios:{simulator:false},android:{buildType:"apk"},channel:"isolated-replay"});
  });
  it("rejects missing, mismatched, insecure and known live destinations", () => {
    for (const override of [
      {EXPO_PUBLIC_SUPABASE_URL:undefined},
      {EXPO_PUBLIC_SITE_URL:undefined},
      {ISOLATED_REPLAY_SITE_URL:undefined},
      {EXPO_PUBLIC_SUPABASE_URL:"https://wrong.example.org"},
      {EXPO_PUBLIC_SUPABASE_URL:"https://dvmevjomyaqrojsiffnf.supabase.co",ISOLATED_REPLAY_SUPABASE_URL:"https://dvmevjomyaqrojsiffnf.supabase.co"},
      {EXPO_PUBLIC_SITE_URL:"https://icu-nursing.vercel.app",ISOLATED_REPLAY_SITE_URL:"https://icu-nursing.vercel.app"},
      {EXPO_PUBLIC_SITE_URL:"https://icu-nursing-preview.vercel.app",ISOLATED_REPLAY_SITE_URL:"https://icu-nursing-preview.vercel.app"},
      {EXPO_PUBLIC_SITE_URL:"http://qa-site.example.org",ISOLATED_REPLAY_SITE_URL:"http://qa-site.example.org"},
      {EXPO_PUBLIC_SITE_URL:"https://qa-site.example.org/path",ISOLATED_REPLAY_SITE_URL:"https://qa-site.example.org/path"},
      {EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_secret_synthetic"},
      {EXPO_PUBLIC_PROGRESS_REPLAY:"false"},
    ]) expect(() => configure(app.expo, {...valid,...override})).toThrow();
  });
  it("does not accept a production deep link in the QA app or a QA link in production", () => {
    const prod = "nursingmastery://auth/callback?code=abcdefgh&type=recovery";
    const qa = "nursingmasteryqa://auth/callback?code=abcdefgh&type=recovery";
    expect(parseAuthCallback(qa, valid.EXPO_PUBLIC_SITE_URL, "nursingmasteryqa").ok).toBe(true);
    expect(parseAuthCallback(prod, valid.EXPO_PUBLIC_SITE_URL, "nursingmasteryqa").ok).toBe(false);
    expect(parseAuthCallback(qa, "https://icu-nursing.vercel.app").ok).toBe(false);
    expect(parseAuthCallback("https://icu-nursing.vercel.app/auth/callback?code=abcdefgh", valid.EXPO_PUBLIC_SITE_URL, "nursingmasteryqa").ok).toBe(false);
  });

});
