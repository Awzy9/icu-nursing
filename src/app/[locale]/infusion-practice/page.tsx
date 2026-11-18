import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { allInfusionCases } from "@/lib/working/infusion-case";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function InfusionPracticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  const cases = allInfusionCases();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تدريب" : "PRACTICE"}</p>
        <h1 className="text-3xl font-bold">{ar ? "تدريب حساب معدل التسريب" : "Infusion-rate practice problems"}</h1>
        <p className="text-muted-foreground">{ar ? "تدرّب على حساب معدل التسريب بالمل/ساعة لأوامر شائعة، ثم تحقق من إجابتك." : "Practise calculating the mL/hr rate for common orders, then check your answer."}</p>
      </header>
      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.key}>
            <Link href={`/infusion-practice/${c.key}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5">
              <p className="text-sm" lang="en" dir="ltr">{c.vignette}</p>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
