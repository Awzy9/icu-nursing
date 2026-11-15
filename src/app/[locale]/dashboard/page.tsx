import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout, ProgressBar } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { TopicList } from "@/components/content/topic-list";
import { Link } from "@/i18n/navigation";
import { getRoles, requireUser, STAFF_ROLES } from "@/lib/auth";
import { getContentRepository, type TopicSummary } from "@/lib/content";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

interface Progress { topic_id: string; status: "in_progress" | "completed"; last_viewed_at: string }

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  if (isDemoMode()) return <Callout tone="warning">{t("demoUnavailable")}</Callout>;

  const user = await requireUser(locale, "/dashboard");
  const supabase = (await createClient())!;
  const repo = await getContentRepository();
  const [{ data: prog }, { data: marks }, domains, topics, roles] = await Promise.all([
    supabase.from("learning_progress").select("topic_id, status, last_viewed_at").order("last_viewed_at", { ascending: false }).limit(100),
    supabase.from("bookmarks").select("topic_id").order("created_at", { ascending: false }),
    repo.listDomains(locale),
    repo.listTopics({ locale }),
    getRoles(user.id),
  ]);
  const progress = (prog ?? []) as Progress[];
  const byId = new Map<string, TopicSummary>(topics.map((x) => [x.id, x]));
  const pick = (ids: string[]) => ids.map((i) => byId.get(i)).filter((x): x is TopicSummary => Boolean(x));
  const inProgress = pick(progress.filter((p) => p.status === "in_progress").map((p) => p.topic_id)).slice(0, 5);
  const recent = pick(progress.map((p) => p.topic_id)).slice(0, 5);
  const completedIds = new Set(progress.filter((p) => p.status === "completed").map((p) => p.topic_id));
  const completed = pick([...completedIds]).slice(0, 5);
  const bookmarked = pick(((marks ?? []) as { topic_id: string }[]).map((m) => m.topic_id)).slice(0, 5);
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{user.displayName ? t("welcome", { name: user.displayName }) : t("welcomeNoName")}</h1>
        <p className="text-sm text-muted-foreground">{t("yourRoles")}: {roles.join(", ")}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link href="/question-bank">{t("questionBank")}</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/study">{t("study")}</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/cases">{t("cases")}</Link></Button>
          {isStaff ? <Button asChild variant="outline" size="sm"><Link href="/admin">{t("staffArea")}</Link></Button> : null}
        </div>
      </header>

      <section aria-labelledby="continue-h" className="space-y-3">
        <h2 id="continue-h" className="text-xl font-semibold">{t("continueLearning")}</h2>
        {inProgress.length ? <TopicList topics={inProgress} /> : (
          <p className="text-muted-foreground">{t("nothingYet")} <Link href="/library">{t("startLibrary")}</Link></p>
        )}
      </section>

      <section aria-labelledby="domains-h" className="space-y-3">
        <h2 id="domains-h" className="text-xl font-semibold">{t("domainProgress")}</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {domains.map((d) => {
            const done = topics.filter((x) => x.domainSlug === d.slug && completedIds.has(x.id)).length;
            return (
              <li key={d.id} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm"><span className="font-medium">{d.title}</span><span className="text-muted-foreground">{t("of", { done, total: d.topicCount })}</span></div>
                <ProgressBar value={d.topicCount ? (done / d.topicCount) * 100 : 0} label={d.title} />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section aria-labelledby="recent-h" className="space-y-3"><h2 id="recent-h" className="text-lg font-semibold">{t("recentlyViewed")}</h2>{recent.length ? <TopicList topics={recent} /> : <p className="text-muted-foreground">{t("nothingYet")}</p>}</section>
        <section aria-labelledby="done-h" className="space-y-3"><h2 id="done-h" className="text-lg font-semibold">{t("completedTopics")}</h2>{completed.length ? <TopicList topics={completed} /> : <p className="text-muted-foreground">{t("nothingYet")}</p>}</section>
        <section aria-labelledby="bm-h" className="space-y-3"><h2 id="bm-h" className="text-lg font-semibold">{t("bookmarks")}</h2>{bookmarked.length ? <TopicList topics={bookmarked} /> : <p className="text-muted-foreground">{t("noBookmarks")}</p>}</section>
      </div>
    </div>
  );
}
