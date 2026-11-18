import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { examQuestionsByIds } from "@/lib/working/exam-source";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/exam/questions?ids=a,b,c - the full question objects (including answer and
// explanation) for a drawn exam's question ids, mirroring src/app/[locale]/exam/[id]/page.tsx's
// use of examQuestionsByIds(). Like the website's own ExamRunner, these are not hidden from the
// client before submission - only the server-anchored timing in working_exams is authoritative.
export function GET(request: Request) {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0 || ids.length > 100) return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  return NextResponse.json({ version: contentVersion(), items: examQuestionsByIds(ids) }, { headers: { "Cache-Control": "public, max-age=300" } });
}
