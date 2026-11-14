import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/feedback";
import { ACTION_SCOPES, type ActionItem } from "@/lib/content/types";

export async function TopicActions({ actions }: { actions: ActionItem[] }) {
  const t = await getTranslations("Topic");
  return (
    <section id="actions" aria-labelledby="actions-h" className="max-w-prose space-y-3 scroll-mt-4">
      <h2 id="actions-h" className="text-xl font-semibold">{t("actionsTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("actionsIntro")}</p>
      {ACTION_SCOPES.map((scope) => {
        const rows = actions.filter((a) => a.scope === scope);
        if (!rows.length) return null;
        return (
          <div key={scope} className="space-y-1">
            <h3 className="font-semibold">{t(`scope.${scope}`)}</h3>
            <ul className="list-disc space-y-1 ps-6">
              {rows.map((a) => (
                <li key={a.id}>
                  {a.text}
                  {a.institutionalProtocolRequired ? <> <Badge tone="warning">{t("protocolRequired")}</Badge></> : null}
                  {a.jurisdictionNote ? <p className="text-sm text-muted-foreground">{t("jurisdictionNote")}: {a.jurisdictionNote}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
