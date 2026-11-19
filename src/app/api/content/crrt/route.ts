import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { contentVersion, loadCrrtData } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/crrt - the CRRT circuit components (for the tap-to-explore screen) and alarm
// exercises, mirroring src/app/[locale]/crrt/page.tsx's use of allCrrtComponents()/
// allCrrtAlarms(). A lookup object, not a list of records, so it is served separately from the
// array-shaped /api/content/labs/[name] endpoint (same reasoning as /api/content/case-visuals).
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), data: loadCrrtData() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
