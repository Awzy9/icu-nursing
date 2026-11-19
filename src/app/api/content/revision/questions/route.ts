import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { allRevisionQuestions } from "@/lib/working/revision-source";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/revision/questions - the full pool of real questions spaced revision draws
// from, mirroring src/app/[locale]/study/page.tsx's use of allRevisionQuestions(). A native
// client computes its own due queue locally from this plus its own recorded attempts (see
// mobile/src/core/revision.ts), the same way the website computes it client-side in
// WorkingStudy/computeRevisionQueue.
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), items: allRevisionQuestions() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
