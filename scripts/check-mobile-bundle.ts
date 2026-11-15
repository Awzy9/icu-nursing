// Verifies the exported native bundle: it must contain the synthetic fixtures and NOTHING from the unpublished clinical drafts or any secret.
// Usage: tsx scripts/check-mobile-bundle.ts <path to the export folder>   (CI runs `expo export` first).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import draftIndex from "../src/content/draft-index.json";

export interface BundleFinding { problem: string }
export function scanBundle(text: string): BundleFinding[] {
  const out: BundleFinding[] = [];
  const lower = text.toLowerCase();
  if (!text.includes("SYN-EQ-001") || !text.includes("SYN-CASE-001")) out.push({ problem: "the synthetic fixtures are missing from the bundle" });
  for (const m of text.matchAll(/\b(D\d\d-T\d\d|SK-\d\d|MD-\d\d|SC-\d\d|EQ-\d\d|XQ-\d\d)\b/g)) out.push({ problem: `draft id ${m[1]} found` });
  for (const e of draftIndex.entries) if (e.title.length > 14 && lower.includes(e.title.toLowerCase())) out.push({ problem: `draft title found: ${e.title}` });
  for (const needle of ["content/drafts", "draft-index", "draft-history", "service_role", "SERVICE_ROLE", "LIVE_SERVICE", "SUPABASE_SERVICE"]) if (text.includes(needle)) out.push({ problem: `forbidden string: ${needle}` });
  if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(text)) out.push({ problem: "a JWT-like token is embedded in the bundle" });
  for (const drug of ["norepinephrine", "propofol", "midazolam", "amiodarone"]) if (lower.includes(drug)) out.push({ problem: `clinical drug name found: ${drug}` });
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
