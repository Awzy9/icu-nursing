import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { resolveAllPaths } from "@/lib/working/paths";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/paths - the guided learning paths (content/working-paths.json), resolved
// against the live catalog, mirroring src/app/[locale]/learn/paths/page.tsx's use of
// resolveAllPaths(). Read-only content, same gating as the rest of /api/content/*.
export function GET() {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), paths: resolveAllPaths() }, { headers: { "Cache-Control": "public, max-age=300" } });
}
