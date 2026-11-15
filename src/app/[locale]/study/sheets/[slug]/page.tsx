import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { RichText } from "@/components/content/rich-text";
import { TopicActions } from "@/components/content/topic-actions";
import { Link } from "@/i18n/navigation";
import { getContentRepository } from "@/lib/content";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const topic = await (await getContentRepository()).getTopic(slug, locale);
  return { title: topic ? `${topic.title} — revision sheet` : "Revision sheet" };
}

/** Key-point revision sheet: a condensed view of a PUBLISHED topic (objectives, red flags, scope-labelled actions). Never reads drafts. */
export default async function SheetPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const topic = await (await getContentRepository()).getTopic(slug, locale);
  if (!topic) notFound();
  const t = await getTranslations("Study");
  const lib = await getTranslations("Library");
  const objectives = topic.sections.filter((s) => s.kind === "objectives");
  const redFlags = topic.sections.filter((s) => s.kind === "red_flags");
  const synthetic = topic.kind === "demo_synthetic";
  return (
    <article className="max-w-3xl space-y-6">
      <p><Link href="/study/sheets">{t("sheetBack")}</Link></p>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          {synthetic ? <Badge tone="warning">{lib("demoLabel")}</Badge> : null}
        </div>
        <Callout tone={synthetic ? "warning" : "info"} role="note">{synthetic ? t("sheetSynthetic") : t("sheetPublished")}</Callout>
      </header>
      {objectives.length + redFlags.length === 0 ? <p className="text-muted-foreground">{t("sheetNoPoints")}</p> : null}
      {objectives.length ? (
        <section aria-labelledby="sh-obj" className="space-y-2">
          <h2 id="sh-obj" className="text-xl font-semibold">{t("sheetObjectives")}</h2>
          {objectives.map((s) => <RichText key={s.id} text={s.body} />)}
        </section>
      ) : null}
      {redFlags.length ? (
        <section aria-labelledby="sh-rf" className="space-y-2">
          <h2 id="sh-rf" className="text-xl font-semibold">{t("sheetRedFlags")}</h2>
          {redFlags.map((s) => <RichText key={s.id} text={s.body} />)}
        </section>
      ) : null}
      {topic.actions.length ? <TopicActions actions={topic.actions} /> : null}
      <p><Link href={`/library/${topic.slug}`}>{t("sheetFull")}</Link></p>
    </article>
  );
}
