import { describe, expect, it } from "vitest";
import { robotsFor } from "@/app/robots";
import { parseEnv } from "@/lib/env";

describe("non-production deployments are never indexed", () => {
  it("disallows everything unless NEXT_PUBLIC_APP_ENV is exactly 'production'", () => {
    for (const e of [undefined, "", "staging", "development"]) expect(parseEnv({ NEXT_PUBLIC_APP_ENV: e }).indexable, String(e)).toBe(false);
    expect(parseEnv({ NEXT_PUBLIC_APP_ENV: "production" }).indexable).toBe(true);
    expect(() => parseEnv({ NEXT_PUBLIC_APP_ENV: "prod" })).toThrow();
  });
  it("robots.txt blocks all crawling when not indexable, and never advertises private areas when indexable", () => {
    expect(robotsFor(false).rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    const prod = robotsFor(true, "https://example.org/");
    expect(JSON.stringify(prod)).toContain('"/admin"');
    expect(prod.sitemap).toBe("https://example.org/sitemap.xml");
  });
});
