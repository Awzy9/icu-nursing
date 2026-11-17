import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { workingEditionEnabled } from "@/lib/working";
import { loadExam } from "@/lib/working/exam-store";
import { examQuestionsByIds } from "@/lib/working/exam-source";
import { computeExamResult } from "@/lib/working/exam";
import { ExamResults } from "@/components/working/exam-results";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ExamResultsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const loaded = await loadExam(id);
  if (!loaded) notFound();
  if (!loaded.exam.submittedAt) redirect({ href: `/exam/${id}`, locale });
  const questions = examQuestionsByIds(loaded.exam.questionIds);
  const result = computeExamResult(questions, loaded.exam.answers);
  return <ExamResults result={result} locale={locale} />;
}
