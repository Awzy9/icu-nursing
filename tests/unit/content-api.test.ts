import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { catalogEntryResponseSchema, catalogListResponseSchema, labDatasetResponseSchema } from "@icu/schemas/working-content";

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

  it("every whitelisted lab name actually resolves to a real file", async () => {
    const { GET } = await import("@/app/api/content/labs/[name]/route");
    const { LAB_DATASETS } = await import("@/lib/content-api/version");
    for (const name of Object.keys(LAB_DATASETS)) {
      const r = await GET(new Request("http://x"), { params: Promise.resolve({ name }) });
      expect(r.status, `lab dataset "${name}"`).toBe(200);
    }
  });
});
