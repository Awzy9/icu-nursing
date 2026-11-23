import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("P1 batch 16 — production web/mobile clinical content must fail closed", () => {
  beforeEach(() => {
    // A production Vercel deploy cannot be excused by a misleading app env.
    vi.stubEnv("CONTENT_EDITION", "working");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
    vi.stubEnv("VERCEL_ENV", "production");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 404 from all eleven native clinical content API endpoints before loading draft data", async () => {
    const { GET: version } = await import("@/app/api/content/version/route");
    const { GET: catalog } = await import("@/app/api/content/catalog/route");
    const { GET: entry } = await import("@/app/api/content/catalog/[key]/route");
    const { GET: labs } = await import("@/app/api/content/labs/[name]/route");
    const { GET: visuals } = await import("@/app/api/content/case-visuals/route");
    const { GET: crrt } = await import("@/app/api/content/crrt/route");
    const { GET: paths } = await import("@/app/api/content/paths/route");
    const { GET: topics } = await import("@/app/api/content/exam/topics/route");
    const { GET: pick } = await import("@/app/api/content/exam/pick/route");
    const { GET: questions } = await import("@/app/api/content/exam/questions/route");
    const { GET: revision } = await import("@/app/api/content/revision/questions/route");

    const request = (url = "http://test.invalid/api/content/catalog") => new Request(url);
    const responses = [
      version(),
      catalog(request()),
      entry(request(), { params: Promise.resolve({ key: "D08-T03" }) }),
      labs(request(), { params: Promise.resolve({ name: "ecg" }) }),
      visuals(),
      crrt(),
      paths(),
      topics(),
      pick(request("http://test.invalid/api/content/exam/pick?categories=General&count=10")),
      questions(request("http://test.invalid/api/content/exam/questions?ids=QB-D01-T19-1")),
      revision(),
    ];

    for (const [i, result] of responses.entries()) {
      const response = await result;
      expect(response.status, `Endpoint ${i + 1} must not serve unpublished clinical content`).toBe(404);
      const payload = await response.json();
      expect(payload.error).toBe("content_edition_disabled");
      expect(JSON.stringify(payload)).not.toContain("clinically reviewed");
    }
  });

  it("a missing app-env classification must not silently enable the public draft catalog", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "");
    const { workingEditionEnabled, workingContent } = await import("@/lib/working");
    expect(workingEditionEnabled()).toBe(false);
    expect(workingContent()).toEqual([]);
  });

  it("allows only explicitly configured development or staging previews without production Vercel flags", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
    const { workingEditionEnabled, workingContent } = await import("@/lib/working");
    expect(workingEditionEnabled()).toBe(true);
    expect(workingContent().length).toBeGreaterThan(100);
  });
});
