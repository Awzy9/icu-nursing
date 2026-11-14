/**
 * SYNTHETIC DEMONSTRATION CONTENT.
 * Shows how pages are structured. It contains NO clinical guidance and is NOT reviewed.
 * It is shown only with prominent "synthetic demonstration" labels.
 */
import type { ActionScope, Level, LocalizedText, ReferenceItem } from "@/lib/content/types";

export interface DemoDomain {
  id: string;
  slug: string;
  sort: number;
  title: LocalizedText;
  summary: LocalizedText;
}

// Arabic domain names are drafts pending clinical-terminology review.
export const DEMO_DOMAINS: DemoDomain[] = [
  ["respiratory-airway", "Respiratory and Airway Management", "التنفس وإدارة الطرق الهوائية", "Oxygenation, ventilation and airway care."],
  ["cardiovascular-hemodynamic", "Cardiovascular and Hemodynamic Care", "القلب والأوعية والديناميكا الدموية", "Rhythm, perfusion, shock and resuscitation."],
  ["neurocritical-care", "Neurocritical Care", "العناية العصبية الحرجة", "Neurological assessment, sedation and delirium."],
  ["renal-metabolic", "Renal and Metabolic Care", "الكلى والاستقلاب", "Kidney injury, fluids, electrolytes and acid-base."],
  ["critical-care-pharmacology", "Critical Care Pharmacology", "علم الأدوية في العناية الحرجة", "Medication classes, monitoring and safe administration."],
  ["infection-sepsis", "Infection and Sepsis", "العدوى والإنتان", "Recognition, prevention and infection control."],
  ["general-icu-nursing", "General ICU Nursing", "تمريض العناية المركزة العام", "Assessment, comfort, skin, nutrition and mobility."],
  ["hematology-transfusion", "Hematology and Transfusion", "أمراض الدم ونقل الدم", "Coagulation, bleeding and blood products."],
  ["professional-practice", "Professional Nursing Practice", "الممارسة التمريضية المهنية", "Communication, documentation, ethics and safety."],
  ["critical-care-emergencies", "Critical Care Emergencies", "الطوارئ في العناية الحرجة", "Recognising and responding to acute deterioration."],
].map(([slug, en, ar, sum], i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  slug: slug as string,
  sort: i + 1,
  title: { en: en as string, ar: ar as string },
  summary: { en: sum as string },
}));

export interface DemoTopic {
  id: string;
  slug: string;
  domainSlug: string;
  level: Level;
  minutes: number;
  title: LocalizedText;
  summary: LocalizedText;
}

export const DEMO_TOPICS: DemoTopic[] = DEMO_DOMAINS.map((d, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  slug: `demo-${d.slug}`,
  domainSlug: d.slug,
  level: (["beginner", "intermediate", "advanced"] as Level[])[i % 3]!,
  minutes: 10 + (i % 4) * 5,
  title: { en: `Demonstration topic: ${d.title.en}`, ar: `موضوع تجريبي: ${d.title.ar}` },
  summary: { en: `A synthetic example of how a ${d.title.en} topic page is organised. It contains no clinical content.` },
}));

const sectionTemplates: { kind: string; title: string; body: string }[] = [
  { kind: "overview", title: "Overview", body: "This page is synthetic demonstration content. It exists to show how a published topic is laid out: objectives, assessment, red flags, escalation, documentation, scope labels and references." },
  { kind: "objectives", title: "Learning objectives", body: "- Recognise the sections of a topic page.\n- Find the nursing-scope labels and reference list.\n- Understand that real topics are published only after named clinical reviewers approve a specific version." },
  { kind: "assessment", title: "Clinical assessment (demonstration)", body: "In a real topic this section lists what the nurse assesses, written for the learner level shown above.\n\nNo clinical statements are made on this page." },
  { kind: "red_flags", title: "Warning signs and red flags (demonstration)", body: "A real topic lists findings that signal deterioration and the criteria that trigger escalation, citing the guideline version used." },
  { kind: "documentation", title: "Documentation (demonstration)", body: "A real topic explains what to document and how, with notes where local or national requirements differ." },
];

export function demoSections(topic: DemoTopic) {
  return sectionTemplates.map((s, i) => ({
    id: `${topic.id}-s${i}`,
    kind: s.kind,
    title: { en: s.title },
    body: { en: s.body },
  }));
}

export function demoActions(topic: DemoTopic) {
  const rows: [ActionScope, string, boolean, string | null][] = [
    ["assessment", "Example: an assessment action would appear here.", false, null],
    ["monitoring", "Example: a monitoring action would appear here.", false, null],
    ["escalation", "Example: an escalation criterion would appear here.", false, null],
    ["independent_nursing", "Example: a nursing-led action would appear here.", false, "Whether an action is independent varies by country and employer."],
    ["order_or_protocol_required", "Example: an action that needs an order or approved local protocol.", true, null],
    ["prescriber_or_other_discipline", "Example: a decision belonging to a prescriber or another discipline.", false, null],
  ];
  return rows.map(([scope, text, protocol, note], i) => ({
    id: `${topic.id}-a${i}`,
    text: { en: text },
    scope,
    institutionalProtocolRequired: protocol,
    jurisdictionNote: note ? { en: note } : null,
  }));
}

export function demoReferences(topic: DemoTopic) {
  const base: ReferenceItem = {
    id: `${topic.id}-r0`,
    organization: "Demonstration",
    title: "No clinical source — structure demonstration only",
    url: null,
    versionLabel: null,
    isDraftGuideline: false,
    lastChecked: "2026-11-14",
    citation: null,
    pinpoint: null,
    independentlyWritten: "All text on this page was written for demonstration.",
  };
  const refs: ReferenceItem[] = [base];
  if (topic.domainSlug === "renal-metabolic") {
    refs.push({
      id: `${topic.id}-r1`,
      organization: "KDIGO",
      title: "AKI/AKD Clinical Practice Guideline — 2026 update (shown to demonstrate the draft label)",
      url: "https://kdigo.org/guidelines/acute-kidney-injury/",
      versionLabel: "2026 update — DRAFT, not final (status checked 2026-11-14)",
      isDraftGuideline: true,
      lastChecked: "2026-11-14",
      citation: null,
      pinpoint: null,
      independentlyWritten: null,
    });
  }
  return refs;
}
