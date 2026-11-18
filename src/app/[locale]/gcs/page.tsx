import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { allGcsCases } from "@/lib/working/gcs-case";
import { GcsTrainer } from "@/components/working/gcs-trainer";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function GcsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  const cases = allGcsCases();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "أداة تفاعلية" : "INTERACTIVE TOOL"}</p>
        <h1 className="text-3xl font-bold">{ar ? "مدرّب مقياس غلاسكو للغيبوبة" : "Glasgow Coma Scale trainer"}</h1>
        <p className="text-muted-foreground">{ar ? "جرّب التسجيل بحرية، أو اختر حالة لممارسة التسجيل الصحيح." : "Explore scoring freely, or pick a case to practise scoring it correctly."}</p>
      </header>

      <GcsTrainer locale={locale} />

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{ar ? "حالات للممارسة" : "Practice cases"}</h2>
        <ul className="space-y-3">
          {cases.map((c) => (
            <li key={c.key}>
              <Link href={`/gcs/${c.key}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5">
                <p className="text-sm" lang="en" dir="ltr">{c.vignette}</p>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
