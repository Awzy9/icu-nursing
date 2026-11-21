export type InterpretationKind = "ecg" | "aline" | "waveforms" | "defib";

/** A neutral exercise heading avoids teaching the answer before the learner responds. */
export function practiceHeading(kind: InterpretationKind, key: string, arabic: boolean): string {
  const index = /^[A-Z]+-([0-9]+)$/.exec(key)?.[1] ?? "";
  const label = {
    ecg: arabic ? "تفسير تخطيط القلب" : "ECG rhythm interpretation",
    aline: arabic ? "تفسير اختبار الخط الشرياني" : "Arterial-line waveform assessment",
    waveforms: arabic ? "تفسير منحنيات جهاز التنفس" : "Ventilator waveform interpretation",
    defib: arabic ? "تقييم نظم إزالة الرجفان" : "Defibrillation rhythm assessment",
  }[kind];
  return index ? `${label} · ${Number(index)}` : label;
}

/**
 * Accessibility-preserving, non-diagnostic observations from the author's trace text.
 * First sentences describe *visible* morphology; subsequent authored text can contain
 * the diagnostic answer or clinical explanation, so the rest is only shown after checking.
 */
export function observationSummary(lines: string[]): string[] {
  return lines.map((line) => line.split(/[.!?]\s+/)[0]?.trim() ?? "").filter(Boolean);
}
