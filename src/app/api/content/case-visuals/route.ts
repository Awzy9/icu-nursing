import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { contentVersion, loadCaseVisuals } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/case-visuals - the lookup object that drives which case steps show a
// reused-equipment photo, a reused ECG trace, the numeric monitor display or the comparison
// panels (content/working-case-visuals.json). A lookup object, not a list of records, so it is
// served separately from the array-shaped /api/content/labs/[name] endpoint.
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), data: loadCaseVisuals() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
