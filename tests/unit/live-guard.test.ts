import { describe, expect, it } from "vitest";
import { DEV_REF, refuseCaptchaWeakeningOnDev } from "../../scripts/live/mgmt";

describe("live-test guard for the real CAPTCHA secret", () => {
  it("refuses to weaken CAPTCHA (test key or off) on the approved dev project", () => {
    expect(() => refuseCaptchaWeakeningOnDev(DEV_REF)).toThrow(/real Turnstile secret/);
  });
  it("allows an isolated project reference", () => {
    expect(() => refuseCaptchaWeakeningOnDev("isolatedtestprojectref")).not.toThrow();
  });
});
