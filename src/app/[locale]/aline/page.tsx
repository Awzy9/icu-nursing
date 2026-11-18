import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { allAlineExercises } from "@/lib/working/aline";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AlinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  const exercises = allAlineExercises();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تفسير بصري" : "VISUAL INTERPRETATION"}</p>
        <h1 className="text-3xl font-bold">{ar ? "تمارين اختبار الموجة المربعة للخط الشرياني" : "Arterial line square-wave test exercises"}</h1>
        <p className="text-muted-foreground">{ar ? "اقرأ استجابة الاختبار بعد الغسل السريع، وحدّد مستوى التخميد، ثم تحقق من إجابتك." : "Read the response after the fast-flush, identify the damping category, then check your answer."}</p>
      </header>
      <ul className="space-y-3">
        {exercises.map((e) => (
          <li key={e.key}>
            <Link href={`/aline/${e.key}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5">
              <div>
                <h2 className="font-semibold" lang="en" dir="ltr">{e.title[ar ? 1 : 0]}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{e.objective[ar ? 1 : 0]}</p>
              </div>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
