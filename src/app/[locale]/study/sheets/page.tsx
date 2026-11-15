import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { getContentRepository } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Study" });
  return { title: t("sheetsTitle") };
}

/** Lists topics from the published-content repository only (demo repository = synthetic; Supabase = approved snapshots). */
export default async function SheetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Study");
  const lib = await getTranslations("Library");
  const topics = await (await getContentRepository()).listTopics({ locale });
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("sheetsTitle")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("sheetsIntro")}</p>
      </header>
      {topics.length === 0 ? <Callout tone="info">{t("sheetsEmpty")}</Callout> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {topics.map((x) => (
            <li key={x.id} className="space-y-2 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{x.title}</h2>
                {x.kind === "demo_synthetic" ? <Badge tone="warning">{lib("demoLabel")}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">{x.summary}</p>
              <Link href={`/study/sheets/${x.slug}`}>{t("openSheet")}<span className="sr-only">: {x.title}</span></Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
