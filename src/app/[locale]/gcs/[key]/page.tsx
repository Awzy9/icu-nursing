import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { gcsCase } from "@/lib/working/gcs-case";
import { GcsTrainer } from "@/components/working/gcs-trainer";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function GcsCasePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const found = gcsCase(key);
  if (!found) notFound();
  const ar = locale === "ar";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/gcs">← {ar ? "كل حالات غلاسكو" : "All GCS cases"}</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين تسجيل" : "SCORING EXERCISE"}</p>
        <h1 className="text-2xl font-bold">{ar ? "تسجيل مقياس غلاسكو للغيبوبة" : "Glasgow Coma Scale scoring"}</h1>
      </header>
      <GcsTrainer locale={locale} gcsCase={found} />
    </div>
  );
}
