import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { examTopics } from "@/lib/working/exam-source";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/exam/topics - the category/count breakdown exam mode's start form offers,
// mirroring src/app/[locale]/exam/page.tsx's use of examTopics().
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), topics: examTopics() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
