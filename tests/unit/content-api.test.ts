import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseVisualsResponseSchema, catalogEntryResponseSchema, catalogListResponseSchema, labDatasetResponseSchema } from "@icu/schemas/working-content";
import { examPickResponseSchema, examQuestionsResponseSchema, examTopicsResponseSchema } from "@icu/schemas/working-exam";
import { pathsResponseSchema } from "@icu/schemas/working-paths";
import { revisionQuestionsResponseSchema } from "@icu/schemas/working-revision";

const ORIGINAL_EDITION = process.env.CONTENT_EDITION;

describe("content API: disabled when the working edition is off", () => {
  beforeEach(() => { delete process.env.CONTENT_EDITION; });
  afterEach(() => { process.env.CONTENT_EDITION = ORIGINAL_EDITION; });

  it("returns 404 from every content endpoint", async () => {
    const { GET: versionGet } = await import("@/app/api/content/version/route");
    expect(versionGet().status).toBe(404);
    const { GET: catalogGet } = await import("@/app/api/content/catalog/route");
    expect((await catalogGet(new Request("http://x/api/content/catalog"))).status).toBe(404);
    const { GET: entryGet } = await import("@/app/api/content/catalog/[key]/route");
    expect((await entryGet(new Request("http://x"), { params: Promise.resolve({ key: "D01-T19" }) })).status).toBe(404);
    const { GET: labGet } = await import("@/app/api/content/labs/[name]/route");
    expect((await labGet(new Request("http://x"), { params: Promise.resolve({ name: "ecg" }) })).status).toBe(404);
    const { GET: caseVisualsGet } = await import("@/app/api/content/case-visuals/route");
    expect(caseVisualsGet().status).toBe(404);
    const { GET: examTopicsGet } = await import("@/app/api/content/exam/topics/route");
    expect(examTopicsGet().status).toBe(404);
    const { GET: examPickGet } = await import("@/app/api/content/exam/pick/route");
    expect((await examPickGet(new Request("http://x?categories=General%20ICU%20Nursing&count=10"))).status).toBe(404);
    const { GET: examQuestionsGet } = await import("@/app/api/content/exam/questions/route");
    expect((await examQuestionsGet(new Request("http://x?ids=a"))).status).toBe(404);
    const { GET: pathsGet } = await import("@/app/api/content/paths/route");
    expect(pathsGet().status).toBe(404);
    const { GET: revisionGet } = await import("@/app/api/content/revision/questions/route");
    expect(revisionGet().status).toBe(404);
  });
});

describe("content API: enabled", () => {
  beforeEach(() => { process.env.CONTENT_EDITION = "working"; });
  afterEach(() => { process.env.CONTENT_EDITION = ORIGINAL_EDITION; });

  it("GET /api/content/version returns a stable, non-empty version string", async () => {
    const { GET } = await import("@/app/api/content/version/route");
    const r = GET();
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(typeof body.version).toBe("string");
    expect(body.version.length).toBeGreaterThan(0);
  });

  it("GET /api/content/catalog returns a valid, schema-conformant list with real entries", async () => {
    const { GET } = await import("@/app/api/content/catalog/route");
    const r = await GET(new Request("http://x/api/content/catalog"));
    expect(r.status).toBe(200);
    const body = await r.json();
    const parsed = catalogListResponseSchema.parse(body);
    expect(parsed.items.length).toBeGreaterThan(50);
    expect(parsed.items.some((i) => i.key === "D01-T19")).toBe(true);
  });

  it("GET /api/content/catalog?type=skills filters by type", async () => {
    const { GET } = await import("@/app/api/content/catalog/route");
    const r = await GET(new Request("http://x/api/content/catalog?type=skills"));
    const body = await r.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i: { type: string }) => i.type === "skills")).toBe(true);
  });

  it("GET /api/content/catalog?type=bogus is rejected", async () => {
    const { GET } = await import("@/app/api/content/catalog/route");
    const r = await GET(new Request("http://x/api/content/catalog?type=bogus"));
    expect(r.status).toBe(400);
  });

  it("GET /api/content/catalog/[key] returns the full entry, including answer keys and rationale, matching the schema", async () => {
    const { GET } = await import("@/app/api/content/catalog/[key]/route");
    const r = await GET(new Request("http://x"), { params: Promise.resolve({ key: "D01-T19" }) });
    expect(r.status).toBe(200);
    const body = await r.json();
    const parsed = catalogEntryResponseSchema.parse(body);
    expect(parsed.entry.key).toBe("D01-T19");
    expect(parsed.entry.body.length).toBeGreaterThan(100);
    if (parsed.entry.questions?.length) {
      for (const q of parsed.entry.questions) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it("GET /api/content/catalog/[key] 404s for an unknown or malformed key", async () => {
    const { GET } = await import("@/app/api/content/catalog/[key]/route");
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ key: "NOT-REAL" }) })).status).toBe(404);
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ key: "../../etc/passwd" }) })).status).toBe(404);
  });

  it("GET /api/content/labs/ecg returns the whitelisted dataset, schema-conformant", async () => {
    const { GET } = await import("@/app/api/content/labs/[name]/route");
    const r = await GET(new Request("http://x"), { params: Promise.resolve({ name: "ecg" }) });
    expect(r.status).toBe(200);
    const body = await r.json();
    const parsed = labDatasetResponseSchema.parse(body);
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it("GET /api/content/labs/[name] rejects any name not on the exact whitelist, including path traversal attempts", async () => {
    const { GET } = await import("@/app/api/content/labs/[name]/route");
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ name: "catalog" }) })).status).toBe(404);
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ name: "../package" }) })).status).toBe(404);
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ name: "working-ecg" }) })).status).toBe(404);
  });

  it("every whitelisted lab name actually resolves to a real file, and its payload is a non-empty array (not case-visuals' lookup object)", async () => {
    const { GET } = await import("@/app/api/content/labs/[name]/route");
    const { LAB_DATASETS } = await import("@/lib/content-api/version");
    for (const name of Object.keys(LAB_DATASETS)) {
      const r = await GET(new Request("http://x"), { params: Promise.resolve({ name }) });
      expect(r.status, `lab dataset "${name}"`).toBe(200);
      const body = await r.json();
      labDatasetResponseSchema.parse(body);
    }
  });

  it("GET /api/content/case-visuals returns the lookup object (not array-shaped, served separately from /labs/[name])", async () => {
    const { GET } = await import("@/app/api/content/case-visuals/route");
    const r = GET();
    expect(r.status).toBe(200);
    const body = await r.json();
    const parsed = caseVisualsResponseSchema.parse(body);
    expect(parsed.data.numericMonitor.length).toBeGreaterThan(0);
    expect(parsed.data.equipment["SC-10"]).toBe("MD-15");
  });

  it("case-visuals is not reachable through the array-shaped labs whitelist", async () => {
    const { GET } = await import("@/app/api/content/labs/[name]/route");
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ name: "case-visuals" }) })).status).toBe(404);
  });

  it("GET /api/content/exam/topics returns a schema-conformant category/count breakdown", async () => {
    const { GET } = await import("@/app/api/content/exam/topics/route");
    const r = GET();
    expect(r.status).toBe(200);
    const parsed = examTopicsResponseSchema.parse(await r.json());
    expect(parsed.topics.length).toBeGreaterThan(0);
    expect(parsed.topics.every((t) => t.count > 0)).toBe(true);
  });

  it("GET /api/content/exam/pick draws question ids from the chosen categories and a sane time limit", async () => {
    const { GET: topicsGet } = await import("@/app/api/content/exam/topics/route");
    const { topics } = await (topicsGet().json() as Promise<{ topics: { category: string; count: number }[] }>);
    const category = topics[0]!.category;
    const { GET } = await import("@/app/api/content/exam/pick/route");
    const r = await GET(new Request(`http://x?categories=${encodeURIComponent(category)}&count=10`));
    expect(r.status).toBe(200);
    const parsed = examPickResponseSchema.parse(await r.json());
    expect(parsed.questionIds.length).toBeGreaterThan(0);
    expect(parsed.questionIds.length).toBeLessThanOrEqual(10);
    expect(parsed.timeLimitSeconds).toBeGreaterThan(0);
  });

  it("GET /api/content/exam/pick rejects an invalid count or missing categories", async () => {
    const { GET } = await import("@/app/api/content/exam/pick/route");
    expect((await GET(new Request("http://x?categories=General%20ICU%20Nursing&count=7"))).status).toBe(400);
    expect((await GET(new Request("http://x?count=10"))).status).toBe(400);
  });

  it("GET /api/content/exam/questions returns full question objects (answer and explanation included) for the given ids", async () => {
    const { GET: topicsGet } = await import("@/app/api/content/exam/topics/route");
    const { topics } = await (topicsGet().json() as Promise<{ topics: { category: string; count: number }[] }>);
    const { GET: pickGet } = await import("@/app/api/content/exam/pick/route");
    const { questionIds } = await (await pickGet(new Request(`http://x?categories=${encodeURIComponent(topics[0]!.category)}&count=10`))).json();
    const { GET } = await import("@/app/api/content/exam/questions/route");
    const r = await GET(new Request(`http://x?ids=${questionIds.join(",")}`));
    expect(r.status).toBe(200);
    const parsed = examQuestionsResponseSchema.parse(await r.json());
    expect(parsed.items.length).toBe(questionIds.length);
    for (const q of parsed.items) { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.explanation.length).toBeGreaterThan(0); }
  });

  it("GET /api/content/exam/questions rejects empty or oversized id lists", async () => {
    const { GET } = await import("@/app/api/content/exam/questions/route");
    expect((await GET(new Request("http://x?ids="))).status).toBe(400);
    expect((await GET(new Request(`http://x?ids=${Array.from({ length: 101 }, (_, i) => `q${i}`).join(",")}`))).status).toBe(400);
  });

  it("GET /api/content/paths returns schema-conformant guided paths, with steps resolved against the live catalog", async () => {
    const { GET } = await import("@/app/api/content/paths/route");
    const r = GET();
    expect(r.status).toBe(200);
    const parsed = pathsResponseSchema.parse(await r.json());
    expect(parsed.paths.length).toBeGreaterThan(0);
    const path = parsed.paths.find((p) => p.key === "new-to-icu");
    expect(path).toBeDefined();
    expect(path!.steps.length).toBeGreaterThan(0);
    for (const step of path!.steps) expect(step.title.length).toBeGreaterThan(0);
  });

  it("GET /api/content/revision/questions returns the full real question pool, schema-conformant with answer keys and rationale", async () => {
    const { GET } = await import("@/app/api/content/revision/questions/route");
    const r = GET();
    expect(r.status).toBe(200);
    const parsed = revisionQuestionsResponseSchema.parse(await r.json());
    expect(parsed.items.length).toBeGreaterThan(100);
    for (const q of parsed.items) { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.explanation.length).toBeGreaterThan(0); }
  });
});
