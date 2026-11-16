import { DEMO_DOMAINS, DEMO_TOPICS, demoActions, demoReferences, demoSections, type DemoTopic } from "@/content/demo";
import { localize, matchesQuery } from "./localize";
import type { ContentRepository, Domain, TopicDetail, TopicQuery, TopicSummary } from "./types";

function summary(t: DemoTopic, locale: string): TopicSummary {
  return {
    id: t.id,
    slug: t.slug,
    domainSlug: t.domainSlug,
    title: localize(t.title, locale),
    summary: localize(t.summary, locale),
    level: t.level,
    minutes: t.minutes,
    kind: "demo_synthetic",
  };
}

export const demoRepository: ContentRepository = {
  async listDomains(locale) {
    return DEMO_DOMAINS.map<Domain>((d) => ({
      id: d.id,
      slug: d.slug,
      sort: d.sort,
      title: localize(d.title, locale),
      summary: localize(d.summary, locale),
      topicCount: DEMO_TOPICS.filter((t) => t.domainSlug === d.slug).length,
    }));
  },

  async listTopics({ locale, q, domainSlug, level }: TopicQuery) {
    return DEMO_TOPICS.filter((t) => (!domainSlug || t.domainSlug === domainSlug) && (!level || t.level === level))
      .map((t) => summary(t, locale))
      .filter((t) => matchesQuery([t.title, t.summary], q));
  },

  async getTopic(slug, locale) {
    const t = DEMO_TOPICS.find((x) => x.slug === slug);
    if (!t) return null;
    return {
      ...summary(t, locale),
      sections: demoSections(t).map((s) => ({ id: s.id, kind: s.kind, title: localize(s.title, locale), body: localize(s.body, locale) })),
      actions: demoActions(t).map((a) => ({
        id: a.id,
        text: localize(a.text, locale),
        scope: a.scope,
        institutionalProtocolRequired: a.institutionalProtocolRequired,
        jurisdictionNote: a.jurisdictionNote ? localize(a.jurisdictionNote, locale) : null,
      })),
      references: demoReferences(t),
      images: [],
      review: { versionNo: null, publishedAt: null, lastReviewedAt: null, nextReviewAt: null, reviewerRoles: [], guidelineNote: null },
    } satisfies TopicDetail;
  },
};
