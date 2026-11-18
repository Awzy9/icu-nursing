import { describe, expect, it, vi } from "vitest";
import { fetchCatalogEntry, fetchCatalogList, fetchExamQuestions, fetchExamTopics, fetchLabDataset, fetchPaths, imageUrl, pickExamQuestions, siteBaseUrl, type ContentClientDeps, type KeyValueStore } from "../../mobile/src/core/remoteContent";

const mem = (): KeyValueStore & { data: Map<string, string> } => { const data = new Map<string, string>(); return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => void data.set(k, v) }; };
const jsonResponse = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

describe("siteBaseUrl / imageUrl", () => {
  it("prefers EXPO_PUBLIC_SITE_URL, then app.json extra, then the production default, and strips a trailing slash", () => {
    expect(siteBaseUrl({ EXPO_PUBLIC_SITE_URL: "https://dev.example.com/" })).toBe("https://dev.example.com");
    expect(siteBaseUrl({}, "https://extra.example.com")).toBe("https://extra.example.com");
    expect(siteBaseUrl({})).toBe("https://icu-nursing.vercel.app");
  });
  it("joins a base URL and an absolute or relative path without a double slash", () => {
    expect(imageUrl("https://x.example.com", "/images/a.webp")).toBe("https://x.example.com/images/a.webp");
    expect(imageUrl("https://x.example.com", "images/a.webp")).toBe("https://x.example.com/images/a.webp");
  });
});

describe("content client: online", () => {
  it("fetchCatalogList validates and caches the response", async () => {
    const store = mem();
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", items: [{ key: "D01-T19", type: "topics", title: "x", category: "y", questionCount: 2 }] }));
    const deps: ContentClientDeps = { store, fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" };
    const r = await fetchCatalogList(deps);
    expect(r).toEqual({ status: "ok", fromCache: false, data: [{ key: "D01-T19", type: "topics", title: "x", category: "y", questionCount: 2 }] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/catalog", expect.anything());
    expect(store.data.size).toBe(1);
  });

  it("fetchCatalogList passes the type filter through as a query param", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", items: [] }));
    await fetchCatalogList({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, "skills");
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/catalog?type=skills", expect.anything());
  });

  it("fetchCatalogEntry validates a full entry, including answer keys and rationale", async () => {
    const entry = { key: "D01-T19", type: "topics", title: "x", category: "y", body: "body", questionCount: 1, questions: [{ id: "q1", prompt: "p", options: ["a", "b"], answer: 1, explanation: "e" }] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", entry }));
    const r = await fetchCatalogEntry({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, "D01-T19");
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data).toEqual(entry);
  });

  it("fetchLabDataset returns the raw items array for a lab dataset", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "ecg", items: [{ key: "ECG-01" }] }));
    const r = await fetchLabDataset({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, "ecg");
    expect(r).toEqual({ status: "ok", fromCache: false, data: [{ key: "ECG-01" }] });
  });

  it("rejects a response that fails schema validation rather than silently accepting malformed data", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", items: [{ key: "D01-T19" }] })); // missing required fields
    const r = await fetchCatalogList({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "offline" });
  });

  it("fetchExamTopics validates and caches the category/count breakdown", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", topics: [{ category: "Sepsis", count: 6 }] }));
    const r = await fetchExamTopics({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [{ category: "Sepsis", count: 6 }] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/exam/topics", expect.anything());
  });

  it("fetchExamQuestions requests the given ids and validates full question objects (answer and explanation included)", async () => {
    const item = { id: "Q1", prompt: "p", options: ["a", "b"], answer: 1, explanation: "e", moduleKey: "MOD-01", moduleTitle: "Module", moduleHref: "/working/MOD-01", category: "Sepsis" };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", items: [item] }));
    const r = await fetchExamQuestions({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, ["Q1"]);
    expect(r).toEqual({ status: "ok", fromCache: false, data: [item] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/exam/questions?ids=Q1", expect.anything());
  });

  it("pickExamQuestions never caches: it always hits the network and returns offline (not a stale cached pick) on failure", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ questionIds: ["Q1", "Q2"], timeLimitSeconds: 1440 }));
    const r = await pickExamQuestions({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, ["Sepsis"], 20);
    expect(r).toEqual({ status: "ok", fromCache: false, data: { questionIds: ["Q1", "Q2"], timeLimitSeconds: 1440 } });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/exam/pick?categories=Sepsis&count=20", expect.anything());

    const failingFetcher = vi.fn(async () => jsonResponse({ error: "no_questions" }, false));
    const failed = await pickExamQuestions({ store: mem(), fetcher: failingFetcher as unknown as typeof fetch, baseUrl: "https://x" }, ["Sepsis"], 20);
    expect(failed).toEqual({ status: "offline" });
  });

  it("fetchPaths validates and caches the resolved guided paths", async () => {
    const path = { key: "new-to-icu", title: ["New to ICU", "ar"], audience: ["aud", "aud-ar"], objectives: [["o", "o-ar"]], estimatedMinutes: 55, steps: [{ key: "D07-T01", type: "topics", title: "t", href: "/working/D07-T01" }] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", paths: [path] }));
    const r = await fetchPaths({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [path] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/paths", expect.anything());
  });
});

describe("content client: offline / error handling", () => {
  it("falls back to the cached copy when the network request fails", async () => {
    const store = mem();
    await store.set("icu.content.v1:catalog:all", JSON.stringify([{ key: "CACHED", type: "topics", title: "t", category: "c", questionCount: 0 }]));
    const fetcher = vi.fn(async () => { throw new Error("network down"); });
    const r = await fetchCatalogList({ store, fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: true, data: [{ key: "CACHED", type: "topics", title: "t", category: "c", questionCount: 0 }] });
  });

  it("falls back to the cached copy on a non-2xx HTTP response", async () => {
    const store = mem();
    await store.set("icu.content.v1:entry:D01-T19", JSON.stringify({ key: "D01-T19", type: "topics", title: "t", category: "c", body: "b", questionCount: 0 }));
    const fetcher = vi.fn(async () => jsonResponse({ error: "not_found" }, false));
    const r = await fetchCatalogEntry({ store, fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" }, "D01-T19");
    expect(r.status).toBe("ok");
  });

  it("returns an explicit offline result, never fabricated data, when the network fails and nothing is cached", async () => {
    const fetcher = vi.fn(async () => { throw new Error("network down"); });
    const r = await fetchCatalogList({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "offline" });
  });

  it("aborts a hung request after the timeout rather than waiting forever", async () => {
    const fetcher = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    const store = mem();
    const r = await fetchCatalogList({ store, fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "offline" });
  }, 15000);
});
