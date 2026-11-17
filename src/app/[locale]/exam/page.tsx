import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { workingEditionEnabled } from "@/lib/working";
import { examTopics } from "@/lib/working/exam-source";
import { ExamStartForm } from "@/components/working/exam-start";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ExamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!workingEditionEnabled()) notFound();
  const ar = locale === "ar";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-primary">{ar ? "تدريب موقوت متعدد المواضيع" : "TIMED MIXED-TOPIC PRACTICE"}</p>
        <h1 className="text-3xl font-bold">{ar ? "وضع الامتحان" : "Exam mode"}</h1>
        <p className="text-muted-foreground">{ar ? "اختبر نفسك عبر عدة مواضيع ضمن وقت محدد، ثم راجع النتائج حسب الموضوع." : "Test yourself across several topics under a time limit, then review your results by topic."}</p>
      </header>
      <ExamStartForm topics={examTopics()} locale={locale} />
    </div>
  );
}
