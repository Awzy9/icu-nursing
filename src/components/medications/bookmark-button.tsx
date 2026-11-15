"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { setMedicationBookmarkAction } from "@/app/[locale]/medications/actions";

export function MedicationBookmark({ medicationId, bookmarked }: { medicationId: string; bookmarked: boolean }) {
  const t = useTranslations("Medications");
  const [saved, setSaved] = useState(bookmarked);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = () => {
    setError(null);
    const next = !saved;
    setSaved(next);
    start(async () => { const r = await setMedicationBookmarkAction(medicationId, next); if (!r.ok) { setSaved(!next); setError(t("bookmarkError")); } });
  };
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={toggle} aria-pressed={saved} disabled={pending}>
        {saved ? <BookmarkCheck className="me-2 size-4" aria-hidden /> : <Bookmark className="me-2 size-4" aria-hidden />}
        {saved ? t("bookmarked") : t("bookmark")}
      </Button>
      {error ? <Callout tone="danger">{error}</Callout> : null}
    </div>
  );
}
