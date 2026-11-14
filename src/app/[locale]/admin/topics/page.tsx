import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

interface Row { id: string; slug: string; title: { en?: string }; status: string; kind: string; level: string; updated_at: string; nursing_domains: { slug: string } | null }

export default async function AdminTopics({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { roles } = await requireStaff(locale);
  const db = (await createClient())!;
  const { data } = await db.from("topics").select("id, slug, title, status, kind, level, updated_at, nursing_domains(slug)").order("updated_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Topics</h1>
        {roles.includes("author") || roles.includes("admin") ? <Button asChild><Link href="/admin/topics/new">New topic</Link></Button> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <caption className="sr-only">Topics visible to you</caption>
          <thead><tr className="border-b border-border text-start"><th scope="col" className="py-2 pe-3 text-start">Title</th><th scope="col" className="pe-3 text-start">Domain</th><th scope="col" className="pe-3 text-start">Status</th><th scope="col" className="pe-3 text-start">Level</th><th scope="col" className="text-start">Updated</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-2 pe-3"><Link href={`/admin/topics/${t.id}`}>{t.title.en}</Link>{t.kind === "demo_synthetic" ? <span className="ms-2 text-xs text-muted-foreground">(demo)</span> : null}</td>
                <td className="pe-3">{t.nursing_domains?.slug}</td>
                <td className="pe-3"><StatusBadge status={t.status} /></td>
                <td className="pe-3">{t.level}</td>
                <td>{formatDate(t.updated_at, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="py-4 text-muted-foreground">No topics yet.</p> : null}
      </div>
    </div>
  );
}
