import { NextResponse } from "next/server";
import { workingContent, workingEditionEnabled, workingTypes } from "@/lib/working";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/catalog?type=skills - a lightweight summary of every catalog entry (not the
// full lesson body), so native clients can render list screens cheaply and fetch a full entry
// only once the learner opens it (GET /api/content/catalog/[key]).
export function GET(request: Request) {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  const type = new URL(request.url).searchParams.get("type");
  if (type && !(workingTypes as readonly string[]).includes(type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  const items = workingContent()
    .filter((e) => !type || e.type === type)
    .map((e) => ({ key: e.key, type: e.type, title: e.title, category: e.category, questionCount: e.questionCount }));
  return NextResponse.json({ version: contentVersion(), items }, { headers: { "Cache-Control": "public, max-age=300" } });
}
