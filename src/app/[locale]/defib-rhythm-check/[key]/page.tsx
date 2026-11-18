import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { defibExercise } from "@/lib/working/defib";
import { DefibExerciseView } from "@/components/working/defib-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function DefibExercisePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = defibExercise(key);
  if (!exercise) notFound();
  return <DefibExerciseView exercise={exercise} locale={locale} />;
}
