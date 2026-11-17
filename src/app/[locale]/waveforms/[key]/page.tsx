import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { waveformExercise } from "@/lib/working/waveform";
import { WaveformExerciseView } from "@/components/working/waveform-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function WaveformExercisePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = waveformExercise(key);
  if (!exercise) notFound();
  return <WaveformExerciseView exercise={exercise} locale={locale} />;
}
