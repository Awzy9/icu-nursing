import { createClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";
import { localize, matchesQuery } from "./localize";
import { mapSnapshot, type PublicTopicRow } from "./snapshot";
import type { ContentRepository, Domain, Level, LocalizedText, TopicSummary } from "./types";

interface DomainRow { id: string; slug: string; sort: number; title: LocalizedText; summary: LocalizedText; topic_count: number }
interface TopicListRow { id: string; slug: string; domain_slug: string; kind: "demo_synthetic" | "clinical"; title: LocalizedText; summary: LocalizedText | null; level: Level; minutes: string | number }

async function db() {
  const c = await createClient();
  if (!c) throw new Error("Supabase is not configured");
  return c;
}

/** Reads ONLY the public views (approved, published snapshots). Drafts are unreachable from here. */
export const supabaseRepository: ContentRepository = {
  async listDomains(locale) {
    const { data, error } = await (await db()).from("public_domains").select("id, slug, sort, title, summary, topic_count").order("sort");
    if (error) throw error;
    return (data as unknown as DomainRow[]).map<Domain>((d) => ({
      id: d.id, slug: d.slug, sort: d.sort, title: localize(d.title, locale), summary: localize(d.summary, locale), topicCount: d.topic_count,
    }));
  },

  async listTopics({ locale, q, domainSlug, level }) {
    let query = (await db())
      .from("public_topics")
      .select("id, slug, domain_slug, kind, title:snapshot->title, summary:snapshot->summary, level:snapshot->>level, minutes:snapshot->>est_minutes")
      .order("slug");
    if (domainSlug) query = query.eq("domain_slug", domainSlug);
    if (level) query = query.eq("snapshot->>level", level);
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as TopicListRow[])
      .map<TopicSummary>((r) => ({
        id: r.id, slug: r.slug, domainSlug: r.domain_slug, kind: r.kind, title: localize(r.title, locale), summary: localize(r.summary, locale), level: r.level, minutes: Number(r.minutes),
      }))
      .filter((t) => matchesQuery([t.title, t.summary], q));
  },

  async getTopic(slug, locale) {
    const { data, error } = await (await db()).from("public_topics").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? mapSnapshot(data as unknown as PublicTopicRow, locale, getEnv().NEXT_PUBLIC_SUPABASE_URL) : null;
  },
};
