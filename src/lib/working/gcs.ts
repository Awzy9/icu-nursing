// Pure, deterministic Glasgow Coma Scale scoring - the standard, well-established 3-component
// scale (Eye opening 1-4, Verbal response 1-5, Motor response 1-6) with the conventional
// severity bands. This is a scoring aid, not a substitute for a full neurological exam.

export interface GcsOption { score: number; label: [string, string] }

export const EYE_OPTIONS: GcsOption[] = [
  { score: 4, label: ["Spontaneous", "تلقائي"] },
  { score: 3, label: ["To speech", "عند الصوت"] },
  { score: 2, label: ["To pain", "عند الألم"] },
  { score: 1, label: ["None", "لا استجابة"] },
];

export const VERBAL_OPTIONS: GcsOption[] = [
  { score: 5, label: ["Oriented", "متوجّه"] },
  { score: 4, label: ["Confused", "مرتبك"] },
  { score: 3, label: ["Inappropriate words", "كلمات غير مترابطة"] },
  { score: 2, label: ["Incomprehensible sounds", "أصوات غير مفهومة"] },
  { score: 1, label: ["None", "لا استجابة"] },
];

export const MOTOR_OPTIONS: GcsOption[] = [
  { score: 6, label: ["Obeys commands", "يستجيب للأوامر"] },
  { score: 5, label: ["Localises pain", "يحدد موضع الألم"] },
  { score: 4, label: ["Withdraws from pain", "ينسحب من الألم"] },
  { score: 3, label: ["Abnormal flexion", "انثناء غير طبيعي"] },
  { score: 2, label: ["Abnormal extension", "تمدد غير طبيعي"] },
  { score: 1, label: ["None", "لا استجابة"] },
];

export type GcsSeverity = "severe" | "moderate" | "mild";

export function gcsTotal(eye: number, verbal: number, motor: number): number { return eye + verbal + motor; }

export function gcsSeverity(total: number): GcsSeverity {
  if (total <= 8) return "severe";
  if (total <= 12) return "moderate";
  return "mild";
}
