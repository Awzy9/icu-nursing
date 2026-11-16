import { setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { DRAFTS, PLAN, coverage } from "@/lib/admin/drafts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content coverage", robots: { index: false, follow: false } };

export default async function Coverage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff(locale);
  const rows = coverage(DRAFTS, new Date());
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb"><Link href="/admin/content">← Content overview</Link></nav>
      <h1 className="text-3xl font-bold">Content coverage</h1>
      <Callout tone="warning" role="note">Drafted is not publishable. Every count below is an unreviewed draft held as a file; none is in the learner-facing database.</Callout>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Coverage of the original plan by draft type, with validation, evidence, licensing and freshness counts</caption>
          <thead><tr className="border-b border-border">{["Type", "Planned", "Drafted", "Passing validator", "With issues", "Reviewed", "Sources stale or undated", "RED or unverified sources", "Evidence status / detail"].map((h) => <th key={h} scope="col" className="py-2 pe-3 text-start">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.type} className="border-b border-border align-top">
              <th scope="row" className="py-2 pe-3 text-start font-medium"><Link href={{ pathname: "/admin/content/register", query: { type: r.type } }}>{r.label}</Link></th>
              <td className="py-2 pe-3 tabular-nums">{PLAN[r.type] ?? "n/a"}</td>
              <td className="py-2 pe-3 tabular-nums">{r.total}</td>
              <td className="py-2 pe-3 tabular-nums">{r.clean}</td>
              <td className="py-2 pe-3 tabular-nums">{r.withIssues ? <Badge tone="danger">{r.withIssues}</Badge> : 0}</td>
              <td className="py-2 pe-3 tabular-nums">{r.reviewed}</td>
              <td className="py-2 pe-3 tabular-nums">{r.unfresh}</td>
              <td className="py-2 pe-3 tabular-nums">{r.redOrUnverified}</td>
              <td className="py-2">{[...Object.entries(r.evidence).map(([k, n]) => `${k.replace(/_/g, " ")}: ${n}`), r.extra].filter(Boolean).join("; ")}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">Questions are counted as sets (the 240 questions inside topic drafts are counted with their topics; 11 expansion sets hold 66 more). The original plan has no fixed number of question sets.</p>
    </div>
  );
}
