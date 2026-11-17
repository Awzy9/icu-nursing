import { CheckCircle2, GraduationCap, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { tenthsToPercentString } from "@/lib/question-bank/score";
import type { ExamResult } from "@/lib/working/exam";

const categoryAr: Record<string, string> = {
  "Infection and Sepsis": "العدوى والإنتان", "General ICU Nursing": "تمريض العناية المركزة العام", "Professional Nursing Practice": "الممارسة المهنية للتمريض",
  "Respiratory and Airway Management": "التنفس والمجرى الهوائي", "Cardiovascular and Hemodynamic Care": "القلب والديناميكا الدموية", "Neurocritical Care": "العناية العصبية الحرجة",
  "Renal and Metabolic Care": "العناية الكلوية والاستقلابية", "Critical Care Pharmacology": "علم الأدوية في العناية الحرجة", "Hematology and Transfusion": "أمراض الدم ونقل الدم", "Cross-topic questions": "أسئلة متعددة المواضيع",
};

export function ExamResults({ result, locale }: { result: ExamResult; locale: string }) {
  const ar = locale === "ar";
  const percent = tenthsToPercentString(result.scoreTenths);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3 text-center">
        <p className="text-sm font-semibold text-primary">{ar ? "اكتمل الامتحان" : "Exam complete"}</p>
        <h1 className="text-4xl font-bold">{result.correct} / {result.total}</h1>
        <p className="text-2xl font-semibold text-muted-foreground">{percent}%</p>
        {result.unanswered > 0 ? <p className="text-sm text-muted-foreground">{ar ? `${result.unanswered} سؤالاً بلا إجابة، احتُسبت كخاطئة.` : `${result.unanswered} question${result.unanswered === 1 ? "" : "s"} unanswered, counted as incorrect.`}</p> : null}
      </header>

      <section aria-labelledby="results-topics" className="space-y-3">
        <h2 id="results-topics" className="text-xl font-bold">{ar ? "النتيجة حسب الموضوع" : "Results by topic"}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {result.topics.map((t) => (
            <li key={t.category} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold" lang="en" dir="ltr">{ar ? categoryAr[t.category] ?? t.category : t.category}</p>
              <p className="text-sm text-muted-foreground">{t.correct} / {t.total} {ar ? "صحيحة" : "correct"}</p>
              <div role="progressbar" aria-valuenow={Math.round((t.correct / t.total) * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(t.correct / t.total) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      {result.gaps.length ? (
        <section aria-labelledby="results-gaps" className="space-y-3">
          <h2 id="results-gaps" className="text-xl font-bold">{ar ? "فجوات التعلم" : "Learning gaps"}</h2>
          <p className="text-sm text-muted-foreground">{ar ? "الأسئلة التي أخطأت فيها أو لم تُجب عنها، مع روابط للدرس والمراجعة." : "Questions you missed or left unanswered, with links to the lesson and revision."}</p>
          <ul className="space-y-3">
            {result.gaps.map((g) => (
              <li key={g.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                <p className="flex items-start gap-2 font-medium" lang="en" dir="ltr"><XCircle className="mt-1 size-4 shrink-0 text-danger-foreground" aria-hidden />{g.prompt}</p>
                <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-success-foreground" aria-hidden />{ar ? "الإجابة الصحيحة" : "Correct answer"}: <span lang="en" dir="ltr">{g.options[g.answer]}</span></p>
                <div className="flex flex-wrap gap-3 text-sm font-semibold text-primary">
                  <Link href={g.moduleHref}>{ar ? "اقرأ الدرس" : "Read the lesson"} →</Link>
                  <Link href="/study">{ar ? "راجع في المراجعة" : "Review in revision"} →</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-muted-foreground"><GraduationCap className="mt-0.5 size-4 shrink-0" aria-hidden />{ar ? "هذا تمرين تعليمي للتقييم الذاتي فقط، ولا يمثل اعتماداً سريرياً أو شهادة كفاءة." : "This is a self-assessment exercise for educational use only. It does not represent clinical approval or a certification of competence."}</p>

      <div className="flex justify-center"><Link href="/exam" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{ar ? "امتحان آخر" : "Take another exam"}</Link></div>
    </div>
  );
}
