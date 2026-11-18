import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { crrtAlarm } from "@/lib/working/crrt";
import { CrrtAlarmExerciseView } from "@/components/working/crrt-alarm-exercise";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CrrtAlarmPage({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const exercise = crrtAlarm(key);
  if (!exercise) notFound();
  return <CrrtAlarmExerciseView exercise={exercise} locale={locale} />;
}
