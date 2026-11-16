// Evidence-gap audit over the 50 medication and 25 skill drafts. Offline and deterministic: reads only the draft files and the source registers.
// Writes docs/phase14/EVIDENCE_GAP_AUDIT.md and docs/phase14/evidence_gaps.csv. It reports; it never edits a draft and never marks anything reviewed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadMedicationDrafts } from "./validate-medication-drafts";
import { loadSkillDrafts } from "./validate-skill-drafts";
import { loadSourceTable, parseCsv } from "./build-draft-index";

type Item = { support: string; sources?: string[] };
export interface GapRow { id: string; kind: "medication" | "skill"; title: string; score: number; gaps: string[]; red_sources: string[]; sourced: number; partial: number; local: number }

const band = (m: Map<string, { licence_class: string }>, ids: string[]) => ids.filter((i) => ["RED", "UNVERIFIED"].includes(m.get(i)?.licence_class ?? "UNVERIFIED"));
const tally = (items: Item[]) => ({ sourced: items.filter((i) => i.support === "sourced").length, partial: items.filter((i) => i.support === "partial").length, local: items.filter((i) => i.support === "local_protocol").length });

export function auditEvidence(root = "."): GapRow[] {
  const table = loadSourceTable(root);
  const labels = new Map(parseCsv(readFileSync(`${root}/content/drafts/medications/LABEL_SOURCES.csv`, "utf8")).map((r) => [r.source_id!, r]));
  const rows: GapRow[] = [];
  for (const m of loadMedicationDrafts(root) as unknown as Record<string, any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const items: Item[] = Object.values(m.sections as Record<string, { items: Item[] }>).flatMap((s) => s.items);
    const gaps: string[] = [];
    const sec = m.sections as Record<string, { items: Item[] }>;
    if (sec.monitoring!.items.every((i) => i.support !== "sourced")) gaps.push("monitoring: no statement sourced from the label");
    if (sec.escalation!.items.every((i) => i.support !== "sourced")) gaps.push("escalation: no nursing-practice source (label-derived triggers only)");
    if ((sec.adverse_effects?.items.length ?? 0) < 2) gaps.push("adverse effects: a single statement");
    if (m.high_alert === false && /not confirmed|not named/i.test(m.high_alert_note)) gaps.push("high-alert status not determined from a source read (local list governs)");
    if (!/US FDA|FDA label only/i.test(m.jurisdiction_note)) gaps.push("jurisdiction note missing");
    else gaps.push("US label only: no other regulator read");
    const lab = labels.get(m.label_ref as string);
    if (lab && lab.effective_time! < "20260101") gaps.push(`label older than 2026 (effective ${lab.effective_time})`);
    if (!m.label_currency_check) gaps.push("label currency not re-checked");
    const red = band(table, (m.sources as { id: string }[]).map((s) => s.id));
    const t = tally(items);
    const score = (m.high_alert ? 3 : 0) + (/boxed/i.test(JSON.stringify(m.sections.safety_alerts)) ? 2 : 0) + gaps.filter((g) => !g.startsWith("US label only")).length + red.length;
    rows.push({ id: m.med_id, kind: "medication", title: m.name, score, gaps, red_sources: red, ...t });
  }
  for (const s of loadSkillDrafts(root) as unknown as Record<string, any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const secs = s.sections as Record<string, { support: string; items?: Item[] }>;
    const gaps: string[] = [];
    for (const k of ["safety", "responsibilities", "monitoring", "escalation", "assessment"]) {
      const sec = Object.entries(secs).find(([n]) => n.startsWith(k.slice(0, 4)))?.[1];
      if (!sec) gaps.push(`no ${k} section`); else if (sec.support === "local_protocol") gaps.push(`${k}: local protocol only`);
    }
    const items = Object.values(secs).flatMap((x) => x.items ?? []);
    const t = tally(items);
    const red = band(table, (s.sources as { id: string }[]).map((x) => x.id));
    if ((s.sources as { read: string }[]).some((x) => x.read === "not_read")) gaps.push("cites a source not read");
    if (t.sourced === 0) gaps.push("no statement sourced from a source read in full");
    const device = /line|tube|ventilator|defibrillator|pump|crrt|drain|catheter|ecg|oxygen/i.test(s.title as string);
    rows.push({ id: s.skill_id, kind: "skill", title: s.title, score: gaps.length + red.length + (device ? 1 : 0), gaps: device ? [...gaps, "device skill: manufacturer instructions are local"] : gaps, red_sources: red, ...t });
  }
  return rows.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

if (process.argv[1]?.endsWith("audit-evidence.ts")) {
  const rows = auditEvidence();
  mkdirSync("docs/phase14", { recursive: true });
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  writeFileSync("docs/phase14/evidence_gaps.csv", ["id,kind,title,priority_score,sourced,partial,local_protocol,red_or_unverified_sources,gaps", ...rows.map((r) => [r.id, r.kind, q(r.title), r.score, r.sourced, r.partial, r.local, q(r.red_sources.join(";")), q(r.gaps.join(" | "))].join(","))].join("\n") + "\n");
  const meds = rows.filter((r) => r.kind === "medication"), sk = rows.filter((r) => r.kind === "skill");
  const count = (rs: GapRow[], f: string) => rs.filter((r) => r.gaps.some((g) => g.startsWith(f))).length;
  const md = `# Evidence gap audit (generated by \`scripts/audit-evidence.ts\`; do not edit by hand)

Scope: ${meds.length} medication drafts and ${sk.length} skill drafts. Everything here is an unreviewed draft. The audit reports gaps; it does not close them.

## Medications (${meds.length})
| Gap | Drafts |
|---|---|
| Monitoring: no statement sourced from the label | ${count(meds, "monitoring")} |
| Escalation: no nursing-practice source | ${count(meds, "escalation")} |
| Adverse effects: a single statement | ${count(meds, "adverse")} |
| High-alert status not determined from a source read | ${count(meds, "high-alert")} |
| US label only, no other regulator read | ${count(meds, "US label only")} |
| Label older than 2026 | ${count(meds, "label older")} |
| Label currency not re-checked | ${count(meds, "label currency")} |
| Cites a RED or unverified source | ${meds.filter((r) => r.red_sources.length).length} |

## Skills (${sk.length})
| Gap | Drafts |
|---|---|
| A core section (safety, responsibilities, monitoring, escalation, assessment) is local-protocol only or missing | ${sk.filter((r) => r.gaps.some((g) => /local protocol only|no \w+ section/.test(g))).length} |
| No statement sourced from a source read in full | ${count(sk, "no statement sourced")} |
| Cites a source not read | ${count(sk, "cites a source")} |
| Cites a RED or unverified source | ${sk.filter((r) => r.red_sources.length).length} |
| Device skill (manufacturer instructions govern locally) | ${count(sk, "device skill")} |

## Priority worklist (top 15 by score)
${rows.slice(0, 15).map((r, i) => `${i + 1}. **${r.id} ${r.title}** (score ${r.score}): ${r.gaps.filter((g) => !g.startsWith("US label only")).slice(0, 3).join("; ") || "see CSV"}`).join("\n")}

Full table: \`docs/phase14/evidence_gaps.csv\`.

## Reading the numbers
* "Sourced" means a regulator label or guideline read in full says it. "Escalation" is almost always "partial" because labels describe adverse reactions, not nursing escalation pathways; closing it needs a nursing-practice source or the unit's protocol.
* "High-alert not determined" is deliberate: the ISMP list is licensed for internal non-commercial use and is not reproduced; each draft says the institution's list governs.
* Jurisdiction restrictions are preserved: every medication draft states it is based on a single US manufacturer label.
`;
  writeFileSync("docs/phase14/EVIDENCE_GAP_AUDIT.md", md);
  console.log(`audited ${rows.length} drafts`);
}
