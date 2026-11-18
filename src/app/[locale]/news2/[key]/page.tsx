import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { news2Case } from "@/lib/working/news2-case";
import { News2ExerciseView } from "@/components/working/news2-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function News2CasePage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = news2Case(key);
  if (!exercise) notFound();
  return <News2ExerciseView exercise={exercise} locale={locale} />;
}
