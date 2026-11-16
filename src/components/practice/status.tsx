"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/feedback";
import { readLocal, clearLocal, type PracticeLocal } from "./local-progress";
import { ChecklistSummary } from "./exercise-runner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

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
const NOTE_MAX = 300;
export function CompetencyTracker({ skills, canExport = false }: { skills: { code: string; title: string }[]; canExport?: boolean }) {
  const t = useTranslations("Practice");
  const [levels, setLevels] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Record<string, boolean>>({});
  useEffect(() => { const l = readLocal(); setLevels(l.levels); setNotes(l.notes); }, []);
  const set = async (code: string, level: string) => {
    setLevels((l) => ({ ...l, [code]: level }));
    const { writeLocal } = await import("./local-progress");
    writeLocal((p) => ({ ...p, levels: { ...p.levels, [code]: level } }));
  };
  const setNote = async (code: string, note: string) => {
    const trimmed = note.slice(0, NOTE_MAX);
    setNotes((n) => ({ ...n, [code]: trimmed }));
    const { writeLocal } = await import("./local-progress");
    writeLocal((p) => ({ ...p, notes: { ...p.notes, [code]: trimmed } }));
    setSavedAt((s) => ({ ...s, [code]: true }));
    setTimeout(() => setSavedAt((s) => ({ ...s, [code]: false })), 1500);
  };
  const tb = useTranslations("Billing");
  const exportCsv = () => {
    const rows = [["code", "skill", "self_rating", "note"], ...skills.map((k) => [k.code, `"${k.title.replace(/"/g, '""')}"`, levels[k.code] ?? "not_started", `"${(notes[k.code] ?? "").replace(/"/g, '""')}"`])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "my-practice-summary.csv"; a.click(); URL.revokeObjectURL(url);
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
              <label className="mt-3 block text-sm" htmlFor={`note-${s.code}`}>
                {t("noteLabel")}
                <textarea
                  id={`note-${s.code}`}
                  className="mt-1 block w-full min-h-20 rounded-md border border-input bg-card p-2 text-sm"
                  maxLength={NOTE_MAX}
                  value={notes[s.code] ?? ""}
                  onChange={(e) => void setNote(s.code, e.target.value)}
                  placeholder={t("notePlaceholder")}
                />
              </label>
              <p role="status" className="text-xs text-muted-foreground" aria-live="polite">{savedAt[s.code] ? t("noteSaved") : ""}</p>
            </fieldset>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => window.print()}>{t("print")}</Button>
        {canExport ? <Button type="button" variant="outline" onClick={exportCsv}>{tb("exportButton")}</Button> : <p className="text-sm text-muted-foreground" data-testid="export-locked">{tb("exportLocked")} <Link className="underline" href="/pricing">{tb("exportLockedLink")}</Link></p>}
      </div>
    </div>
  );
}
