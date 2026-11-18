import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { allExamQuestions, pickExamQuestions } from "@/lib/working/exam-source";
import { timeLimitSecondsFor, COUNT_PRESETS } from "@/lib/working/exam";
import { newSeed } from "@/lib/question-bank/shuffle";

export const dynamic = "force-dynamic";

// GET /api/content/exam/pick?categories=a,b&count=20 - draws a random set of question ids for a
// timed exam, mirroring src/app/[locale]/exam/actions.ts's startExam (minus the working_exams
// insert, which the caller does itself via the working_exam_start RPC once signed in - this
// endpoint only picks content, the same read-only operation as the rest of /api/content/*).
export function GET(request: Request) {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  const url = new URL(request.url);
  const categories = (url.searchParams.get("categories") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  const count = Number(url.searchParams.get("count"));
  if (categories.length === 0 || categories.length > 30) return NextResponse.json({ error: "invalid_categories" }, { status: 400 });
  if (!(COUNT_PRESETS as readonly number[]).includes(count)) return NextResponse.json({ error: "invalid_count" }, { status: 400 });
  const picked = pickExamQuestions(allExamQuestions(), categories, count, newSeed());
  if (picked.length === 0) return NextResponse.json({ error: "no_questions" }, { status: 400 });
  return NextResponse.json({ questionIds: picked.map((q) => q.id), timeLimitSeconds: timeLimitSecondsFor(picked.length) });
}
