"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";

export default function QuestionBankError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("QuestionBank");
  return (
    <div className="space-y-4">
      <Callout tone="danger" title={t("errorTitle")}>{t("loadError")}</Callout>
      <Button type="button" onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
