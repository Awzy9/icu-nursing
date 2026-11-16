"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { discardAttemptAction } from "@/app/[locale]/question-bank/actions";

export function DiscardButton({ attemptId }: { attemptId: string }) {
  const t = useTranslations("QuestionBank");
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm) return <Button type="button" variant="outline" onClick={() => setConfirm(true)}>{t("discard")}</Button>;
  return (
    <div role="group" aria-label={t("discard")} className="flex flex-wrap items-center gap-2">
      <p className="max-w-xs text-sm">{t("discardConfirm")}</p>
      <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => start(async () => { await discardAttemptAction(attemptId); router.refresh(); })}>{t("discard")}</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("keepWorking")}</Button>
    </div>
  );
}
