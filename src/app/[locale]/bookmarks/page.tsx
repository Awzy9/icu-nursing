import { workingEditionEnabled } from "@/lib/working";
import { LearningDashboard } from "@/components/working/dashboard";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { TopicList } from "@/components/content/topic-list";
import { requireUser } from "@/lib/auth";
import { getContentRepository } from "@/lib/content";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function BookmarksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return <LearningDashboard locale={locale} bookmarksOnly/>;
  const t = await getTranslations("Dashboard");
  if (isDemoMode()) return <Callout tone="warning">{t("demoUnavailable")}</Callout>;
  await requireUser(locale, "/bookmarks");
  const supabase = (await createClient())!;
  const { data } = await supabase.from("bookmarks").select("topic_id").order("created_at", { ascending: false });
  const ids = new Set(((data ?? []) as { topic_id: string }[]).map((m) => m.topic_id));
  const topics = (await (await getContentRepository()).listTopics({ locale })).filter((x) => ids.has(x.id));
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("bookmarks")}</h1>
      {topics.length ? <TopicList topics={topics} /> : <p className="text-muted-foreground">{t("noBookmarks")}</p>}
    </div>
  );
}
