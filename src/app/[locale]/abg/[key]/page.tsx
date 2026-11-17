import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { abgCase } from "@/lib/working/abg-case";
import { AbgExerciseView } from "@/components/working/abg-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AbgCasePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = abgCase(key);
  if (!exercise) notFound();
  return <AbgExerciseView exercise={exercise} locale={locale} />;
}
