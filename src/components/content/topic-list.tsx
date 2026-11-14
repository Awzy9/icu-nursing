import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/feedback";
import type { TopicSummary } from "@/lib/content/types";

export async function TopicList({ topics, domainTitles }: { topics: TopicSummary[]; domainTitles?: Record<string, string> }) {
  const t = await getTranslations("Library");
  return (
    <ul className="divide-y divide-border border-y border-border">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link href={`/library/${topic.slug}`} className="block py-4 no-underline">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{topic.title}</span>
              {topic.kind === "demo_synthetic" ? <Badge tone="warning">{t("demoLabel")}</Badge> : null}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{topic.summary}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {domainTitles?.[topic.domainSlug] ? `${domainTitles[topic.domainSlug]} · ` : ""}
              {t(`levels.${topic.level}`)} · {t("minutes", { minutes: topic.minutes })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
