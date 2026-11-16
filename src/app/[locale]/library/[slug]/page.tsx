import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { RichText } from "@/components/content/rich-text";
import { TopicActions } from "@/components/content/topic-actions";
import { TopicReferences } from "@/components/content/topic-references";
import { TopicControls } from "@/components/content/topic-controls";
import { isDemoMode } from "@/lib/env";
import { getContentRepository } from "@/lib/content";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const topic = await (await getContentRepository()).getTopic(slug, locale);
  return { title: topic?.title ?? "Topic" };
}

export default async function TopicPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const topic = await (await getContentRepository()).getTopic(slug, locale);
  if (!topic) notFound();
  const t = await getTranslations("Topic");
  const lib = await getTranslations("Library");
  const r = topic.review;

  const toc = [
    ...topic.sections.map((s) => ({ id: `s-${s.id}`, label: s.title })),
    ...(topic.actions.length ? [{ id: "actions", label: t("actionsTitle") }] : []),
    { id: "references", label: t("references") },
    { id: "review", label: t("reviewInfo") },
  ];

  return (
    <article className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <details open className="rounded-md border border-border bg-card p-3 lg:[&:not([open])]:block">
          <summary className="min-h-11 cursor-pointer font-medium leading-[2.75rem]">{t("onThisPage")}</summary>
          <nav aria-label={t("onThisPage")}>
            <ol className="space-y-1 text-sm">
              {toc.map((i) => (
                <li key={i.id}><a href={`#${i.id}`} className="block py-1 text-foreground">{i.label}</a></li>
              ))}
            </ol>
          </nav>
        </details>
      </aside>

      <div className="min-w-0 space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {topic.kind === "demo_synthetic" ? <Badge tone="warning">{lib("demoLabel")}</Badge> : null}
            <Badge>{lib(`levels.${topic.level}`)}</Badge>
            <Badge>{lib("minutes", { minutes: topic.minutes })}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <p className="text-lg text-muted-foreground">{topic.summary}</p>
          {topic.kind === "demo_synthetic" ? <Callout tone="warning" role="status">{t("reviewDemo")}</Callout> : null}
          {!isDemoMode() ? <TopicControls topicId={topic.id} /> : null}
        </header>

        {topic.sections.map((s) => (
          <section key={s.id} id={`s-${s.id}`} aria-labelledby={`h-${s.id}`} className="max-w-prose space-y-3 scroll-mt-4">
            <h2 id={`h-${s.id}`} className="text-xl font-semibold">{s.title}</h2>
            <RichText text={s.body} />
          </section>
        ))}

        {topic.actions.length ? <TopicActions actions={topic.actions} /> : null}
        <TopicReferences references={topic.references} locale={locale} />

        <section id="review" aria-labelledby="review-h" className="max-w-prose space-y-2 scroll-mt-4">
          <h2 id="review-h" className="text-xl font-semibold">{t("reviewInfo")}</h2>
          {topic.kind === "demo_synthetic" ? (
            <p>{t("reviewDemo")}</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-medium">{t("reviewPublished", { version: r.versionNo ?? "—", date: r.publishedAt ? formatDate(r.publishedAt, locale) : "—" })}</dt><dd />
              {r.lastReviewedAt ? (<><dt className="font-medium">{t("lastReviewed")}</dt><dd>{formatDate(r.lastReviewedAt, locale)}</dd></>) : null}
              {r.nextReviewAt ? (<><dt className="font-medium">{t("nextReview")}</dt><dd>{formatDate(r.nextReviewAt, locale)}</dd></>) : null}
              {r.reviewerRoles.length ? (<><dt className="font-medium">{t("reviewers")}</dt><dd>{r.reviewerRoles.join(", ")}</dd></>) : null}
              {r.guidelineNote ? (<><dt className="font-medium">{t("guidelineVersions")}</dt><dd>{r.guidelineNote}</dd></>) : null}
            </dl>
          )}
        </section>
      </div>
    </article>
  );
}
