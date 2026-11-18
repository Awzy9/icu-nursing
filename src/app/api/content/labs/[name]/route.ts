import { NextResponse } from "next/server";
import { workingEditionEnabled } from "@/lib/working";
import { contentVersion, loadLabDataset, LAB_DATASETS } from "@/lib/content-api/version";

export const dynamic = "force-dynamic";

// GET /api/content/labs/ecg - raw data for one of the specialized interactive labs (ECG traces,
// GCS cases, NEWS2 cases, ...). `name` is checked against an exact whitelist (LAB_DATASETS) -
// never used to build a file path directly.
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!workingEditionEnabled()) return NextResponse.json({ error: "content_edition_disabled" }, { status: 404 });
  const { name } = await params;
  if (!Object.prototype.hasOwnProperty.call(LAB_DATASETS, name)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const items = loadLabDataset(name);
  if (!items) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ version: contentVersion(), name, items }, { headers: { "Cache-Control": "public, max-age=300" } });
}
