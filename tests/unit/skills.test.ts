import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { loadSkillFixtures, skillSeedSql } from "@/lib/skills/fixtures";
import { createSkillFixtureService, type SkillStore } from "@/lib/skills/fixture-service";
import { SKILL_CATEGORIES, SKILL_SECTIONS, SkillError } from "@/lib/skills/types";

const skills = loadSkillFixtures();
const mk = () => { const store: SkillStore = new Map(); return (u = "u") => createSkillFixtureService(u, { store }); };

describe("skill fixtures", () => {
  it("are labelled synthetic and nonclinical with valid structure", () => {
    expect(skills.length).toBeGreaterThanOrEqual(4);
    for (const s of skills) {
      expect(s.code).toMatch(/^SYN-SKILL-\d{3}$/);
      expect(s.summary.en).toMatch(/no clinical content/i);
      expect(SKILL_CATEGORIES).toContain(s.category);
      expect(s.checklist.length).toBeGreaterThanOrEqual(3);
      expect(s.checklist.some((c) => c.critical)).toBe(true);
      for (const k of ["indications", "safety", "escalation", "documentation"]) expect(s.sections[k], `${s.code} ${k}`).toBeDefined();
      for (const k of Object.keys(s.sections)) expect(SKILL_SECTIONS as readonly string[]).toContain(k);
    }
  });
  it("seed SQL only inserts demo_synthetic rows and never a clinical one", () => {
    const sql = skillSeedSql();
    expect(sql).toMatch(/demo_synthetic/);
    expect(sql).not.toMatch(/'clinical'/);
    expect(sql).toContain("SYNTHETIC FIXTURE");
  });
  it("no application source imports the clinical skill drafts (they are never learner-facing content)", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    for (const f of walk("src").filter((x) => /\.(ts|tsx|json)$/.test(x))) expect(readFileSync(f, "utf8"), f).not.toMatch(/(from|import\(|require\()\s*["'][^"']*content\/drafts/);
  });
});

describe("fixture skill service", () => {
  it("lists, filters by category and searches", async () => {
    const svc = mk()();
    expect((await svc.list()).length).toBe(skills.length);
    expect((await svc.list({ category: "assessment" })).map((x) => x.code)).toEqual(["SYN-SKILL-002"]);
    expect((await svc.list({ query: "RADIO" })).map((x) => x.code)).toEqual(["SYN-SKILL-004"]);
    expect(await svc.list({ query: "zzzz" })).toEqual([]);
    expect(await svc.get("NOPE-000")).toBeNull();
  });
  it("records self-reported ticks, completes without any verdict, and isolates users", async () => {
    const get = mk();
    const a = get("a"), b = get("b");
    const s = skills[0]!;
    const id = await a.start(s.id);
    expect(await a.start(s.id)).toBe(id);
    await a.mark(id, s.checklist[0]!.id, "done");
    await a.mark(id, s.checklist[1]!.id, "unsure");
    await expect(a.mark(id, "00000000-0000-4000-8000-000000000000", "done")).rejects.toThrow(SkillError);
    const done = await a.complete(id);
    expect(done.summary).toEqual({ items_total: 7, items_done: 1, items_unsure: 1, critical_total: 3, critical_done: 1 });
    expect(JSON.stringify(done)).not.toMatch(/passed|competent|certified/i);
    await expect(a.mark(id, s.checklist[2]!.id, "done")).rejects.toThrow(SkillError);
    expect(await b.getSession(id)).toBeNull();
    expect((await b.progress()).practised).toBe(0);
    expect((await a.progress()).practised).toBe(1);
  });
  it("bookmarks and caps unfinished sessions", async () => {
    const svc = mk()("c");
    await svc.setBookmark(skills[0]!.id, true);
    expect((await svc.list({ bookmarked: true })).length).toBe(1);
    await svc.setBookmark(skills[0]!.id, false);
    expect(await svc.list({ bookmarked: true })).toEqual([]);
    await expect(svc.setBookmark("not-a-skill", true)).rejects.toThrow(SkillError);
  });
});
