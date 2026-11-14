import { setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface Row { id: string; slug: string; title: { en?: string }; status: string }

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user, roles } = await requireStaff(locale);
  const db = (await createClient())!;
  const [{ data: topics }, { data: assigned }] = await Promise.all([
    db.from("topics").select("id, slug, title, status").order("updated_at", { ascending: false }).limit(200),
    db.from("review_assignments").select("id, specialty, version_id, content_versions(id, version_no, status, topic_id, topics!content_versions_topic_id_fkey(id, slug, title))").eq("reviewer_id", user.id),
  ]);
  const list = (topics ?? []) as unknown as Row[];
  const counts = list.reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {});
  const queue = ((assigned ?? []) as unknown as { id: string; specialty: string; content_versions: { version_no: number; status: string; topics: { id: string; title: { en?: string } } } | null }[])
    .filter((a) => a.content_versions?.status === "in_review");
  const waiting = list.filter((t) => t.status === "in_review" || t.status === "approved");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Administration</h1>
      <section aria-labelledby="counts" className="space-y-2">
        <h2 id="counts" className="text-xl font-semibold">Topics by status</h2>
        <ul className="flex flex-wrap gap-3">{Object.entries(counts).map(([s, n]) => <li key={s} className="flex items-center gap-2"><StatusBadge status={s} /> <span className="tabular-nums">{n}</span></li>)}{!list.length ? <li className="text-muted-foreground">No topics visible to you yet.</li> : null}</ul>
      </section>
      {roles.includes("clinical_reviewer") ? (
        <section aria-labelledby="queue" className="space-y-2">
          <h2 id="queue" className="text-xl font-semibold">My review queue</h2>
          {queue.length ? <ul className="list-disc ps-6">{queue.map((q) => <li key={q.id}><Link href={`/admin/topics/${q.content_versions!.topics.id}`}>{q.content_versions!.topics.title.en}</Link> — version {q.content_versions!.version_no} as {q.specialty}</li>)}</ul> : <p className="text-muted-foreground">Nothing assigned to you.</p>}
        </section>
      ) : null}
      {roles.includes("publisher") || roles.includes("admin") ? (
        <section aria-labelledby="pub" className="space-y-2">
          <h2 id="pub" className="text-xl font-semibold">Awaiting reviewers or publication</h2>
          {waiting.length ? <ul className="list-disc ps-6">{waiting.map((t) => <li key={t.id}><Link href={`/admin/topics/${t.id}`}>{t.title.en}</Link> <StatusBadge status={t.status} /></li>)}</ul> : <p className="text-muted-foreground">Nothing waiting.</p>}
        </section>
      ) : null}
    </div>
  );
}
