import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

it("refuses hosted dev SQL and Auth requests before sending anything to the converted production project", async () => {
  vi.stubEnv("LIVE_TARGET", "");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const { sql, api } = await import("../../scripts/live/mgmt");
  await expect(sql("select 1")).rejects.toThrow("converted to production");
  await expect(api("/config/auth", { method: "PATCH", body: "{}" })).rejects.toThrow("now production");
  expect(fetch).not.toHaveBeenCalled();
});
