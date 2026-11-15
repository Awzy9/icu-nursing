"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { setSkillBookmarkAction, startSkillSessionAction } from "@/app/[locale]/skills/actions";

export function SkillActions({ skillId, inProgress, completed, bookmarked }: { skillId: string; inProgress: string | null; completed: number; bookmarked: boolean }) {
  const t = useTranslations("Skills");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(bookmarked);
  const [pending, start] = useTransition();
  const go = () => { setError(null); start(async () => { const r = await startSkillSessionAction(skillId); if (r && !r.ok) setError(t("startError")); /* success redirects from the server */ }); };
  const toggle = () => {
    setError(null);
    const next = !saved;
    setSaved(next);
    start(async () => { const r = await setSkillBookmarkAction(skillId, next); if (!r.ok) { setSaved(!next); setError(t("bookmarkError")); } });
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={go} disabled={pending} aria-busy={pending}>
          {pending ? t("starting") : inProgress ? t("resumeStudy") : completed > 0 ? t("studyAgain") : t("startStudy")}
        </Button>
        <Button type="button" variant="outline" onClick={toggle} aria-pressed={saved} disabled={pending}>
          {saved ? <BookmarkCheck className="me-2 size-4" aria-hidden /> : <Bookmark className="me-2 size-4" aria-hidden />}
          {saved ? t("bookmarked") : t("bookmark")}
        </Button>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
    </div>
  );
}
