import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { LEVELS } from "@/lib/content/types";

export interface TopicDefaults {
  domainId?: string; slug?: string; titleEn?: string; titleAr?: string; summaryEn?: string; summaryAr?: string; level?: string; minutes?: number;
  curriculumId?: string; guidelineNote?: string; jurisdiction?: string; origin?: string; roles?: string[];
}

export function TopicFields({ domains, d = {}, disabled }: { domains: { id: string; title: string }[]; d?: TopicDefaults; disabled?: boolean }) {
  return (
    <fieldset disabled={disabled} className="grid gap-4 md:grid-cols-2">
      <Field label="Domain" htmlFor="domainId"><Select id="domainId" name="domainId" defaultValue={d.domainId} required>{domains.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select></Field>
      <Field label="URL slug (lowercase, digits, hyphens)" htmlFor="slug"><Input id="slug" name="slug" defaultValue={d.slug} required pattern="[a-z0-9-]+" maxLength={80} /></Field>
      <Field label="Title (English)" htmlFor="titleEn"><Input id="titleEn" name="titleEn" defaultValue={d.titleEn} required maxLength={200} /></Field>
      <Field label="Title (Arabic, optional)" htmlFor="titleAr"><Input id="titleAr" name="titleAr" lang="ar" dir="rtl" defaultValue={d.titleAr} maxLength={200} /></Field>
      <Field label="Summary (English)" htmlFor="summaryEn"><Textarea id="summaryEn" name="summaryEn" defaultValue={d.summaryEn} required maxLength={600} className="min-h-20" /></Field>
      <Field label="Summary (Arabic, optional)" htmlFor="summaryAr"><Textarea id="summaryAr" name="summaryAr" lang="ar" dir="rtl" defaultValue={d.summaryAr} maxLength={600} className="min-h-20" /></Field>
      <Field label="Learner level" htmlFor="level"><Select id="level" name="level" defaultValue={d.level ?? "beginner"}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field>
      <Field label="Estimated minutes" htmlFor="minutes"><Input id="minutes" name="minutes" type="number" min={1} max={240} defaultValue={d.minutes ?? 15} required /></Field>
      <Field label="Curriculum ID (e.g. D01-T07)" htmlFor="curriculumId"><Input id="curriculumId" name="curriculumId" defaultValue={d.curriculumId} maxLength={40} /></Field>
      <Field label="Jurisdiction scope" htmlFor="jurisdiction" hint="Use 'international' unless the topic is specific to a country."><Input id="jurisdiction" name="jurisdiction" defaultValue={d.jurisdiction ?? "international"} maxLength={80} aria-describedby="jurisdiction-hint" /></Field>
      <Field label="Guideline versions used" htmlFor="guidelineNote" hint="e.g. 'SSC 2026; NICE NG253 (2025)'. Never describe a draft as final."><Input id="guidelineNote" name="guidelineNote" defaultValue={d.guidelineNote} maxLength={500} aria-describedby="guidelineNote-hint" /></Field>
      <Field label="Content origin" htmlFor="origin" hint="Be honest: AI-assisted drafts need at least two distinct human reviewers and can never self-approve."><Select id="origin" name="origin" defaultValue={d.origin ?? "human"} aria-describedby="origin-hint"><option value="human">Written by a human</option><option value="ai_assisted">AI-assisted</option><option value="ai_generated">AI-generated</option></Select></Field>
    </fieldset>
  );
}
