import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";
import type { ReferenceItem } from "@/lib/content/types";

export async function TopicReferences({ references, locale }: { references: ReferenceItem[]; locale: string }) {
  const t = await getTranslations("Topic");
  return (
    <section id="references" aria-labelledby="refs-h" className="max-w-prose space-y-3 scroll-mt-4">
      <h2 id="refs-h" className="text-xl font-semibold">{t("references")}</h2>
      <ol className="list-decimal space-y-3 ps-6">
        {references.map((r) => (
          <li key={r.id} className="text-sm">
            <span className="font-medium">{r.organization}</span>: {r.url ? <a href={r.url} rel="noopener noreferrer" target="_blank">{r.title}</a> : r.title}
            {r.versionLabel ? <span className="block text-muted-foreground">{r.versionLabel}</span> : null}
            {r.isDraftGuideline ? <Badge tone="danger" className="mt-1">{t("referenceDraft")}</Badge> : null}
            {r.citation ? <span className="block">{r.citation}{r.pinpoint ? ` — ${r.pinpoint}` : ""}</span> : null}
            {r.lastChecked ? <span className="block text-muted-foreground">{t("lastChecked")}: {formatDate(r.lastChecked, locale)}</span> : null}
            {r.independentlyWritten ? <span className="block text-muted-foreground">{t("independentlyWritten")}: {r.independentlyWritten}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
