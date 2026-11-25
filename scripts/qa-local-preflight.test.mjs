import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateLocalQa, checkLocalWorkspace } from "./qa-local-preflight.mjs";

const backend = "https://qa-test.example.ts.net:8443";
const site = "https://qa-test.example.ts.net";
const key = "sb_publishable_synthetic_fixture";
const valid = {
  APP_VARIANT: "isolated-replay",
  EXPO_PUBLIC_PROGRESS_REPLAY: "true",
  EXPO_PUBLIC_SUPABASE_URL: backend,
  EXPO_PUBLIC_SITE_URL: site,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  ISOLATED_REPLAY_SUPABASE_URL: backend,
  ISOLATED_REPLAY_SITE_URL: site,
  NEXT_PUBLIC_APP_ENV: "staging",
  CONTENT_EDITION: "working",
  NEXT_PUBLIC_SUPABASE_URL: backend,
  NEXT_PUBLIC_SITE_URL: site,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "qa-synthetic-shape-only",
};

test("accepts matching private QA configuration shape", () => {
  assert.deepEqual(validateLocalQa(valid), []);
});
test("rejects hosted, mismatched or unsafe QA settings", () => {
  for (const override of [
    { EXPO_PUBLIC_SUPABASE_URL: "https://dvmevjomyaqrojsiffnf.supabase.co" },
    { EXPO_PUBLIC_SITE_URL: "http://qa-test.example.ts.net" },
    { NEXT_PUBLIC_APP_ENV: "production" },
    { VERCEL_ENV: "production" },
    { CI: "true" },
    { NEXT_PUBLIC_SUPABASE_ANON_KEY: "different" },
    { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" },
    { ISOLATED_REPLAY_SITE_URL: "https://wrong.example.ts.net" },
    { EXPO_PUBLIC_PROGRESS_REPLAY: "false" },
  ]) assert.ok(validateLocalQa({...valid, ...override}).length > 0);
});
test("rejects linked checkouts and hosted environment files without exposing values", () => {
  const root = mkdtempSync(join(tmpdir(), "nursing-qa-"));
  try {
    mkdirSync(join(root, "supabase", ".temp"), { recursive: true });
    writeFileSync(join(root, "supabase", "config.toml"), "");
    assert.deepEqual(checkLocalWorkspace(root), []);
    writeFileSync(join(root, "supabase", ".temp", "project-ref"), "example");
    writeFileSync(join(root, ".env.local"), "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\n");
    const issues = checkLocalWorkspace(root);
    assert.equal(issues.length, 2);
    assert.ok(issues.every(issue => !issue.includes("example.supabase.co")));
  } finally { rmSync(root, {recursive:true,force:true}); }
});
