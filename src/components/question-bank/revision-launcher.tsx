"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import type { RevisionKind } from "@/lib/question-bank/types";
import { startRevisionAction } from "@/app/[locale]/study/actions";

/** One revision set: a labelled count and a button that starts a practice attempt over exactly those questions. */
export function RevisionLauncher({ kind, count, primary = false }: { kind: RevisionKind; count: number; primary?: boolean }) {
  const t = useTranslations("Study");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cap = (n: number) => Math.min(n, 20);
  const label = t(`kind${kind[0]!.toUpperCase()}${kind.slice(1)}` as "kindDue");
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={primary ? "default" : "outline"}
        disabled={count === 0 || pending}
        aria-busy={pending}
        aria-describedby={`launch-${kind}-help`}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await startRevisionAction({ kind, count: cap(count) });
            if (r.ok) router.push(`/question-bank/attempt/${r.id}`);
            else setError(t("startError"));
          });
        }}
      >
        {pending ? t("starting") : kind === "due" ? t("reviewDue") : `${t("practise")}`}
        <span className="sr-only"> — {label}</span>
      </Button>
      <span id={`launch-${kind}-help`} className="sr-only">{t("questionsCount", { n: count })}</span>
      {error ? <Callout tone="danger">{error}</Callout> : null}
    </div>
  );
}
