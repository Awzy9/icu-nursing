import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { allCrrtComponents, allCrrtAlarms } from "@/lib/working/crrt";
import { CrrtExplorer } from "@/components/working/crrt-explorer";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CrrtPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  const components = allCrrtComponents();
  const alarms = allCrrtAlarms();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "مختبر تفاعلي" : "INTERACTIVE LABORATORY"}</p>
        <h1 className="text-3xl font-bold">{ar ? "مختبر دائرة العلاج الكلوي المستمر (CRRT)" : "CRRT circuit laboratory"}</h1>
        <p className="text-muted-foreground">{ar ? "استكشف مكونات الدائرة بالنقر عليها، ثم جرّب تمارين استكشاف إنذارات الدائرة." : "Click through the circuit components to understand their function, then try the alarm-troubleshooting exercises."}</p>
      </header>

      <CrrtExplorer components={components} locale={locale} />

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{ar ? "تمارين استكشاف الإنذارات" : "Alarm-troubleshooting exercises"}</h2>
        <ul className="space-y-3">
          {alarms.map((a) => (
            <li key={a.key}>
              <Link href={`/crrt/${a.key}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5">
                <div>
                  <h3 className="font-semibold" lang="en" dir="ltr">{a.title[ar ? 1 : 0]}</h3>
                  <p className="mt-1 text-sm text-muted-foreground" lang="en" dir="ltr">{a.vignette}</p>
                </div>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
