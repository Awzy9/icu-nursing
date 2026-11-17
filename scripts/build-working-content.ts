/** Build the owner's explicitly enabled, read-only working edition. Never changes approval flags or database content. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
export interface WorkingEntry { key: string; type: string; title: string; category: string; body: string; questionCount: number }
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const omitted = new Set(["support", "read", "points", "next", "id", "key", "critical", "original_graphic", "alt_text_needed"]);
function prose(value: unknown, depth = 3): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => typeof v === "object" && v !== null ? `\n${prose(v, depth)}\n` : `- ${prose(v, depth)}`).join("\n");
  const obj = value as Record<string, unknown>;
  if (typeof obj.text === "string") return [obj.text, ...Object.entries(obj).filter(([k]) => k !== "text" && !omitted.has(k)).map(([k, v]) => `**${label(k)}:** ${prose(v, depth)}`)].join("\n\n");
  return Object.entries(obj).filter(([k]) => !omitted.has(k)).map(([k, v]) => `${"#".repeat(Math.min(depth, 5))} ${label(k)}\n\n${prose(v, depth + 1)}`).join("\n\n");
}
export function buildWorkingContent(root = "."): WorkingEntry[] {
  const base = path.join(root, "content", "drafts");
  const out: WorkingEntry[] = [];
  for (const dir of readdirSync(base).filter((d) => /^batch-\d+$/.test(d)).sort()) {
    for (const f of readdirSync(path.join(base, dir)).filter((f) => /^D\d\d-T\d\d.*\.md$/.test(f)).sort()) {
      const raw = readFileSync(path.join(base, dir, f), "utf8"), key = f.match(/^D\d\d-T\d\d/)![0];
      const title = raw.match(/^title: (.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, "") ?? key;
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
      const questionCount = (body.match(/\*\*Q\d+\s*\(/g) ?? []).length;
      const category = raw.match(/^domain: (.+)$/m)?.[1] ?? "Topics";
      out.push({ key, type: "topics", title, category, body, questionCount });
      const questions = body.match(/## 17\. MCQs([\s\S]*?)(?=\n## 18\.|$)/)?.[1];
      if (questions) out.push({ key: `QB-${key}`, type: "questions", title, category, body: `# ${title}\n\n${questions}`, questionCount });
    }
  }
  for (const f of readdirSync(path.join(base, "mcq-expansion")).filter((f) => /^XQ-\d+.*\.md$/.test(f)).sort()) {
    const raw = readFileSync(path.join(base, "mcq-expansion", f), "utf8"), key = f.match(/^XQ-\d+/)![0];
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    out.push({ key, type: "questions", title: raw.match(/^title: (.+)$/m)?.[1] ?? key, category: "Cross-topic questions", body, questionCount: (body.match(/\*\*Q\d+\s*\(/g) ?? []).length });
  }
  const fields: Record<string, string[]> = {
    skills: ["objectives", "prerequisites", "sections", "checklist", "gaps", "permissions", "references", "sources"],
    medications: ["summary", "drug_class", "high_alert_note", "jurisdiction_note", "evidence_type_note", "sections", "monitoring", "gaps", "permissions", "sources"],
    scenarios: ["learning_objectives", "setting", "steps", "debrief", "gaps", "permissions", "sources", "required_sources"],
    equipment: ["diagram", "parameters", "safety_concepts", "monitoring_concepts", "escalation_concepts", "gaps", "permissions", "sources", "required_sources"],
    practice: ["objectives", "setup", "prompt", "items", "options", "lines", "steps", "debrief", "gaps", "permissions", "sources", "required_sources"],
  };
  for (const [dir, keys] of Object.entries(fields)) {
    for (const f of readdirSync(path.join(base, dir)).filter((f) => /^(SK|MD|SC|EQ|PX)-\d+.*\.json$/.test(f)).sort()) {
      const d = JSON.parse(readFileSync(path.join(base, dir, f), "utf8"));
      out.push({ key: d.skill_id ?? d.med_id ?? d.scenario_id ?? d.equipment_id ?? d.practice_id, type: dir === "scenarios" ? "cases" : dir, title: d.title ?? d.name, category: d.category ?? d.domain ?? d.area ?? dir, body: keys.filter((k) => d[k] != null).map((k) => `## ${label(k)}\n\n${prose(d[k])}`).join("\n\n"), questionCount: 0 });
    }
  }
  if (new Set(out.map((e) => e.key)).size !== out.length) throw new Error("Duplicate working content key");
  return out;
}
if (process.argv[1]?.endsWith("build-working-content.ts")) {
  const entries = buildWorkingContent();
  writeFileSync("content/working-catalog.json", JSON.stringify(entries));
  console.log(`Built working edition: ${entries.length} entries; ${entries.filter((e) => e.type === "questions").reduce((n, e) => n + e.questionCount, 0)} questions`);
}
