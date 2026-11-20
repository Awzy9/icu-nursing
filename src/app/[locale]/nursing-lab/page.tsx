import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NursingLab } from "@/components/working/nursing-lab";
import { workingEditionEnabled } from "@/lib/working";
import { allRevisionQuestions } from "@/lib/working/revision-source";

export const dynamic = "force-dynamic";

export default async function NursingLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  return <NursingLab locale={locale} questions={allRevisionQuestions()} />;
}
