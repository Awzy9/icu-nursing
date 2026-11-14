import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { batchPositionIssues, mcqQuality, parseMcqs, validateDraft } from "@/lib/draft-validator";

const batches = readdirSync("content/drafts", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const files = batches.flatMap((b) => readdirSync(`content/drafts/${b}`).filter((f) => f.endsWith(".md")).map((f) => `${b}/${f}`));
const texts = files.map((f) => readFileSync(`content/drafts/${f}`, "utf8"));
const perBatch = (b: string) => files.map((f, i) => (f.startsWith(`${b}/`) ? texts[i]! : "")).filter(Boolean);
const good = texts[0]!;

const q = (id: string, answer: string, opts: string[], extra = {}) => ({
  id, answer, hasWhyCorrect: true,
  options: Object.fromEntries(opts.map((o, i) => ["ABCD"[i]!, o])),
  why: Object.fromEntries(["A", "B", "C", "D"].filter((l) => l !== answer).map((l) => [l, "This is wrong because of the reason."])),
  ...extra,
});
const ok = ["Reassess the patient and escalate using SBAR now", "Wait for the next ward round before acting on it", "Record it and look again at the end of shift", "Ask a relative to find a doctor for the patient"];

describe("Phase 2 drafts: structure and safety", () => {
  it("has the batch files", () => expect(files.length).toBeGreaterThanOrEqual(40));
  files.forEach((f, i) => it(`${f} passes validation`, () => expect(validateDraft(texts[i]!)).toEqual([])));
  batches.forEach((b) => it(`${b}: answer positions are balanced across the batch`, () => expect(batchPositionIssues(perBatch(b))).toEqual([])));
  it("every draft has six or more MCQs with an explanation for each wrong option", () => {
    for (const t of texts) {
      const qs = parseMcqs(t);
      expect(qs.length).toBeGreaterThanOrEqual(6);
      for (const m of qs) for (const l of ["A", "B", "C", "D"]) if (l !== m.answer) expect(m.why[l]?.length ?? 0).toBeGreaterThan(14);
    }
  });
  it("rejects claims of review", () => {
    expect(validateDraft(good.replace("clinically_reviewed: false", "clinically_reviewed: true")).length).toBeGreaterThan(0);
    expect(validateDraft(good.replace("status: DRAFT", "status: published")).length).toBeGreaterThan(0);
    expect(validateDraft(good + "\nReviewed by Dr X").length).toBeGreaterThan(0);
  });
  it("allows ventilator tidal volume per predicted body weight but still blocks drug-style doses", () => {
    expect(validateDraft(good + "\nTidal volume 6 mL/kg PBW").some((i) => i.rule === "dosing")).toBe(false);
    expect(validateDraft(good + "\nGive 6 mL/kg/h").some((i) => i.rule === "dosing")).toBe(true);
  });
  it("rejects dosing and missing banner", () => {
    expect(validateDraft(good + "\nGive 5 mcg/kg/min").some((i) => i.rule === "dosing")).toBe(true);
    expect(validateDraft(good.replace(/NOT clinically reviewed/g, "x")).some((i) => i.rule === "banner")).toBe(true);
  });
});

describe("Phase 2 drafts: consistency with the curriculum and source register", () => {
  const csv = (path: string) => readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  const curriculum = csv("curriculum/master_curriculum.csv");
  const register = readFileSync("sources/source_register.csv", "utf8");
  files.forEach((f, i) => {
    it(`${f}: topic id, domain and source IDs match the curriculum and register`, () => {
      const m = (k: string) => new RegExp(`^${k}: (.+)$`, "m").exec(texts[i]!)?.[1]?.trim() ?? "";
      const row = curriculum.find((l) => l.startsWith(`${m("topic_id")},`));
      expect(row, "topic id exists in the curriculum").toBeTruthy();
      expect(row!.includes(`,${m("domain")},`), "domain name matches the curriculum").toBe(true);
      for (const s of m("sources").replace(/[\[\]]/g, "").split(",").map((x) => x.trim()).filter(Boolean)) expect(register.includes(s), `source ${s} is in the register`).toBe(true);
    });
  });
});

describe("Source status integrity (no inaccessible source is presented as verified)", () => {
  const reg = readFileSync("sources/source_register.csv", "utf8").trim().split(/\r?\n/);
  const head = reg[0]!.split(",");
  const idx = head.indexOf("source_status");
  const status = new Map<string, string>();
  for (const line of reg.slice(1)) {
    const cells = (line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, ""));
    status.set(cells[0]!, cells[idx]!);
  }
  it("register has a status for every source", () => {
    expect(idx).toBeGreaterThan(0);
    for (const [, s] of status) expect(["VERIFIED FULL TEXT", "PARTIAL OR SUMMARY", "NOT READ", "SUPERSEDED"]).toContain(s);
  });
  files.forEach((f, i) => {
    it(`${f}: cited sources are read; unread sources are listed separately; superseded ones carry a caveat`, () => {
      const ids = (/^sources: \[(.*?)\]/m.exec(texts[i]!)?.[1] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      for (const id of ids) {
        const s = status.get(id);
        expect(s, `${id} in register`).toBeTruthy();
        expect(s, `${id} must not be NOT READ`).not.toBe("NOT READ");
        if (s === "SUPERSEDED") expect(/supersed|2026 (edition|update)/i.test(texts[i]!), `${id} is superseded: the draft must say so`).toBe(true);
      }
    });
  });
});

describe("Canonical topic inventory (no double counting)", () => {
  const rows = readFileSync("content/drafts/TOPIC_INVENTORY.csv", "utf8").trim().split(/\r?\n/).slice(1).map((l) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')));
  const ids = rows.map((r) => r[0]!);
  it("lists each of the 40 P1 topics exactly once", () => {
    expect(rows.length).toBe(40);
    expect(new Set(ids).size).toBe(40);
  });
  it("matches the draft files on disk: one canonical ID, one batch", () => {
    const onDisk = files.map((f, i) => ({ f, id: /^topic_id: (\S+)/m.exec(texts[i]!)?.[1] ?? "" }));
    expect(new Set(onDisk.map((d) => d.id)).size).toBe(onDisk.length);
    const drafted = rows.filter((r) => r[3]!.startsWith("DRAFTED"));
    expect(drafted.length).toBe(onDisk.length);
    for (const d of onDisk) expect(drafted.some((r) => r[0] === d.id && d.f.startsWith(`${r[4]}/`))).toBe(true);
  });
  it("marks nothing as clinically reviewed", () => expect(rows.every((r) => r[7] === "no")).toBe(true));
  it("separates DRAFTED from COMPREHENSIVELY COVERED: every drafted topic has a coverage level and stated gaps", () => {
    const allowed = ["CORE", "PARTIAL", "THIN"];
    for (const r of rows.filter((x) => x[3]!.startsWith("DRAFTED"))) {
      expect(allowed.includes(r[9]!), `${r[0]} coverage level`).toBe(true);
      expect(r[11]!.length, `${r[0]} gaps text`).toBeGreaterThan(20);
      expect(r[10]!.startsWith("PROVISIONAL YES") === (r[9] === "CORE"), `${r[0]} comprehensive flag matches level`).toBe(true);
    }
  });
  it("never claims unqualified comprehensive coverage before clinical review", () => expect(rows.some((r) => r[10] === "YES")).toBe(false));
  it("keeps blocked topics undrafted", () => { for (const r of rows.filter((x) => x[3]!.startsWith("BLOCKED"))) expect(files.some((f) => f.includes(r[0]!))).toBe(false); });
});

describe("MCQ quality checks (self-tests)", () => {
  it("accepts a balanced set", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ok));
    expect(mcqQuality(qs)).toEqual([]);
  });
  it("flags answer-position imbalance", () => {
    const qs = Array.from({ length: 6 }, (_, i) => q(`Q${i + 1}`, "B", ok));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-position")).toBe(true);
  });
  it("flags implausibly short distractors", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ["Reassess the patient and escalate using SBAR now", "Wait", "Ignore it", "No"]));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-distractor")).toBe(true);
  });
  it("flags a correct option that is always the longest", () => {
    const long = "Reassess the patient thoroughly, escalate using SBAR, and document the time of the call and the reply";
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ["A", "B", "C", "D"].map((l) => (l === a ? long : "Wait for the next ward round before acting on it")) as string[]));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-length")).toBe(true);
  });
  it("flags a missing explanation for a wrong option", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ok));
    qs[0]!.why = {};
    expect(mcqQuality(qs).some((i) => /Why not/.test(i.message))).toBe(true);
  });
  it("flags answer-position imbalance across a batch", () => {
    const one = (a: string) => `## 17. MCQs\n${Array.from({ length: 6 }, (_, i) => `**Q${i + 1} (x).** s\nA. aaa\nB. bbb\nC. ccc\nD. ddd\n**Answer: ${a}.**\n`).join("\n")}\n## 18. References`;
    expect(batchPositionIssues([one("A"), one("A"), one("B"), one("A")]).length).toBeGreaterThan(0);
  });
});
