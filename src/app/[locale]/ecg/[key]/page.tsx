import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { ecgExercise } from "@/lib/working/ecg";
import { EcgExerciseView } from "@/components/working/ecg-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function EcgExercisePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = ecgExercise(key);
  if (!exercise) notFound();
  return <EcgExerciseView exercise={exercise} locale={locale} />;
}
