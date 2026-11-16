"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { discardCaseAction, startCaseAction } from "@/app/[locale]/cases/actions";

export function CaseCardActions({ caseId, inProgress, inProgressPosition, lastCompleted }: { caseId: string; inProgress: string | null; inProgressPosition: number | null; lastCompleted: string | null }) {
  const t = useTranslations("Cases");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const go = () => { setError(null); start(async () => { const r = await startCaseAction(caseId); if (r && !r.ok) setError(t("startError")); /* success redirects from the server */ }); };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={go} disabled={pending} aria-busy={pending}>
          {pending ? t("starting") : inProgress ? (inProgressPosition ? t("resumeAt", { n: inProgressPosition }) : t("resume")) : lastCompleted ? t("again") : t("start")}
        </Button>
        {lastCompleted && !inProgress ? <Button type="button" variant="outline" onClick={() => router.push(`/cases/attempt/${lastCompleted}`)}>{t("review")}</Button> : null}
        {inProgress && !confirm ? <Button type="button" variant="outline" onClick={() => setConfirm(true)}>{t("discard")}</Button> : null}
      </div>
      {inProgress && confirm ? (
        <div role="group" aria-label={t("discard")} className="flex flex-wrap items-center gap-2">
          <p className="text-sm">{t("discardConfirm")}</p>
          <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => start(async () => { await discardCaseAction(inProgress); setConfirm(false); router.refresh(); })}>{t("discard")}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("keep")}</Button>
        </div>
      ) : null}
      {error ? <Callout tone="danger">{error}</Callout> : null}
    </div>
  );
}
