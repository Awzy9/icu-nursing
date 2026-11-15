import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { buildDraftIndex, licenceBand, parseCsv, updateHistory, type DraftHistory, type DraftIndex, type IndexEntry } from "../../scripts/build-draft-index";
import { compareLatest, coverage, draftFreshness, filterDrafts, sourceFreshness, worstLicence, STALE_DAYS } from "@/lib/admin/drafts-core";

const onDisk = JSON.parse(readFileSync("src/content/draft-index.json", "utf8")) as DraftIndex;
const hist = JSON.parse(readFileSync("src/content/draft-history.json", "utf8")) as DraftHistory;
const today = new Date("2026-11-15T00:00:00Z");
const e = (over: Partial<IndexEntry> = {}): IndexEntry => ({ key: "SK-99", type: "skills", title: "Sample", domain: null, evidence_status: "partial", spec_level: null, clinically_reviewed: false, sources: [{ id: "S-A", licence_class: "GREEN", verified: "2026-11-01" }], issues: [], gaps: 1, required_sources: 0, hash: "aa", ...over });

describe("draft index (metadata only)", () => {
  it("is up to date with the draft files and the history agrees with it (regenerate with npm run register:drafts)", () => {
    expect(onDisk).toEqual(buildDraftIndex());
    for (const x of onDisk.entries) expect(hist.entries[x.key]?.at(-1)?.hash, x.key).toBe(x.hash);
    expect(updateHistory(onDisk, hist, "2099-01-01")).toEqual(hist); // idempotent: unchanged drafts add no snapshot
  });
  it("covers every draft once, none reviewed, and every cited source is registered", () => {
    expect(onDisk.entries).toHaveLength(154);
    expect(new Set(onDisk.entries.map((x) => `${x.type}:${x.key}`)).size).toBe(154);
    for (const x of onDisk.entries) { expect(x.clinically_reviewed, x.key).toBe(false); for (const s of x.sources) expect(s.licence_class, `${x.key} ${s.id}`).not.toBe("UNREGISTERED"); }
  });
  it("holds no draft body text: only short metadata fields", () => {
    for (const x of onDisk.entries) expect(JSON.stringify({ ...x, issues: undefined }).length, x.key).toBeLessThan(2500);
  });
  it("normalises free-text licence classes to the most restrictive band", () => {
    expect(licenceBand("YELLOW/RED (cite only)")).toBe("RED"); expect(licenceBand("RED for commercial use")).toBe("RED");
    expect(licenceBand("GREEN/YELLOW (GPL caveat)")).toBe("YELLOW"); expect(licenceBand("GREEN (conditional)")).toBe("GREEN");
    expect(licenceBand("Unverified")).toBe("UNVERIFIED"); expect(licenceBand("RED (unconfirmed)")).toBe("RED"); expect(licenceBand("")).toBe("UNVERIFIED");
  });
  it("reads quoted CSV fields with commas, doubled quotes and newlines", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n"multi\nline",z\n')).toEqual([{ a: "x, y", b: 'say "hi"' }, { a: "multi\nline", b: "z" }]);
  });
});

describe("filters, freshness, comparison and coverage", () => {
  it("flags stale and undated sources", () => {
    expect(sourceFreshness({ id: "x", licence_class: "GREEN", verified: "2026-11-01" }, today)).toBe("fresh");
    expect(sourceFreshness({ id: "x", licence_class: "GREEN", verified: "2026-05-01" }, today)).toBe("stale");
    expect(sourceFreshness({ id: "x", licence_class: "GREEN", verified: null }, today)).toBe("unknown");
    expect(STALE_DAYS).toBe(180);
    expect(draftFreshness(e(), today)).toBe("fresh");
    expect(draftFreshness(e({ sources: [] }), today)).toBe("unknown");
    expect(draftFreshness(e({ sources: [{ id: "a", licence_class: "GREEN", verified: "2026-11-01" }, { id: "b", licence_class: "RED", verified: "2025-01-01" }] }), today)).toBe("stale");
    expect(worstLicence(e({ sources: [{ id: "a", licence_class: "GREEN", verified: null }, { id: "b", licence_class: "RED", verified: null }] }))).toBe("RED");
  });
  it("filters by type, evidence, validation, licence, freshness, notes and text", () => {
    const list = [e({ key: "SK-01", title: "Arterial line" }), e({ key: "MD-01", type: "medications", title: "Norepinephrine", evidence_status: "unsupported", issues: [{ rule: "x", message: "y" }], sources: [{ id: "b", licence_class: "RED", verified: null }] })];
    expect(filterDrafts(list, { type: "medications" }, today).map((x) => x.key)).toEqual(["MD-01"]);
    expect(filterDrafts(list, { evidence: "partial" }, today).map((x) => x.key)).toEqual(["SK-01"]);
    expect(filterDrafts(list, { validation: "issues" }, today).map((x) => x.key)).toEqual(["MD-01"]);
    expect(filterDrafts(list, { licence: "RED" }, today).map((x) => x.key)).toEqual(["MD-01"]);
    expect(filterDrafts(list, { freshness: "unknown" }, today).map((x) => x.key)).toEqual(["MD-01"]);
    expect(filterDrafts(list, { notes: "with" }, today, new Set(["SK-01"])).map((x) => x.key)).toEqual(["SK-01"]);
    expect(filterDrafts(list, { q: "arter" }, today).map((x) => x.key)).toEqual(["SK-01"]);
    expect(filterDrafts(list, { q: "%" }, today)).toEqual([]);
    expect(filterDrafts(list, {}, today)).toHaveLength(2);
  });
  it("compares the last two snapshots", () => {
    const h: DraftHistory = { note: "", entries: { A: [{ hash: "1", recorded: "d1", evidence_status: "unsupported", sources: ["S-1"], gaps: 3, required_sources: 2, issues: 1 }, { hash: "2", recorded: "d2", evidence_status: "partial", sources: ["S-1", "S-2"], gaps: 2, required_sources: 2, issues: 0 }], B: [{ hash: "1", recorded: "d1", evidence_status: "partial", sources: [], gaps: 0, required_sources: 0, issues: 0 }] } };
    expect(compareLatest(h, "A")!.changes).toEqual(["Evidence status: unsupported -> partial", "Sources added: S-2", "Declared gaps: 3 -> 2", "Validator issues: 1 -> 0"]);
    expect(compareLatest(h, "B")!.from).toBeNull();
    expect(compareLatest(h, "Z")).toBeNull();
  });
  it("reports coverage per type on the real index (no reviewed drafts, planned counts met)", () => {
    const c = Object.fromEntries(coverage(onDisk, today).map((r) => [r.type, r]));
    expect(c.skills!.total).toBe(25); expect(c.medications!.total).toBe(50); expect(c.cases!.total).toBe(20); expect(c.equipment!.total).toBe(8); expect(c.topics!.total).toBe(40);
    expect(c.cases!.extra).toMatch(/13 decision graphs, 7 outlines/);
    for (const r of Object.values(c)) { expect(r.reviewed).toBe(0); expect(r.withIssues).toBe(0); }
  });
});

describe("the draft index is staff-only code", () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  it("only admin pages, the admin library and their actions import it, and none of them is a client component", () => {
    for (const f of walk("src").filter((x) => /\.(ts|tsx)$/.test(x))) {
      const t = readFileSync(f, "utf8");
      if (!/draft-index|draft-history|@\/lib\/admin\/drafts"/.test(t)) continue;
      expect(/[\\/]admin[\\/]/.test(f), f).toBe(true);
      expect(t.startsWith('"use client"'), f).toBe(false);
    }
  });
});
