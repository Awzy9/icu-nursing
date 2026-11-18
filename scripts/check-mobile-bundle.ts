// Verifies the exported native bundle: it must contain NOTHING from the internal content-ops
// tooling (audit reports, the internal draft index's own metadata), any secret, or the removed
// fictional prototype's sample content (the harbour ferry office, the bakery dispenser, etc.).
// It is no longer a "synthetic content only" check: the app now fetches real, published lesson
// content (the same content the website shows every visitor, including its honest draft/review
// labels) over the content API at runtime, so real content codes and clinical terms legitimately
// never appear in the *static* bundle text in the first place - this scanner only needs to catch
// an accidental leak of something that was never meant to ship: internal file paths, the content
// team's own audit metadata, a credential, or the old prototype's fixtures.
// Usage: tsx scripts/check-mobile-bundle.ts <path to the export folder>   (CI runs `expo export` first).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface BundleFinding { problem: string }
export function scanBundle(text: string): BundleFinding[] {
  const out: BundleFinding[] = [];
  for (const needle of ["content/drafts", "draft-index", "draft-history", "service_role", "SERVICE_ROLE", "LIVE_SERVICE", "SUPABASE_SERVICE"]) if (text.includes(needle)) out.push({ problem: `forbidden string: ${needle}` });
  // The original synthetic-only prototype (packages/fixtures, mobile/src/samples.ts, the
  // removed /prototype screen): a fictional harbour ferry office, a bakery dispenser, a garden
  // drip pump, a ferry-ticket-scanner skill, a "number pattern" quiz question. None of this
  // should ever reach a release bundle again now that every screen reads real content
  // (core/content.ts and samples.ts are test-only, enforced by a guard test) - checked here too
  // as defense in depth against someone re-wiring a screen to the fixtures by mistake.
  const lower = text.toLowerCase();
  for (const needle of ["sample content", "harbour island", "fictional bakery", "fictional ferry", "ferry ticket scanner", "a sample number pattern"]) if (lower.includes(needle)) out.push({ problem: `prototype sample content leaked: ${needle}` });
  // The internal draft-index.json's own field names (content-ops audit metadata: source licence
  // class, whether a draft has had formal clinical review, unresolved required-source counts,
  // decision-graph spec level) - never meant to ship in the app, distinct from the lesson
  // content itself, which is legitimately fetched. "evidence_status" is deliberately NOT in this
  // list: @icu/schemas/skills.ts and medications.ts (shared, legitimately bundled schemas used
  // by src/api/rpc.ts since Phase 13) use that same field name for an unrelated, already-public
  // concept, so it is not a reliable signal of a content-ops leak.
  for (const needle of ["licence_class", "clinically_reviewed", "required_sources", "spec_level"]) if (text.includes(needle)) out.push({ problem: `internal content-audit field leaked: ${needle}` });
  if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(text)) out.push({ problem: "a JWT-like token is embedded in the bundle" });
  return out;
}
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
if (process.argv[1]?.endsWith("check-mobile-bundle.ts")) {
  const dir = process.argv[2] ?? "mobile/dist";
  const files = walk(dir).filter((f) => /\.(hbc|js|json)$/.test(f));
  if (!files.length) { console.error(`no bundle files in ${dir}`); process.exit(1); }
  const all = files.map((f) => readFileSync(f, "latin1")).join("\n");
  const findings = scanBundle(all);
  for (const f of findings) console.error(`✗ ${f.problem}`);
  console.log(`scanned ${files.length} files (${(all.length / 1e6).toFixed(1)} MB), ${findings.length} problem(s).`);
  process.exit(findings.length ? 1 : 0);
}
