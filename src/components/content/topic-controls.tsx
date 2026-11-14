import { getTranslations } from "next-intl/server";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setCompletionAction, toggleBookmarkAction } from "@/app/[locale]/library/[slug]/actions";
import { RecordView } from "./record-view";

export async function TopicControls({ topicId }: { topicId: string }) {
  const t = await getTranslations("Topic");
  const user = await getSessionUser();
  if (!user) {
    const a = await getTranslations("Auth");
    return <p className="text-sm text-muted-foreground">{t("signInToSave")} <Link href="/login">{a("signInButton")}</Link></p>;
  }
  const supabase = await createClient();
  const [{ data: bm }, { data: pr }] = await Promise.all([
    supabase!.from("bookmarks").select("topic_id").eq("topic_id", topicId).maybeSingle(),
    supabase!.from("learning_progress").select("status").eq("topic_id", topicId).maybeSingle(),
  ]);
  const bookmarked = Boolean(bm);
  const completed = pr?.status === "completed";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RecordView topicId={topicId} />
      <form action={toggleBookmarkAction}>
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="bookmarked" value={bookmarked ? "1" : "0"} />
        <Button type="submit" variant="outline" aria-pressed={bookmarked}>
          {bookmarked ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {bookmarked ? t("removeBookmark") : t("bookmark")}
        </Button>
      </form>
      <form action={setCompletionAction}>
        <input type="hidden" name="topicId" value={topicId} />
        <input type="hidden" name="completed" value={completed ? "0" : "1"} />
        <Button type="submit" variant={completed ? "default" : "outline"}>
          <CheckCircle2 className="size-4" aria-hidden />
          {completed ? t("markIncomplete") : t("markComplete")}
        </Button>
      </form>
      {completed ? <Callout tone="success" role="status" className="py-1">{t("completed")}</Callout> : null}
    </div>
  );
}
