"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/feedback";
import { readLocal, clearLocal, type PracticeLocal } from "./local-progress";
import { ChecklistSummary } from "./exercise-runner";
import { Button } from "@/components/ui/button";

/** The last score on this device for one exercise, or a plain "not tried yet". */
export function ScoreBadge({ code }: { code: string }) {
  const t = useTranslations("Practice");
  const [p, setP] = useState<PracticeLocal | null>(null);
  useEffect(() => setP(readLocal()), []);
  const d = p?.done[code];
  return d ? <Badge tone="success">{t("lastScore", { correct: d.correct, total: d.total })}</Badge> : <Badge>{t("notTried")}</Badge>;
}
export function ClearLocalButton() {
  const t = useTranslations("Practice");
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={() => { clearLocal(); setDone(true); }}>{t("clear")}</Button>
      <span role="status" className="text-sm">{done ? t("cleared") : ""}</span>
    </div>
  );
}
/** Self-rated competency tracker: levels are the learner's own words, kept on this device, and never verified. */
export function CompetencyTracker({ skills, locale }: { skills: { code: string; title: string }[]; locale: string }) {
  const t = useTranslations("Practice");
  const [levels, setLevels] = useState<Record<string, string>>({});
  useEffect(() => setLevels(readLocal().levels), []);
  void locale;
  const set = async (code: string, level: string) => {
    setLevels((l) => ({ ...l, [code]: level }));
    const { writeLocal } = await import("./local-progress");
    writeLocal((p) => ({ ...p, levels: { ...p.levels, [code]: level } }));
  };
  const LV = [["not_started", t("lvlNot")], ["learning", t("lvlLearning")], ["with_support", t("lvlSupport")], ["independent", t("lvlIndependent")]] as const;
  return (
    <div className="space-y-4">
      <ChecklistSummary ids={skills.map((s) => s.code)} levels={levels} />
      <ul className="space-y-3">
        {skills.map((s) => (
          <li key={s.code}>
            <fieldset className="rounded-lg border border-border bg-card p-4">
              <legend className="px-1 font-medium">{s.title}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {LV.map(([v, label]) => (
                  <label key={v} className="inline-flex min-h-11 items-center gap-2">
                    <input type="radio" name={`lvl-${s.code}`} value={v} checked={(levels[s.code] ?? "not_started") === v} onChange={() => void set(s.code, v)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" onClick={() => window.print()}>{t("print")}</Button>
    </div>
  );
}
