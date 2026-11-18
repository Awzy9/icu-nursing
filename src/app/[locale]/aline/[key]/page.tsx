import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { alineExercise } from "@/lib/working/aline";
import { AlineExerciseView } from "@/components/working/aline-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AlineExercisePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = alineExercise(key);
  if (!exercise) notFound();
  return <AlineExerciseView exercise={exercise} locale={locale} />;
}
