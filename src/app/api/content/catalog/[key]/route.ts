import { NextResponse } from "next/server";
import { workingEditionEnabled, workingEntry } from "@/lib/working";
import { contentVersion } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/catalog/D01-T19 - the full entry (lesson body, questions with answer keys
// and rationale, scenario steps, checklist, practice exercise) for one catalog item.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  const { key } = await params;
  const entry = workingEntry(key);
  if (!entry) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), entry }, { headers: { "Cache-Control": "public, max-age=300" } });
}
