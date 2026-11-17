"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { startExam } from "@/app/[locale]/exam/actions";
import { timeLimitSecondsFor, COUNT_PRESETS, type ExamTopic } from "@/lib/working/exam";

const categoryAr: Record<string, string> = {
  "Infection and Sepsis": "العدوى والإنتان", "General ICU Nursing": "تمريض العناية المركزة العام", "Professional Nursing Practice": "الممارسة المهنية للتمريض",
  "Respiratory and Airway Management": "التنفس والمجرى الهوائي", "Cardiovascular and Hemodynamic Care": "القلب والديناميكا الدموية", "Neurocritical Care": "العناية العصبية الحرجة",
  "Renal and Metabolic Care": "العناية الكلوية والاستقلابية", "Critical Care Pharmacology": "علم الأدوية في العناية الحرجة", "Hematology and Transfusion": "أمراض الدم ونقل الدم", "Cross-topic questions": "أسئلة متعددة المواضيع",
};

export function ExamStartForm({ topics, locale }: { topics: ExamTopic[]; locale: string }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(topics.map((t) => t.category));
  const [count, setCount] = useState<number>(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = topics.filter((t) => selected.includes(t.category)).reduce((n, t) => n + t.count, 0);
  const effectiveCount = Math.min(count, available);
  const minutes = Math.round(timeLimitSecondsFor(effectiveCount) / 60);
  const toggle = (category: string) => setSelected((s) => s.includes(category) ? s.filter((c) => c !== category) : [...s, category]);

  async function start() {
    if (selected.length === 0 || available === 0) return;
    setBusy(true); setError(null);
    const r = await startExam({ categories: selected, count: COUNT_PRESETS.includes(count as 10 | 20 | 30) ? count : 10 });
    if (r.ok) router.push(`/exam/${r.id}`);
    else { setError(r.error); setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">{ar ? "اختر المواضيع" : "Choose topics"}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {topics.map((t) => (
            <label key={t.category} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <input type="checkbox" className="size-5 accent-primary" checked={selected.includes(t.category)} onChange={() => toggle(t.category)} />
              <span className="flex-1" lang="en" dir="ltr">{ar ? categoryAr[t.category] ?? t.category : t.category}</span>
              <span className="text-sm text-muted-foreground">{t.count}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">{ar ? "عدد الأسئلة" : "Number of questions"}</h2>
        <div className="flex flex-wrap gap-3">
          {COUNT_PRESETS.map((n) => (
            <button key={n} onClick={() => setCount(n)} aria-pressed={count === n} className={`min-h-11 rounded-xl px-5 font-semibold ${count === n ? "bg-primary text-primary-foreground" : "border border-border"}`}>{n}</button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{available === 0 ? (ar ? "اختر موضوعاً واحداً على الأقل." : "Choose at least one topic.") : effectiveCount < count ? (ar ? `يتوفر ${available} سؤالاً فقط في المواضيع المختارة.` : `Only ${available} questions are available in the chosen topics.`) : null}</p>
      </section>
      <section role="note" className="space-y-2 rounded-2xl border-2 border-primary bg-card p-5">
        <h2 className="font-semibold">{ar ? "قواعد التوقيت والتغذية الراجعة" : "Timing and feedback rules"}</h2>
        <ul className="list-disc space-y-1.5 ps-5 text-sm leading-6">
          <li>{ar ? `سيكون لديك حوالي ${minutes} دقيقة (تقدير بمعدل دقيقة واحدة لكل سؤال تقريباً).` : `You'll have about ${minutes} minutes (roughly a minute per question).`}</li>
          <li>{ar ? "لن تظهر الإجابة الصحيحة أثناء الامتحان؛ ستظهر جميع النتائج معاً بعد التسليم." : "No answer is revealed while you're taking it; everything is shown together after you submit."}</li>
          <li>{ar ? "يبدأ المؤقت فور البدء ويستمر حتى لو أعدت تحميل الصفحة؛ ينتهي الامتحان تلقائياً عند انتهاء الوقت." : "The timer starts the moment you begin and keeps running even if you reload the page; it submits automatically when time is up."}</li>
          <li>{ar ? "هذا تمرين تعليمي ذاتي ولا يمثل شهادة كفاءة سريرية." : "This is a self-study exercise. It does not certify clinical competence."}</li>
        </ul>
      </section>
      {error ? <p role="alert" className="text-sm font-semibold text-danger-foreground">{error}</p> : null}
      <button disabled={busy || available === 0} onClick={start} className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-40">{busy ? (ar ? "جارٍ البدء…" : "Starting…") : (ar ? "ابدأ الامتحان" : "Start exam")}</button>
    </div>
  );
}
