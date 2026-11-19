import { describe, expect, it, vi } from "vitest";
import { fetchAbgCases, fetchAlineExercises, fetchCatalogEntry, fetchCatalogList, fetchCrrtData, fetchDefibExercises, fetchEcgExercises, fetchExamQuestions, fetchExamTopics, fetchGcsCases, fetchInfusionCases, fetchLabDataset, fetchNews2Cases, fetchPaths, fetchRevisionQuestions, fetchTransfusionExercises, fetchWaveformExercises, imageUrl, pickExamQuestions, siteBaseUrl, type ContentClientDeps, type KeyValueStore } from "../../mobile/src/core/remoteContent";

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

  it("fetchRevisionQuestions validates and caches the full question pool, including answer keys and rationale", async () => {
    const item = { id: "Q1", prompt: "p", options: ["a", "b"], answer: 1, explanation: "e", moduleKey: "MOD-01", moduleTitle: "Module", moduleHref: "/working/MOD-01" };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", items: [item] }));
    const r = await fetchRevisionQuestions({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [item] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/revision/questions", expect.anything());
  });

  it("fetchNews2Cases validates each item against the specific News2Case shape, not just 'a non-empty array'", async () => {
    const news2Case = { key: "NEWS2-01", vignette: "v", scale: "1", respiratoryRate: 16, spo2: 98, onOxygen: false, systolicBp: 122, pulse: 72, consciousness: "alert", temperature: 36.8, options: ["a", "b"], answer: 0, explanation: "e" };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "news2-cases", items: [news2Case] }));
    const r = await fetchNews2Cases({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [news2Case] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/news2-cases", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "news2-cases", items: [{ key: "NEWS2-01" /* missing everything else */ }] }));
    const bad = await fetchNews2Cases({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchGcsCases validates each item against the specific GcsCase shape, not just 'a non-empty array'", async () => {
    const gcsCase = { key: "GCS-01", vignette: "v", correctEye: 4, correctVerbal: 5, correctMotor: 6, explanation: "e" };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "gcs-cases", items: [gcsCase] }));
    const r = await fetchGcsCases({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [gcsCase] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/gcs-cases", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "gcs-cases", items: [{ key: "GCS-01", correctEye: 7 /* out of range */ }] }));
    const bad = await fetchGcsCases({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchEcgExercises validates each item against the specific EcgExercise shape, not just 'a non-empty array'", async () => {
    const exercise = { key: "ECG-01", title: ["Normal sinus rhythm", "ar"], objective: ["o", "o-ar"], lessonHref: "/working/D02-T02", accessibleDescription: ["d"], trace: { label: "Lead II", unit: "mV", domain: [-0.5, 1.6], points: [[0, 0], [1, 0.5]] }, question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" }, evidenceSources: ["s"] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "ecg", items: [exercise] }));
    const r = await fetchEcgExercises({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [exercise] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/ecg", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "ecg", items: [{ key: "ECG-01" /* missing everything else */ }] }));
    const bad = await fetchEcgExercises({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchWaveformExercises validates each item against the specific WaveformExercise shape, not just 'a non-empty array'", async () => {
    const exercise = { key: "WV-01", title: ["Normal mechanical breath", "ar"], objective: ["o", "o-ar"], lessonHref: "/working/EQ-02", accessibleDescription: ["d"], traces: [{ label: "Pressure", unit: "cmH2O", domain: [0, 30], points: [[0, 5], [1, 25]] }], question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" }, evidenceSources: ["s"] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "waveforms", items: [exercise] }));
    const r = await fetchWaveformExercises({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [exercise] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/waveforms", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "waveforms", items: [{ key: "WV-01" /* missing everything else */ }] }));
    const bad = await fetchWaveformExercises({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchAlineExercises validates each item against the specific AlineExercise shape, not just 'a non-empty array'", async () => {
    const exercise = { key: "ALN-01", title: ["Optimally damped", "ar"], objective: ["o", "o-ar"], lessonHref: "/working/EQ-02", accessibleDescription: ["d1", "d2"], trace: { label: "Pressure", unit: "mmHg", domain: [0, 160], points: [[0, 0], [1, 160]] }, question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" }, evidenceSources: ["s"] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "aline", items: [exercise] }));
    const r = await fetchAlineExercises({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [exercise] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/aline", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "aline", items: [{ key: "ALN-01" /* missing everything else */ }] }));
    const bad = await fetchAlineExercises({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchDefibExercises validates each item against the specific DefibExercise shape, not just 'a non-empty array'", async () => {
    const exercise = { key: "DFB-01", title: ["Ventricular fibrillation", "ar"], vignette: "v", traceKey: "ECG-06", question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" } };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "defib", items: [exercise] }));
    const r = await fetchDefibExercises({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [exercise] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/defib", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "defib", items: [{ key: "DFB-01" /* missing everything else */ }] }));
    const bad = await fetchDefibExercises({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchAbgCases validates each item against the specific AbgCase shape, not just 'a non-empty array'", async () => {
    const abgCase = { key: "ABG-01", title: ["ABG case 01", "ar"], vignette: "v", gases: { pH: 7.25, paco2: 60, hco3: 24 }, lessonHref: "/working/D04-T08", question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" }, oxygenationNote: null, evidenceSources: ["s"] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "abg", items: [abgCase] }));
    const r = await fetchAbgCases({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [abgCase] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/abg", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "abg", items: [{ key: "ABG-01" /* missing everything else */ }] }));
    const bad = await fetchAbgCases({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchInfusionCases validates each item against the specific InfusionCase shape, not just 'a non-empty array'", async () => {
    const infusionCase = { key: "INF-01", drugRef: "norepinephrine", vignette: "v", order: { kind: "mcg/kg/min", doseOrdered: 0.1, weightKg: 70, concentrationMcgPerMl: 16 }, options: [26.3, 30.5], answerIndex: 0, explanation: "e" };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "infusion-cases", items: [infusionCase] }));
    const r = await fetchInfusionCases({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [infusionCase] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/infusion-cases", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "infusion-cases", items: [{ key: "INF-01" /* missing everything else */ }] }));
    const bad = await fetchInfusionCases({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchTransfusionExercises validates each item against the specific TransfusionExercise shape, not just 'a non-empty array'", async () => {
    const exercise = { key: "TRX-01", title: ["Acute hemolytic reaction", "ar"], vignette: "v", question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" } };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", name: "transfusion", items: [exercise] }));
    const r = await fetchTransfusionExercises({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data: [exercise] });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/labs/transfusion", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", name: "transfusion", items: [{ key: "TRX-01" /* missing everything else */ }] }));
    const bad = await fetchTransfusionExercises({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
  });

  it("fetchCrrtData validates the lookup object against the shared CrrtData shape (not the array-shaped labs endpoint)", async () => {
    const data = { components: [{ key: "filter", label: ["Hemofilter", "ar"], description: ["d", "ar"], alarms: ["Transmembrane pressure high", "ar"] }], alarms: [{ key: "CRRT-01", title: ["TMP alarm", "ar"], vignette: "v", componentKey: "filter", question: { prompt: "p", options: ["a", "b"], answer: 0, explanation: "e" } }] };
    const fetcher = vi.fn(async () => jsonResponse({ version: "v1", data }));
    const r = await fetchCrrtData({ store: mem(), fetcher: fetcher as unknown as typeof fetch, baseUrl: "https://x" });
    expect(r).toEqual({ status: "ok", fromCache: false, data });
    expect(fetcher).toHaveBeenCalledWith("https://x/api/content/crrt", expect.anything());

    const malformed = vi.fn(async () => jsonResponse({ version: "v1", data: { components: [{ key: "filter" /* missing everything else */ }], alarms: [] } }));
    const bad = await fetchCrrtData({ store: mem(), fetcher: malformed as unknown as typeof fetch, baseUrl: "https://x" });
    expect(bad).toEqual({ status: "offline" });
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
