"use client";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";

export function ContinueLearning({ locale }: { locale: string }) {
  const { sessions, discardSession } = useLearning();
  const ar = locale === "ar";
  const unfinished = sessions.filter((s) => !s.finished).sort((a, b) => b.at - a.at);
  if (!unfinished.length) return null;
  return (
    <section aria-labelledby="continue-learning" className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h2 id="continue-learning" className="text-lg font-bold">{ar ? "متابعة التعلم" : "Continue learning"}</h2>
      <ul className="space-y-2">
        {unfinished.map((s) => (
          <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div className="min-w-0">
              <p lang="en" dir="ltr" className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.kind === "quiz" ? (ar ? `السؤال ${s.position + 1} · النتيجة ${s.score}` : `Question ${s.position + 1} · score ${s.score}`) : (ar ? "سيناريو غير مكتمل" : "Unfinished scenario")}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={s.href} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{ar ? "استمر" : "Resume"}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
              <button onClick={() => { if (confirm(ar ? "سيتم حذف هذا التقدم غير المكتمل. متابعة؟" : "This will discard this unfinished progress. Continue?")) discardSession(s.key); }} className="min-h-11 rounded-xl border border-border px-4 text-sm">{ar ? "تجاهل" : "Discard"}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
