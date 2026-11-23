import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";
import { contentRevisionHash, eligibleForProduction, isProductionWorkingRelease } from "@/lib/working/publication-policy";
import { checkProductionPublication, PUBLICATION_DATASETS } from "@/lib/working/publication-gate";
import { workingContent, workingEditionEnabled } from "@/lib/working";

const register = JSON.parse(readFileSync("content/publication-approvals.json", "utf8"));
const index = JSON.parse(readFileSync("src/content/draft-index.json", "utf8"));
const working = buildWorkingContent();

describe("P1 batch 15: fail-closed clinical publication guard for web/mobile working edition", () => {
  it("never confuses enabling the educational preview with a clinically approved production release", () => {
    expect(isProductionWorkingRelease({ CONTENT_EDITION: "working", NEXT_PUBLIC_APP_ENV: "staging" })).toBe(false);
    expect(isProductionWorkingRelease({ CONTENT_EDITION: "working", NEXT_PUBLIC_APP_ENV: "production" })).toBe(true);
    expect(isProductionWorkingRelease({ CONTENT_EDITION: "working" })).toBe(true);
    expect(isProductionWorkingRelease({ CONTENT_EDITION: "working", NEXT_PUBLIC_APP_ENV: "staging", VERCEL_ENV: "production" })).toBe(true);
    expect(register.schema_version).toBe(1);
    expect(register.approvals).toEqual([]);
    expect(register.lab_approvals).toEqual([]);
    expect(index.entries.length).toBeGreaterThan(100);
    expect(index.entries.every((e: { clinically_reviewed: boolean }) => e.clinically_reviewed === false)).toBe(true);
  });

  it("blocks every unreviewed module and interactive dataset from production", () => {
    const checked = checkProductionPublication(working);
    expect(checked.ready).toBe(false);
    expect(checked.catalogBlocked).toBe(working.length);
    expect(checked.assetsBlocked).toEqual([...PUBLICATION_DATASETS]);
  });

  it("fail-closes ALL working routes and web/mobile content APIs in production mode", () => {
    vi.stubEnv("CONTENT_EDITION", "working");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    try {
      expect(workingEditionEnabled()).toBe(false);
      expect(workingContent()).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
    // Include every API endpoint, not just the catalog, to prevent future bypasses.
    const allApiRoutes = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((f) => {
        const file = path.join(dir, f.name);
        return f.isDirectory() ? allApiRoutes(file) : f.name === "route.ts" ? [file] : [];
      });
    const routes = allApiRoutes("src/app/api/content");
    expect(routes.length).toBeGreaterThanOrEqual(11);
    for (const routeFile of routes) {
      const route = readFileSync(routeFile, "utf8");
      expect(route, routeFile).toContain("workingEditionEnabled");
      expect(route, routeFile).toMatch(/if \(!workingEditionEnabled\(\)\)/);
      expect(route, routeFile).toMatch(/status: 404/);
    }
  });

  it("requires individual immutable revision-bound and independently authorised records", () => {
    const entry = working.find((e) => e.key === "D08-T03")!;
    expect(entry).toBeDefined();
    const fakeIndex = { entries: [{ key: entry.key, hash: "1234567890abcdef", clinically_reviewed: true, issues: [], sources: [{ id: "EXAMPLE", licence_class: "GREEN" }] }] };
    const fakeApproval = {
      key: entry.key,
      entry_sha256: contentRevisionHash(entry),
      source_draft_hash: "1234567890abcdef",
      clinical_reviewer_id: "clinician-example",
      clinical_reviewed_at: "2026-11-23",
      licence_reviewer_id: "licence-example",
      rights_clearance_reference: "permission-example",
      licence_reviewed_at: "2026-11-23",
      publisher_id: "publisher-example",
      published_approved_at: "2026-11-23",
      commercial_use_cleared: true,
    };
    const demoRegister = { schema_version: 1, approvals: [fakeApproval] };
    expect(eligibleForProduction([entry], demoRegister, fakeIndex).allowed).toHaveLength(1);
    expect(eligibleForProduction([entry], demoRegister, { entries: [{ ...fakeIndex.entries[0], hash: "abcdef1234567890" }] }).allowed).toHaveLength(0);
    expect(eligibleForProduction([{ ...entry, body: entry.body + "changed" }], demoRegister, fakeIndex).allowed).toHaveLength(0);
    expect(eligibleForProduction([entry], { ...demoRegister, approvals: [{ ...fakeApproval, commercial_use_cleared: false }] }, fakeIndex).allowed).toHaveLength(0);
    expect(eligibleForProduction([entry], demoRegister, { entries: [{ ...fakeIndex.entries[0], clinically_reviewed: false }] }).allowed).toHaveLength(0);
    expect(eligibleForProduction([entry], { ...demoRegister, approvals: [{ ...fakeApproval, publisher_id: fakeApproval.clinical_reviewer_id }] }, fakeIndex).allowed).toHaveLength(0);
    expect(eligibleForProduction([entry], { ...demoRegister, approvals: [fakeApproval, fakeApproval] }, fakeIndex).allowed).toHaveLength(0);
  });

  it("enforces a publication check at both build time and request time", () => {
    const builder = readFileSync("scripts/build-working-content.ts", "utf8");
    const server = readFileSync("src/lib/working/index.ts", "utf8");
    expect(builder).toContain("isProductionWorkingRelease(process.env)");
    expect(builder).toContain("checkProductionPublication(entries)");
    expect(builder).toContain("REFUSING production build of unapproved clinical working catalog");
    expect(server).toContain("!isProductionWorkingRelease(process.env)");
    expect(server).toContain("checkProductionPublication(loadCatalog()).ready");
    expect(server).toContain("Missing register, generated catalog or clinical review must fail closed");
  });
});
