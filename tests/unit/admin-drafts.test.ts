import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { buildDraftIndex, licenceBand, parseCsv, updateHistory, type DraftHistory, type DraftIndex, type IndexEntry } from "../../scripts/build-draft-index";
import { compareLatest, coverage, draftFreshness, filterDrafts, hasSourceGap, needsRightsCheck, orderReviewQueue, reviewLane, sourceFreshness, worstLicence, STALE_DAYS } from "@/lib/admin/drafts-core";

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
    expect(onDisk.entries).toHaveLength(166);
    expect(new Set(onDisk.entries.map((x) => `${x.type}:${x.key}`)).size).toBe(166);
    for (const x of onDisk.entries) { expect(x.clinically_reviewed, x.key).toBe(false); for (const s of x.sources) expect(s.licence_class, `${x.key} ${s.id}`).not.toBe("UNREGISTERED"); }
  });
  it("keeps explicit supplementary source verification dates without implying clinical or rights clearance", () => {
    for (const id of ["N-HODGSON-2014", "S-ISBT-ATR-EDU", "N-LHSC-CRRT-PRINCIPLES"]) {
      const entries = onDisk.entries.filter(x => x.sources.some(s => s.id === id));
      expect(entries.length).toBeGreaterThan(0);
      for (const x of entries) {
        expect(x.sources.find(s => s.id === id)?.verified).toBe("2026-11-24");
        expect(x.clinically_reviewed).toBe(false);
        expect(needsRightsCheck(x)).toBe(true);
      }
    }
    expect(onDisk.entries.find(x => x.key === "SK-17")?.sources.find(s => s.id === "N-BAXTER-PRISMAFLEX")?.verified).toBeNull();
  });
  it("records partial airway and transport source checks while preserving unresolved older guidance", () => {
    for (const id of ["N-ICS-TRANSFER-2026", "N-ACI-TRACH", "N-NCBI-OPENRN-TRACH", "N-NCBI-OPENRN-CHEST"]) {
      const entries = onDisk.entries.filter(x => x.sources.some(s => s.id === id));
      expect(entries.length).toBeGreaterThan(0);
      for (const x of entries) {
        expect(x.sources.find(s => s.id === id)?.verified).toBe("2026-11-24");
        expect(x.clinically_reviewed).toBe(false);
        expect(needsRightsCheck(x)).toBe(true);
      }
    }
    const airway = onDisk.entries.find(x => x.key === "SK-05")!;
    expect(airway.sources.find(s => s.id === "N-NHSGGC-TRACH-2022")?.verified).toBeNull();
    expect(hasSourceGap(airway)).toBe(true);
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
  it("keeps staff clinical-review suggestions separate from actual approval", () => {
    const urgent = e({ key: "SC-11", type: "cases", gaps: 8, sources: [{ id: "S-UKKA-HK-2026", licence_class: "RED", verified: "2026-11-14" }] });
    const urgent2 = e({ key: "MD-20", type: "medications", gaps: 7 });
    const sourceGap = e({ key: "PX-12", type: "practice", gaps: 0, sources: [] });
    const unverified = e({ key: "SK-08", gaps: 4, sources: [{ id: "X", licence_class: "UNVERIFIED", verified: null }] });
    const rights = e({ key: "EQ-03", type: "equipment", gaps: 6, sources: [{ id: "R", licence_class: "RED", verified: "2026-11-14" }] });
    const general = e({ key: "PX-01", type: "practice", gaps: 9 });
    expect(reviewLane(urgent)).toBe("patient-safety");
    expect(reviewLane(urgent2)).toBe("patient-safety");
    expect(reviewLane(sourceGap)).toBe("source-verification");
    expect(reviewLane(unverified)).toBe("source-verification");
    expect(reviewLane(rights)).toBe("rights-review");
    expect(reviewLane(general)).toBe("general");
    const entries = [general, urgent2, rights, sourceGap, unverified, urgent];
    expect(orderReviewQueue(entries).map((x) => x.key)).toEqual(["SC-11", "MD-20", "SK-08", "PX-12", "EQ-03", "PX-01"]);
    expect(entries[0]).toBe(general); // stable original data, ordering is non-mutating
    expect(filterDrafts(entries, { review: "patient-safety" }, today).map(x => x.key)).toEqual(["MD-20", "SC-11"]);
    expect(filterDrafts(entries, { review: "source-verification" }, today).map(x => x.key)).toEqual(["PX-12", "SK-08"]);
    expect(entries.every(x => x.clinically_reviewed === false)).toBe(true);
  });
  it("finds overlapping source and rights signals across review lanes without implying clearance", () => {
    const urgent = e({ key: "SC-11", type: "cases", required_sources: 2, sources: [{ id: "R", licence_class: "RED", verified: "2026-11-14" }] });
    const undated = e({ sources: [{ id: "Y", licence_class: "YELLOW", verified: null }] });
    const missing = e({ key: "PX-12", sources: [] });
    const clean = e({ key: "SK-98" });
    const list = [urgent, undated, missing, clean];
    expect(hasSourceGap(urgent)).toBe(true);
    expect(needsRightsCheck(undated)).toBe(true);
    expect(filterDrafts(list, { sourceGap: "yes" }, today)).toEqual([urgent, undated, missing]);
    expect(filterDrafts(list, { rights: "yes" }, today)).toEqual([urgent, undated]);
    expect(filterDrafts(list, { review: "patient-safety", sourceGap: "yes", rights: "yes" }, today)).toEqual([urgent]);
    expect(filterDrafts(list, { sourceGap: "no", rights: "no" }, today)).toEqual([clean]);
    expect(worstLicence(e({ sources: [...clean.sources, { id: "U", licence_class: "UNREGISTERED", verified: null }] }))).toBe("UNREGISTERED");
    // Check exact membership against independent metadata criteria, not mutable
    // catalogue counts. A newly resolved source must not break this regression.
    const expectedGapKeys = onDisk.entries.filter(x =>
      x.required_sources !== 0 || x.sources.length === 0 ||
      x.sources.some(s => s.verified === null || s.verified === "" ||
        s.licence_class === "UNVERIFIED" || s.licence_class === "UNREGISTERED")
    ).map(x => x.key);
    const expectedRightsKeys = onDisk.entries.filter(x =>
      x.sources.some(s => s.licence_class === "RED" || s.licence_class === "YELLOW" ||
        s.licence_class === "UNVERIFIED" || s.licence_class === "UNREGISTERED")
    ).map(x => x.key);
    expect(filterDrafts(onDisk.entries, { sourceGap: "yes" }, today).map(x => x.key)).toEqual(expectedGapKeys);
    expect(filterDrafts(onDisk.entries, { rights: "yes" }, today).map(x => x.key)).toEqual(expectedRightsKeys);
    expect(filterDrafts(onDisk.entries, { sourceGap: "no" }, today).map(x => x.key))
      .toEqual(onDisk.entries.map(x => x.key).filter(key => !expectedGapKeys.includes(key)));
    expect(filterDrafts(onDisk.entries, { rights: "no" }, today).map(x => x.key))
      .toEqual(onDisk.entries.map(x => x.key).filter(key => !expectedRightsKeys.includes(key)));
    expect(expectedGapKeys).toContain("SC-11");
    expect(expectedRightsKeys).toContain("SC-11");
    expect(list.every(x => !x.clinically_reviewed)).toBe(true);
  });
  it("retains insulin rights and clinical review requirements after dated sources resolve its source-gap signal", () => {
    const insulin = onDisk.entries.find(x => x.key === "MD-15")!;
    expect(insulin.sources.map(s => s.id)).toContain("S-ADA-HOSP-2026");
    expect(insulin.sources.map(s => s.id)).toContain("S-JBDS-HYPO-2023");
    expect(hasSourceGap(insulin)).toBe(false);
    expect(needsRightsCheck(insulin)).toBe(true);
    expect(reviewLane(insulin)).toBe("patient-safety");
    expect(insulin.gaps).toBeGreaterThan(0);
    expect(insulin.clinically_reviewed).toBe(false);
  });
  it("flags the known high-priority working draft without displaying its content body", () => {
    const indexCase = onDisk.entries.find((x) => x.key === "SC-11")!;
    expect(reviewLane(indexCase)).toBe("patient-safety");
    expect(orderReviewQueue(onDisk.entries).slice(0, 2).map(x => x.key)).toEqual(["SC-09", "SC-11"]);
    expect(onDisk.entries.filter(x => x.clinically_reviewed)).toHaveLength(0);
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
    expect(c.cases!.extra).toMatch(/20 decision graphs, 0 outlines/);
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
