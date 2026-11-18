import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { allNews2Cases } from "@/lib/working/news2-case";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function News2Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  const cases = allNews2Cases();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين حساب الدرجة" : "SCORING PRACTICE"}</p>
        <h1 className="text-3xl font-bold">{ar ? "تمارين تسجيل NEWS2" : "NEWS2 scoring exercises"}</h1>
        <p className="text-muted-foreground">{ar ? "احسب درجة الإنذار المبكر الوطني (NEWS2) من القيم الحيوية، وحدد الاستجابة السريرية المناسبة." : "Work out the National Early Warning Score (NEWS2) from a set of vital signs, and identify the appropriate clinical response."}</p>
      </header>
      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.key}>
            <Link href={`/news2/${c.key}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5">
              <div>
                <h2 className="font-semibold" lang="en" dir="ltr">{c.key}</h2>
                <p className="mt-1 text-sm text-muted-foreground" lang="en" dir="ltr">{c.vignette}</p>
              </div>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
