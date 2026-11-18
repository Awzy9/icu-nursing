import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { infusionCase } from "@/lib/working/infusion-case";
import { InfusionExerciseView } from "@/components/working/infusion-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function InfusionCasePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = infusionCase(key);
  if (!exercise) notFound();
  return <InfusionExerciseView exercise={exercise} locale={locale} />;
}
