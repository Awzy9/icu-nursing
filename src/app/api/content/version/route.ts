import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/version - a cheap check native clients can poll to decide whether their
// cached catalog/lab data is stale, without re-downloading anything.
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion() }, { headers: { "Cache-Control": "public, max-age=60" } });
}
