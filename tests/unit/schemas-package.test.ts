import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as pkg from "@icu/schemas";
import * as cases from "@icu/schemas/cases";
import * as casesShim from "@/lib/cases/types";
import * as qb from "@icu/schemas/question-bank";
import * as qbShim from "@/lib/question-bank/types";
import { equipmentStateSchema } from "@icu/schemas/equipment-state";
import { createCaseFixtureService } from "@/lib/cases/fixture-service";
import { loadCaseFixtures } from "@/lib/cases/fixtures";
import { createEquipmentFixtureService } from "@/lib/equipment/state-fixture";
import { createSkillFixtureService } from "@/lib/skills/fixture-service";
import { skillListSchema, skillProgressSchema } from "@icu/schemas/skills";

const dir = path.resolve(__dirname, "../../packages/schemas/src");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));

describe("@icu/schemas is portable (usable by React Native / Expo as well as the web app)", () => {
  it("imports only zod and its own files: no Next.js, React, Node, DOM, app aliases, Supabase or server-only code", () => {
    for (const f of files) {
      const text = readFileSync(path.join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const specs = [...text.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)].map((m) => m[1]!);
      for (const s of specs) expect(s === "zod" || s.startsWith("./"), `${f} imports ${s}`).toBe(true);
      expect(text, f).not.toMatch(/process\.env|window\.|document\.|Buffer|require\(|"use client"|"use server"|server-only/);
    }
  });
  it("declares zod as its only dependency and is private", () => {
    const pj = JSON.parse(readFileSync(path.join(dir, "../package.json"), "utf8"));
    expect(pj.name).toBe("@icu/schemas"); expect(pj.private).toBe(true);
    expect(Object.keys(pj.peerDependencies ?? {})).toEqual(["zod"]); expect(pj.dependencies).toBeUndefined();
  });
  it("is the single definition: the old import paths re-export the same objects", () => {
    expect(casesShim.caseAttemptSchema).toBe(cases.caseAttemptSchema);
    expect(casesShim.CaseError).toBe(cases.CaseError);
    expect(qbShim.QuestionBankError).toBe(qb.QuestionBankError);
    expect(Object.keys(pkg).sort()).toEqual(["accountDeletion", "cases", "content", "equipment", "equipmentState", "medications", "practice", "questionBank", "skills", "subscription", "workingContent", "workingCrrt", "workingExam", "workingPaths", "workingProgress", "workingRevision"]);
    for (const f of ["src/lib/question-bank/types.ts", "src/lib/cases/types.ts", "src/lib/skills/types.ts", "src/lib/medications/types.ts", "src/lib/equipment/types.ts", "src/lib/equipment/state.ts", "src/lib/content/types.ts", "src/lib/account/deletion.ts"])
      expect(readFileSync(path.resolve(__dirname, "../..", f), "utf8")).toMatch(/export \* from "@icu\/schemas\/[a-z-]+";/);
  });
  it("parses what the application's services return (contract check against the in-memory engines)", async () => {
    const c = createCaseFixtureService("schema-user", { store: new Map() });
    const id = await c.start(loadCaseFixtures()[0]!.id);
    expect(() => cases.caseAttemptSchema.parse({})).toThrow(); // the schemas reject nonsense
    const attempt = JSON.parse(JSON.stringify(await c.get(id))), list = JSON.parse(JSON.stringify(await c.list())), progress = await c.progress();
    expect(() => cases.caseAttemptSchema.parse(attempt)).not.toThrow();
    expect(() => cases.caseListSchema.parse(list)).not.toThrow();
    expect(() => cases.caseProgressSchema.parse(progress)).not.toThrow();
    const e = createEquipmentFixtureService("schema-user", { store: new Map() });
    await e.setBookmark("SYN-EQ-001", true); await e.markViewed("SYN-EQ-001", "sensor");
    const estate = await e.get();
    expect(() => equipmentStateSchema.parse(estate)).not.toThrow();
    const s = createSkillFixtureService("schema-user", { store: new Map() });
    const slist = JSON.parse(JSON.stringify(await s.list())), sprog = await s.progress();
    expect(() => skillListSchema.parse(slist)).not.toThrow();
    expect(() => skillProgressSchema.parse(sprog)).not.toThrow();
  });
});
