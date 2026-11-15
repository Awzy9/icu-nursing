export type LocalizedText = Record<string, string>;
export type Level = "beginner" | "intermediate" | "advanced";
export type ContentKind = "demo_synthetic" | "clinical";
export type ActionScope =
  | "assessment"
  | "monitoring"
  | "escalation"
  | "independent_nursing"
  | "order_or_protocol_required"
  | "prescriber_or_other_discipline";

export const LEVELS: readonly Level[] = ["beginner", "intermediate", "advanced"];
export const ACTION_SCOPES: readonly ActionScope[] = [
  "assessment",
  "monitoring",
  "escalation",
  "independent_nursing",
  "order_or_protocol_required",
  "prescriber_or_other_discipline",
];

export interface Domain {
  id: string;
  slug: string;
  sort: number;
  title: string;
  summary: string;
  topicCount: number;
}

export interface TopicSummary {
  id: string;
  slug: string;
  domainSlug: string;
  title: string;
  summary: string;
  level: Level;
  minutes: number;
  kind: ContentKind;
}

export interface SectionItem {
  id: string;
  kind: string;
  title: string;
  body: string;
}
export interface ActionItem {
  id: string;
  text: string;
  scope: ActionScope;
  institutionalProtocolRequired: boolean;
  jurisdictionNote: string | null;
}
export interface ReferenceItem {
  id: string;
  organization: string;
  title: string;
  url: string | null;
  versionLabel: string | null;
  isDraftGuideline: boolean;
  lastChecked: string | null;
  citation: string | null;
  pinpoint: string | null;
  independentlyWritten: string | null;
}
export interface ImageItem {
  id: string;
  url: string | null;
  alt: string;
  caption: string | null;
  licence: string;
  attribution: string | null;
}
export interface ReviewInfo {
  versionNo: number | null;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewerRoles: string[];
  guidelineNote: string | null;
}
export interface TopicDetail extends TopicSummary {
  sections: SectionItem[];
  actions: ActionItem[];
  references: ReferenceItem[];
  images: ImageItem[];
  review: ReviewInfo;
}

export interface TopicQuery {
  locale: string;
  q?: string;
  domainSlug?: string;
  level?: Level;
}

/** Read-only access to PUBLISHED content. Implementations: demo (synthetic) and Supabase. */
export interface ContentRepository {
  listDomains(locale: string): Promise<Domain[]>;
  listTopics(query: TopicQuery): Promise<TopicSummary[]>;
  getTopic(slug: string, locale: string): Promise<TopicDetail | null>;
}
