"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Common");
  return (
    <div role="alert" className="mx-auto max-w-prose space-y-4 py-12">
      <h1 className="text-2xl font-bold">{t("genericError")}</h1>
      <Button onClick={reset}>{t("back")}</Button>
    </div>
  );
}
