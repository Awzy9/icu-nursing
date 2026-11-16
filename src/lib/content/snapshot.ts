import { localize } from "./localize";
import type { ActionItem, ActionScope, ImageItem, Level, LocalizedText, ReferenceItem, SectionItem, TopicDetail } from "./types";

/** Shape stored in content_versions.snapshot (built by the database workflow functions). */
export interface Snapshot {
  title: LocalizedText;
  summary?: LocalizedText;
  level: Level;
  est_minutes: number;
  guideline_note?: string | null;
  sections?: { id: string; kind: string; sort: number; title: LocalizedText; body: LocalizedText }[];
  actions?: { id: string; scope: ActionScope; text: LocalizedText; institutional_protocol_required: boolean; jurisdiction_note: LocalizedText | null; sort: number }[];
  references?: {
    organization: string; title: string; url: string | null; version_label: string | null; is_draft_guideline: boolean;
    last_checked: string | null; citation: string | null; pinpoint: string | null; independently_written_note: string | null;
  }[];
  images?: { id: string; storage_path: string; alt_text: LocalizedText; caption: LocalizedText | null; licence: string; attribution: string | null }[];
  reviewer_roles?: string[];
}

export interface PublicTopicRow {
  id: string;
  slug: string;
  domain_slug: string;
  kind: "demo_synthetic" | "clinical";
  version_no: number | null;
  published_at: string | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  snapshot: Snapshot;
}

export function imageUrl(baseUrl: string | undefined, path: string): string | null {
  if (!baseUrl || path.includes("..")) return null;
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/topic-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function mapSnapshot(row: PublicTopicRow, locale: string, storageBase?: string): TopicDetail {
  const s = row.snapshot;
  const sections: SectionItem[] = [...(s.sections ?? [])].sort((a, b) => a.sort - b.sort).map((x) => ({ id: x.id, kind: x.kind, title: localize(x.title, locale), body: localize(x.body, locale) }));
  const actions: ActionItem[] = [...(s.actions ?? [])].sort((a, b) => a.sort - b.sort).map((a) => ({
    id: a.id, text: localize(a.text, locale), scope: a.scope, institutionalProtocolRequired: a.institutional_protocol_required,
    jurisdictionNote: a.jurisdiction_note ? localize(a.jurisdiction_note, locale) : null,
  }));
  const references: ReferenceItem[] = (s.references ?? []).map((r, i) => ({
    id: `${row.id}-r${i}`, organization: r.organization, title: r.title, url: r.url, versionLabel: r.version_label,
    isDraftGuideline: r.is_draft_guideline, lastChecked: r.last_checked, citation: r.citation, pinpoint: r.pinpoint, independentlyWritten: r.independently_written_note,
  }));
  const images: ImageItem[] = (s.images ?? []).map((im) => ({
    id: im.id, url: imageUrl(storageBase, im.storage_path), alt: localize(im.alt_text, locale), caption: im.caption ? localize(im.caption, locale) : null, licence: im.licence, attribution: im.attribution,
  }));
  return {
    id: row.id, slug: row.slug, domainSlug: row.domain_slug, kind: row.kind,
    title: localize(s.title, locale), summary: localize(s.summary, locale), level: s.level, minutes: s.est_minutes,
    sections, actions, references, images,
    review: {
      versionNo: row.version_no, publishedAt: row.published_at, lastReviewedAt: row.last_reviewed_at, nextReviewAt: row.next_review_at,
      reviewerRoles: s.reviewer_roles ?? [], guidelineNote: s.guideline_note ?? null,
    },
  };
}
