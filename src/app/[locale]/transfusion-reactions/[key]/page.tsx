import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { transfusionExercise } from "@/lib/working/transfusion";
import { TransfusionExerciseView } from "@/components/working/transfusion-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function TransfusionReactionPage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = transfusionExercise(key);
  if (!exercise) notFound();
  return <TransfusionExerciseView exercise={exercise} locale={locale} />;
}
